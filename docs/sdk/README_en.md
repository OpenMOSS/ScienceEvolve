# ScienceEvolve SDK documentation

[← Back to README](../../README.md) · **English** | [简体中文](README.md)

Start with the [quick start](../../README.md#quick-start) for daily use. This directory indexes development entry points and dated implementation/test records.

Current user documentation: [CLI and deployment](../../sdk/docs/main-cli.md), [Workflow reference](../../sdk/skills/scienceevolve-sdk/references/workflow-en.md), and [API reference](../../sdk/skills/scienceevolve-sdk/references/usage-en.md).

## Development and tests

Run from the repository root:

```sh
npm ci
npm run check:main-runtime
npm run typecheck
npm run build
npm test
npm run smoke:package
```

Build verifies pinned kernel source and copies runtime assets. smoke:package installs a tarball in an independent directory and checks CLI/API. Complete tests require Node.js 24+, Git, Bash/POSIX commands, symlink privileges, and local HTTP/subprocess/SQLite support. The [Linux validation environment](../../scripts/validation/README.md) remains documented in Chinese.

Run npm run pack:sdk for sdk/scienceevolve-sdk-0.1.1.tgz. Records should identify commit, environment, and actual results. See [kernel synchronization](../../sdk/docs/main-sync-20261016.md) for provenance and generation.

## Implementation and historical records

Current English entry points:

- [Main CLI/API](../../sdk/docs/main-cli.md)
- [2026-10-16 kernel synchronization and validation](../../sdk/docs/main-sync-20261016.md)
- [Runtime migration and historical boundaries](../../sdk/docs/main-runtime-migration.md)
- [Web / SDK comparison](../../sdk/docs/main-sdk-parity.md)

The following dated records remain in their original Chinese. They preserve historical evidence and are not current startup contracts:

- [2026-10-13 synchronization and host compatibility](../../sdk/docs/main-sync-20261013-zh.md)
- [Dual-loop implementation audit](dual-loop-audit.md#默认-main-引擎)
- [Historical legacy delivery/user guide](usage-guide.md)
- [Real-model acceptance](real-model-acceptance-20260921.md)
- [2026-09-23 gateway/Harness/multi-round acceptance](real-acceptance-20260923.md)
- [Regression test matrix](test-matrix-20260923.md)
- [2026-09-23 host comparison](main-sync-20260923.md)
- [Earlier CLI entry guide](../../sdk/docs/cli-guide-zh.md)
- [Historical legacy field audit](config-field-audit.md)

See [package installation](../../sdk/README.md) for startup. Date-specific reports and method audits must be read under their original engine, version, and validation scope. September materials and legacy plans do not define the default main interface.
