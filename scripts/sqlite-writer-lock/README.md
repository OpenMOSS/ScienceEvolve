# ScienceEvolve SQLite writer lock validation (S0)

This is an isolated native-lock and legacy-open validation package, **not the
collaboration runtime**. It does not upgrade existing databases, start Agents,
change the server/SDK dependency graph, or establish S1–S4 acceptance.

## Native primitive checks

From this directory, using Node 24+:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

The package pins `fs-native-extensions@1.5.3` and its transitive dependencies in
`package-lock.json`. No install scripts or native compilation are needed for the
verified Linux x64 prebuild. Missing prebuilds or native errors fail the test;
there is no timestamp-lock or no-op fallback.

The 17 primitive checks and 31 identity/lifecycle checks create only task-owned fixtures under
`../../.scratch/sqlite-writer-lock-validation/`. Each case closes its descriptors,
terminates its own workers/processes, and deletes its own fixture directory.
The parent scratch directory can remain empty. The test uses the filesystem on
which the checkout resides, not a substituted `/tmp` lock.

Checks cover:

- Same-process and cross-process exclusion, independent roots, normal close and
  SIGKILL release, symlink/hardlink aliases of a lock inode.
- Negative controls: a hardlinked **database** can have two distinct sidecars;
  replacing the sidecar creates a separately lockable inode. Kernel exclusion
  alone does not solve database identity or protect a mutable directory entry.
- Worker/nested-Worker termination, uncaught Worker error, parent process death,
  parent-owned versus Worker-owned descriptors, ordinary child non-inheritance.
- A native SQLite wait in a child Worker keeps its owner Worker's descriptor
  held until child teardown completes. This is bounded Linux/Node evidence,
  not a portable guarantee for every filesystem failure or every Worker layout.
- An owner actually suspended for **31 seconds** remains exclusive, then resumes
  and releases normally. The old writer TTL is 30 seconds.
- Closed descriptors produce the actual error, not a false contention result.

On Windows, SIGSTOP/SIGCONT and the POSIX rename fixture are explicitly skipped;
these skips are **not acceptance**. File symlink creation requires the applicable
Windows privilege. A Windows suspend/resume and file-replacement fixture, plus
native loading, contention-error, packaging and lifecycle checks on Windows and
macOS, remain required. The test must not be used to remove existing platform
support.

## Identity and lifecycle executable design

Run only the fast identity slice with:

```sh
node --test --test-concurrency=1 identity.test.mjs
```

`identity-guard.mjs` is an S0 prototype, **not a production Store or migration
entrypoint**. It uses the real native primitive, canonical database paths,
single-link regular-file checks, and a strict binding of parent/database/lock
file identities plus an immutable random lock ID. Identity numbers are decimal
strings, not lossy JavaScript numbers. GPFS reports no usable birth time in this
environment, so the design does not use birth time as a fallback identity.

New fixture provisioning is explicit and uses exclusive creation; a normal open
must supply the existing binding and cannot create/repair a missing lock. SQLite
fixture tests persist the binding, recheck it before incrementing an epoch, and
retain unknown-effect receipts. Provisioning/header fsync is not an atomic
production SQLite-plus-sidecar migration; no directory-durability guarantee or
automatic recovery is claimed.

The tests cover file/directory symlink convergence, hardlink rejection, missing
and replaced objects, lock-header corruption, replacement during inspection/open
and post-lock checks, defensive binding copies, and rejected ordinary backup
copies. The probe has no rebind path. For the separate product offline restore
command and its limits, see [SQLite writer ownership](../../docs/sqlite-writer-lifecycle.md). Device/inode identity is deliberately
fail-closed after remount/restore changes, not assumed portable across them.

The guard retains the original failure and descriptor when fenced. `close(drain)`
rejects new calls immediately and returns one shared promise. It closes only
after the supplied drain succeeds. A failed drain remains rejected and locked;
the isolated process test confirms release only after process exit. The callback
is a contract to test, **not proof that the actual product Worker or children
have drained**.

Path checks are not an atomic filesystem snapshot: a privileged actor can
replace directory entries after a check. The production protocol still needs
checks at its actual SQLite-open/transaction/publication boundaries and a trusted,
non-mutating runtime directory. This is not an execution sandbox or protection
against arbitrary writes by the service user. Native GPFS failures, remounts,
Windows/macOS file identity and packaged-runtime behavior remain unverified.

## Pinned legacy binaries against the actual product

To exercise the schema-30 Store, backup/upgrade and restore code rather than the protocol fixture, run from this directory:

