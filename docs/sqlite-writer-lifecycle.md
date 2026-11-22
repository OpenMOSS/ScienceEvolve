# ScienceEvolve SQLite writer ownership

The research database has **one writer service per physical database on one host**, not one writer per project or Agent. `fs-native-extensions@1.5.3` holds a nonblocking native exclusive lock for the service lifetime. A pause, event-loop stall, busy SQLite connection or delayed fsync does not transfer ownership. Independent databases have independent locks. SQLite remains `DELETE`/`FULL`, with foreign keys, revision CAS and separate execution and coordinator epochs.

## Startup, shutdown and failure

- Start on the original host at the canonical database path. Schema 30 binds the database, parent directory, `<database>.writer.lock` and its UUID. Missing, hardlinked or replaced files are not silently repaired. Do not delete, replace or copy a lock to force takeover. This mechanism is not distributed fencing or protection against arbitrary code running as the service account.
- Each acquisition advances the durable epoch once. Additional connections require the current token **and** the local owner capability. A token copied into another process does not authorize attachment. Service ownership does not grant a replacement Agent an old execution or native session.
- Healthy service diagnostics report ownership `lifecycle-lock` and the epoch. Normal operation does not renew a row. `WRITER_LEASE_HELD` means another owner holds the resource; it has no takeover deadline. Admission and publication must drain before release. A failed resident or dispatcher drain retains ownership. If the DB Worker dies, pending outcomes are unconfirmed; the caller retains the lock through termination and callback drain.
- `WRITER_COMMIT_UNCONFIRMED` means a SQLite COMMIT did not return a confirmed result. Preserve the original cause and inspect the original revision, receipt and external facts. Do not replay a request because its reply was lost. A failed SQL statement before COMMIT is distinct: confirmed rollback preserves the original error and does not by itself transfer ownership.
- After process death the next service can acquire a new epoch. It must still reconcile native processes, sessions, checkpoints, receipts and external effects before resuming the original work. A lock release proves none of these effects stopped.

## Upgrade of a stopped schema 1–29 database

This is an offline format change, **not** a mixed-version rolling upgrade. Disable all scheduling and restart entrypoints; stop every old writer; verify the original host, project storage and retained sessions. Take a storage-consistent backup of the complete research root and its external worktrees/artifacts. The upgrade command also requires a **new, separate** directory for its SQLite backup. Do not point it at the AuthStore database.

From a source checkout, the entrypoint is `server/src/collaboration-state/upgrade-writer.ts` (SDK: `sdk/src/core/collaboration-state/upgrade-writer.ts`). For example, with the repository's `tsx` installed:

```sh
node --import tsx server/src/collaboration-state/upgrade-writer.ts \
  --database /path/to/collaboration-state.sqlite \
  --backup-directory /path/to/new-backup-directory \
  --host ORIGINAL_HOST --service SERVICE_ID --confirm-stopped
```

The command checks the legacy schema, host, journal mode and integrity, acquires the native owner, retains a SQLite backup, performs the existing research migrations, and switches authority. The old lease table is renamed and retained as immutable historical facts. The old binary cannot acquire/renew under its former table name. Legacy research migration steps have their own transaction checkpoints; the final protocol transition is a separate transaction. A failure is **not** a guarantee that every earlier schema checkpoint rolled back. Preserve the backup, original database, journal and sidecar for diagnosis; do not guess an outcome or retry automatically.

Ordinary startup refuses legacy databases. A copied schema-30 database has a different physical identity and ordinary open refuses it too. **A validated offline restore/rebind procedure for a copied schema-30 database is not part of this slice.** Do not deploy this format where that recovery procedure or native platform acceptance is a prerequisite. Moving to another host is not an automatic failover operation.

## Verification boundary

The product Store, Worker, runtime, offline upgrade and exact-source SDK core have Linux fixture coverage. This includes competing owners, independent roots, explicit upgrades from older schemas, retained facts, original SQL failures, uncertain COMMIT without replay, a process stopped for 31 seconds, and a failed Worker retaining the parent's lock. The 31-second case tests a real suspended process, not an advanced test clock. Separate tests use a real reader to block COMMIT and a lost-ack hook to model a successful COMMIT whose reply is lost.

A local Linux run does not certify Windows/macOS native packages, GPFS failure/remount behavior, a portable restore, or cleanup of arbitrary external processes. Full package/platform and stage acceptance are outstanding. The Web application and SDK retain their existing independent host entrypoints; neither PostgreSQL nor authentication storage is involved here.
