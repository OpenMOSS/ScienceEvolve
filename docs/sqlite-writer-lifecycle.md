# ScienceEvolve SQLite writer ownership

The research database has **one writer service per physical database on one host**, not one writer per project or Agent. `fs-native-extensions@1.5.3` holds a nonblocking native exclusive lock for the service lifetime. A pause, event-loop stall, busy SQLite connection or delayed fsync does not transfer ownership. Independent databases have independent locks. SQLite remains `DELETE`/`FULL`, with foreign keys, revision CAS and separate execution and coordinator epochs.

## Startup, shutdown and failure

- Start on the original host at the canonical database path. Schema 31 binds the database, parent directory, `<database>.writer.lock` and its UUID. Missing, hardlinked or replaced files are not silently repaired. Do not delete, replace or copy a lock to force takeover. This mechanism is not distributed fencing or protection against arbitrary code running as the service account.
- Each acquisition advances the durable epoch once. Additional connections require the current token **and** the local owner capability. A token copied into another process does not authorize attachment. A stale token rejected while an attached DB Worker is starting does not revoke the established writer. If an admitted Worker detects an epoch change during a write, it fences the shared owner; the descriptor remains locked until close. Service ownership does not grant a replacement Agent an old execution or native session.
- Healthy service diagnostics report ownership `lifecycle-lock` and the epoch. Normal operation does not renew a row. `WRITER_LEASE_HELD` means another owner holds the resource; it has no takeover deadline. Admission and publication must drain before release. A failed resident or dispatcher drain retains ownership. If the DB Worker dies, pending outcomes are unconfirmed; the caller retains the lock through termination and callback drain.
- An admitted DB Worker reports a physical or durable ownership failure to its host on the failing request, preserving the original SQLite/filesystem error. A missing or unreadable ownership table fences the owner. A busy or locked pre-COMMIT read fails that operation without transferring or revoking ownership; it is not retried automatically.
- `WRITER_COMMIT_UNCONFIRMED` means a SQLite COMMIT did not return a confirmed result. Slow transaction diagnostics use `committed: null` for this unknown outcome, not `false`. Preserve the original cause and inspect the original revision, receipt and external facts. Do not replay a request because its reply was lost. A failed SQL statement before COMMIT is distinct: confirmed rollback preserves the original error and does not by itself transfer ownership.
- A task return or removal from scheduling is not a native Stop. The coordinator tracks each physical open from admission, including Main routing, and keeps any unconfirmed cleanup after business retirement. Shutdown seals launches and turns; a late handle is closed without submitting work. If Stop cannot be confirmed, shutdown rejects and the writer stays fenced and locked. An explicit shutdown retry rechecks the outstanding resources; it does not reopen a session or replay a Git action. Do not infer a remote operation’s outcome from a native Stop or from the next writer epoch.
- For ordinary member returns, `execution.retirement.prepared` binds the original output to the execution, invocation and ownership epoch before native close. Until Stop is confirmed the task retains its lane and cannot route. Recovery checks the original handle or trusted launch scope; it does not resubmit the turn. An accepted group completion similarly waits for the original coordinator’s Stop before downstream routing, without asking the Leader to decide again.
- A scoped Leader retains its SQLite management lane if native cleanup is unconfirmed. Its accepted decision and its Stop receipt are separate. Once the exact invocation’s Stop is proven, recovery can settle the recorded `complete_group` without another Leader turn, Git action or change to the final PR. If a prior release recorded failed cleanup or lacks a Stop result, recovery checks that original scope and appends a separate proof; it does not rewrite the old release or infer Stop from its timestamp.
- After process death the next service can acquire a new epoch. It must still reconcile native processes, sessions, checkpoints, receipts and external effects before resuming the original work. A lock release proves none of these effects stopped.

## Upgrade a stopped schema 1–30 database to schema 31

Disable scheduling and automatic restarts, stop every writer, and verify the original host, research root and retained sessions. Take a storage-consistent backup of the research root and external worktrees and artifacts. Supply a new, separate directory for the command's SQLite backup. Use the research database path.

From a source checkout, the entrypoint is `server/src/collaboration-state/upgrade-writer.ts` (SDK: `sdk/src/core/collaboration-state/upgrade-writer.ts`). For example, with the repository's `tsx` installed:

```sh
node --import tsx server/src/collaboration-state/upgrade-writer.ts \
  --database /path/to/collaboration-state.sqlite \
  --backup-directory /path/to/new-backup-directory \
  --host ORIGINAL_HOST --service SERVICE_ID --confirm-stopped
```

The command checks the schema, original host, journal mode and integrity, acquires exclusive writer ownership and retains a SQLite backup before migrating. For schemas 1–29 it runs the legacy research migrations and retains the old writer lease table as immutable history. For schema 30 it verifies the original physical database and lock identity before changing the delivery tables. Keep the original sidecar in place. Both paths advance the writer epoch and preserve existing Git branches, commits and merge receipts.

