# ScienceEvolve naming and migration boundaries

[← Back to SDK README](../README.md) · **English** | [简体中文](naming-migration-zh.md)

> Historical naming-refactor record. Legacy was preserved at that point but has since been removed. The dated 404 observations below are historical, not a statement of current repository availability. Use the current [CLI guide](main-cli.md) and [runtime notes](main-sync-20261016.md).

This release changes project-owned names throughout the SDK, CLI, authored Skills
and generated runtime. It preserves the main and legacy engines and their functional
contracts. Naming conversion is a breaking configuration change, not an automatic
upgrade of live research state.

| Previously used name | Current name |
| --- | --- |
| `@scion-ar/sdk` | `@scienceevolve/sdk` |
| `scion-ar` | `scievolve` |
| `scienceevolve` CLI | `scievolve` |
| `SCION_AR_*` | `SCIENCEEVOLVE_*` |
| `SCION_*` example variables | `SCIENCEEVOLVE_*` |
| `.scion-ar` | `.scienceevolve` |
| `scion-ar-sdk` Skill | `scienceevolve-sdk` |
| Project-authored `scion-*` Skills | `scienceevolve-*` |

## Configuration and source projects

1. Keep the original package version, configuration and data directories together
   as an immutable backup. Record the engine, version and absolute workspace paths.
2. Update imports, package-manager dependencies, CLI commands and environment
   assignments in a separate source/configuration copy. Use the table above, including
   variables forwarded into child processes and example task services.
3. Update the preset kind to `scienceevolve-agent-config-preset`, MCP service/tool
   identifiers and authored Skill paths to the current names shown by generated
   configuration and `scievolve help`.
4. Validate the copied workflow with the new installed CLI before starting a new
   project. Use a separate, explicitly selected data directory for migration trials.
5. Check creation, pause/resume, resources and result delivery in that isolated project.
   Retain the original version and copies until the trial has been verified.

Rollback for a configuration trial means selecting the unchanged original version,
configuration and data directory. No tool in this refactor migrates real user data.
Changes made by an actual research run must be handled separately from naming changes.

## Existing runtime state

Old projects can contain internal workspace folders, absolute paths, MCP registrations,
serialized prompts and native-profile metadata. Changing only the top-level folder name
does not prove those records can be resumed by the new version. Keep old state with its
original engine/version, export its research artifacts through that version, and create
a separate new-version project when continuing work. Never blindly replace text inside
credentials, Git history, scientific inputs/results or live state databases.

The legacy CLI defaults to `~/.scienceevolve/data`; `--data-dir` or
`SCIENCEEVOLVE_DATA_DIR` selects a different root. The main CLI requires an explicit
`--data-dir` and rejects an environment-only directory selection. Neither selection
performs state conversion. Main and legacy data remain separate, just as before
this naming refactor.

## Historical and upstream evidence

Dated acceptance reports preserve original commands, artifact names, actual paths and
repository links. Source patches and per-file branding edits retain exact original bytes
so upstream hashes can be verified. These are individually checked exceptions, not
current installation instructions or compatibility aliases.

The fixed-source runtime is generated as upstream bytes, declared shared fixes/test
adaptations, then the deterministic naming overlay. Checking reverses that exact order.
The naming module's bytes are protected from automatic Git newline conversion.

## Release prerequisites

The target package name does not establish npm namespace ownership. Public requests
for the new npm package and the two documented GitHub repositories returned 404 during
this audit; private existence and write permissions could not be confirmed. Verify these
with the publishing account and configure working release links before public release.
The SDK package currently retains `private: true`; an authorized release process must
explicitly resolve that setting before npm publication. Local packaging/install checks
remain valid without publishing credentials.
