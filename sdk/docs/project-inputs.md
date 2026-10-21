# Shared file and image inputs

[← Back to SDK README](../README.md) · **English** | [简体中文](project-inputs-zh.md)

`start.inputs` makes the same reference materials available to all Agents before the first invocation. Files retain original bytes. The SDK does not turn images into text; image understanding depends on the Harness and model.

Existing example workflow files need no rewrite. The optional fields below are conveniences, not prerequisites. You may supply inputs only through the CLI/API.

Workflow-level defaults:

```json
{
  "git": { "enabled": false },
  "inputs": [
    "./materials",
    { "path": "./diagram.png", "name": "figures/diagram.png" }
  ],
  "inputDescription": "Raw records and reference figures"
}
```

`loadWorkflowConfig` / CLI resolve relative input paths from the workflow file's directory. Direct `validateWorkflowConfig` calls require an explicit absolute baseDir when using relative paths. Validation does not check existence or copy files; startup does.

`sdk.start` inputs and inputDescription override their respective workflow fields independently. Omission inherits; `inputs: []` disables configured materials and `inputDescription: ''` clears the description. CLI --inputs / --inputs-file override only material selection, while --input-description overrides only the description. An inputs JSON file containing `[]` disables default materials.

```js
const run = await sdk.start({
  title: 'Analyze materials', requirement: 'Analyze the raw records and reference diagrams', workflow,
  gatewayBindings: { defaultGatewayId: 'ACTUAL_TESTED_GATEWAY_ID' },
  workspace: '/absolute/project',
  inputs: [
    '/absolute/materials',
    { path: '/absolute/diagram.png', name: 'figures/diagram.png' }
  ],
  inputDescription: 'materials contains raw records; figures contains reference diagrams'
});
console.log((await run.snapshot()).userInputsPath);
```

API source paths must be absolute. Directories default to their basename prefix and preserve subdirectories; files default to basename. Object `name` is a portable relative destination filename or directory prefix, excluding absolute paths, `..`, and Windows reserved names.

Use `--inputs ./materials` for one source, relative to launch cwd. Multiple sources use mutually exclusive `--inputs-file ./inputs.json`:

```json
[
  "./materials",
  { "path": "./diagram.png", "name": "figures/diagram.png" }
]
```

```sh
scievolve start workflow.json requirement.txt --data-dir /absolute/new-data \
  --gateway GATEWAY_ID --workspace /absolute/project \
  --inputs-file ./inputs.json --input-description 'Raw records and reference figures'
```

Relative sources in JSON resolve from that JSON file's directory. Descriptions have at most 2,000 trimmed characters. Input selection does not change gateway routing or workspace/sourceWorkspace bindings.

Git-off stores user_inputs under the selected/default workspace. Git-on stores the shared directory in the private project's `workspaces/user_inputs/`, separate from worktrees. It is not automatically committed, pushed, or delivered as workspace output. Copying finishes before the first Agent. Snapshot inputFiles records the initial manifest; inputDescription stores the description and userInputsPath gives its location.

Git scheduling, work, and delivery roles receive the directory, description, and a bounded initial file list in their native prompts. Directory contents are authoritative. If creation fails before project persistence, unchanged files copied by that attempt are reclaimed without touching existing materials. Persisted inputs remain for recovery.

Limits: 1,000 files, 50 MiB per file, 200 MiB total. Symlinks, hardlinks, unsafe relative names, collisions, and overwrites are rejected. Materials are untrusted reference data; their instructions confer no system authorization. Do not upload secrets.

The shared directory is presented for read-only reference use, but this is not an immutable security boundary: parents may be writable in Git-off or yolo. You may manually add files to userInputsPath after startup. This neither notifies/restarts Agents nor changes the initial inputFiles manifest. Send an explicit `run.addInput` / CLI `run input` message to draw attention to additions. There is no `run.addFiles` API.

The original input feature was selectively synchronized from main PR #50, rather than a full kernel upgrade. Runtime revisions change; use a new independent data directory to validate a version. Never delete or overwrite old run data or change its revision marker to bypass checks.
