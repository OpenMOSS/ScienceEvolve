import { spawn } from "node:child_process";
import fsSync, { promises as fs, readFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CommonProcessHost,
  MAX_RAW_LOG_LIMIT_BYTES,
  buildInvocationEnvironment
} from "../../src/core/harness-runtime/process-host.js";
import type { LaunchPlan } from "../../src/core/harness-runtime/contracts.js";
import { InvocationRecoveryController } from "../../src/core/harness-runtime/invocation-recovery.js";
import { agentEnvironment } from "../../src/core/harness-runtime/runtime-support.js";
import { NATIVE_PROCESS_SCOPE_ENV, NATIVE_PROCESS_SUPPORT_ENV, nativeProcessScope, pendingNativeProcesses, recoverNativeProcesses, type NativeProcessRecord } from "../../src/core/harness-runtime/native-processes.js";
import { requestNativeBackgroundJob } from "../../src/core/harness-runtime/background-jobs.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_ENV,
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME
} from "../../src/core/published-artifact-access.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, {
    recursive: true,
    force: true
  })));
});

async function createBoundFixture(maxAttempts = 4, trackProcesses = false,
  onProcesses?: (records: readonly NativeProcessRecord[]) => Promise<void>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-process-host-"));
  temporaryRoots.push(root);
  const workspacePath = path.join(root, "workspace");
  const runtimePath = path.join(root, "runtime");
  await Promise.all([
    fs.mkdir(workspacePath, { recursive: true }),
    fs.mkdir(runtimePath, { recursive: true })
  ]);
  const invocationId = "inv_process_host_fixture";
  const harnessId = "fixture";
  const budget = new InvocationRecoveryController(maxAttempts);
  const processRecords: NativeProcessRecord[] = [];
  const plan: LaunchPlan = {
    command: process.execPath,
    args: ["-e", "process.exit(0)"],
    cwd: workspacePath,
    env: buildInvocationEnvironment({
      common: {
        ...(trackProcesses ? { SCIENCEEVOLVE_PROJECT_ID: "prj_process_fixture", SCIENCEEVOLVE_AGENT_NAME: "coder" } : {}),
        SCIENCEEVOLVE_INVOCATION_ID: invocationId,
        SCIENCEEVOLVE_AGENT_HARNESS: harnessId,
        SCIENCEEVOLVE_ROLE_WORKSPACE: workspacePath,
        [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
          runtimePath,
          PUBLISHED_ARTIFACT_MANIFEST_FILENAME
        )
      }
    }),
    eventFormat: "jsonl",
    session: {
      schemaVersion: 1,
      harnessId,
      adapterVersion: "test",
      generation: 0,
      nativeId: "fixture-session",
      durable: false,
      createdAt: "2000-01-01T00:00:00.000Z"
    },
    rawLogLimitBytes: 1_024,
    recoveryEvidence: { kind: "adapter-dispatch" }
  };
  const processHost = new CommonProcessHost().forInvocation({
    ...(trackProcesses ? { nativeProcesses: { projectId: "prj_process_fixture", projectPath: root, agentId: "coder", invocationId,
      onChanges: async (records: readonly NativeProcessRecord[]) => { processRecords.push(...records); await onProcesses?.(records); } } } : {}),
    invocationId,
    harnessId,
    runtimePath,
    workspacePath,
    signal: new AbortController().signal,
    recoveryBudget: budget,
    session: () => plan.session,
    commonEnvironment: plan.env,
    ...(trackProcesses ? { authorityEnvironment: plan.env } : {})
  });
  return {
    root,
    runtimePath,
    invocationId,
    budget,
    processHost,
    processRecords,
    workspacePath,
    plan
  };
}

async function waitForPath(target: string): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    try {
      await fs.access(target);
      return;
    } catch {
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
    }
  }
  throw new Error(`Timed out waiting for fixture path ${target}`);
}

