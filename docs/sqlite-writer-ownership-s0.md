# ScienceEvolve SQLite writer ownership: S0 evidence and integration design

Updated: 2026-11-18. **S0 is in progress; the production writer still uses its
existing TTL protocol.** This record covers isolated feasibility tests, not
S1–S4 or a production migration. Demo and Online are outside this slice.

## Scope and reproducible evidence

The paired `scripts/sqlite-writer-lock/` directories contain the same validation
source and pinned standalone dependency lockfile. This package is not imported
by the server/SDK and does not alter either host's runtime dependencies. See its
[commands and test boundaries](../scripts/sqlite-writer-lock/README.md).

Environment: Node **v24.21.0**, Linux x64, kernel **5.15.0-119-generic**. Both
checkouts and their fixture directories are on **GPFS**. The native package is
`fs-native-extensions@1.5.3`, Apache-2.0, N-API 9; installation used
`--ignore-scripts --no-audit --no-fund`. The Node prebuild loaded successfully.
The lockfile pins the seven installed packages, including the two direct loader
dependencies and their transitive packages.

| Check | main | SDK | Meaning |
| --- | --- | --- | --- |
| Native primitive/lifetime suite | 17 passed, ~32.2 s | 17 passed, ~32.1 s | Real processes, threads and files on this Linux/GPFS host |
| Actual schema-29 Store open suite | 5 passed, ~22.5 s | 5 passed, ~32.4 s | Isolated old-source checks, including the unsafe version-only control |
| Windows/macOS execution | Not run | Not run | No runners in this session; existing support is not withdrawn |
| New production protocol, recovery, SDK package, multi-project regression | Not run | Not run | Not implemented by this slice |

There are **22 distinct checks executed against each checkout**, not 44 distinct
behaviors. Repeated development runs are not additional acceptance. No full
product suite, real Agent/model call, real research database, production service,
network filesystem failure or cross-host takeover was exercised.

Pinned old implementation sources:

- main `af0fd3237cf064537775ecc81c03d8ce74988258`.
- SDK `7de072a95be9acf56cda9ef17538af8fa0caf75c`.

Each old implementation was loaded from a detached, clean worktree. The probe
checks schema version **29** before creating any database. Temporary worktrees
are disposable; the Git commits and committed test source are the reproduction
inputs, not a dependency on an untracked backup.

### What the native checks establish

- Linux OFD exclusion works for independent descriptors, processes and Workers.
  Distinct roots remain independently writable. The lock is not a host-wide
  Agent or project execution lock.
- SIGSTOP is confirmed by process state. After **31 seconds** (beyond the old
  30-second TTL), another process still cannot acquire the held inode. Resume
  followed by close permits acquisition; normal exit and SIGKILL also release.
- Worker-opened descriptors close on Worker termination/error on this Node build.
  A descriptor opened by the parent and used by a Worker remains held when only
  that Worker exits. Nested Worker/process exit and default child non-inheritance
  are covered separately.
- A parent owner Worker retains its descriptor while a child Worker is inside a
  blocked native SQLite call during termination. This test checks the ordering
  while blocked, not only the final absence of a lock.
- Errors such as `EBADF` propagate. Contention is distinct from an unavailable
  native primitive; no fallback is permitted.

### Negative identity controls are part of the design evidence

A symlink to the **database** resolves to its canonical name, but a hardlink can
have a different canonical name for the same inode. Two sidecars derived solely
from those names can both be locked. Likewise, renaming a held sidecar and
creating a new file at the old name creates another independently lockable
inode. These controls pass by demonstrating the bypass, **not by claiming a
production guard already prevents it**.

No lock file may be removed, replaced, expired or recreated to recover from a
slow owner. A trusted administrator can modify files as the service user; these
locks are not an arbitrary-code security boundary. Missing/changed identity must
fail closed rather than trigger lock repair while a service could still run.

### Actual old-binary rejection evidence

The version-only control changes the fixture's schema number to 30, calls the
actual old `open()`, and observes the persisted writer epoch advance before open
fails. This confirms that a schema bump alone is unsafe.

The identity-switch controls rename the old table inside an isolated transaction.
Old acquire and old attach then fail at the missing-lease-table check **before
any SQLite bytes change**. An already-open old connection cannot append another
event. Injected DDL failure preserves the entire prior schema and all table rows,
including an event with original invocation/session and unconfirmed-effect facts.
This proves a refusal mechanism, not a finished migration or safe concurrent
handover from a live old service.

## Identity/lifecycle executable design (2026-11-18)

`identity-guard.mjs`, `identity-holder.mjs` and `identity.test.mjs` in the standalone
validation package now implement and exercise the identity/lifetime design in
isolated fixtures. **They are not imported by the product runtime.** The 31 new
checks passed on Linux/GPFS in both checkouts; `node --check` also passed. The
17 primitive checks were rerun separately from the pinned-old-source tests.
Header validation also rejects high-bit bytes rather than accepting lossy ASCII
decoding. The pinned-old-source suite was not rerun for this identity-only slice.