Schema 31 stores workspace deliveries using completion and handoff receipts. Group branches, integration targets and execution branches belong to Git-enabled projects. The final table rebuild, foreign-key check and schema revision run in one transaction. Earlier research migrations can have their own committed checkpoints. If an upgrade fails, retain the backup, database, journals and sidecar and inspect the recorded outcome before recovery.

Ordinary startup requires schema 31 at its bound location. A database copy requires the explicit restore procedure.

## Restore a stopped schema-31 database to a new path

Disable every launcher of the old service and stop it. Keep the originals. Verify the final committed research root, files, Git worktrees, native session state and operation receipts together. Record the database snapshot's SHA-256, the `lockId` in `writer_service_owner.identity_json` and its last confirmed `epoch` **at backup time**. These values are not proof that no later commits exist: writes within an epoch do not increment it. If completeness, the original host or physical stop is uncertain, do not restore and resume.

Use a detached, self-contained SQLite snapshot (no journal/WAL/SHM or writer sidecar beside it) and a **new database path in an existing trusted directory** on the original host. Do not copy or remove a sidecar to repair an existing runtime. From source (SDK entrypoint: `sdk/src/core/collaboration-state/restore-writer.ts`):

```sh
node --import tsx server/src/collaboration-state/restore-writer.ts \
  --snapshot /path/to/verified-snapshot.sqlite --sha256 SHA256 \
  --source-lock-id ORIGINAL_UUID --source-epoch LAST_CONFIRMED_EPOCH \
  --database /new/research-root/collaboration-state.sqlite \
  --host ORIGINAL_HOST --service SERVICE_ID --confirm-stopped
```

The tool never modifies the source, replaces an existing database, or reuses its old UUID. It copies into an exclusively provisioned inode, verifies the digest, validates the copied database and binds it to its new descriptor/UUID in one `FULL` transaction. It advances the service epoch without changing project revisions or executing Agents. A partial copy or failed verification is evidence: ordinary open must not silently complete it. If COMMIT was entered and not acknowledged, inspect the target and its identity read-only; never rerun blindly. Re-establish the matching research files and verify all confirmed facts before separately authorizing startup. This is not automatic rollback to an older snapshot, in-place rebind on remount, or multi-host failover.

## Verification boundary

The product Store, Worker, runtime, offline upgrade and exact-source SDK core have Linux fixture coverage. This includes competing owners, independent roots, explicit upgrades from older schemas, retained facts, original SQL failures, uncertain COMMIT without replay, a process stopped for 31 seconds, and a failed Worker retaining the parent's lock. The 31-second case tests a real suspended process, not an advanced test clock. Separate tests use a real reader to block COMMIT and a lost-ack hook to model a successful COMMIT whose reply is lost.

The two-project integration fixture holds both simulated native turns inside `submit` under one coordinator and DB Worker. It pauses one project, lets the other finish, and checks the unchanged writer epoch, both original execution inputs, and two distinct repository-scoped PR #1 records. It does not use a live model or GitHub.

The offline restore fixture checks complete projection/events, an uncertain Git receipt, unchanged source bytes, destination refusal, failed digest and lost COMMIT acknowledgement. On Linux, the compiled Web entry reports its epoch over loopback and refuses a second Web process. A repository-external SDK tarball consumer verifies native lock exclusion, the next epoch, and the installed `dist/core/collaboration-state/{upgrade-writer,restore-writer}.js` commands. Both commands take the same flags as their source counterparts above. Neither acceptance path uses a live model, GitHub account, authentication store or PostgreSQL.

### Reproduce on a target host

Use the paired committed checkouts, Node 24 with `node:sqlite` and normal locked dependencies. Run the following **from each respective repository root**, against disposable storage only:

```sh
# Main
npm run typecheck -w server
npm run test -w server -- tests/writer-owner-process.test.ts tests/writer-owner.test.ts tests/writer-restore.test.ts --maxWorkers=1

# SDK
npm run typecheck -w sdk
npm run test -w sdk -- tests/main-core/writer-owner-process.test.ts tests/main-core/writer-owner.test.ts tests/main-core/writer-restore.test.ts --maxWorkers=1
npm run smoke:package -w sdk
```

Record the OS, CPU architecture, Node version, filesystem containing the fixture, test counts **including skips**, and installed-package result. The suspension test uses POSIX `SIGSTOP`/`SIGCONT` or the existing Python/Windows Job Object supervisor (`python.exe` required), queues one write while suspended for 31 seconds and verifies it commits once after resume. The alias/replacement test uses a Windows junction or POSIX directory symlink. A denied rename must leave the original owner exclusive; a successful substitution must stop writes. Windows/macOS execution is not certified by a Linux pass.

On GPFS, point the test process’s `TMPDIR` at a new private directory on the target mount and verify that directory’s filesystem. Normal contention, suspension, process death, path substitution, SQLite page exhaustion and offline upgrade/restore do **not** simulate a failed mount. Storage-fault/remount acceptance requires a separately authorized, isolated **single-host** mount with no production users. Record the original epoch/UUID, event and uncertain receipt, the error observed during loss, refusal under changed identity and recovery of the final verified facts. Never force a takeover, reuse a copied sidecar or remount the shared research volume for a test.