async function waitForNamespaceProcessExit(pid: number): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (!await namespaceProcessAlive(pid)) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for namespace process ${pid} to exit`);
}

async function namespaceProcessAlive(pid: number): Promise<boolean> {
  for (const entry of await fs.readdir("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const status = await fs.readFile(`/proc/${entry}/status`, "utf8");
      const namespaceIds = /^NSpid:\s+(.+)$/m.exec(status)?.[1]
        ?.trim().split(/\s+/).map(Number);
      if (namespaceIds?.at(-1) !== pid) continue;
      return !/^State:\s+Z\b/m.test(status);
    } catch (error) {
      if (["ENOENT", "ESRCH", "EACCES", "EPERM"].includes(
        (error as NodeJS.ErrnoException).code ?? ""
      )) continue;
      throw error;
    }
  }
  return false;
}

async function procPidForNamespacePid(pid: number): Promise<number> {
  for (const entry of await fs.readdir("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const status = await fs.readFile(`/proc/${entry}/status`, "utf8");
      const namespaceIds = /^NSpid:\s+(.+)$/m.exec(status)?.[1]
        ?.trim().split(/\s+/).map(Number);
      if (namespaceIds?.at(-1) === pid) return Number(entry);
    } catch (error) {
      if (["ENOENT", "ESRCH", "EACCES", "EPERM"].includes(
        (error as NodeJS.ErrnoException).code ?? ""
      )) continue;
      throw error;
    }
  }
  throw new Error(`Unable to resolve namespace process ${pid}`);
}

describe("CommonProcessHost", () => {
  it("canonicalizes case-insensitive Windows host environment names", () => {
    const environment = buildInvocationEnvironment({
      common: {},
      hostEnvironment: { Path: "C:\\fixture-bin" }
    });
    if (process.platform === "win32") {
      expect(environment.PATH).toBe("C:\\fixture-bin");
      expect(environment).not.toHaveProperty("Path");
    } else {
      expect(environment.PATH).toBeUndefined();
    }
    expect(buildInvocationEnvironment({ common: {} }).PATH).toBe(process.env.PATH);
  });

  it.each(["workspace", "compute", "yolo"] as const)(
    "does not inherit unrelated host secrets in %s mode",
    (permission) => {
      const key = "OPENFARS_UNRELATED_HOST_SECRET";
      const previous = process.env[key];
      process.env[key] = "must-not-cross-the-invocation-boundary";
      try {
        const environment = agentEnvironment(
          "/tmp/openfars-agent-home",
          "/tmp/openfars-runtime",
          "prj_fixture",
          "inv_fixture",
          "main",
          "main",
          permission,
          "/tmp/openfars-project",
          "/tmp/openfars-project/workspaces",
          {},
          []
        );
        expect(environment[key]).toBeUndefined();
      } finally {
        if (previous === undefined) delete process.env[key];
        else process.env[key] = previous;
      }
    }
  );

  it("replaces configured provider credentials with the invocation Gateway credential", () => {
    const key = "OPENFARS_FIXTURE_PROVIDER_TOKEN";
    const previous = process.env[key];
    process.env[key] = "host-provider-secret";
    try {
      const environment = agentEnvironment(
        "/tmp/openfars-agent-home",
        "/tmp/openfars-runtime",
        "prj_fixture",
        "inv_fixture",
        "main",
        "main",
        "workspace",
        "/tmp/openfars-project",
        "/tmp/openfars-project/workspaces",
        {},
        [key],
        undefined,
        undefined,
        undefined,
        {
          id: `gwy_${"a".repeat(32)}`,
          name: "Fixture Gateway",
          url: "http://127.0.0.1:43199/v1",
          apiKey: "invocation-route-token",
          models: ["fixture-model"],
          defaultModel: "fixture-model",
          protocol: "responses",
          nativeProtocol: "responses",
          routeMode: "direct"
        }
      );

      expect(environment[key]).toBeUndefined();
      expect(environment.OPENAI_API_KEY).toBe("invocation-route-token");
      expect(environment.SCIENCEEVOLVE_GATEWAY_API_KEY).toBe("invocation-route-token");
    } finally {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  });

  it("streams stdout and bounds retained raw output", async () => {
    const host = new CommonProcessHost();
    const chunks: string[] = [];
    const plan: LaunchPlan = {
      command: process.execPath,
      args: ["-e", "process.stdout.write('0123456789')"],
      cwd: process.cwd(),
      env: buildInvocationEnvironment({ common: {} }),
      eventFormat: "jsonl",
      session: {
        schemaVersion: 1, harnessId: "fixture", adapterVersion: "test",
        generation: 0, nativeId: "fixture", durable: false,
        createdAt: "2000-01-01T00:00:00.000Z"
      },
      rawLogLimitBytes: 5
    };
    const result = await host.run(plan, { onStdout: (chunk) => chunks.push(chunk) }, new AbortController().signal);
    expect(chunks.join("")).toBe("0123456789");
    expect(result.stdout).toBe("56789");
    expect(result.code).toBe(0);
  });

  it("bounds retained output by UTF-8 bytes without splitting a code point", async () => {
    const host = new CommonProcessHost();
    const output = "A你好🙂B";
    const plan: LaunchPlan = {
      command: process.execPath,
      args: ["-e", `process.stdout.write(${JSON.stringify(output)})`],
      cwd: process.cwd(),
      env: buildInvocationEnvironment({ common: {} }),
      eventFormat: "jsonl",
      session: {
        schemaVersion: 1, harnessId: "fixture", adapterVersion: "test",
        generation: 0, nativeId: "fixture", durable: false,
        createdAt: "2000-01-01T00:00:00.000Z"
      },
      rawLogLimitBytes: 8
    };

    const result = await host.run(plan, {}, new AbortController().signal);

    expect(result.stdout).toBe("好🙂B");
    expect(Buffer.byteLength(result.stdout, "utf8")).toBeLessThanOrEqual(8);
  });

  it("rejects adapter credential and authority overrides", () => {
    expect(() => buildInvocationEnvironment({
      common: { SCIENCEEVOLVE_PROJECT_ID: "one" },
      adapter: { SCIENCEEVOLVE_PROJECT_ID: "two" }
    })).toThrow(/protected environment/);
    expect(() => buildInvocationEnvironment({
      common: { SCIENCEEVOLVE_ROLE_WORKSPACE: "/trusted" },
      adapter: { SCIENCEEVOLVE_ROLE_WORKSPACE: "/outside" }
    })).toThrow(/protected environment/);
    expect(() => buildInvocationEnvironment({
      common: {}, adapter: { OPENAI_API_KEY: "secret" }
    })).toThrow(/provider credential/);
  });

  it("terminates the spawned process when startup bookkeeping rejects", async () => {
    const host = new CommonProcessHost();
    const plan: LaunchPlan = {
      command: process.execPath,
      args: ["-e", "setInterval(() => undefined, 1000)"],
      cwd: process.cwd(),
      env: buildInvocationEnvironment({ common: {} }),
      eventFormat: "jsonl",
      session: {
        schemaVersion: 1, harnessId: "fixture", adapterVersion: "test",
        generation: 0, nativeId: "fixture", durable: false,
        createdAt: "2000-01-01T00:00:00.000Z"
      },
      rawLogLimitBytes: 100
    };
    const managed = host.start(plan, {
      onSpawn: () => { throw new Error("marker write failed"); }
    }, new AbortController().signal);

    await expect(managed.completed).rejects.toThrow("marker write failed");
    expect(managed.child.exitCode !== null || managed.child.signalCode !== null).toBe(true);
  });

  it("accounts every bound launch and refuses to spawn after the shared recovery budget is exhausted", async () => {
    const fixture = await createBoundFixture(1);
    const first = await fixture.processHost.run({
      ...fixture.plan,
      args: ["-e", "process.stdout.write('first attempt')"]
    }, {});

    expect(first.code).toBe(0);
    expect(fixture.budget.attemptsStarted).toBe(1);

    const spawnSentinel = path.join(fixture.root, "second-process-spawned");
    await expect(fixture.processHost.run({
      ...fixture.plan,
      args: [
        "-e",
        `require("node:fs").writeFileSync(${JSON.stringify(spawnSentinel)}, "spawned")`
      ],
      recoveryEvidence: { kind: "adapter-recovery" }
    }, {})).rejects.toMatchObject({
      code: "INVOCATION_ATTEMPT_BUDGET_EXHAUSTED",
      source: "runtime"
    });
    expect(fixture.budget.attemptsStarted).toBe(1);
    await expect(fs.access(spawnSentinel)).rejects.toThrow();
  });

  it("rejects unapproved host passthrough, credentials, and authority overrides before spawning", async () => {
    const fixture = await createBoundFixture();
    expect(Object.getOwnPropertyNames(fixture.processHost)).not.toEqual(
      expect.arrayContaining(["host", "binding", "processActive"])
    );
    const spawnSentinel = path.join(fixture.root, "invalid-process-spawned");
    const args = [
      "-e",
      `require("node:fs").writeFileSync(${JSON.stringify(spawnSentinel)}, "spawned")`
    ];
    const passthroughKey = "OPENFARS_FIXTURE_HOST_VALUE";
    const previous = process.env[passthroughKey];
    process.env[passthroughKey] = "host-owned-value";
    try {
      expect(() => fixture.processHost.start({
        ...fixture.plan,
        args,
        env: {
          ...fixture.plan.env,
          [passthroughKey]: process.env[passthroughKey]
        }
      }, {})).toThrow(/was not approved by the common host/);

      expect(() => fixture.processHost.start({
        ...fixture.plan,
        args,
        env: {
          ...fixture.plan.env,
          OPENAI_API_KEY: "host-or-adapter-credential"
        }
      }, {})).toThrow(/unapproved credential/);

      expect(() => fixture.processHost.start({
        ...fixture.plan,
        args,
        env: {
          ...fixture.plan.env,
          SCIENCEEVOLVE_INVOCATION_ID: "inv_authority_override"
        }
      }, {})).toThrow(/invalid SCIENCEEVOLVE_INVOCATION_ID/);

      expect(() => fixture.processHost.start({
        ...fixture.plan,
        args,
        session: {
          ...fixture.plan.session,
          generation: fixture.plan.session.generation + 1
        }
      }, {})).toThrow(/SessionRef does not match invocation authority/);

      for (const [key, value] of [
        ["PATH", `${fixture.plan.env.PATH ?? ""}${path.delimiter}/adapter-bin`],
        ["HTTPS_PROXY", "http://adapter-proxy.invalid"],
        ["NODE_EXTRA_CA_CERTS", path.join(fixture.root, "adapter-ca.pem")]
      ] as const) {
        expect(() => fixture.processHost.start({
          ...fixture.plan,
          args,
          env: { ...fixture.plan.env, [key]: value }
        }, {})).toThrow(new RegExp(`invalid ${key}`));
      }
    } finally {
      if (previous === undefined) delete process.env[passthroughKey];
      else process.env[passthroughKey] = previous;
    }

    expect(fixture.budget.attemptsStarted).toBe(0);
    await expect(fs.access(spawnSentinel)).rejects.toThrow();
  });

  it("accepts the 64 MiB compatibility limit and rejects anything larger before spawning", async () => {
    const fixture = await createBoundFixture();
    const spawnSentinel = path.join(fixture.root, "oversized-log-process-spawned");
    const oversizedPlan: LaunchPlan = {
      ...fixture.plan,
      args: [
        "-e",
        `require("node:fs").writeFileSync(${JSON.stringify(spawnSentinel)}, "spawned")`
      ],
      rawLogLimitBytes: MAX_RAW_LOG_LIMIT_BYTES + 1
    };

    expect(() => new CommonProcessHost().startRaw(
      oversizedPlan,
      new AbortController().signal
    )).toThrow(/raw log limit must be between/);
    expect(() => fixture.processHost.start(oversizedPlan, {})).toThrow(
      /raw log limit must be between/
    );

    expect(fixture.budget.attemptsStarted).toBe(0);
    await expect(fs.access(spawnSentinel)).rejects.toThrow();
    await expect(fixture.processHost.run({
      ...fixture.plan,
      rawLogLimitBytes: MAX_RAW_LOG_LIMIT_BYTES
    }, {})).resolves.toMatchObject({ code: 0 });
    expect(fixture.budget.attemptsStarted).toBe(1);
  });

  it.each(["workspace", "yolo"] as const)(
    "rejects compute-only environment in %s mode",
    async (permission) => {
      const fixture = await createBoundFixture();
      const commonEnvironment = {
        ...fixture.plan.env,
        SCIENCEEVOLVE_PROJECT_ROOT: fixture.root,
        SCIENCEEVOLVE_AGENT_PERMISSION: permission
      };
      const processHost = new CommonProcessHost().forInvocation({
        invocationId: fixture.invocationId,
        harnessId: "fixture",
        runtimePath: fixture.runtimePath,
        workspacePath: fixture.plan.cwd,
        signal: new AbortController().signal,
        recoveryBudget: fixture.budget,
        session: () => fixture.plan.session,
        commonEnvironment,
        authorityEnvironment: commonEnvironment
      });

      for (const injected of [
        {
          SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT: fixture.root,
          SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER: path.join(fixture.root, "inspire.jsonl")
        },
        {
          NATURE_FIGURE_CONFIG: path.join(fixture.plan.cwd, ".scienceevolve", "nature-figure.json"),
          MPLBACKEND: "Agg"
        },
        { INSPIRE_GLOBAL_CONFIG_PATH: path.join(fixture.root, "inspire.toml") }
      ]) {
        expect(() => processHost.start({
          ...fixture.plan,
          env: {
            ...commonEnvironment,
            HOME: fixture.plan.cwd,
            ...injected
          }
        }, {})).toThrow(/invalid SCIENCEEVOLVE_INSPIRE_|invalid INSPIRE_GLOBAL_CONFIG_PATH|compute-only/);
      }
      expect(() => processHost.start({
        ...fixture.plan,
        env: {
          ...commonEnvironment,
          HOME: fixture.plan.cwd,
          SCIENCEEVOLVE_INSPIRE_UNDECLARED_OVERRIDE: fixture.root
        },
        adapterEnvironmentKeys: ["SCIENCEEVOLVE_INSPIRE_UNDECLARED_OVERRIDE"]
      }, {})).toThrow(/unsafe Adapter environment key SCIENCEEVOLVE_INSPIRE_UNDECLARED_OVERRIDE/);
      expect(fixture.budget.attemptsStarted).toBe(0);
    }
  );

  it("binds compute environment exactly and permits only the selected workspace Nature config", async () => {
    const fixture = await createBoundFixture();
    const natureFigureConfigPath = path.join(
      fixture.plan.cwd,
      ".scienceevolve",
      "nature-figure.json"
    );
    const validEnvironment = buildInvocationEnvironment({
      common: agentEnvironment(
        fixture.plan.cwd,
        fixture.runtimePath,
        "prj_fixture",
        fixture.invocationId,
        "main",
        "worker",
        "compute",
        fixture.root,
        fixture.plan.cwd,
        {
          inspireBin: path.join(fixture.root, "inspire"),
          inspireNoProxy: ["inspire.internal"],
          inspireWorkspaceRoot: fixture.root
        },
        [],
        natureFigureConfigPath,
        undefined,
        undefined,
        undefined,
        "fixture",
        "responses"
      )
    });
    for (const key of [
      "OPENAI_API_KEY",
      "OPENAI_BASE_URL",
      "OPENAI_ORG_ID",
      "OPENAI_PROJECT_ID",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_ENDPOINT"
    ]) {
      delete validEnvironment[key];
    }
    const commonEnvironment: Record<string, string> = {};
    for (const [key, value] of Object.entries(validEnvironment)) {
      if (value !== undefined && !["HOME", "NATURE_FIGURE_CONFIG", "MPLBACKEND"].includes(key)) {
        commonEnvironment[key] = value;
      }
    }
    const processHost = new CommonProcessHost().forInvocation({
      invocationId: fixture.invocationId,
      harnessId: "fixture",
      runtimePath: fixture.runtimePath,
      workspacePath: fixture.plan.cwd,
      signal: new AbortController().signal,
      recoveryBudget: fixture.budget,
      session: () => fixture.plan.session,
      commonEnvironment,
      authorityEnvironment: commonEnvironment,
      natureFigureConfigPath
    });
    expect(validEnvironment.PATH?.split(path.delimiter)[0]).toBe(
      path.join(fixture.runtimePath, "bin")
    );
    expect(validEnvironment.NO_PROXY).toContain("inspire.internal");
    expect(validEnvironment.no_proxy).toBe(validEnvironment.NO_PROXY);

    expect(() => processHost.start({
      ...fixture.plan,
      env: {
        ...validEnvironment,
        SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT: path.dirname(fixture.root)
      }
    }, {})).toThrow(/invalid SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT/);
    expect(() => processHost.start({
      ...fixture.plan,
      env: {
        ...validEnvironment,
        NATURE_FIGURE_CONFIG: path.join(fixture.root, "outside-nature.json")
      }
    }, {})).toThrow(/invalid compute-only Nature configuration/);
    expect(fixture.budget.attemptsStarted).toBe(0);

    await expect(processHost.run({
      ...fixture.plan,
      env: validEnvironment
    }, {})).resolves.toMatchObject({ code: 0 });
    expect(fixture.budget.attemptsStarted).toBe(1);
  });

  it("keeps workspace HOME and CODEX_HOME inside the Facade project boundary", async () => {
    const fixture = await createBoundFixture();
    const projectHome = path.join(fixture.root, "agent-home");
    const authorityEnvironment = {
      SCIENCEEVOLVE_PROJECT_ROOT: fixture.root,
      SCIENCEEVOLVE_AGENT_PERMISSION: "workspace"
    };
    const processHost = new CommonProcessHost().forInvocation({
      invocationId: fixture.invocationId,
      harnessId: "fixture",
      runtimePath: fixture.runtimePath,
      workspacePath: fixture.plan.cwd,
      signal: new AbortController().signal,
      recoveryBudget: fixture.budget,
      session: () => fixture.plan.session,
      authorityEnvironment
    });
    const common = {
      ...fixture.plan.env,
      ...authorityEnvironment,
      HOME: projectHome
    };

    expect(() => processHost.start({
      ...fixture.plan,
      env: { ...common, HOME: path.dirname(fixture.root) }
    }, {})).toThrow(/HOME is outside the permitted invocation boundary/);
    expect(() => processHost.start({
      ...fixture.plan,
      env: { ...common, CODEX_HOME: path.dirname(fixture.root) }
    }, {})).toThrow(/CODEX_HOME is outside the project boundary/);
    expect(fixture.budget.attemptsStarted).toBe(0);
  });

  it("allows an Adapter-declared non-sensitive environment value that did not come from the host", async () => {
    const fixture = await createBoundFixture();
    const key = "OPENFARS_FIXTURE_COLOR";
    const previous = process.env[key];
    delete process.env[key];
    try {
      const result = await fixture.processHost.run({
        ...fixture.plan,
        args: ["-e", `process.stdout.write(process.env.${key} ?? "missing")`],
        env: {
          ...fixture.plan.env,
          [key]: "violet"
        },
        adapterEnvironmentKeys: [key]
      }, {});

      expect(result.code).toBe(0);
      expect(result.stdout).toBe("violet");
      expect(fixture.budget.attemptsStarted).toBe(1);
    } finally {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  });

  it.each(["secret-value", "0", "1000001", "1e6"])("rejects an Adapter-declared credential value: %s", async (value) => {
    const fixture = await createBoundFixture();
    const key = "ADAPTER_ACCESS_TOKEN";
    expect(() => fixture.processHost.start({
      ...fixture.plan, env: { ...fixture.plan.env, [key]: value }, adapterEnvironmentKeys: [key]
    }, {})).toThrow(/unsafe Adapter environment key|unapproved credential/);
    expect(fixture.budget.attemptsStarted).toBe(0);
  });

  it("rejects credentials hidden inside an Adapter-declared configuration value", async () => {
    const fixture = await createBoundFixture();
    const routeToken = "route-secret-value";
    const fixedToken = "fixed-mcp-secret-value";
    const processHost = new CommonProcessHost().forInvocation({
      invocationId: fixture.invocationId,
      harnessId: "fixture",
      runtimePath: fixture.runtimePath,
      workspacePath: fixture.plan.cwd,
      signal: new AbortController().signal,
      recoveryBudget: fixture.budget,
      session: () => fixture.plan.session,
      route: {
        baseUrl: "http://127.0.0.1:43199/v1",
        token: routeToken
      },
      authorityEnvironment: {
        SCIENCEEVOLVE_FIXED_MCP_TOKEN: fixedToken
      }
    });

    expect(() => processHost.start({
      ...fixture.plan,
      env: buildInvocationEnvironment({
        common: {
          SCIENCEEVOLVE_INVOCATION_ID: fixture.invocationId,
          SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
          SCIENCEEVOLVE_ROLE_WORKSPACE: fixture.plan.cwd,
          [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
            fixture.runtimePath,
            PUBLISHED_ARTIFACT_MANIFEST_FILENAME
          ),
          SCIENCEEVOLVE_GATEWAY_API_KEY: routeToken,
          OPENAI_API_KEY: routeToken,
          OPENAI_BASE_URL: "http://127.0.0.1:43199/v1",
          SCIENCEEVOLVE_FIXED_MCP_TOKEN: fixedToken,
          FIXTURE_CONFIG: JSON.stringify({ authorization: `Bearer ${fixedToken}` })
        }
      }),
      adapterEnvironmentKeys: ["FIXTURE_CONFIG"]
    }, {})).toThrow(/embedded an invocation credential/);
    expect(fixture.budget.attemptsStarted).toBe(0);
  });

  it("binds the complete serialized control context instead of selected fields", async () => {
    const fixture = await createBoundFixture();
    const capability = "control-capability-secret";
    const controlContext = JSON.stringify({
      projectId: "prj_fixture",
      invocationId: fixture.invocationId,
      agent: "main",
      kind: "main",
      stateVersion: 9,
      candidates: ["writing"],
      decisionBy: "main",
      allowUserIntervention: true,
      canComplete: false,
      stagingPath: path.join(fixture.runtimePath, "control-actions.jsonl"),
      workspacePath: fixture.plan.cwd,
      bridgePort: 43123,
      bridgeHost: "127.0.0.1",
      requireBridge: true
    });
    const processHost = new CommonProcessHost().forInvocation({
      invocationId: fixture.invocationId,
      harnessId: "fixture",
      runtimePath: fixture.runtimePath,
      workspacePath: fixture.plan.cwd,
      signal: new AbortController().signal,
      recoveryBudget: fixture.budget,
      session: () => fixture.plan.session,
      authorityEnvironment: {
        SCIENCEEVOLVE_CONTROL_CAPABILITY: capability,
        SCIENCEEVOLVE_CONTROL_CONTEXT: controlContext
      }
    });
    const changedContext = JSON.stringify({
      ...JSON.parse(controlContext),
      canComplete: true
    });

    expect(() => processHost.start({
      ...fixture.plan,
      env: buildInvocationEnvironment({
        common: {
          SCIENCEEVOLVE_INVOCATION_ID: fixture.invocationId,
          SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
          SCIENCEEVOLVE_ROLE_WORKSPACE: fixture.plan.cwd,
          SCIENCEEVOLVE_CONTROL_CAPABILITY: capability,
          SCIENCEEVOLVE_CONTROL_CONTEXT: changedContext
        }
      })
    }, {})).toThrow(/invalid SCIENCEEVOLVE_CONTROL_CONTEXT|does not match invocation authority/);
    expect(fixture.budget.attemptsStarted).toBe(0);
  });

  it("requires the provider environment family for the bound native protocol", async () => {
    const fixture = await createBoundFixture();
    const routeToken = "route-protocol-secret";
    const baseUrl = "http://127.0.0.1:43199/v1";
    const processHost = new CommonProcessHost().forInvocation({
      invocationId: fixture.invocationId,
      harnessId: "fixture",
      runtimePath: fixture.runtimePath,
      workspacePath: fixture.plan.cwd,
      signal: new AbortController().signal,
      recoveryBudget: fixture.budget,
      session: () => fixture.plan.session,
      route: { baseUrl, token: routeToken },
      authorityEnvironment: {
        SCIENCEEVOLVE_AGENT_PROTOCOL: "responses"
      }
    });
    const common = {
      SCIENCEEVOLVE_INVOCATION_ID: fixture.invocationId,
      SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
      SCIENCEEVOLVE_AGENT_PROTOCOL: "responses",
      SCIENCEEVOLVE_ROLE_WORKSPACE: fixture.plan.cwd,
      [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
        fixture.runtimePath,
        PUBLISHED_ARTIFACT_MANIFEST_FILENAME
      ),
      SCIENCEEVOLVE_GATEWAY_API_KEY: routeToken
    };

    expect(() => processHost.start({
      ...fixture.plan,
      env: buildInvocationEnvironment({ common })
    }, {})).toThrow(/omitted the OpenAI-compatible invocation Gateway binding/);
    expect(() => processHost.start({
      ...fixture.plan,
      env: buildInvocationEnvironment({
        common: {
          ...common,
          OPENAI_BASE_URL: baseUrl,
          OPENAI_API_KEY: routeToken,
          ANTHROPIC_BASE_URL: "http://127.0.0.1:43199",
          ANTHROPIC_AUTH_TOKEN: routeToken
        }
      })
    }, {})).toThrow(/mixed provider environment families/);
    expect(fixture.budget.attemptsStarted).toBe(0);
  });

  it("creates the common harness-process marker before Adapter startup and removes it on completion", async () => {
    const fixture = await createBoundFixture();
    const markerPath = path.join(fixture.runtimePath, "harness-process.json");
    await fs.writeFile(markerPath, `${JSON.stringify({
      invocationId: fixture.invocationId,
      pid: 99_999_999,
      processGroupId: 99_999_999,
      status: "running"
    })}\n`, { encoding: "utf8", mode: 0o600 });
    let markerDuringSpawn: Record<string, unknown> | undefined;
    const managed = fixture.processHost.start({
      ...fixture.plan,
      args: [
        "-e",
        "process.stdin.resume(); process.stdin.once('end', () => process.exit(0))"
      ]
    }, {
      onSpawn: async (child) => {
        markerDuringSpawn = JSON.parse(await fs.readFile(markerPath, "utf8")) as Record<string, unknown>;
        expect(markerDuringSpawn.pid).toBe(child.pid);
      }
    });

    await managed.end();
    await expect(managed.completed).resolves.toMatchObject({ code: 0 });
    expect(markerDuringSpawn).toMatchObject({
      invocationId: fixture.invocationId,
      status: "running"
    });
    await expect(fs.access(markerPath)).rejects.toThrow();
  });

  it.runIf(process.platform === "linux")(
    "does not trust a stale marker whose PID belongs to another process",
    async () => {
      const fixture = await createBoundFixture();
      const markerPath = path.join(fixture.runtimePath, "harness-process.json");
      const unrelated = spawn(
        process.execPath,
        ["-e", "setInterval(() => undefined, 1_000)"],
        {
          detached: true,
          stdio: "ignore",
          env: { PATH: process.env.PATH ?? "" }
        }
      );
      const unrelatedPid = unrelated.pid;
      if (!unrelatedPid) throw new Error("Fixture process did not start");
      unrelated.unref();
      try {
        await fs.writeFile(markerPath, `${JSON.stringify({
          invocationId: fixture.invocationId,
          pid: unrelatedPid,
          processGroupId: unrelatedPid,
          status: "running"
        })}\n`, { encoding: "utf8", mode: 0o600 });

        await new CommonProcessHost().cleanupInterrupted(
          fixture.invocationId,
          fixture.runtimePath
        );

        expect(() => process.kill(unrelatedPid, 0)).not.toThrow();
        await expect(fs.access(markerPath)).rejects.toThrow();
      } finally {
        try { process.kill(-unrelatedPid, "SIGKILL"); } catch { /* Already exited. */ }
        await waitForNamespaceProcessExit(unrelatedPid);
      }
    }
  );

  it("refuses a symlinked process marker without overwriting its target and stops the child", async () => {
    const fixture = await createBoundFixture();
    const markerPath = path.join(fixture.runtimePath, "harness-process.json");
    const outsideTarget = path.join(fixture.root, "marker-target.txt");
    await fs.writeFile(outsideTarget, "outside must remain unchanged\n", "utf8");
    await fs.symlink(outsideTarget, markerPath);
    const managed = fixture.processHost.start({
      ...fixture.plan,
      args: ["-e", "setInterval(() => undefined, 1_000)"]
    }, {});

    await expect(managed.completed).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "process",
      message: "Unable to create the Facade-owned Harness process marker safely"
    });
    expect(managed.child.exitCode !== null || managed.child.signalCode !== null).toBe(true);
    expect(await fs.readFile(outsideTarget, "utf8")).toBe("outside must remain unchanged\n");
    await expect(fs.access(markerPath)).rejects.toThrow();
  });

  it("rejects concurrent root processes and permits the next sequential attempt", async () => {
    const fixture = await createBoundFixture(3);
    const first = fixture.processHost.start({
      ...fixture.plan,
      args: [
        "-e",
        "process.stdin.resume(); process.stdin.once('end', () => process.exit(0))"
      ]
    }, {});
    await waitForPath(path.join(fixture.runtimePath, "harness-process.json"));

    expect(() => fixture.processHost.start(fixture.plan, {})).toThrow(
      /cannot launch concurrent root processes/
    );
    expect(fixture.budget.attemptsStarted).toBe(1);

    await first.end();
    await expect(first.completed).resolves.toMatchObject({ code: 0 });
    await expect(fixture.processHost.run(fixture.plan, {})).resolves.toMatchObject({
      code: 0
    });
    expect(fixture.budget.attemptsStarted).toBe(2);
  });

  it.each(["stdout", "stderr"] as const)(
    "applies backpressure while an asynchronous %s callback is pending",
    async (stream) => {
      const fixture = await createBoundFixture();
      const releaseSecondWrite = path.join(fixture.root, `${stream}-release-second`);
      const secondWriteFinished = path.join(fixture.root, `${stream}-second-finished`);
      let enterCallback!: () => void;
      let releaseCallback!: () => void;
      const callbackEntered = new Promise<void>((resolve) => { enterCallback = resolve; });
      const callbackReleased = new Promise<void>((resolve) => { releaseCallback = resolve; });
      const chunks: string[] = [];
      const callback = async (chunk: string) => {
        chunks.push(chunk);
        if (chunks.length === 1) {
          enterCallback();
          await callbackReleased;
        }
      };
      const managed = fixture.processHost.start({
        ...fixture.plan,
        args: ["-e", [
          `const fs = require("node:fs")`,
          `process.${stream}.write("first\\n")`,
          "const timer = setInterval(() => {",
          `  if (!fs.existsSync(${JSON.stringify(releaseSecondWrite)})) return`,
          "  clearInterval(timer)",
          `  process.${stream}.write("second\\n")`,
          `  fs.writeFileSync(${JSON.stringify(secondWriteFinished)}, "done")`,
          "}, 5)"
        ].join(";")]
      }, stream === "stdout" ? { onStdout: callback } : { onStderr: callback });
      let completed = false;
      void managed.completed.then(
        () => { completed = true; },
        () => { completed = true; }
      );

      await callbackEntered;
      await fs.writeFile(releaseSecondWrite, "release", "utf8");
      await waitForPath(secondWriteFinished);
      await Promise.resolve();
      expect(completed).toBe(false);
      expect(chunks).toEqual(["first\n"]);

      releaseCallback();
      await expect(managed.completed).resolves.toMatchObject({ code: 0 });
      expect(completed).toBe(true);
      expect(chunks.join("")).toBe("first\nsecond\n");
    }
  );

  it.each(["stdout", "stderr"] as const)(
    "terminates the child and propagates an asynchronous %s callback failure",
    async (stream) => {
      const fixture = await createBoundFixture();
      const managed = fixture.processHost.start({
        ...fixture.plan,
        args: [
          "-e",
          `process.${stream}.write("fixture chunk"); setInterval(() => undefined, 1_000)`
        ]
      }, stream === "stdout" ? {
        onStdout: async () => {
          await Promise.resolve();
          throw new Error("async stdout callback failed");
        }
      } : {
        onStderr: async () => {
          await Promise.resolve();
          throw new Error("async stderr callback failed");
        }
      });

      await expect(managed.completed).rejects.toThrow(`async ${stream} callback failed`);
      expect(managed.child.exitCode !== null || managed.child.signalCode !== null).toBe(true);
      await expect(fs.access(path.join(fixture.runtimePath, "harness-process.json"))).rejects.toThrow();
    }
  );

  it.runIf(process.platform === "linux")(
    "waits for late callback-failure process-group quiescence before rejecting",
    async () => {
      const fixture = await createBoundFixture();
      const descendantPidPath = path.join(fixture.root, "late-callback-descendant.pid");
      const managed = fixture.processHost.start({
        ...fixture.plan,
        args: ["-e", [
          "const {spawn}=require('node:child_process')",
          "const fs=require('node:fs')",
          "const child=spawn(process.execPath,['-e','process.on(\\'SIGTERM\\',()=>{});setInterval(()=>{},1000)'],{stdio:'ignore'})",
          `fs.writeFileSync(${JSON.stringify(descendantPidPath)},String(child.pid))`,
          "process.exit(0)"
        ].join(";")]
      }, {
        onSpawn: async () => {
          await waitForPath(descendantPidPath);
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
          throw new Error("late startup bookkeeping rejected");
        }
      });
      const descendantPid = Number(await (async () => {
        await waitForPath(descendantPidPath);
        return fs.readFile(descendantPidPath, "utf8");
      })());
      await expect(managed.completed).rejects.toThrow("late startup bookkeeping rejected");
      // Rejection is itself the quiescence boundary; no background cleanup is
      // allowed to make this assertion pass later.
      expect(await namespaceProcessAlive(descendantPid)).toBe(false);
    },
    10_000
  );

  it.runIf(process.platform === "linux")(
    "requires exact trusted protocol provenance when no resident claim exists",
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-provenance-"));
      temporaryRoots.push(root);
      const identity = {
        projectId: "project-provenance",
        harnessId: "fixture",
        scopeId: "execution-provenance",
        role: "delivery" as const,
        executionId: "execution-provenance",
        ownershipEpoch: 1
      };
      const host = new CommonProcessHost();
      const legacyRuntime = path.join(root, "legacy");
      await fs.mkdir(legacyRuntime, { recursive: true });
      await expect(host.cleanupResidentInterrupted(identity, legacyRuntime)).rejects.toThrow(
        "no trusted launch claim or durable launch protocol proof"
      );

      const trustedRuntime = path.join(root, "trusted");
      await fs.mkdir(trustedRuntime, { recursive: true });
      await expect(host.cleanupResidentInterrupted(identity, trustedRuntime, {
        allowMissingClaim: true
      })).resolves.toBeUndefined();

      const malformedRuntime = path.join(root, "malformed");
      await fs.mkdir(malformedRuntime, { recursive: true });
      await fs.writeFile(
        path.join(malformedRuntime, "resident-launch-claim-v1-1.json"),
        `${JSON.stringify({
          schemaVersion: 1,
          protocol: "trusted-supervisor-v1",
          identity,
          owner: { pid: 0, procPid: 0, pidNamespace: "", bootId: "", startTicks: "bad" },
          status: "launching"
        })}\n`,
        { mode: 0o600 }
      );
      await expect(host.cleanupResidentInterrupted(identity, malformedRuntime, {
        allowMissingClaim: true
      })).rejects.toThrow("owner identity is malformed");
    }
  );

  it.runIf(process.platform === "linux")(
    "does not signal a process group whose start identity disagrees with a stale claim",
    async () => {
      const fixture = await createBoundFixture();
      const runtimePath = path.join(fixture.root, "reused-identity-runtime");
      await fs.mkdir(runtimePath, { recursive: true });
      const host = new CommonProcessHost();
      const adjacent = host.startRaw({
        ...fixture.plan,
        args: ["-e", "setInterval(() => undefined, 1000)"]
      }, new AbortController().signal);
      try {
        const namespacePid = adjacent.child.pid!;
        const procPid = await procPidForNamespacePid(namespacePid);
        const [stat, status, pidNamespace, bootId, ownerStat, ownerStatus] =
          await Promise.all([
            fs.readFile(`/proc/${procPid}/stat`, "utf8"),
            fs.readFile(`/proc/${procPid}/status`, "utf8"),
            fs.readlink("/proc/self/ns/pid"),
            fs.readFile("/proc/sys/kernel/random/boot_id", "utf8"),
            fs.readFile("/proc/self/stat", "utf8"),
            fs.readFile("/proc/self/status", "utf8")
          ]);
        const statTail = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/);
        const ownerTail = ownerStat.slice(ownerStat.lastIndexOf(")") + 2)
          .trim().split(/\s+/);
        const statusField = (value: string, name: "NSpid" | "NSpgid") =>
          Number(new RegExp(`^${name}:\\s+(.+)$`, "m").exec(value)?.[1]
            ?.trim().split(/\s+/).at(-1));
        const observedPid = statusField(status, "NSpid") || procPid;
        const observedGroup = statusField(status, "NSpgid") || Number(statTail[2]);
        const ownerProcPid = Number(ownerStat.split(" ", 1)[0]);
        const ownerPid = statusField(ownerStatus, "NSpid") || ownerProcPid;
        const identity = {
          projectId: "project-reused-identity",
          harnessId: "fixture",
          scopeId: "execution-reused-identity",
          role: "delivery" as const,
          executionId: "execution-reused-identity",
          ownershipEpoch: 1
        };
        await fs.writeFile(
          path.join(runtimePath, "resident-launch-claim-v1-1.json"),
          `${JSON.stringify({
            schemaVersion: 1,
            protocol: "trusted-supervisor-v1",
            identity,
            owner: {
              pid: ownerPid,
              procPid: ownerProcPid,
              pidNamespace,
              bootId: bootId.trim(),
              startTicks: ownerTail[19]
            },
            status: "spawned",
            process: {
              pid: observedPid,
              procPid,
              processGroupId: observedPid,
              observedProcessGroupId: observedGroup,
              procProcessGroupId: Number(statTail[2]),
              procSessionId: Number(statTail[3]),
              pidNamespace,
              bootId: bootId.trim(),
              // All numeric identities are intentionally identical to the
              // live neighbor except start time, modelling PID/PGID reuse.
              startTicks: (BigInt(statTail[19]!) + 1n).toString()
            }
          })}\n`,
          { mode: 0o600 }
        );

        await expect(host.cleanupResidentInterrupted(identity, runtimePath))
          .resolves.toBeUndefined();
        expect(adjacent.child.exitCode).toBeNull();
        expect(adjacent.child.signalCode).toBeNull();
      } finally {
        adjacent.forceTerminate();
        await adjacent.completed;
      }
    }
  );

  it.runIf(process.platform === "linux")(
    "does not mistake another PID namespace's matching native PID for its actual child",
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-namespace-collision-"));
      temporaryRoots.push(root);
      const host = new CommonProcessHost();
      const runtimePath = path.join(root, "runtime");
      const witness = path.join(root, "foreign-namespace-observed.json");
      const session = { schemaVersion: 1 as const, harnessId: "fixture", adapterVersion: "test", generation: 0,
        nativeId: "namespace-collision-fixture", durable: false, createdAt: "2000-01-01T00:00:00.000Z" };
      const env = buildInvocationEnvironment({ common: {
        SCIENCEEVOLVE_PROJECT_ID: "resident-namespace-test", SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
        SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "namespace-execution", SCIENCEEVOLVE_RESIDENT_ROLE: "delivery",
        SCIENCEEVOLVE_EXECUTION_ID: "namespace-execution", SCIENCEEVOLVE_OWNERSHIP_EPOCH: "1", SCIENCEEVOLVE_ROLE_WORKSPACE: root,
        SCIENCEEVOLVE_GATEWAY_API_KEY: "fixture-route-token"
      } });
      // Exercise the actual trusted supervisor with a controlled /proc view
      // inside that child only. No service environment or real process file is
      // changed. A foreign namespace is listed before the real native child.
      const original = host.start.bind(host);
      vi.spyOn(host, "start").mockImplementation((plan, callbacks, signal) => {
        const shim = String.raw`
          const fixtureFs=require('node:fs'),fixtureCp=require('node:child_process');
          const fixtureSpawn=fixtureCp.spawn,fixtureRead=fixtureFs.readFileSync,
            fixtureLink=fixtureFs.readlinkSync,fixtureList=fixtureFs.readdirSync;
          let fixtureNativePid;
          fixtureCp.spawn=(...args)=>{const child=fixtureSpawn(...args);fixtureNativePid=child.pid;return child};
          const fixtureWitness=(kind)=>fixtureFs.writeFileSync(${JSON.stringify(witness)},JSON.stringify({kind,nativePid:fixtureNativePid}));
          fixtureFs.readdirSync=(file,...args)=>{const entries=fixtureList(file,...args);
            return file==='/proc'&&fixtureNativePid?['999999991',...entries]:entries};
          fixtureFs.readFileSync=(file,...args)=>{if(file==='/proc/999999991/status'){
            fixtureWitness('foreign-status');return 'NSpid:\t'+fixtureNativePid+'\nNSpgid:\t99\nNSsid:\t99\n';
          }if(file==='/proc/999999991/stat')return '999999991 (foreign-native) S 1 99 99 0 0 0 0 0';
          return fixtureRead(file,...args)};
          fixtureFs.readlinkSync=(file,...args)=>{if(file==='/proc/999999991/ns/pid'){
            fixtureWitness('foreign-namespace');return 'pid:[foreign-namespace]';
          }return fixtureLink(file,...args)};
        `;
        return original({ ...plan, args: [plan.args[0], `${shim}\n${plan.args[1]}`, ...plan.args.slice(2)] }, callbacks, signal);
      });
      let output = ""; let stderr = "";
      const managed = await host.startResident({
        scopeId: "namespace-execution", role: "delivery", harnessId: "fixture", runtimePath, workspacePath: root,
        signal: new AbortController().signal, recoveryBudget: new InvocationRecoveryController(1), session: () => session,
        route: { baseUrl: "http://127.0.0.1/v1", token: "fixture-route-token" }, commonEnvironment: env, authorityEnvironment: env
      }, { command: process.execPath, args: ["-e", "process.stdin.resume();process.stdin.once('end',()=>process.exit(0));process.stdout.write('native-ready\\n')"],
        cwd: root, env, eventFormat: "jsonl", session, rawLogLimitBytes: 1024 }, {
          onStdout: (chunk) => { output += chunk; }, onStderr: (chunk) => { stderr += chunk; }
        }).catch((error) => { throw new Error(`Namespace collision fixture launch failed: ${stderr}`, { cause: error }); });
      try {
        await managed.end();
        await expect(managed.completed).resolves.toMatchObject({ code: 0, signal: null });
        expect(output).toContain("native-ready");
        expect(JSON.parse(await fs.readFile(witness, "utf8"))).toMatchObject({ kind: "foreign-namespace", nativePid: expect.any(Number) });
      } finally {
        managed.terminate(); await managed.waitForQuiescence(); await managed.completed.catch(() => undefined);
      }
    }
  );

  it.runIf(process.platform === "linux").each(["previous_boot", "same_boot_foreign_namespace", "active_marker", "identity_mismatch"] as const)(
    "reconciles an original resident claim with a colliding current process (%s)", async (mode) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-old-boot-claim-")); temporaryRoots.push(root);
      const runtimePath = path.join(root, "runtime"); await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
      const host = new CommonProcessHost(), signal = new AbortController().signal;
      const session = { schemaVersion: 1 as const, harnessId: "fixture", adapterVersion: "test", generation: 0,
        nativeId: "original-native-session", durable: true, createdAt: "2000-01-01T00:00:00.000Z" };
      const adjacent = host.startRaw({ command: process.execPath, args: ["-e", "setInterval(()=>undefined,1000)"], cwd: root,
        env: buildInvocationEnvironment({ common: { SCIENCEEVOLVE_PROJECT_ID: "adjacent-project", SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
          SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "adjacent-execution", SCIENCEEVOLVE_RESIDENT_ROLE: "delivery", SCIENCEEVOLVE_EXECUTION_ID: "adjacent-execution",
          SCIENCEEVOLVE_OWNERSHIP_EPOCH: "1", SCIENCEEVOLVE_ROLE_WORKSPACE: root } }),
        eventFormat: "jsonl", session, rawLogLimitBytes: 1024 }, signal);
      try {
        const pid = adjacent.child.pid!, procPid = await procPidForNamespacePid(pid);
        const stat = await fs.readFile(`/proc/${procPid}/stat`, "utf8");
        const startTicks = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/)[19]!;
        const currentBoot = (await fs.readFile("/proc/sys/kernel/random/boot_id", "utf8")).trim();
        const oldBoot = "00000000-0000-0000-0000-000000000001";
        expect(currentBoot).not.toBe(oldBoot);
        const bootId = mode === "same_boot_foreign_namespace" ? currentBoot : oldBoot;
        const identity = { projectId: "original-project", harnessId: "fixture", scopeId: "original-execution",
          role: "delivery" as const, executionId: "original-execution", ownershipEpoch: 1 };
        const claimPath = path.join(runtimePath, "resident-launch-claim-v1-1.json");
        const claimText = JSON.stringify({ schemaVersion: 1, protocol: "trusted-supervisor-v1", identity: {
          ...identity, ...(mode === "identity_mismatch" ? { projectId: "foreign-project" } : {}) }, status: "spawned",
          owner: { pid, procPid, startTicks, bootId, pidNamespace: "pid:[previous-boot]" },
          process: { pid, procPid, processGroupId: pid, observedProcessGroupId: pid,
            procProcessGroupId: procPid, procSessionId: procPid, startTicks, bootId, pidNamespace: "pid:[previous-boot]" } }) + "\n";
        const markerText = JSON.stringify({ schemaVersion: 1, executionId: identity.scopeId, harnessId: "fixture", role: "delivery",
          ownershipEpoch: 1, state: mode === "active_marker" ? "running" : "stopped", pid, bootId, startTicks, session }) + "\n";
        await fs.writeFile(claimPath, claimText, { mode: 0o600 });
        await fs.writeFile(path.join(runtimePath, "resident-process.json"), markerText, { mode: 0o600 });
        const cleanup = host.cleanupResidentInterrupted(identity, runtimePath);
        if (mode === "previous_boot") await cleanup;
        else await expect(cleanup).rejects.toThrow(mode === "same_boot_foreign_namespace" ? /another PID namespace/
          : mode === "active_marker" ? /active marker/ : /mismatched/);
        expect(adjacent.child.exitCode).toBeNull(); expect(adjacent.child.signalCode).toBeNull();
        expect(await fs.readFile(claimPath, "utf8")).toBe(claimText);
        expect(await fs.readFile(path.join(runtimePath, "resident-process.json"), "utf8")).toBe(markerText);
      } finally { adjacent.forceTerminate(); await adjacent.completed; }
    });

  it.runIf(process.platform === "linux")(
    "kills only the exact resident authority process group without an invocation id",
    async () => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-cleanup-"));
      temporaryRoots.push(root);
      const host = new CommonProcessHost();
      const signal = new AbortController().signal;
      const runtimePath = path.join(root, "runtime");
      await fs.mkdir(runtimePath, { recursive: true });
      const session = {
        schemaVersion: 1 as const,
        harnessId: "fixture",
        adapterVersion: "test",
        generation: 0,
        nativeId: "resident-cleanup-fixture",
        durable: false,
        createdAt: "2000-01-01T00:00:00.000Z"
      };
      const startRaw = (
        projectId: string,
        role: "delivery" | "final-integration",
        ownershipEpoch: number
      ) => host.startRaw({
        command: process.execPath,
        args: ["-e", "setInterval(() => undefined, 1000)"],
        cwd: root,
        env: buildInvocationEnvironment({
          common: {
            SCIENCEEVOLVE_PROJECT_ID: projectId,
            SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
            SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "execution-resident-cleanup",
            SCIENCEEVOLVE_RESIDENT_ROLE: role,
            SCIENCEEVOLVE_EXECUTION_ID: "execution-resident-cleanup",
            SCIENCEEVOLVE_OWNERSHIP_EPOCH: String(ownershipEpoch),
            SCIENCEEVOLVE_ROLE_WORKSPACE: root
          }
        }),
        eventFormat: "jsonl",
        session,
        rawLogLimitBytes: 1_024
      }, signal);
      const descendantReadyPath = path.join(root, "orphan-descendant.ready");
      const exactEnvironment = buildInvocationEnvironment({
        common: {
          SCIENCEEVOLVE_PROJECT_ID: "project-resident-cleanup",
          SCIENCEEVOLVE_AGENT_HARNESS: "fixture",
          SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "execution-resident-cleanup",
          SCIENCEEVOLVE_RESIDENT_ROLE: "delivery",
          SCIENCEEVOLVE_EXECUTION_ID: "execution-resident-cleanup",
          SCIENCEEVOLVE_OWNERSHIP_EPOCH: "7",
          SCIENCEEVOLVE_ROLE_WORKSPACE: root,
          SCIENCEEVOLVE_GATEWAY_API_KEY: "resident-fixture-route"
        }
      });
      const exactPlan: LaunchPlan = {
        command: process.execPath,
        args: ["-e", [
          "const {spawn}=require('node:child_process')",
          "const fs=require('node:fs')",
          "const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('SCIENCEEVOLVE_')))",
          "const child=spawn(process.execPath,['-e','process.on(\\'SIGTERM\\',()=>{});setInterval(()=>undefined,1000)'],{stdio:'ignore',env})",
          `fs.writeFileSync(${JSON.stringify(descendantReadyPath)},String(child.pid))`,
          "process.exit(0)"
        ].join(";")],
        cwd: root,
        env: exactEnvironment,
        eventFormat: "jsonl",
        session,
        rawLogLimitBytes: 1_024
      };
      const residentBinding = {
        scopeId: "execution-resident-cleanup",
        role: "delivery" as const,
        harnessId: "fixture",
        workspacePath: root,
        signal,
        recoveryBudget: new InvocationRecoveryController(4),
        session: () => session,
        route: { baseUrl: "http://127.0.0.1/v1", token: "resident-fixture-route" },
        commonEnvironment: exactEnvironment,
        authorityEnvironment: {
          SCIENCEEVOLVE_PROJECT_ID: "project-resident-cleanup",
          SCIENCEEVOLVE_EXECUTION_ID: "execution-resident-cleanup",
          SCIENCEEVOLVE_OWNERSHIP_EPOCH: "7"
        }
      };
      const normalRuntimePath = path.join(root, "normal-runtime");
      const normal = await host.startResident({
        ...residentBinding,
        runtimePath: normalRuntimePath
      }, {
        ...exactPlan,
        args: ["-e", "process.exit(0)"]
      });
      await expect(Promise.race([
        normal.completed,
        new Promise<never>((_, reject) => setTimeout(
          () => reject(new Error("resident supervisor did not exit with its native CLI")),
          2_000
        ))
      ])).resolves.toMatchObject({ code: 0 });
      const orphan = await host.startResident({
        ...residentBinding,
        runtimePath: path.join(root, "orphan-runtime")
      }, exactPlan);
      await waitForPath(descendantReadyPath);
      await expect(Promise.race([
        orphan.completed,
        new Promise<never>((_, reject) => setTimeout(
          () => reject(new Error("resident supervisor masked a dead native root")),
          2_000
        ))
      ])).resolves.toMatchObject({ code: 0 });
      orphan.terminate();
      await orphan.waitForQuiescence();
      await waitForNamespaceProcessExit(Number(await fs.readFile(descendantReadyPath, "utf8")));

      const cleanupReadyPath = path.join(root, "cleanup-descendant.ready");
      const cleanupNativePidPath = path.join(root, "cleanup-native.pid");
      const exact = await host.startResident({
        ...residentBinding,
        runtimePath
      }, {
        ...exactPlan,
        args: ["-e", [
          "const {spawn}=require('node:child_process')",
          "const fs=require('node:fs')",
          "const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('SCIENCEEVOLVE_')))",
          "const child=spawn(process.execPath,['-e','process.on(\\'SIGTERM\\',()=>{});setInterval(()=>undefined,1000)'],{stdio:'ignore',env})",
          `fs.writeFileSync(${JSON.stringify(cleanupNativePidPath)},String(process.pid))`,
          `fs.writeFileSync(${JSON.stringify(cleanupReadyPath)},String(child.pid))`,
          "setInterval(()=>undefined,1000)"
        ].join(";")]
      });
      const adjacentEpoch = startRaw("project-resident-cleanup", "delivery", 8);
      const adjacentRole = startRaw("project-resident-cleanup", "final-integration", 7);
      const adjacentProject = startRaw("project-resident-cleanup-other", "delivery", 7);
      const adjacentProcesses = [adjacentEpoch, adjacentRole, adjacentProject];
      try {
        await waitForPath(cleanupReadyPath);
        // Here the native root is still alive; this simulates a service crash
        // before the resident marker and exercises claim-backed PG cleanup.
        expect(exact.child.exitCode).toBeNull();
        expect(exact.child.signalCode).toBeNull();
        const claimPath = path.join(runtimePath, "resident-launch-claim-v1-7.json");
        const claim = JSON.parse(await fs.readFile(claimPath, "utf8")) as {
          process: {
            pidNamespace: string;
            procPid: number;
            procProcessGroupId: number;
            procSessionId: number;
          };
        };
        const nativeNamespacePid = Number(await fs.readFile(cleanupNativePidPath, "utf8"));
        const nativeProcPid = await procPidForNamespacePid(nativeNamespacePid);
        const nativeStat = await fs.readFile(`/proc/${nativeProcPid}/stat`, "utf8");
        const nativeTail = nativeStat.slice(nativeStat.lastIndexOf(")") + 2)
          .trim().split(/\s+/);
        // The durable claim names the trusted supervisor. The native CLI must
        // start as its direct child in that exact PG/session before cleanup is
        // allowed to treat the supervisor identity as whole-tree authority.
        expect(Number(nativeTail[1])).toBe(claim.process.procPid);
        expect(Number(nativeTail[2])).toBe(claim.process.procProcessGroupId);
        expect(Number(nativeTail[3])).toBe(claim.process.procSessionId);
        const originalPidNamespace = claim.process.pidNamespace;
        claim.process.pidNamespace = "pid:[unrelated-namespace]";
        await fs.writeFile(claimPath, `${JSON.stringify(claim)}\n`, { mode: 0o600 });
        await expect(host.cleanupResidentInterrupted({
          projectId: "project-resident-cleanup",
          harnessId: "fixture",
          scopeId: "execution-resident-cleanup",
          role: "delivery",
          executionId: "execution-resident-cleanup",
          ownershipEpoch: 7
        }, runtimePath)).rejects.toThrow("another PID namespace");
        expect(exact.child.exitCode).toBeNull();
        expect(exact.child.signalCode).toBeNull();
        claim.process.pidNamespace = originalPidNamespace;
        await fs.writeFile(claimPath, `${JSON.stringify(claim)}\n`, { mode: 0o600 });
        await host.cleanupResidentInterrupted({
          projectId: "project-resident-cleanup",
          harnessId: "fixture",
          scopeId: "execution-resident-cleanup",
          role: "delivery",
          executionId: "execution-resident-cleanup",
          ownershipEpoch: 7
        }, runtimePath);
        await expect(exact.completed).resolves.toMatchObject({ signal: "SIGKILL" });
        await waitForNamespaceProcessExit(Number(await fs.readFile(cleanupReadyPath, "utf8")));
        expect(exact.child.exitCode !== null || exact.child.signalCode !== null).toBe(true);
        expect(adjacentEpoch.child.exitCode).toBeNull();
        expect(adjacentEpoch.child.signalCode).toBeNull();
        expect(adjacentRole.child.exitCode).toBeNull();
        expect(adjacentRole.child.signalCode).toBeNull();
        expect(adjacentProject.child.exitCode).toBeNull();
        expect(adjacentProject.child.signalCode).toBeNull();
      } finally {
        exact.terminate();
        for (const resident of adjacentProcesses) resident.forceTerminate();
        await Promise.allSettled([
          exact.completed,
          ...adjacentProcesses.map((resident) => resident.completed)
        ]);
      }
    },
    15_000
  );

  it.runIf(process.platform === "linux")(
    "escalates to the original process group after its leader exits on SIGTERM",
    async () => {
      const fixture = await createBoundFixture();
      const descendantPidPath = path.join(fixture.root, "descendant.pid");
      const descendantReadyPath = path.join(fixture.root, "descendant.ready");
      const descendantSource = [
        "const fs=require('node:fs')",
        "process.on('SIGTERM',()=>{})",
        `fs.writeFileSync(${JSON.stringify(descendantReadyPath)},'ready')`,
        "setInterval(()=>{},1000)"
      ].join(";");
      const raw = new CommonProcessHost().startRaw({
        ...fixture.plan,
        args: ["-e", [
          "const {spawn}=require('node:child_process')",
          "const fs=require('node:fs')",
          `const child=spawn(process.execPath,['-e',${JSON.stringify(descendantSource)}],{stdio:'ignore'})`,
          `fs.writeFileSync(${JSON.stringify(descendantPidPath)},String(child.pid))`,
          "process.on('SIGTERM',()=>process.exit(0))",
          "setInterval(()=>{},1000)"
        ].join(";")]
      }, new AbortController().signal);
      await waitForPath(descendantPidPath);
      await waitForPath(descendantReadyPath);
      const descendantPid = Number(await fs.readFile(descendantPidPath, "utf8"));
      try {
        raw.terminate();
        await expect(raw.completed).resolves.toBeDefined();
        expect(processAlive(descendantPid)).toBe(false);
      } finally {
        try { process.kill(descendantPid, "SIGKILL"); } catch { /* already gone */ }
      }
    },
    15_000
  );
});

describe.runIf(process.platform === "linux")("automatic native process ownership", () => {
  function denyNamespace(procPid: number) {
    const original = fsSync.readlinkSync;
    let attempts = 0;
    const failure = Object.assign(new Error(`EACCES: permission denied, readlink '/proc/${procPid}/ns/pid'`), { code: "EACCES" });
    const mock = vi.spyOn(fsSync, "readlinkSync").mockImplementation((...args) => {
      if (String(args[0]) === `/proc/${procPid}/ns/pid`) { attempts += 1; throw failure; }
      return Reflect.apply(original, fsSync, args);
    });
    syncBuiltinESMExports();
    return { failure, attempts: () => attempts, restore: () => { mock.mockRestore(); syncBuiltinESMExports(); } };
  }

  it.each(["readable", "exited", "unreadable"] as const)("rechecks an owned process after a polling permission error (%s)", async outcome => {
    const fixture = await nativeChild();
    const scope = nativeProcessScope(fixture.raw.child)!;
    await scope.flushAudit();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const recovered = vi.spyOn(console, "info").mockImplementation(() => {});
    const denied = denyNamespace(await procPidForNamespacePid(fixture.pid));
    try {
      await vi.waitFor(() => expect(denied.attempts()).toBeGreaterThanOrEqual(2), { timeout: 3_000 });
      expect(() => pendingNativeProcesses(fixture.raw.child.pid!)).toThrow(denied.failure);
      expect(fixture.processRecords).not.toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "exited" }));
      if (outcome === "unreadable") {
        expect(() => pendingNativeProcesses(fixture.raw.child.pid!)).toThrow(denied.failure);
        expect(recovered).not.toHaveBeenCalled();
      } else {
        if (outcome === "exited") { process.kill(fixture.pid, "SIGKILL"); await waitForNamespaceProcessExit(fixture.pid); }
        else denied.restore();
        const pending = pendingNativeProcesses(fixture.raw.child.pid!);
        expect(pending.map(record => record.pid)).toEqual(outcome === "exited" ? [] : [fixture.pid]);
        await scope.flushAudit();
        expect(recovered).toHaveBeenCalledWith("Native process observation recovered", expect.objectContaining({ scopeId: scope.scopeId }));
        if (outcome === "exited") expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "exited" }));
      }
      expect(warning).toHaveBeenCalledTimes(1);
    } finally {
      denied.restore();
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed.catch(() => {});
      warning.mockRestore(); recovered.mockRestore();
    }
  });

  it("audits an earlier exit after another owned identity temporarily becomes unreadable", async () => {
    const fixture = await nativeChild(false, undefined, 2);
    const scope = nativeProcessScope(fixture.raw.child)!;
    await scope.flushAudit();
    const denied = denyNamespace(await procPidForNamespacePid(fixture.pids[1]!));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const recovered = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      process.kill(fixture.pid, "SIGKILL"); await waitForNamespaceProcessExit(fixture.pid);
      expect(() => pendingNativeProcesses(fixture.raw.child.pid!)).toThrow(denied.failure);
      denied.restore();
      await scope.flushAudit();
      expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "exited" }));
      expect(pendingNativeProcesses(fixture.raw.child.pid!).map(record => record.pid)).toEqual([fixture.pids[1]]);
    } finally {
      denied.restore(); warning.mockRestore(); recovered.mockRestore();
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed.catch(() => {});
    }
  });

  it("keeps an inventory write failure fatal after the filesystem becomes writable", async () => {
    const fixture = await nativeChild();
    const scope = nativeProcessScope(fixture.raw.child)!;
    await scope.flushAudit();
    const inventory = path.join(fixture.runtimePath, `native-processes-${scope.scopeId}.json`);
    const failure = Object.assign(new Error("Native inventory publication failed"), { code: "EIO" });
    const original = fsSync.renameSync;
    const rename = vi.spyOn(fsSync, "renameSync").mockImplementation((...args) => {
      if (String(args[1]) === inventory) throw failure;
      return Reflect.apply(original, fsSync, args);
    });
    syncBuiltinESMExports();
    const completion = fixture.raw.completed.catch(error => error);
    try {
      process.kill(fixture.pid, "SIGKILL"); await waitForNamespaceProcessExit(fixture.pid);
      expect(() => pendingNativeProcesses(fixture.raw.child.pid!)).toThrow(failure);
      expect((await fs.readdir(fixture.runtimePath)).filter(file => file.startsWith(`native-processes-${scope.scopeId}.json.`))).toEqual([]);
      rename.mockRestore(); syncBuiltinESMExports();
      expect(() => pendingNativeProcesses(fixture.raw.child.pid!)).toThrow(failure);
      await expect(scope.flushAudit()).rejects.toBe(failure);
      fixture.raw.forceTerminate();
      await expect(fixture.raw.waitForQuiescence()).rejects.toBe(failure);
      expect(await completion).toBe(failure);
    } finally {
      rename.mockRestore(); syncBuiltinESMExports();
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence().catch(() => {}); await completion;
    }
  });

  it("does not adopt a descendant assigned to a different Agent launch", async () => {
    const fixture = await createBoundFixture(4, true);
    const pidFile = path.join(fixture.root, "separate-agent.pid");
    const source = `const child=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],` +
      `{detached:true,stdio:'ignore',env:{...process.env,${JSON.stringify(NATIVE_PROCESS_SCOPE_ENV)}:'00000000-0000-4000-8000-000000000002'}});` +
      `require('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(child.pid));setInterval(()=>{},1000)`;
    const raw = fixture.processHost.startRaw({ ...fixture.plan, args: ["-e", source] });
    let pid: number | undefined;
    try {
      await waitForPath(pidFile); pid = Number(await fs.readFile(pidFile, "utf8"));
      expect(pendingNativeProcesses(raw.child.pid!)).toEqual([]);
      await nativeProcessScope(raw.child)!.flushAudit();
      expect(fixture.processRecords.some(record => record.pid === pid)).toBe(false);
      raw.forceTerminate(); await raw.waitForQuiescence(); await raw.completed;
      expect(await namespaceProcessAlive(pid)).toBe(true);
    } finally {
      raw.forceTerminate(); await raw.waitForQuiescence(); await raw.completed.catch(() => {});
      if (pid) { try { process.kill(pid, "SIGKILL"); } catch {} await waitForNamespaceProcessExit(pid); }
    }
  });

  it.each([false, true])("does not adopt a process born before the current launch even if its scope assignment matches (recovery=%s)", async recovering => {
    const older = await nativeChild();
    const current = await nativeChild();
    let restore: (() => void) | undefined;
    try {
      pendingNativeProcesses(older.raw.child.pid!);
      const scope = nativeProcessScope(current.raw.child)!;
      const olderRecord = older.processRecords.find(record => record.pid === older.pid)!;
      if (recovering) {
        const original = fsSync.readFileSync;
        const read = vi.spyOn(fsSync, "readFileSync").mockImplementation((...args) => {
          if (String(args[0]) === `/proc/${olderRecord.procPid}/environ`) return `${NATIVE_PROCESS_SCOPE_ENV}=${scope.scopeId}\0`;
          return Reflect.apply(original, fsSync, args);
        });
        syncBuiltinESMExports(); restore = () => { read.mockRestore(); syncBuiltinESMExports(); };
        await recoverNativeProcesses(current.runtimePath); await current.raw.completed;
      } else {
        scope.observe([{ ...olderRecord, scopeId: scope.scopeId }]);
        const inventory = JSON.parse(await fs.readFile(path.join(current.runtimePath, `native-processes-${scope.scopeId}.json`), "utf8"));
        expect(inventory.records.some((record: NativeProcessRecord) => record.pid === older.pid)).toBe(false);
        current.raw.forceTerminate(); await current.raw.waitForQuiescence(); await current.raw.completed;
      }
      expect(await namespaceProcessAlive(older.pid)).toBe(true);
    } finally {
      restore?.();
      for (const fixture of [current, older]) {
        fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed.catch(() => {});
      }
    }
  });

  it("does not block another Agent launch when one owned process is unreadable", async () => {
    const first = await nativeChild(), second = await nativeChild();
    await nativeProcessScope(first.raw.child)!.flushAudit();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const recovered = vi.spyOn(console, "info").mockImplementation(() => {});
    const denied = denyNamespace(await procPidForNamespacePid(first.pid));
    try {
      await vi.waitFor(() => expect(denied.attempts()).toBeGreaterThanOrEqual(2), { timeout: 3_000 });
      expect(pendingNativeProcesses(second.raw.child.pid!).map(record => record.pid)).toEqual([second.pid]);
      second.raw.forceTerminate(); await second.raw.waitForQuiescence(); await second.raw.completed;
      expect(await namespaceProcessAlive(first.pid)).toBe(true);
    } finally {
      denied.restore();
      for (const fixture of [first, second]) {
        fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed.catch(() => {});
      }
      warning.mockRestore(); recovered.mockRestore();
    }
  });

  it("does not let an explicitly handed-off job's observation block its original Agent", async () => {
    const fixture = await nativeChild();
    const scope = { projectId: "prj_process_fixture", projectPath: fixture.root, agentId: "coder",
      invocationId: fixture.invocationId, workspacePath: fixture.workspacePath };
    const call = (operation: "register" | "stop") => requestNativeBackgroundJob(scope,
      { operation, jobId: "independent-monitor", ...(operation === "register" ? { pid: fixture.pid } : {}) }, async () => {});
    let restore: (() => void) | undefined;
    try {
      await call("register");
      expect(pendingNativeProcesses(fixture.raw.child.pid!)).toEqual([]);
      restore = denyNamespace(await procPidForNamespacePid(fixture.pid)).restore;
      expect(pendingNativeProcesses(fixture.raw.child.pid!)).toEqual([]);
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed;
      expect(await namespaceProcessAlive(fixture.pid)).toBe(true);
    } finally {
      restore?.(); await call("stop");
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence(); await fixture.raw.completed.catch(() => {});
    }
  });

  it("checks only this task's business processes while supervising MCP helpers through Harness shutdown", async () => {
    const fixture = await createBoundFixture(4, true);
    const other = await nativeChild();
    const supportFile = path.join(fixture.root, "support.pid");
    const helperFile = path.join(fixture.root, "support-helper.pid");
    const businessFile = path.join(fixture.root, "business.pid");
    const launch = (source: string, target: string, support: boolean) =>
      `const child=require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(source)}],` +
      `{detached:true,stdio:'ignore',env:{...process.env,${JSON.stringify(NATIVE_PROCESS_SUPPORT_ENV)}:${JSON.stringify(support ? "1" : "0")}}});` +
      `require('node:fs').writeFileSync(${JSON.stringify(target)},String(child.pid));`;
    const helper = launch("setInterval(()=>{},1000)", helperFile, true) + "setInterval(()=>{},1000)";
    const source = "{" + launch(helper, supportFile, true) + "}{" +
      launch("setInterval(()=>{},1000)", businessFile, false) + "}setInterval(()=>{},1000)";
    const raw = fixture.processHost.startRaw({ ...fixture.plan, args: ["-e", source] });
    const pids: number[] = [];
    try {
      for (const file of [supportFile, helperFile, businessFile]) {
        await waitForPath(file); pids.push(Number(await fs.readFile(file, "utf8")));
      }
      const [supportPid, helperPid, businessPid] = pids;
      const pending = pendingNativeProcesses(raw.child.pid!);
      expect(pending.map(record => record.pid)).toEqual([businessPid]);
      await vi.waitFor(() => {
        for (const pid of pids) expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid, state: "running" }));
      });
      raw.forceTerminate(); await raw.waitForQuiescence(); await raw.completed;
      for (const pid of [supportPid!, helperPid!, businessPid!]) await waitForNamespaceProcessExit(pid);
      expect(await namespaceProcessAlive(other.pid)).toBe(true);
      expect(other.raw.child.exitCode).toBeNull();
    } finally {
      raw.forceTerminate(); await raw.waitForQuiescence(); await raw.completed.catch(() => {});
      other.raw.forceTerminate(); await other.raw.waitForQuiescence(); await other.raw.completed.catch(() => {});
      for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
    }
  });

  async function nativeChild(orphanShell = false, onProcesses?: (records: readonly NativeProcessRecord[]) => Promise<void>, count = 1) {
    const fixture = await createBoundFixture(4, true, onProcesses);
    const pidFile = path.join(fixture.root, "native-child.pid");
    const ready = path.join(fixture.root, "native-child.ready");
    const pidsFile = path.join(fixture.root, "native-children.json");
    const worker = `require('node:fs').writeFileSync(${JSON.stringify(ready)},'ready');setInterval(()=>{},1000)`;
    const launch = `const pids=[];for(let i=0;i<${count};i++){const c=require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(worker)}],{detached:true,stdio:'ignore'});pids.push(c.pid);}` +
      `require('node:fs').writeFileSync(${JSON.stringify(pidsFile)},JSON.stringify(pids));require('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(pids[0]));`;
    const source = orphanShell
      ? `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(launch + "process.exit(0)")}],{stdio:'ignore'});setInterval(()=>{},1000)`
      : launch + "setInterval(()=>{},1000)";
    const raw = fixture.processHost.startRaw({ ...fixture.plan, args: ["-e", source] });
    await waitForPath(pidFile); await waitForPath(ready);
    const pid = Number(await fs.readFile(pidFile, "utf8"));
    const pids = JSON.parse(await fs.readFile(pidsFile, "utf8")) as number[];
    return { ...fixture, raw, pid, pids };
  }

  it.each([false, true])("records and stops detached native work after shell reparenting=%s", async orphanShell => {
    const fixture = await nativeChild(orphanShell);
    try {
      expect(pendingNativeProcesses(fixture.raw.child.pid!)).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "running", agentId: "coder" }));
      await vi.waitFor(() => expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "running" })));
      fixture.raw.forceTerminate();
      await fixture.raw.waitForQuiescence();
      await fixture.raw.completed;
      await waitForNamespaceProcessExit(fixture.pid);
      expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "exited" }));
    } finally {
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence();
      await fixture.raw.completed.catch(() => {});
      try { process.kill(fixture.pid, "SIGKILL"); } catch {}
    }
  });

  it.each([false, true])("preserves an explicitly registered handoff across native completion with restart reconciliation=%s", async recovering => {
    const fixture = await nativeChild();
    const scope = { projectId: "prj_process_fixture", projectPath: fixture.root, agentId: "coder", invocationId: fixture.invocationId, workspacePath: fixture.workspacePath };
    const call = (operation: "register" | "stop" | "status") => requestNativeBackgroundJob(scope,
      { operation, jobId: "retained", ...(operation === "register" ? { pid: fixture.pid } : {}) }, async () => {});
    try {
      expect(pendingNativeProcesses(fixture.raw.child.pid!)).toHaveLength(1);
      await call("register");
      if (recovering) await recoverNativeProcesses(fixture.runtimePath);
      else {
        expect(pendingNativeProcesses(fixture.raw.child.pid!)).toEqual([]);
        fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence();
      }
      await fixture.raw.completed;
      expect(await call("status")).toMatchObject({ state: "running" });
      expect(fixture.processRecords).toContainEqual(expect.objectContaining({ pid: fixture.pid, state: "handed_off", jobId: "retained" }));
    } finally {
      await call("stop");
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence();
      await fixture.raw.completed.catch(() => {});
    }
  });

  it("still stops owned work when audit delivery fails and never acknowledges successful completion", async () => {
    const failure = new Error("Native process audit delivery failed");
    const fixture = await nativeChild(false, async () => { throw failure; });
    const completion = fixture.raw.completed.catch(error => error);
    try {
      fixture.raw.forceTerminate();
      await expect(fixture.raw.waitForQuiescence()).rejects.toBe(failure);
      expect(await completion).toBe(failure);
      await waitForNamespaceProcessExit(fixture.pid);
    } finally {
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence().catch(() => {});
      await completion;
      try { process.kill(fixture.pid, "SIGKILL"); } catch {}
    }
  });

  it("reconciles a retained process inventory without touching another execution", async () => {
    const fixture = await nativeChild(), other = await nativeChild();
    try {
      pendingNativeProcesses(fixture.raw.child.pid!);
      await recoverNativeProcesses(fixture.runtimePath);
      await fixture.raw.completed;
      await waitForNamespaceProcessExit(fixture.pid);
      expect(await namespaceProcessAlive(other.pid)).toBe(true);
      expect(other.raw.child.exitCode).toBeNull();
    } finally {
      for (const current of [fixture, other]) {
        current.raw.forceTerminate(); await current.raw.waitForQuiescence();
        await current.raw.completed.catch(() => {});
      }
    }
  });

  it("does not signal a replacement whose retained start identity disagrees", async () => {
    const fixture = await nativeChild();
    try {
      pendingNativeProcesses(fixture.raw.child.pid!);
      const name = (await fs.readdir(fixture.runtimePath)).find(name => /^native-processes-.*\.json$/.test(name))!;
      const file = path.join(fixture.runtimePath, name), inventory = JSON.parse(await fs.readFile(file, "utf8"));
      inventory.scopeId = "00000000-0000-4000-8000-000000000001";
      inventory.records = inventory.records.filter((record: NativeProcessRecord) => record.pid === fixture.pid)
        .map((record: NativeProcessRecord) => ({ ...record, scopeId: inventory.scopeId, startTicks: "0" }));
      const retained = path.join(fixture.runtimePath, `native-processes-${inventory.scopeId}.json`);
      await fs.rename(file, retained);
      await fs.writeFile(retained, JSON.stringify(inventory));
      await recoverNativeProcesses(fixture.runtimePath);
      expect(await namespaceProcessAlive(fixture.pid)).toBe(true);
      expect(fixture.raw.child.exitCode).toBeNull();
    } finally {
      fixture.raw.forceTerminate(); await fixture.raw.waitForQuiescence();
      await fixture.raw.completed.catch(() => {});
    }
  });
});

function processAlive(pid: number): boolean {
  try {
    const status = readFileSync(`/proc/${pid}/status`, "utf8");
    return !/^State:\s+Z\b/m.test(status);
  } catch {
    return false;
  }
}
