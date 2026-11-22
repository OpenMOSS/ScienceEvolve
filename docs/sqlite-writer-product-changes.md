# ScienceEvolve SQLite writer integration changes

## Schema preflight and database Worker drain — 2026-11-18

These changes are in the **product Store and database Worker**, not only the S0
probe package. They do **not** replace the TTL writer protocol or finish S1–S4.

### Implemented behavior

- `CollaborationStateDatabase.open()` reads schema metadata before acquiring or
  attaching writer authority. Missing/invalid metadata fails explicitly; a newer
  schema is rejected before writer acquisition or failed-open expiry cleanup can
  change its authority. Supported older schemas still use the existing migration
  path. This cannot change already-distributed old binaries: an incompatible
  authority-table identity is still needed for the future lock-protocol upgrade.
- Database Worker close shuts admission synchronously and shares one drain
  promise. Requests accepted before close retain FIFO ordering; new reads and
  mutations are rejected. Close waits for actual Worker termination and already
  active publication callbacks. A callback cannot close the Worker that is
  waiting for that callback; the attempt fails rather than deadlocking.
- A publication failure during drain remains the original failed write, with no
  committed state or blind retry. Existing typed error/CAS/publication behavior
  remains covered by targeted tests.

### Validation

Main and SDK each passed 12 selected tests in
`collaboration-open-preflight.test.ts` and `collaboration-database-worker.test.ts`.
The existing 30-second stall test was unselected in this slice. Both product
TypeScript checks passed. SDK tests were run through `npm run test -w sdk`,
including source verification, asset copying and branding pretest checks.

The initial Worker test used the wrong raw event column (`type` instead of the
actual `event_type`); the assertion was corrected and rerun. SDK pretest initially
rejected the task-created nested worktree; moving it out of the SDK checkout
resolved that error. Its diagnostic JSON also contained the matched historical
branding strings and was moved out of the scanned delivery tree. No check or
exception was disabled or broadened.

Four existing writer/migration checks ran on main: three passed, and
`migrates a real v1 branch constraint without retargeting foreign keys` failed
with `duplicate column name: gate_run_id`. The same failure was reproduced with
the saved pre-change Store in an isolated source tree. This is a retained
migration acceptance failure, not a pass or a regression attributed to this
preflight change. The new preflight negative cases also reproduce on that saved
Store (wrong authority error or unintended successful open).

No full product suite, build/package validation, Windows/macOS, live service,
production database migration, Agent/model calls or Online work ran in this
slice.

### Shared-core provenance and working-tree boundary

Both product source files are byte-identical across main/SDK; tests use the
existing path translation. The existing synchronization tool was run in isolated
task-owned trees reconstructed from the saved working-tree common baseline,
applying only the two source files and two test files. Its generated metadata
was returned without changing the 11 unrelated pending synchronization entries.
SDK `sync-main-runtime.mjs --check` passes against the resulting working-tree
capture (337 runtime files). The shared plan discovers 340 mappings and still
reports those 11 pre-existing changes, no textual conflicts.

The **committed** baseline has pre-existing non-test main/SDK differences in
`collaboration-runtime.ts` and `collaboration-state/store.ts`; the original dirty
working tree includes corrections to that baseline. Therefore source/test hunks
are committed independently. The generated shared/SDK metadata remains visibly
uncommitted together with the original baseline edits: committing it wholesale
would incorporate unrelated work. This slice does not claim a clean deliverable
shared baseline or full stage completion. The baseline owner must reconcile its
existing work, or it needs a separately authorized reconciliation slice.

## Chained Gate schema migration — 2026-11-18

The v28→v29 migration preserves a valid nullable TEXT `gate_run_id` column when
an earlier migration has already created it using the current scoped schema.
It rejects a pre-existing column with the wrong type/nullability/key/default
rather than silently tolerating it. Ordinary v28 tables still receive the column.
The journal rebuild, reference checks and transaction boundary remain intact.

Six selected checks passed on each host: original v1 migration, live-writer
refusal, invalid v1 rollback, v28 with/without the existing Gate column, and
invalid-column rollback including schema/index/trigger and authority retention.
This resolves the earlier `duplicate column name: gate_run_id` failure described
above. SDK pretest checks passed unchanged. The schema number stays 29.

Runtime TTL renewal, native-owner integration, complete migration/recovery and
platform/package exits remain outstanding. Demo, AuthStore and PG are unchanged.