The prototype normalizes database symlinks, rejects database hardlinks and
non-regular/linked lock files, binds parent/database/lock device and inode
identities as decimal strings, and checks an immutable UUID header. GPFS stat
reports birth time zero here, so birth time is not treated as usable identity.
Strict decoding rejects omitted/extra/malformed fields and numeric truncation.
Existing bindings never recreate a missing sidecar. Exclusive provisioning is
fixture-only; a partial header stays visible rather than being silently repaired.

Tests preserve SQLite bytes, fixture epoch and unknown-effect receipts on rejected
opens; check sidecar substitution between inspection/open and after acquisition;
and reject copying a bound database to another root. In-place restarts preserve
the binding. Changed filesystem identity after restore/remount fails closed:
an offline restore/rebind protocol must explicitly re-establish it while retaining
research facts, rather than pretending the physical identity is portable.

The prototype fences immediately on failure and retains the original error and
lock. Close rejects reentry into work, shares one drain promise, releases only on
successful drain, and does not rerun or unlock after a failed drain. A child-process
fixture proves the failure retains exclusion until process death. It does not
prove actual runtime drain, child-process stop or remote-effect reconciliation.

These checks narrow the S0 design but do not provide an atomic snapshot of mutable
filesystem paths. Production integration must bind/check the actual SQLite-open,
transaction and publication boundaries under a trusted non-mutating directory.
Provisioning currently fsyncs the header only; durable directory creation,
SQLite-plus-sidecar migration failure, inode reuse across restores, mount failure
and Windows/macOS behavior remain separate acceptance gates. No production
schema, public API, dependency manifest, sync baseline or running service changed
in this slice.

## Combined schema-29 protocol rehearsal (2026-11-18)

The paired `protocol-fixture.mjs` and `protocol.test.mjs` combine the guarded lock,
legacy refusal and durable epoch transactions. These are **isolated test fixtures,
not production migrations or runtime code**. They load the same pinned old main
and SDK sources recorded above. The actual old Store is closed before migration;
its future expiry remains in the preserved old row and is not a takeover signal.

Nine checks passed on each checkout: research tables/unknown-effect evidence
preserved, old authority rows immutable, old acquire/attach rejected without
writes, repeated migration rejected, restart epoch advanced, stale/closed callers
rejected, DDL/actual SQLite error rollback, lost COMMIT result fencing, a real
reader-blocked COMMIT, acquisition pre/post-COMMIT faults, and invalid host/schema/
connection/binding/overflow refusal. The protocol is explicitly probe-namespaced;
the table layout is fixture-only. `DELETE/FULL` remains in force. Connection path
checks are not claimed to atomically identify a SQLite handle under arbitrary
path mutation.

- SDK: 9/9 in one run, ~77.6 s.
- Main: first combined run hit its 120-second outer timeout, without a completed
  test result; **not a pass**. A read-only inspection refused the hot-journal
  fixture (SQLite errcode 776). A separate copied fixture recovered to integrity
  `ok`, schema 29, zero writer rows and zero project rows, with no new sidecar
  present. The interrupted operation was still in old fixture initialization,
  not the new migration. The underlying stall cause is not established.
- Main rerun: first case 1/1 (~3.9 s), remaining cases 8/8 (~59.4 s). The test
  contract, DELETE/FULL and assertions were not weakened to obtain these results.
  No process from the timed-out fixture remained.
- Strengthened full-schema rollback snapshots also compare indexes and triggers;
  the seven affected cases passed again (main ~45.1 s, SDK ~57.6 s), without
  counting repeats as additional behaviors.

The fixture treats errors after entering COMMIT as unconfirmed, preserves their
cause, fences the guard and never retries. A still-active transaction is cleaned
up without claiming that an already-completed COMMIT was undone. The post-COMMIT
hook tests lost acknowledgement, not real storage failure. Closed SQLite and
completed runtime drain remain prerequisites for releasing ownership.

This rehearsal does not finish earlier-schema upgrades, fresh database setup,
sidecar-directory durability, offline restore/rebind or product Worker/recovery
integration. It does not certify Windows/macOS or GPFS failure behavior. S0 and
the stage-one exit remain incomplete; Online has not begun.

## Integration design to implement and verify in S1/S2

These are implementation requirements, **not capabilities of the current Store**.
The standalone prototype exercises part of this design; detailed API/DDL changes
must remain paired and tested, not be inferred from the small DDL fixture.

### Owner, connection and shutdown lifetime

1. One runtime owner holds a native descriptor **in the caller that owns the
   runtime**, before starting its database Worker. The lock remains held through
   Worker failure handling and shutdown drain. Opening the descriptor only in
   the database Worker could release it before the surviving runtime has fenced
   callbacks or stopped admitting effects.
2. A synchronous Store used without a Worker owns the same lifecycle guard.
   Attaching a connection requires that exact local owner capability plus the
   durable service/instance/host/epoch identity; copying a serializable token
   alone must not grant another process writer authority.
3. Worker requests use the existing FIFO without retry on lost replies. A shared
   availability gate fences late work; Worker failure closes admission before
   reporting failure. Retaining the lock while draining is intentional. There
   is no timer-driven unlock and no independent heartbeat authority.
