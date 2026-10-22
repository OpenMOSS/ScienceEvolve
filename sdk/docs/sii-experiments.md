# Asynchronous SII / Inspire experiments

[← Back to SDK README](../README.md) · **English** | [简体中文](sii-experiments-zh.md)

SII is disabled by default. Ordinary compute Agents need no Inspire CLI or platform account. The deployer explicitly configures sii for platform experiments; this is a host setting, not portable workflow content.

```js
const sdk = await createResearchSdk({
  dataDir: '/absolute/new-data',
  sii: {
    inspireBin: '/absolute/bin/inspire',
    workspaceRoot: '/absolute/allowed-workspaces',
    configPath: '/absolute/inspire/config.yaml', // optional
    noProxy: ['localhost', '127.0.0.1'],         // optional
    refreshMs: 30000                           // optional; integer, at least 1000 ms
  }
});
try {
  // Use the existing start / events / wait API.
} finally {
  await sdk.close();
}
```

Node API paths must be absolute. CLI runtime-config accepts the same sii object; relative inspireBin, workspaceRoot, configPath, and knowledgeRoot resolve from its file directory. knowledgeRoot defaults to packaged assets/skills/general/inspire independently of custom skillRoots. Set it explicitly to override.

Install the native Inspire executable and complete CLI account login/configuration first. The SDK uses the CLI's existing account context; it stores no separate platform-password catalog and does not install, log in, or allocate resources automatically. Enabling the service creates no experiment. Agent operations still require user authorization. The asynchronous service invokes the specified CLI directly, without the old shell wrapper.

The service starts after local storage initialization and before the engine. Normal close and startup failure collect it. workspaceRoot constrains access. Host-validated external Git-off workspace bindings remain supported; workflow/Agent fields cannot expand authorization.

Compute-authorized delivery Agents use scienceevolve-sii MCP:

- sii_read_knowledge reads operational knowledge; sii_command reads CLI help and performs operations.
- sii_submit_experiment submits and records asynchronous experiments. On existing notebook/ray/serving resources, register through sii_register_experiment before starting the background program.
- Use a fresh request_id per run; reuse it when retrying the same submission after a lost response. notebook/ray/serving programs atomically write completion_file containing `{run_id: request_id, exit_code}`.
- Agents may continue independent work in the same task. To yield, call sii_defer_task with experiment IDs and continuation context, then end the model turn.

The system monitors results and notifies the original session, without model polling loops. Tasks remain unfinished and successors blocked while waiting. Platform success does not complete the task: the resumed Agent checks results and decides whether to continue, retry, clean up, or use its existing completion tool. SDK close stops local monitoring/session services, not platform resources; explicitly clean those through CLI operations.

## Recorded validation scope (2026-10-08)

Windows / Node 24.20.0: 787 SDK regressions passed; three skipped for file-symlink permissions. Type checking, build, and independent tarball installation passed. Twenty-two existing main workflow configurations loaded unchanged.

SII tests used real local MCP/HTTP, file ledgers, and scheduler kernel, with platform outcomes and native model turns supplied by doubles. Coverage included deduplicated submission, waiting/session recovery, pause/cancel, completion gates, slot release, and close-time writes. Package checks covered optional service lifecycle and new knowledge resources. No real SII platform or model was called; this is not full platform acceptance. Linux/macOS were not run in that round.