```sh
SCIENCEEVOLVE_LEGACY_WRITER_CORE=/absolute/pinned-schema-29-core \
SCIENCEEVOLVE_CURRENT_WRITER_CORE=/absolute/current-product-core \
  ../../node_modules/.bin/tsx --test product-upgrade.test.mjs
```

Use `server/src` for main and `sdk/src/core` for SDK. The script checks the source schema versions. Its disposable fixtures live on the checkout filesystem. It opens an actual old Store, records a session/event and uncertain operation, closes it, upgrades with a backup, and verifies both old acquisition and attachment refuse without changing database or sidecar bytes. A new-version confirmed event must survive subsequent snapshot restore; the uncertain receipt must not be replayed. A separate trigger forces a real SQL rollback of the ownership transition, and the old schema, data and readable backup are checked. This does not authorize any migration of a running service.

## Legacy-open checks

Use an isolated, pinned **schema-29** checkout. The probe refuses another schema.
The source directory is `server/src` for main and `sdk/src/core` for SDK. It is
explicitly provided, not inferred from a potentially changing working tree:

```sh
SCIENCEEVOLVE_LEGACY_WRITER_CORE=/absolute/pinned-checkout/server/src \
  ../../node_modules/.bin/tsx --test legacy-open.test.mjs
```

From this directory the repository's `tsx` is at `../../node_modules/.bin/tsx`.
The same command works with `/absolute/pinned-sdk/sdk/src/core`. Dependency
resolution for the pinned checkout must already be available; the probe neither
installs product dependencies nor fetches source itself.

Five checks use the **actual old Store** against newly created databases:

1. A version-only bump demonstrably lets old `open()` advance the writer epoch
   before rejecting the schema. This expected negative control passes only when
   that unsafe behavior is reproduced.
2. Renaming the old authority table makes old acquire fail before changing any
   SQLite bytes.
3. The same holds for an old attached connection open.
4. Injected DDL failure rolls back the identity/version change and preserves all
   table rows, including original invocation/session and unknown-effect evidence.
5. An already-open old connection cannot append after the table identity changes.

The DDL is a **fixture**, not the production migration: it does not implement the
new owner schema, migration entrypoint, durable lock identity, epoch acquisition,
shutdown drain, or recovery. It cannot prove that an existing old process and its
children/remote effects have stopped. Production upgrades still require a
separately authorized controlled stop, backup and validated migration.

## Combined protocol rehearsal

With the same explicit pinned schema-29 source directory:

```sh
SCIENCEEVOLVE_LEGACY_WRITER_CORE=/absolute/pinned-checkout/server/src \
  ../../node_modules/.bin/tsx --test protocol.test.mjs
```

`protocol-fixture.mjs` composes the identity guard with a disposable SQLite
migration and epoch transaction. It is **not a migration command** and is not
included in the product's schema. The fixture calls and closes the actual old
Store before migration; its unexpired old lease is retained deliberately, not
used to prove that the writer stopped. Production upgrades need independent
controlled-stop/backup evidence, including child and remote effects.

Nine checks verify:

- Renaming the old authority table and preserving its rows behind immutable
  triggers; creating probe owner metadata with the lock binding; advancing rather
  than resetting the writer epoch; retaining every research table and receipt.
- Actual old acquire/attach fail without changing bytes after the switch;
  repeated migration refuses; subsequent acquisition advances epoch and rejects
  late calls with the old token or closed guard. No wall-clock expiry is used.
- Pre-COMMIT fault and an actual SQLite trigger error roll back DDL/version/rows;
  original SQLite errors remain identifiable.
- Lost result after a real COMMIT keeps committed facts, fences the owner and
  retains the native lock. There is no replay and no claim that rollback undid a
  completed COMMIT.
- A real reader blocks COMMIT; the failure fences the owner, preserves the first
  error as its cause, and cleans up an active transaction without retrying. This
  conservative fixture marks any entered-COMMIT failure unconfirmed; it does not
  invent a successful outcome from cleanup.
- Acquisition faults distinguish rolled-back and committed-but-unacknowledged
  epochs. Wrong host/connection/schema/binding and unsafe epoch overflow refuse
  before changing authority.

This rehearsal covers schema 29 only. Earlier migrations, fresh-store creation,
offline restore/rebind, directory durability, actual Worker/runtime integration,
packaging and Windows/macOS are still separate gates. An `after-commit` hook is
lost-result injection, **not** physical disk-failure certification.

See `../../docs/sqlite-writer-ownership-s0.md` for pinned sources, results and the
remaining integration gates.
