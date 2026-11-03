import { chmod, mkdtemp, mkdir, readFile, realpath as fsRealpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  prepareInvocationInputs,
  prepareProjectUserInputsPath,
  mirrorProjectWorkspaceFiles,
  validateStagedInvocationInputs
} from "../../src/core/harness-runtime/invocation-inputs.js";
import { compileFilesystemAuthority, filesystemAuthorityPrompt } from "../../src/core/harness-runtime/filesystem-authority.js";

describe("prepareInvocationInputs", () => {
  it("mirrors all shared regular project files into Git without overwriting Agent work", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "scienceevolve-shared-git-inputs-"));
    try {
      const source = path.join(root, "workspaces"), worktree = path.join(root, "git-worktrees", "agent");
      await mkdir(path.join(source, ".hidden"), { recursive: true });
      await mkdir(path.join(source, "user_inputs")); await mkdir(worktree, { recursive: true });
      await writeFile(path.join(source, ".hidden", "configuration.json"), "{}\n");
      await writeFile(path.join(source, "user_inputs", "data.bin"), Buffer.from([0, 1, 2, 255]));
      await writeFile(path.join(source, "Memory.md"), "shared initial memory\n");
      await writeFile(path.join(worktree, "Memory.md"), "newer Agent-written memory\n");
      await mirrorProjectWorkspaceFiles(root, worktree);
      expect(await readFile(path.join(worktree, ".hidden", "configuration.json"), "utf8")).toBe("{}\n");
      expect(await readFile(path.join(worktree, "user_inputs", "data.bin"))).toEqual(Buffer.from([0, 1, 2, 255]));
      expect(await readFile(path.join(worktree, "Memory.md"), "utf8")).toBe("newer Agent-written memory\n");
      await writeFile(path.join(source, "user_inputs", "later.txt"), "later supplied input\n");
      await mirrorProjectWorkspaceFiles(root, worktree);
      expect(await readFile(path.join(worktree, "user_inputs", "later.txt"), "utf8")).toBe("later supplied input\n");
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("never seeds a missing original business Memory for a closing grant", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-closing-inputs-"));
    try {
      const projectPath = path.join(root, "prj_fixture"), workspacePath = path.join(root, "original-worktree");
      const runtimePath = path.join(projectPath, "runtime", "inv_closing");
      const inboxPath = path.join(projectPath, "messages", "0001_inv_closing_to_writer.md");
      await Promise.all([mkdir(workspacePath), mkdir(runtimePath, { recursive: true }), mkdir(path.dirname(inboxPath), { recursive: true })]);
      await writeFile(inboxPath, "Original Leader authorized only leftover.txt");
      const memoryPath = path.join(workspacePath, "agent-memory", "writer", "Memory.md");
      const request = { project: { id: "prj_fixture", git: { enabled: true } }, agent: "writer", invocationId: "inv_closing",
        projectPath, workspacePath, runtimePath, inboxPath,
        executionContext: { role: "delivery", executionWorktree: workspacePath },
        worktreeClosing: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["leftover.txt"], executionId: "old",
          ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "close" } } as Parameters<typeof prepareInvocationInputs>[0];
      await expect(prepareInvocationInputs(request)).rejects.toThrow(/stage|prepare/i);
      await expect(readFile(memoryPath)).rejects.toMatchObject({ code: "ENOENT" });
      await mkdir(path.dirname(memoryPath), { recursive: true });
      await writeFile(memoryPath, "Original retained business memory");
      const prepared = await prepareInvocationInputs(request);
      expect(prepared.memoryPath).toBe(await fsRealpath(memoryPath));
      expect(await readFile(memoryPath, "utf8")).toBe("Original retained business memory");
      expect(prepared.inboxPath.startsWith(workspacePath)).toBe(false);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("seeds first-use Git collaboration memory inside the execution worktree", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-collaboration-"));
    const projectPath = path.join(root, "prj_fixture");
    const executionWorktree = path.join(root, "worktrees", "exec_fixture");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_writer.md");
    const memoryPath = path.join(executionWorktree, "agent-memory", "writer", "Memory.md");
    const userInputsPath = path.join(projectPath, "workspaces", "user_inputs");
    await Promise.all([
      mkdir(path.dirname(inboxPath), { recursive: true }),
      mkdir(executionWorktree, { recursive: true }),
      mkdir(runtimePath, { recursive: true }),
      mkdir(userInputsPath, { recursive: true })
    ]);
    await writeFile(inboxPath, "business assignment");
    await writeFile(path.join(userInputsPath, "reference.txt"), "original shared evidence");
    const prepared = await prepareInvocationInputs({
      project: { id: "prj_fixture", git: { enabled: true } },
      agent: "writer",
      invocationId: "inv_fixture",
      projectPath,
      workspacePath: executionWorktree,
      inboxPath,
      runtimePath,
      executionContext: {
        nodeRunId: "nr_fixture",
        taskId: "tsk_fixture",
        executionId: "exe_fixture",
        role: "delivery",
        ownershipEpoch: 2,
        executionWorktree
      }
    } as Parameters<typeof prepareInvocationInputs>[0]);
    expect(prepared.workspacePath).toBe(await fsRealpath(executionWorktree));
    expect(prepared.memoryPath).toBe(await fsRealpath(memoryPath));
    expect(prepared.userInputsPath).toBe(await fsRealpath(userInputsPath));
    expect(await readFile(path.join(prepared.userInputsPath!, "reference.txt"), "utf8")).toBe("original shared evidence");
    expect(await readFile(memoryPath, "utf8")).toBe("");
    expect(prepared.inboxPath).toContain(path.join("runtime", "inv_fixture", "staged-inputs", "inbox"));
    expect(prepared.inboxPath.startsWith(await fsRealpath(executionWorktree))).toBe(false);
  });

  it.each(["leader", "delivery"] as const)("grants the %s read access to canonical inputs outside its Git worktree", async (role) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-input-authority-"));
    try {
      const serviceRoot = path.join(root, "service-home");
      const projectRoot = path.join(root, "data", "prj_fixture");
      const userInputs = path.join(projectRoot, "workspaces", "user_inputs");
      const executionWorktree = path.join(projectRoot, "git-worktrees", "agents", "writer");
      const memory = path.join(executionWorktree, "Memory.md");
      await Promise.all([mkdir(serviceRoot, { recursive: true }), mkdir(userInputs, { recursive: true }), mkdir(executionWorktree, { recursive: true })]);
      await writeFile(memory, "retained business memory");
      const userInputsPath = await prepareProjectUserInputsPath(await fsRealpath(projectRoot));
      const authority = await compileFilesystemAuthority({ permission: "workspace", role, gitEnabled: true,
        serviceUserRoot: serviceRoot, executionWorktree, ownedMemoryPath: memory, protectedRoots: [], inputReadRoots: [userInputsPath!] });
      expect(authority.rootBindings).toContainEqual(expect.objectContaining({ path: userInputsPath, write: false }));
      expect(authority.readRoots).not.toContain(await fsRealpath(projectRoot));
      expect(authority.writeRoots).not.toContain(userInputsPath);
      expect(filesystemAuthorityPrompt(authority, { workspacePath: executionWorktree, inboxPath: memory, memoryPath: memory, userInputsPath }))
        .toContain("User-supplied files: ");
      await writeFile(path.join(userInputs, "later.txt"), "added after invocation preparation");
      expect(await readFile(path.join(userInputsPath!, "later.txt"), "utf8")).toBe("added after invocation preparation");
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("rejects a user_inputs directory redirected outside its project", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-input-links-"));
    try {
      const projectRoot = path.join(root, "prj_fixture");
      const outside = path.join(root, "outside");
      await Promise.all([mkdir(path.join(projectRoot, "workspaces"), { recursive: true }), mkdir(outside)]);
      await symlink(outside, path.join(projectRoot, "workspaces", "user_inputs"), process.platform === "win32" ? "junction" : "dir");
      await expect(prepareProjectUserInputsPath(projectRoot)).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("never overwrites an existing Git collaboration Memory.md", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-existing-memory-"));
    const projectPath = path.join(root, "prj_fixture");
    const executionWorktree = path.join(root, "worktrees", "exec_fixture");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_writer.md");
    const memoryPath = path.join(executionWorktree, "agent-memory", "writer", "Memory.md");
    await Promise.all([
      mkdir(path.dirname(inboxPath), { recursive: true }),
      mkdir(path.dirname(memoryPath), { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    await Promise.all([
      writeFile(inboxPath, "business assignment"),
      writeFile(memoryPath, "committed memory\n")
    ]);
    await prepareInvocationInputs({
      project: { id: "prj_fixture", git: { enabled: true } },
      agent: "writer", invocationId: "inv_fixture", projectPath,
      workspacePath: executionWorktree, inboxPath, runtimePath,
      executionContext: {
        nodeRunId: "nr_fixture", taskId: "tsk_fixture", executionId: "exe_fixture",
        role: "delivery", ownershipEpoch: 2, executionWorktree
      }
    } as Parameters<typeof prepareInvocationInputs>[0]);
    expect(await readFile(memoryPath, "utf8")).toBe("committed memory\n");
  });

  it("keeps Git-off memory at the legacy shared Memory.md", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-legacy-memory-"));
    const projectPath = path.join(root, "prj_fixture");
    const workspacePath = path.join(projectPath, "workspaces", "main", "shared");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_main.md");
    await Promise.all([
      mkdir(path.dirname(inboxPath), { recursive: true }),
      mkdir(workspacePath, { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    await Promise.all([
      writeFile(inboxPath, "legacy assignment"),
      writeFile(path.join(workspacePath, "Memory.md"), "legacy memory")
    ]);
    const prepared = await prepareInvocationInputs({
      project: { id: "prj_fixture", git: { enabled: false } },
      agent: "main",
      invocationId: "inv_fixture",
      projectPath,
      workspacePath,
      inboxPath,
      runtimePath
    } as Parameters<typeof prepareInvocationInputs>[0]);
    expect(prepared.memoryPath).toBe(await fsRealpath(path.join(workspacePath, "Memory.md")));
  });

  it("refuses to reuse a delivery workspace for a leader role", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-leader-"));
    const projectPath = path.join(root, "prj_fixture");
    const workspacePath = path.join(projectPath, "workspaces", "main", "shared");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_main.md");
    await Promise.all([
      mkdir(path.dirname(inboxPath), { recursive: true }),
      mkdir(workspacePath, { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    await Promise.all([
      writeFile(inboxPath, "manage"),
      writeFile(path.join(workspacePath, "Memory.md"), "delivery memory")
    ]);
    await expect(prepareInvocationInputs({
      project: { id: "prj_fixture", git: { enabled: true } },
      agent: "main",
      invocationId: "inv_fixture",
      projectPath,
      workspacePath,
      inboxPath,
      runtimePath,
      executionContext: {
        nodeRunId: "nr_fixture",
        groupRunId: "grp_fixture",
        role: "leader",
        coordinatorEpoch: 3
      }
    } as Parameters<typeof prepareInvocationInputs>[0])).rejects.toMatchObject({
      code: "INVOCATION_INPUT_STAGING_FAILED",
      cause: expect.objectContaining({ message: expect.stringMatching(/management-only/) })
    });
  });

  it("safely mirrors the authority Inbox and rebuilds a changed or read-only mirror", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-"));
    const projectPath = path.join(root, "prj_fixture");
    const messages = path.join(projectPath, "messages");
    const workspacePath = path.join(projectPath, "workspaces");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    await Promise.all([
      mkdir(messages, { recursive: true }),
      mkdir(workspacePath, { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    const inboxPath = path.join(messages, "0001_inv_fixture_to_main.md");
    await writeFile(inboxPath, Buffer.from("fixture inbox\n\0bytes", "utf8"));
    await writeFile(path.join(workspacePath, "Memory.md"), "fixture memory\n");
    const request = {
      project: { id: "prj_fixture" },
      agent: "main",
      invocationId: "inv_fixture",
      projectPath,
      workspacePath,
      inboxPath,
      runtimePath
    } as Parameters<typeof prepareInvocationInputs>[0];

    const first = await prepareInvocationInputs(request);
    expect(first.inboxPath).not.toBe(inboxPath);
    expect(await readFile(first.inboxPath)).toEqual(await readFile(inboxPath));
    // Windows maps its read-only attribute to 0444 rather than POSIX 0400.
    expect((await stat(first.inboxPath)).mode & 0o222).toBe(0);

    // Session/protocol recovery stages the exact same invocation again. This
    // must replace a read-only destination on Windows without EPERM.
    const unchanged = await prepareInvocationInputs(request);
    expect(await readFile(unchanged.inboxPath)).toEqual(await readFile(inboxPath));
    expect((await stat(unchanged.inboxPath)).mode & 0o222).toBe(0);

    // The mirror itself is intentionally 0400. A same-UID process can still
    // replace the directory entry, which is the tampering model under test.
    await chmod(first.inboxPath, 0o600);
    await writeFile(first.inboxPath, "tampered", { mode: 0o600 });
    const rebuilt = await prepareInvocationInputs(request);
    expect(await readFile(rebuilt.inboxPath)).toEqual(await readFile(inboxPath));
    expect(await readFile(inboxPath, "utf8")).toBe("fixture inbox\n\0bytes");
  });

  it("refuses to replace a non-file staged Inbox destination", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-destination-"));
    const projectPath = path.join(root, "prj_fixture");
    const messages = path.join(projectPath, "messages");
    const workspacePath = path.join(projectPath, "workspaces");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const mirrorPath = path.join(workspacePath, ".scienceevolve", "inbox", "inv_fixture.md");
    await Promise.all([
      mkdir(messages, { recursive: true }),
      mkdir(path.dirname(mirrorPath), { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    const inboxPath = path.join(messages, "0001_inv_fixture_to_main.md");
    await Promise.all([
      writeFile(inboxPath, "authority"),
      writeFile(path.join(workspacePath, "Memory.md"), "memory"),
      mkdir(mirrorPath)
    ]);

    await expect(prepareInvocationInputs({
      project: { id: "prj_fixture" }, agent: "main", invocationId: "inv_fixture",
      projectPath, workspacePath, inboxPath, runtimePath
    } as Parameters<typeof prepareInvocationInputs>[0])).rejects.toMatchObject({
      code: "INVOCATION_INPUT_STAGING_FAILED",
      cause: expect.objectContaining({
        message: "Staged Inbox destination must be a regular non-symlink file"
      })
    });
    expect((await stat(mirrorPath)).isDirectory()).toBe(true);
    expect(await readFile(inboxPath, "utf8")).toBe("authority");
  });

  it("rejects an authority Inbox outside messages", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-outside-"));
    const projectPath = path.join(root, "prj_fixture");
    const workspacePath = path.join(projectPath, "workspaces");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    await Promise.all([
      mkdir(path.join(projectPath, "messages"), { recursive: true }),
      mkdir(workspacePath, { recursive: true }),
      mkdir(runtimePath, { recursive: true })
    ]);
    await writeFile(path.join(workspacePath, "Memory.md"), "memory");
    const inboxPath = path.join(projectPath, "not-authority.md");
    await writeFile(inboxPath, "bad");
    await expect(prepareInvocationInputs({
      project: { id: "prj_fixture" }, agent: "main", invocationId: "inv_fixture",
      projectPath, workspacePath, inboxPath, runtimePath
    } as Parameters<typeof prepareInvocationInputs>[0])).rejects.toMatchObject({
      code: "INVOCATION_INPUT_STAGING_FAILED"
    });
  });

  it("binds workflow paths to the common project workspace and current invocation", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-binding-"));
    const projectPath = path.join(root, "prj_fixture");
    const selectedWorkspace = path.join(projectPath, "workspaces");
    const otherWorkspace = path.join(projectPath, "other-workspace");
    const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
    const otherRuntime = path.join(projectPath, "runtime", "inv_other");
    const inboxPath = path.join(projectPath, "messages", "0001_inv_fixture_to_main.md");
    await Promise.all([
      mkdir(selectedWorkspace, { recursive: true }),
      mkdir(otherWorkspace, { recursive: true }),
      mkdir(runtimePath, { recursive: true }),
      mkdir(otherRuntime, { recursive: true }),
      mkdir(path.dirname(inboxPath), { recursive: true })
    ]);
    await Promise.all([
      writeFile(path.join(selectedWorkspace, "Memory.md"), "selected"),
      writeFile(path.join(otherWorkspace, "Memory.md"), "other"),
      writeFile(inboxPath, "authority"),
      writeFile(
        path.join(projectPath, "messages", "0001_inv_other_to_main.md"),
        "other invocation"
      ),
      writeFile(
        path.join(projectPath, "messages", "0001_inv_fixture_to_other.md"),
        "other agent"
      )
    ]);
    const base = {
      project: { id: "prj_fixture" },
      agent: "main",
      invocationId: "inv_fixture",
      projectPath,
      workspacePath: selectedWorkspace,
      inboxPath,
      runtimePath
    } as Parameters<typeof prepareInvocationInputs>[0];

    await expect(prepareInvocationInputs({
      ...base,
      workspacePath: otherWorkspace
    })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    await expect(prepareInvocationInputs({
      ...base,
      runtimePath: otherRuntime
    })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    await expect(prepareInvocationInputs({
      ...base,
      inboxPath: path.join(projectPath, "messages", "0001_inv_other_to_main.md")
    })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    await expect(prepareInvocationInputs({
      ...base,
      inboxPath: path.join(projectPath, "messages", "0001_inv_fixture_to_other.md")
    })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
  });

  it("validates Explainer inputs inside one invocation-local snapshot", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-purpose-"));
    const projectPath = path.join(root, "prj_fixture");
    const runtimePath = path.join(projectPath, "runtime", "readonly-fixture");
    const workspacePath = path.join(runtimePath, "workspaces");
    const inboxPath = path.join(workspacePath, ".scienceevolve", "explainer_turn_fixture.md");
    const memoryPath = path.join(workspacePath, "Memory.md");
    await Promise.all([
      mkdir(path.dirname(inboxPath), { recursive: true }),
      mkdir(workspacePath, { recursive: true })
    ]);
    await Promise.all([
      writeFile(inboxPath, "quoted evidence"),
      writeFile(memoryPath, "explainer memory")
    ]);

    await expect(validateStagedInvocationInputs({
      projectId: "prj_fixture",
      invocationId: "explainer_turn_fixture",
      projectPath,
      workspacePath,
      inboxPath,
      memoryPath,
      runtimePath
    })).resolves.toMatchObject({ workspacePath, inboxPath, memoryPath, runtimePath });

    const outsideInbox = path.join(projectPath, "messages", "explainer_turn_fixture.md");
    await mkdir(path.dirname(outsideInbox), { recursive: true });
    await writeFile(outsideInbox, "not staged");
    await expect(validateStagedInvocationInputs({
      projectId: "prj_fixture",
      invocationId: "explainer_turn_fixture",
      projectPath,
      workspacePath,
      inboxPath: outsideInbox,
      memoryPath,
      runtimePath
    })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
  });

  it("keeps management cwd fixed while isolating per-invocation inputs and proposal authoring", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-fixed-management-"));
    const projectPath = path.join(root, "prj_fixture");
    const workspacePath = path.join(projectPath, "git-worktrees", "agents", "writer");
    const runtimePath = path.join(projectPath, "runtime", "leader_turn");
    const snapshot = path.join(workspacePath, ".scienceevolve", "management", "leader_turn");
    const inboxPath = path.join(snapshot, "leader_turn-Inbox.md");
    const memoryPath = path.join(snapshot, "Memory.md");
    const workflowAuthoringPath = path.join(snapshot, "proposal", "workflow.json");
    await Promise.all([mkdir(path.dirname(workflowAuthoringPath), { recursive: true }), mkdir(runtimePath, { recursive: true })]);
    await Promise.all([writeFile(inboxPath, "manage only"), writeFile(memoryPath, "readonly"), writeFile(workflowAuthoringPath, "{}")]);
    const input = { projectId: "prj_fixture", invocationId: "leader_turn", fixedAgentId: "writer", projectPath,
      workspacePath, runtimePath, inboxPath, memoryPath, workflowAuthoringPath };
    await expect(validateStagedInvocationInputs(input)).resolves.toMatchObject({ workspacePath, workflowAuthoringPath });
    await expect(validateStagedInvocationInputs({ ...input, fixedAgentId: "other" })).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    await writeFile(path.join(workspacePath, "workflow.json"), "business content");
    await expect(validateStagedInvocationInputs({ ...input, workflowAuthoringPath: path.join(workspacePath, "workflow.json") }))
      .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    expect(await readFile(path.join(workspacePath, "workflow.json"), "utf8")).toBe("business content");
  });

  it.each(["legacy", "external"])("validates the exact retained task proposal while keeping Inbox and Memory invocation-local (%s)", async layout => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openfars-inputs-retained-management-"));
    try {
      const projectPath = path.join(root, "prj_fixture");
      const workspacePath = path.join(projectPath, "git-worktrees", "agents", "writer");
      const runtimePath = path.join(projectPath, "runtime", "new_turn");
      const management = layout === "legacy" ? path.join(workspacePath, ".scienceevolve", "management")
        : path.join(projectPath, "agent-inputs", "writer", "management");
      const snapshot = path.join(management, "new_turn");
      const inboxPath = path.join(snapshot, "new_turn-Inbox.md");
      const memoryPath = path.join(snapshot, "Memory.md");
      const workflowAuthoringPath = path.join(management, "original_turn", "proposal", "workflow.json");
      const workflowCurrentPath = path.join(management, "original_turn", ".scienceevolve", "workflow-current.json");
      await Promise.all([mkdir(snapshot, { recursive: true }), mkdir(runtimePath, { recursive: true }), mkdir(workspacePath, { recursive: true }),
        mkdir(path.dirname(workflowAuthoringPath), { recursive: true }), mkdir(path.dirname(workflowCurrentPath), { recursive: true })]);
      const originalDraft = '{"unfinishedAgentEdit":true}\n';
      await Promise.all([writeFile(inboxPath, "current authoritative inputs"), writeFile(memoryPath, "current readonly memory"),
        writeFile(workflowAuthoringPath, originalDraft), writeFile(workflowCurrentPath, "{}\n")]);
      const input = { projectId: "prj_fixture", invocationId: "new_turn", fixedAgentId: "writer", projectPath,
        workspacePath, runtimePath, inboxPath, memoryPath, workflowAuthoringPath, workflowCurrentPath, workflowAuthoringInvocationId: "original_turn" };
      const validated = await validateStagedInvocationInputs(input);
      expect(validated).toMatchObject({ inboxPath, memoryPath, workflowAuthoringPath, workflowAuthoringInvocationId: "original_turn" });
      await expect(validateStagedInvocationInputs({ ...validated, projectId: "prj_fixture", invocationId: "new_turn", fixedAgentId: "writer" }))
        .resolves.toMatchObject({ workflowAuthoringPath });
      for (const binding of [undefined, "another_turn", "../original_turn"]) {
        await expect(validateStagedInvocationInputs({ ...input, workflowAuthoringInvocationId: binding }))
          .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
      }
      const oldInbox = path.join(management, "original_turn", "new_turn-Inbox.md");
      await writeFile(oldInbox, "historical inputs cannot replace current authority");
      await expect(validateStagedInvocationInputs({ ...input, inboxPath: oldInbox }))
        .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
      const otherProposal = path.join(projectPath, "git-worktrees", "agents", "other", ".scienceevolve", "management", "original_turn", "proposal", "workflow.json");
      await mkdir(path.dirname(otherProposal), { recursive: true }); await writeFile(otherProposal, originalDraft);
      await expect(validateStagedInvocationInputs({ ...input, workflowAuthoringPath: otherProposal }))
        .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
      const linkedSnapshot = path.join(management, "linked_turn"); await mkdir(linkedSnapshot);
      await symlink(path.dirname(otherProposal), path.join(linkedSnapshot, "proposal"), process.platform === "win32" ? "junction" : "dir");
      await expect(validateStagedInvocationInputs({ ...input, workflowAuthoringInvocationId: "linked_turn",
        workflowAuthoringPath: path.join(linkedSnapshot, "proposal", "workflow.json") }))
        .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
      expect(await readFile(workflowAuthoringPath, "utf8")).toBe(originalDraft);
      const wrongReference = path.join(snapshot, "workflow-current.json"); await writeFile(wrongReference, "{}\n");
      await expect(validateStagedInvocationInputs({ ...input, workflowCurrentPath: wrongReference }))
        .rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