4. Close must be reentrant and await the same drain. Stop new submissions,
   reconcile/record confirmed execution shutdown as allowed, await in-flight
   database operations and actual Worker termination, close SQLite connections,
   then release the descriptor. Startup failure follows the same resource order.
   A failure to confirm cleanup must not unlock and report a successful close.
5. A killed process releasing its kernel lock says nothing about surviving
   children, native sessions or remote Git effects. Existing recovery, original
   identity and uncertain-outcome reconciliation remain mandatory before replay.

### Database and lock identity

- Canonicalize the existing parent and database symlinks before deriving the
  sidecar. Recheck identities around acquisition; never lock the SQLite main,
  journal or shared-memory descriptor. Different canonical databases get
  independent locks.
- Reject hardlinked database files and linked/non-regular lock files explicitly;
  verify `lstat`/`fstat` identity and link count, including during ownership checks.
  Same-process duplicate acquisition must fail just like a second process.
- Bind the durable database ownership metadata to the established lock identity.
  An existing new-protocol database with a missing or changed lock must refuse
  normal open **before** advancing its epoch. Recreating or rebinding it belongs
  to a separately validated offline restore procedure, not a startup fallback.
- Detect moved/replaced database, lock or canonical parent identities; retain the
  acquired descriptor on failure until the runtime is fenced/drained. Tests must
  include races around acquisition, not only a renamed path observed later.
- The prototype uses strict decimal device/inode identities and a random lock ID.
  Ordinary restart preserves them; copying/restoring/remounting with changed
  identity refuses open. A separately controlled offline rebind and cross-platform
  validation are still required; this representation alone is not a finished
  backup/restore protocol.

### Durable epoch and protocol upgrade

- Preserve service, instance, host and a monotonically increasing writer epoch;
  acquisition occurs only under the native owner guard. Each mutation retains
  epoch and project revision/CAS checks. Wall-clock age is not authority.
- Use an incompatible authority-table identity so the tested old open order
  fails before its acquire/failed-open-expiry writes. Preserve prior authority
  evidence rather than dropping research rows or resetting epochs. The new
  table's exact DDL and schema version are not finalized by this fixture.
- The schema-29 rehearsal preserves the old owner row in an immutable table and
  creates a separately named, probe-only owner table in one transaction. It is
  evidence for the transition, not finalized production DDL or upgrade tooling.
- Existing old-protocol databases need an explicit offline upgrade after the
  old runtime is confirmed stopped and backed up. Absence of the **new** lock,
  an expired old lease or a dead PID is not proof of that stop. No mixed-protocol
  rolling takeover. Production stop/migrate/restart remains separately authorized.
- Older schema upgrades must retain their existing migration invariants and
  rollback behavior. New protocol setup, integrity/identity checks, and epoch
  acquisition require failure-injection tests, including COMMIT uncertainty.
  Do not replace an uncertain outcome with unconditional rollback/success.
- New owner health reports actual ownership/failure/progress separately. Remove
  TTL renewal fields/configuration only when their callers, diagnostics and tests
  have migrated; execution/coordinator leases are separate contracts.

### Durability, concurrency and platform gates

Keep the existing path, single-host topology, **DELETE/FULL**, short SQLite
transactions and lock-outside-Agent-work boundaries. Do not change file-view
publication semantics merely to reduce lock time. Required follow-up tests cover
slow COMMIT, late callbacks, CAS, same-runtime multi-project/Agent overlap,
independent roots, original sessions and effect receipts.

Linux GPFS primitive success does not certify mount loss, I/O failure, every
SQLite/Worker cleanup ordering or multi-host fencing. Windows `LockFileEx` and
macOS `flock` are present in the pinned native source; their actual contention
errors, close/Worker behavior, identity APIs, prebuild installation and packaged
SDK execution remain unaccepted. Skips must remain visible and cannot be used to
mark S0/S4 complete or proceed to Online.

## Working-tree isolation and remaining gates

The original main/SDK worktrees contain substantial unrelated changes, including
Store, contracts, runtime and sync baselines. No such hunk is part of this slice.
Main also advanced during the investigation; a pinned test worktree prevents that
from silently changing the old implementation under test.

Read-only `planSync(..., {from: 'both'})` at slice start covered 339 mappings,
**11 changes, no textual conflicts**: invocation-policy, orchestrator,
protocol-router, scoped-agent-configuration, serial-task-recovery (SDK addition),
storage, types, workflow-input, and invocation-policy/orchestrator-main/
serial-workflow-native-input tests. No `applySync`, baseline rewrite or unrelated
commit was performed. Zero textual conflicts does not establish semantic parity.

The standalone validation package is paired directly as tooling; it is not an
SDK core-source override. Source/schema/runtime changes still require the
existing exact-source synchronization machinery and a settled paired baseline.
The standalone package's `npm test` is not an SDK product-test run and does not
replace or bypass the SDK's mandatory pretest/build checks.

Remaining gates: finish canonical/persistent identity and migration design;
resolve the moving shared-core baseline without incorporating unrelated work;
validate Windows/macOS; then implement and accept S1–S4. Online remains unstarted.
No push, deployment, production migration, service restart or Demo action belongs
to this slice.
