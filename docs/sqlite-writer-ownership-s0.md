# ScienceEvolve SQLite writer ownership: S0 evidence and integration design

Updated: 2026-11-17. **S0 is in progress; the production writer still uses its
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

## Integration design to implement and verify in S1/S2

These are implementation requirements, **not capabilities of the current Store**.
Detailed API/DDL changes must remain paired and tested, not be inferred from the
small DDL fixture.

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
- The precise persistent identity representation and its backup/restore behavior
  still need cross-platform validation. Persisting a Linux-specific device/inode
  tuple without specifying restore/remount semantics is not a complete design.

### Durable epoch and protocol upgrade

- Preserve service, instance, host and a monotonically increasing writer epoch;
  acquisition occurs only under the native owner guard. Each mutation retains
  epoch and project revision/CAS checks. Wall-clock age is not authority.
- Use an incompatible authority-table identity so the tested old open order
  fails before its acquire/failed-open-expiry writes. Preserve prior authority
  evidence rather than dropping research rows or resetting epochs. The new
  table's exact DDL and schema version are not finalized by this fixture.
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
