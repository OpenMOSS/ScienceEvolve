import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse as parseToml } from "smol-toml";
import { NATIVE_PROCESS_SUPPORT_ENV } from "../../src/core/harness-runtime/native-processes.js";
import {
  AgentApiError,
  AgentAuthenticationError,
  AgentRequestConfigurationError,
  CodexRunner,
  codexGatewayConfigOverrides,
  describeCodexEvent,
  type CodexRunnerOptions
} from "../../src/core/codex-runner.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import type {
  AgentConfig,
  AgentRunRequest,
  ProjectState,
  TraceSink
} from "../../src/core/types.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { SYSTEM_CONTROLLER_AGENT } from "../../src/core/system-controller.js";
import { containsCredentialMaterial, redactTrace } from "../../src/core/utils.js";
import {
  FIXED_MCP_BASE_URL,
  FIXED_MCP_TOKEN_ENV_VAR,
  isFixedMcpServer
} from "../../src/core/mcp-directory.js";
import {
  prepareComputeRuntime,
  serializeInvocationControlContext
} from "../../src/core/harness-runtime/runtime-support.js";
import { CommonProcessHost } from "../../src/core/harness-runtime/process-host.js";
import { InvocationRecoveryController } from "../../src/core/harness-runtime/invocation-recovery.js";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";

const temporaryRoots: string[] = [];
const originalHttpProxy = process.env.HTTP_PROXY;
const originalHome = process.env.HOME;
const originalCodexHome = process.env.CODEX_HOME;
const originalMossApiKey = process.env.MOSS_API_KEY;
const originalFixedMcpToken = process.env[FIXED_MCP_TOKEN_ENV_VAR];
const originalExecutionLocalSetting =
  process.env.SCIENCEEVOLVE_EXECUTION_LOCAL_SETTING;
const WORKER_MARKDOWN =
  "## Result\nA structured fake result.\n\n## Evidence\nThe runner contract was inspected.\n\n## Risks and Unresolved Issues\nNo unresolved blocker is known.";
const EXECUTION_MARKDOWN =
  "## Result\nExecution environment inspected without reading credentials.\n\n## Evidence\nThe isolated environment was inspected.\n\n## Risks and Unresolved Issues\nNo unresolved blocker is known.";

afterEach(async () => {
  delete process.env.SCIENCEEVOLVE_TEST_SECRET;
  if (originalHttpProxy === undefined) {
    delete process.env.HTTP_PROXY;
  } else {
    process.env.HTTP_PROXY = originalHttpProxy;
  }
  if (originalHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  if (originalCodexHome === undefined) {
    delete process.env.CODEX_HOME;
  } else {
    process.env.CODEX_HOME = originalCodexHome;
  }
  if (originalMossApiKey === undefined) {
    delete process.env.MOSS_API_KEY;
  } else {
    process.env.MOSS_API_KEY = originalMossApiKey;
  }
  if (originalFixedMcpToken === undefined) {
    delete process.env[FIXED_MCP_TOKEN_ENV_VAR];
  } else {
    process.env[FIXED_MCP_TOKEN_ENV_VAR] = originalFixedMcpToken;
  }
  if (originalExecutionLocalSetting === undefined) {
    delete process.env.SCIENCEEVOLVE_EXECUTION_LOCAL_SETTING;
  } else {
    process.env.SCIENCEEVOLVE_EXECUTION_LOCAL_SETTING =
      originalExecutionLocalSetting;
  }
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      fs.rm(root, { recursive: true, force: true })
    )
  );
});

describe("CodexRunner", () => {
  it("sets the custom provider idle deadline after the protocol proxy deadline", () => {
    expect(codexGatewayConfigOverrides(
      testGatewaySnapshot("route-token"),
      1_200_000
    )).toContain(
      "model_providers.openfars_gateway.stream_idle_timeout_ms=1230000"
    );
  });

  it("projects the selected model context window and native compaction threshold", () => {
    const gateway = testGatewaySnapshot("route-token");
    gateway.modelContextWindows = {
      "nex-agi/Nex-N2-Pro": 1_000_000,
      "other-model": 32_768
    };
    expect(codexGatewayConfigOverrides(
      gateway,
      undefined,
      "other-model"
    )).toEqual(expect.arrayContaining([
      "model_context_window=32768",
      "model_auto_compact_token_limit=26214",
      'model_auto_compact_token_limit_scope="total"'
    ]));
  });

  it("uses the selected model's window for Codex native compaction", () => {
    const gateway = {
      ...testGatewaySnapshot("route-token"),
      models: ["small", "large"],
      defaultModel: "small",
      modelContextWindows: { small: 4_096, large: 1_048_576 }
    };
    const overrides = codexGatewayConfigOverrides(gateway, undefined, "large");
    expect(overrides).toContain("model_context_window=1048576");
    expect(overrides).toContain("model_auto_compact_token_limit=838860");
    expect(overrides).not.toContain("model_context_window=4096");
  });

  it("rejects an explainer invocation with workflow tools before launching", async () => {
    const runner = createTestCodexRunner(path.resolve("missing-codex-executable"));
    await expect(runner.run(
      {
        project: testProject(),
        purpose: "explainer",
        agent: "idea",
        kind: "worker",
        permission: "workspace",
        invocationId: "inv_rejected_explainer",
        inboxPath: path.resolve("missing-inbox.md"),
        projectPath: path.resolve(testProject().id),
        workspacePath: path.resolve(testProject().id, "workspace"),
        runtimePath: path.resolve("missing-runtime"),
        schemaPath: path.resolve("missing-schema.json"),
        skillPaths: [],
        availableSkillPaths: []
      },
      () => undefined,
      new AbortController().signal
    )).rejects.toBeInstanceOf(AgentRequestConfigurationError);
  });

  it("redacts secrets in JSON, environment, and authorization forms", () => {
    const redacted = redactTrace(
      [
        '{"access_token":"FAKESECRET123456789"}',
        '{"api_key": "another-secret-value"}',
        "OPENAI_API_KEY=environment-secret-value",
        "Authorization: Bearer abcdefghijklmnopqrstuvwxyz"
      ].join("\n")
    );
    expect(redacted).not.toContain("FAKESECRET");
    expect(redacted).not.toContain("another-secret");
    expect(redacted).not.toContain("environment-secret");
    expect(redacted).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(redacted.match(/\[REDACTED\]/g)?.length).toBeGreaterThanOrEqual(4);

    const nested = redactTrace(
      JSON.stringify({
        item: {
          text: JSON.stringify({
            access_token: "NESTED-ACCESS-TOKEN",
            password: "FAKE,SECRET;TAIL",
            client_secret: 123456789
          })
        }
      })
    );
    expect(() => JSON.parse(nested)).not.toThrow();
    expect(nested).not.toContain("NESTED-ACCESS");
    expect(nested).not.toContain("SECRET;TAIL");
    expect(nested).not.toContain("123456789");

    const variants = redactTrace([
      "OpenAI-API-Key=key-value-that-must-go",
      "CLIENT_SECRET: client-secret-that-must-go",
      "Proxy_Authorization=Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==",
      "Bearer bearer-value-that-must-go",
      "ghp_1234567890abcdefghij",
      "github_pat_1234567890abcdefghij",
      "sk-1234567890abcdefghijklmnop",
      "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
      "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "unlabelled AWS access id AKIAIOSFODNN7EXAMPLE",
      "https://alice:swordfish@example.test/private.git",
      "-----BEGIN OPENSSH PRIVATE KEY-----\nPRIVATE-KEY-MATERIAL\n-----END OPENSSH PRIVATE KEY-----"
    ].join("\n"));
    for (const leaked of [
      "key-value-that-must-go",
      "client-secret-that-must-go",
      "YWxhZGRpbjpvcGVuIHNlc2FtZQ==",
      "bearer-value-that-must-go",
      "ghp_1234567890abcdefghij",
      "github_pat_1234567890abcdefghij",
      "sk-1234567890abcdefghijklmnop",
      "AKIAIOSFODNN7EXAMPLE",
      "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "alice:swordfish",
      "PRIVATE-KEY-MATERIAL"
    ]) {
      expect(variants).not.toContain(leaked);
    }
    expect(variants.match(/\[REDACTED(?: PRIVATE KEY)?\]/g)?.length)
      .toBeGreaterThanOrEqual(9);
    expect(containsCredentialMaterial(variants)).toBe(false);

    const structuredVariants = redactTrace(JSON.stringify({
      nested: {
        "API-Key": "STRUCTURED-API-KEY",
        refresh_token: "STRUCTURED-REFRESH-TOKEN",
        ClientSecret: "STRUCTURED-CLIENT-SECRET",
        private_key: "STRUCTURED-PRIVATE-KEY",
        AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
        AWS_SECRET_ACCESS_KEY: "AWS-STRUCTURED-SECRET"
      }
    }));
    expect(structuredVariants).not.toMatch(/STRUCTURED-(?:API|REFRESH|CLIENT|PRIVATE|SECRET)/);
    expect(structuredVariants).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("marks durable-thread usage separately from one-turn usage", () => {
    const event = {
      type: "turn.completed",
      usage: { input_tokens: 10, output_tokens: 5 }
    };
    expect(
      describeCodexEvent(event, {
        usageScope: "thread",
        threadId: "thread_durable"
      })
    ).toEqual({
      kind: "status",
      message: "Codex turn completed",
      data: {
        input_tokens: 10,
        output_tokens: 5,
        usageScope: "thread",
        threadId: "thread_durable"
      }
    });
    expect(
      describeCodexEvent(event, { usageScope: "turn" })
    ).toEqual({
      kind: "status",
      message: "Codex turn completed",
      data: {
        input_tokens: 10,
        output_tokens: 5,
        usageScope: "turn"
      }
    });
  });

  it("classifies a Codex 401 response as an authentication error", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-auth-error-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "auth-failing-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
fs.writeSync(2, "HTTP 401 Unauthorized: invalid API key\\n");
process.exit(1);
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const project = testProject();
    const projectPath = path.join(root, project.id);
    const workspacePath = path.join(projectPath, "workspace");
    const runtimePath = path.join(root, "runtime");
    const inboxPath = path.join(root, "inbox.md");
    const schemaPath = path.join(root, "schema.json");
    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(inboxPath, "# Inbox", "utf8");
    await fs.writeFile(schemaPath, "{}", "utf8");

    const runner = createTestCodexRunner(await fs.realpath(executable));
    await expect(
      runner.run(
        {
          project: testProject(),
          purpose: "probe",
          agent: "idea",
          kind: "worker",
          invocationId: "inv_auth_error",
          inboxPath,
          projectPath,
          workspacePath,
          runtimePath,
          schemaPath,
          skillPaths: [],
          availableSkillPaths: []
        },
        () => undefined,
        new AbortController().signal
      )
    ).rejects.toBeInstanceOf(AgentAuthenticationError);
  });

  it("classifies a stdout turn.failed upstream error as a provider error", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-api-error-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "api-failing-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
const message = JSON.stringify({
  error: {
    code: null,
    message: "Upstream request failed",
    param: "",
    type: "upstream_error"
  }
});
const events = [
  { type: "thread.started", thread_id: "thread_api_error" },
  { type: "turn.started" },
  { type: "error", message },
  { type: "turn.failed", error: { message } }
];
fs.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
process.exit(1);
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const project = testProject();
    const projectPath = path.join(root, project.id);
    const workspacePath = path.join(projectPath, "workspace");
    const runtimePath = path.join(root, "runtime");
    const inboxPath = path.join(root, "inbox.md");
    const schemaPath = path.join(root, "schema.json");
    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(inboxPath, "# Inbox", "utf8");
    await fs.writeFile(schemaPath, "{}", "utf8");

    const runner = createTestCodexRunner(await fs.realpath(executable));
    const error = await runner
      .run(
        {
          project: testProject(),
          agent: "idea",
          kind: "worker",
          invocationId: "inv_api_error",
          inboxPath,
          projectPath,
          workspacePath,
          runtimePath,
          schemaPath,
          skillPaths: [],
          availableSkillPaths: []
        },
        () => undefined,
        new AbortController().signal
      )
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AgentApiError);
    expect(error).not.toBeInstanceOf(AgentAuthenticationError);
    expect(error).toMatchObject({ kind: "provider" });
    expect((error as Error).message).toContain("Upstream request failed");
  });

  it("classifies a rejected structured-output schema as a non-retryable configuration error", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "scienceevolve-schema-error-")
    );
    temporaryRoots.push(root);
    const executable = path.join(root, "schema-failing-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fsSync from "node:fs";
const events = [
  {type:"thread.started",thread_id:"thread_schema_error"},
  {type:"turn.started"},
  {type:"error",error:{code:"invalid_json_schema",message:"Invalid schema for response_format 'codex_output_schema': Missing 'compilationAssessment'"}},
  {type:"turn.failed",error:{message:"invalid_json_schema"}}
];
fsSync.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
process.exit(1);
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const projectPath = path.join(root, testProject().id);
    const workspacePath = path.join(projectPath, "workspace");
    const runtimePath = path.join(root, "runtime");
    const inboxPath = path.join(root, "inbox.md");
    const schemaPath = path.join(root, "schema.json");
    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(inboxPath, "# Inbox", "utf8");
    await fs.writeFile(schemaPath, "{}", "utf8");

    const runner = createTestCodexRunner(await fs.realpath(executable));
    await expect(
      runner.run(
        {
          project: testProject(),
          agent: "review",
          kind: "worker",
          invocationId: "inv_schema_error",
          inboxPath,
          projectPath,
          workspacePath,
          runtimePath,
          schemaPath,
          skillPaths: [],
          availableSkillPaths: []
        },
        () => undefined,
        new AbortController().signal
      )
    ).rejects.toBeInstanceOf(AgentRequestConfigurationError);
  });

  it("uses structured JSONL, isolated skills, shell access, and a minimal environment", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-runner-"));
    temporaryRoots.push(root);
    const hostHome = path.join(root, "host-home");
    const codexHome = path.join(hostHome, ".codex");
    await fs.mkdir(codexHome, { recursive: true });
    await fs.writeFile(
      path.join(codexHome, "config.toml"),
      [
        'model = "must-remain-ignored"',
        'service_tier = "fast"',
        'model_provider = "moss"',
        "[model_providers.moss]",
        'name = "Moss"',
        'base_url = "https://provider.example/v1"',
        'wire_api = "responses"',
        'env_key = "MOSS_API_KEY"',
        'experimental_bearer_token = "host-inline-bearer-secret"',
        'http_headers = { Authorization = "Bearer host-inline-header-secret" }',
        'query_params = { api_key = "host-inline-query-secret" }',
        ""
      ].join("\n"),
      "utf8"
    );
    process.env.HOME = hostHome;
    delete process.env.CODEX_HOME;
    process.env.MOSS_API_KEY = "provider-token-visible-only-by-name";
    const executable = path.join(root, "fake-codex.mjs");
    const credentialCapturePath = path.join(root, "credential-environment.json");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
const args = process.argv.slice(2);
const prompt = fs.readFileSync(0, "utf8");
fs.writeFileSync(${JSON.stringify(credentialCapturePath)}, JSON.stringify({
  host: process.env.MOSS_API_KEY ?? null,
  route: process.env.SCIENCEEVOLVE_GATEWAY_API_KEY ?? null,
  openai: process.env.OPENAI_API_KEY ?? null,
  anthropicAuth: process.env.ANTHROPIC_AUTH_TOKEN ?? null,
  anthropicApi: process.env.ANTHROPIC_API_KEY ?? null,
}), {mode: 0o600});
const summary = JSON.stringify({
  args,
  secretVisible: Boolean(process.env.SCIENCEEVOLVE_TEST_SECRET),
  promptClosed: prompt.includes("inbox"),
  home: process.env.HOME,
  codexHome: process.env.CODEX_HOME,
  providerTokenVisible: Boolean(process.env.MOSS_API_KEY),
  fixedTokenVisible: Boolean(process.env.${FIXED_MCP_TOKEN_ENV_VAR}),
  invocationId: process.env.SCIENCEEVOLVE_INVOCATION_ID,
  inspireConfigPath: process.env.INSPIRE_GLOBAL_CONFIG_PATH ?? null,
  projectRoot: process.env.SCIENCEEVOLVE_PROJECT_ROOT,
  roleWorkspace: process.env.SCIENCEEVOLVE_ROLE_WORKSPACE,
});
const result = {
  summary,
  markdown: ${JSON.stringify(WORKER_MARKDOWN)},
  recommendation: "Continue through main."
};
const events = [
  {type:"thread.started",thread_id:"thread_fake"},
  {type:"turn.started"},
  {type:"item.completed",item:{type:"reasoning",text:JSON.stringify({access_token:"nested-runner-secret",detail:"x".repeat(25000)})}},
  {type:"item.completed",item:{id:"item_progress",type:"agent_message",text:JSON.stringify({summary:"正在核验实验输入。",markdown:${JSON.stringify(WORKER_MARKDOWN)},recommendation:""})}},
  {type:"item.started",item:{id:"item_tool",type:"command_execution",command:"npm test",status:"in_progress"}},
  {type:"item.completed",item:{id:"item_tool",type:"command_execution",command:"npm test",status:"completed"}},
  {type:"item.completed",item:{type:"agent_message",text:JSON.stringify(result)}},
  {type:"turn.completed",usage:{input_tokens:10,output_tokens:5}}
];
fs.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
await new Promise((resolve) => setTimeout(resolve, 20));
fs.writeSync(2, "api_key=runner-super-secret-token\\n");
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const projectPath = path.join(root, testProject().id);
    const workspace = path.join(projectPath, "workspace");
    const runtime = path.join(root, "runtime");
    await fs.mkdir(workspace, { recursive: true });
    const inbox = path.join(root, "inbox.md");
    const schema = path.join(root, "schema.json");
    const selectedSkill = path.join(root, "nature-writing", "SKILL.md");
    const supportSkill = path.join(root, "nature-shared", "SKILL.md");
    const ccfWriterSkill = path.join(root, "ccf-paper-writer", "SKILL.md");
    const ccfCommonSkill = path.join(root, "ccf-common", "SKILL.md");
    const disabledSkill = path.join(root, "disabled", "SKILL.md");
    await fs.mkdir(path.dirname(selectedSkill), { recursive: true });
    await fs.mkdir(path.dirname(supportSkill), { recursive: true });
    await fs.mkdir(path.dirname(ccfWriterSkill), { recursive: true });
    await fs.mkdir(path.dirname(ccfCommonSkill), { recursive: true });
    await fs.mkdir(path.dirname(disabledSkill), { recursive: true });
    await fs.writeFile(
      selectedSkill,
      "---\nname: nature-writing\ndescription: selected test skill\n---\n# Selected\n",
      "utf8"
    );
    await fs.writeFile(
      supportSkill,
      "---\nname: nature-shared\ndescription: support test skill\n---\n# Shared\n",
      "utf8"
    );
    await fs.writeFile(
      ccfWriterSkill,
      "---\nname: ccf-paper-writer\ndescription: CCFA writer\n---\n# Writer\n",
      "utf8"
    );
    await fs.writeFile(
      ccfCommonSkill,
      "---\nname: ccf-common\ndescription: CCFA support\n---\n# Common\n",
      "utf8"
    );
    await fs.writeFile(
      disabledSkill,
      "---\nname: disabled\ndescription: disabled test skill\n---\n# Disabled\n",
      "utf8"
    );
    await fs.writeFile(inbox, "# Inbox", "utf8");
    await fs.writeFile(schema, "{}", "utf8");
    process.env.SCIENCEEVOLVE_TEST_SECRET = "must-not-leak";
    process.env[FIXED_MCP_TOKEN_ENV_VAR] = "fixed-mcp-token-secret";

    const project = testProject();
    project.agents.idea.gatewaySnapshot = testGatewaySnapshot(
      "idea-invocation-route-token"
    );
    const invocationRoute = project.agents.idea.gatewaySnapshot!;
    invocationRoute.modelContextWindows = {
      [project.agents.idea.model]: 1_000_000
    };
    project.agents.writing.gatewaySnapshot = testGatewaySnapshot(
      "writing-invocation-route-token"
    );
    project.agents.idea.mcpServers = [
      { name: "research-docs", url: "https://docs.example.test/mcp" },
      { name: "文献工具", url: "http://127.0.0.1:4311/mcp" }
    ];
    const traces: string[] = [];
    const traceRecords: Array<{
      kind: string;
      message: string;
      data?: Record<string, unknown>;
    }> = [];
    const onModelActivity = vi.fn();
    const runner = createTestCodexRunner(await fs.realpath(executable), {
      inspireConfigPath: "/secure/inspire/config.toml",
      inspireNoProxy: ["qz.sii.edu.cn"],
      protocolProxyTimeoutMs: 1_200_000
    });
    const result = await runner.run(
      {
        project,
        agent: "idea",
        kind: "worker",
        invocationId: "inv_test",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: runtime,
        schemaPath: schema,
        skillPaths: [selectedSkill],
        autoSkillPaths: [disabledSkill],
        onModelActivity,
        availableSkillPaths: [
          selectedSkill,
          supportSkill,
          ccfWriterSkill,
          ccfCommonSkill,
          disabledSkill
        ]
      },
      (kind, message, data) => {
        traces.push(message);
        traceRecords.push({ kind, message, data });
      },
      new AbortController().signal
    );

    expect(result.threadId).toBe("thread_fake");
    const summaryPayload = JSON.parse(result.handoff!) as { summary: string };
    const summary = JSON.parse(summaryPayload.summary) as {
      args: string[];
      secretVisible: boolean;
      promptClosed: boolean;
      home: string;
      codexHome: string;
      providerTokenVisible: boolean;
      fixedTokenVisible: boolean;
      invocationId: string;
      inspireConfigPath: string | null;
      projectRoot: string;
      roleWorkspace: string;
    };
    expect(summary.secretVisible).toBe(false);
    expect(summary.promptClosed).toBe(true);
    expect(summary.home).toBe(path.join(runtime, "home"));
    expect(summary.codexHome).toBe(
      path.join(projectPath, "runtime", "harness-sessions", "idea", "codex")
    );
    // Provider traffic is forced through the invocation-local route. An
    // arbitrary credential named by host Codex config must not reach the CLI.
    expect(summary.providerTokenVisible).toBe(false);
    const providerCredentials = JSON.parse(
      await fs.readFile(credentialCapturePath, "utf8")
    ) as Record<string, string | null>;
    expect(providerCredentials).toEqual({
      host: null,
      route: invocationRoute.apiKey,
      openai: invocationRoute.apiKey,
      anthropicAuth: null,
      anthropicApi: null
    });
    expect((await fs.stat(credentialCapturePath)).mode & 0o777).toBe(0o600);
    expect(summary.fixedTokenVisible).toBe(false);
    expect(summary.invocationId).toBe("inv_test");
    expect(summary.inspireConfigPath).toBeNull();
    expect(summary.projectRoot).toBe(projectPath);
    expect(summary.roleWorkspace).toBe(workspace);
    expect(summary.args).toContain("--strict-config");
    expect(summary.args).toContain("--ephemeral");
    const goalsFlag = summary.args.indexOf("goals");
    expect(goalsFlag).toBe(-1);
    expect(summary.args).toContain("skip_host_skill_discovery");
    expect(summary.args).toContain("--ignore-user-config");
    expect(summary.args).toContain("--ignore-rules");
    expect(summary.args).not.toContain('windows.sandbox="elevated"');
    expect(summary.args.join(" ")).not.toContain("--disable multi_agent");
    expect(summary.args).toContain("skills.include_instructions=false");
    expect(summary.args).not.toContain(
      "--dangerously-bypass-approvals-and-sandbox"
    );
    expect(summary.args).not.toContain("shell_tool");
    expect(summary.args.slice(summary.args.indexOf("-s"), summary.args.indexOf("-s") + 2)).toEqual(["-s", "danger-full-access"]);
    expect(summary.args).toContain("--search");
    expect(summary.args.join(" ")).not.toContain("model_reasoning_effort");
    expect(summary.args).toContain('service_tier="fast"');
    const serializedArgs = summary.args.join(" ");
    expect(serializedArgs).toContain('model_provider="openfars_gateway"');
    expect(serializedArgs).toContain(
      "model_providers.openfars_gateway.stream_idle_timeout_ms=1230000"
    );
    expect(serializedArgs).toContain("model_context_window=1000000");
    expect(serializedArgs).toContain("model_auto_compact_token_limit=800000");
    expect(serializedArgs).toContain(
      'model_auto_compact_token_limit_scope="total"'
    );
    expect(serializedArgs).toContain(invocationRoute.url);
    expect(serializedArgs).not.toContain('model_provider="moss"');
    expect(serializedArgs).not.toContain("provider.example/v1");
    expect(serializedArgs).not.toContain("must-remain-ignored");
    expect(serializedArgs).not.toContain("provider-token-visible-only-by-name");
    expect(serializedArgs).not.toContain("host-inline-bearer-secret");
    expect(serializedArgs).not.toContain("host-inline-header-secret");
    expect(serializedArgs).not.toContain("host-inline-query-secret");
    expect(serializedArgs).not.toContain(invocationRoute.apiKey);
    expect(summary.args.slice(summary.args.indexOf("-m"), summary.args.indexOf("-m") + 2)).toEqual([
      "-m",
      "nex-agi/Nex-N2-Pro"
    ]);
    expect(summary.args.join(" ")).toContain(
      `path = "${selectedSkill}", enabled = false`
    );
    expect(summary.args.join(" ")).toContain(
      `path = "${disabledSkill}", enabled = false`
    );
    expect(summary.args.join(" ")).toContain(
      `path = "${supportSkill}", enabled = false`
    );
    expect(summary.args.join(" ")).toContain(
      `path = "${path.join(workspace, ".scienceevolve", "agent-skills", "idea", "skills", "nature-writing", "SKILL.md")}", enabled = true`
    );
    expect(summary.args.join(" ")).not.toContain(
      `path = "${path.join(workspace, ".scienceevolve", "agent-skills", "idea", "skills", "nature-shared", "SKILL.md")}", enabled = true`
    );
    expect(summary.args.join(" ")).toContain(
      `path = "${path.join(workspace, ".scienceevolve", "agent-skills", "idea", "skills", "disabled", "SKILL.md")}", enabled = true`
    );
    const mcpConfig = summary.args.find((arg) => arg.startsWith("mcp_servers="));
    expect(mcpConfig).toContain(
      '"research-docs" = { url = "https://docs.example.test/mcp", default_tools_approval_mode = "approve" }'
    );
    expect(mcpConfig).toContain(
      '"文献工具" = { url = "http://127.0.0.1:4311/mcp", default_tools_approval_mode = "approve" }'
    );
    expect(mcpConfig).toContain('"scienceevolve-workspace"');
    expect(mcpConfig).toContain('"scienceevolve-sleep"');
    const servers = parseToml(mcpConfig!).mcp_servers as Record<string, { command?: string; env?: Record<string, string> }>;
    expect(servers["scienceevolve-sleep"]).toMatchObject({ tool_timeout_sec: 43260 });
    for (const row of Object.values(servers)) if (row.command) expect(row.env?.[NATIVE_PROCESS_SUPPORT_ENV]).toBe("1");
    expect(mcpConfig).toContain('"openfars-web"');
    expect(mcpConfig).toContain("/web-mcp");
    expect(mcpConfig).toContain('bearer_token_env_var = "SCIENCEEVOLVE_GATEWAY_API_KEY"');
    expect(mcpConfig).not.toContain("SCIENCEEVOLVE_CONTROL_REQUEST_PATH");
    expect(mcpConfig).toContain('"SCIENCEEVOLVE_PROJECT_ID"');
    expect(mcpConfig).toContain('"SCIENCEEVOLVE_INVOCATION_ID"');
    expect(mcpConfig).toContain('"SCIENCEEVOLVE_APPEND_ROOT"');
    expect(mcpConfig).toContain('"SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST"');
    expect(mcpConfig).toContain(path.join(runtime, "published-artifacts.json"));
    expect(mcpConfig).toContain(workspace);
    expect(mcpConfig).not.toContain("SCIENCEEVOLVE_MEMORY_PATH");
    expect(
      await fs.readFile(
        path.join(
          workspace,
          ".scienceevolve",
          "agent-skills",
          "idea",
          "skills",
          "nature-writing",
          "SKILL.md"
        ),
        "utf8"
      )
    ).toContain("selected test skill");
    await expect(fs.access(path.join(workspace, ".scienceevolve", "agent-skills", "idea", "skills", "nature-shared", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(traces).toContain("Codex turn completed");
    expect(traces).toContain("正在核验实验输入。");
    expect(onModelActivity).toHaveBeenCalledTimes(5);
    expect(onModelActivity.mock.calls.map(([activity]) => activity)).toEqual([
      expect.objectContaining({ kind: "model", phase: "completed", source: "harness" }),
      expect.objectContaining({ kind: "model", phase: "completed", source: "harness" }),
      expect.objectContaining({ kind: "tool", phase: "started", callId: "item_tool" }),
      expect.objectContaining({ kind: "tool", phase: "completed", callId: "item_tool" }),
      expect.objectContaining({ kind: "model", phase: "completed", source: "harness" })
    ]);
    expect(traceRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "tool",
          message: "npm test · completed",
          data: expect.objectContaining({
            itemId: "item_tool",
            itemType: "command_execution",
            command: "npm test",
            status: "completed"
          })
        })
      ])
    );
    const rawTrace = await fs.readFile(
      path.join(runtime, "codex-events.jsonl"),
      "utf8"
    );
    expect(rawTrace).toContain("turn.completed");
    expect(rawTrace).not.toContain("x".repeat(25_000));
    expect(rawTrace).toContain('"type":"reasoning","redacted":true');
    expect(rawTrace).not.toContain("nested-runner-secret");
    expect(rawTrace).not.toContain("host-inline-bearer-secret");
    expect(rawTrace).not.toContain("host-inline-header-secret");
    expect(rawTrace).not.toContain("host-inline-query-secret");
    expect(rawTrace).not.toContain(invocationRoute.apiKey);
    expect(JSON.stringify(traceRecords)).not.toContain(
      "host-inline-bearer-secret"
    );
    expect(JSON.stringify(traceRecords)).not.toContain(invocationRoute.apiKey);
    for (const line of rawTrace.trim().split("\n")) {
      expect(() => JSON.parse(line)).not.toThrow();
    }

    await runner.run(
      {
        project,
        agent: "idea",
        kind: "worker",
        invocationId: "inv_test_without_skills",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-without-skills"),
        schemaPath: schema,
        skillPaths: [],
        autoSkillPaths: [],
        availableSkillPaths: [
          selectedSkill,
          supportSkill,
          ccfWriterSkill,
          ccfCommonSkill,
          disabledSkill
        ]
      },
      () => undefined,
      new AbortController().signal
    );
    for (const directoryName of [
      "nature-writing",
      "nature-shared",
      "ccf-paper-writer",
      "ccf-common",
      "disabled"
    ]) {
      await expect(
        fs.access(path.join(
          workspace,
          ".scienceevolve",
          "agent-skills",
          "idea",
          "skills",
          directoryName
        ))
      ).rejects.toMatchObject({ code: "ENOENT" });
    }
    const stderr = await fs.readFile(path.join(runtime, "stderr.log"), "utf8");
    expect(stderr).toContain("api_key=[REDACTED]");
    expect(stderr).not.toContain("runner-super-secret-token");
    expect(stderr).not.toContain("host-inline-bearer-secret");
    expect(stderr).not.toContain("host-inline-header-secret");
    expect(stderr).not.toContain("host-inline-query-secret");
    expect(stderr).not.toContain(invocationRoute.apiKey);

    const fixedProject = structuredClone(project);
    fixedProject.agents.idea.mcpServers = [
      { name: "ai4fusion-mcp", url: `${FIXED_MCP_BASE_URL}/ai4fusion-mcp` }
    ];
    const fixedResult = await runner.run(
      {
        project: fixedProject,
        agent: "idea",
        kind: "worker",
        invocationId: "inv_test_fixed_mcp",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-fixed-mcp"),
        schemaPath: schema,
        skillPaths: [],
        autoSkillPaths: [],
        availableSkillPaths: []
      },
      () => undefined,
      new AbortController().signal
    );
    const fixedSummary = JSON.parse(
      (JSON.parse(fixedResult.handoff!) as { summary: string }).summary
    ) as { fixedTokenVisible: boolean };
    expect(fixedSummary.fixedTokenVisible).toBe(true);

    const computeProject = structuredClone(project);
    computeProject.agents.idea.permission = "compute";
    const computeResult = await runner.run(
      {
        project: computeProject,
        agent: "idea",
        kind: "worker",
        invocationId: "inv_test_compute_without_fixed_mcp",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-compute-without-fixed-mcp"),
        schemaPath: schema,
        skillPaths: [],
        autoSkillPaths: [],
        availableSkillPaths: []
      },
      () => undefined,
      new AbortController().signal
    );
    const computeSummary = JSON.parse(
      (JSON.parse(computeResult.handoff!) as { summary: string }).summary
    ) as { fixedTokenVisible: boolean };
    expect(computeSummary.fixedTokenVisible).toBe(false);
    await expect(
      fs.access(path.join(runtime, "harness-process.json"))
    ).rejects.toMatchObject({ code: "ENOENT" });

    await runner.run(
      {
        project,
        agent: "writing",
        kind: "worker",
        invocationId: "inv_test_ccfa_dependency",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-ccfa-dependency"),
        schemaPath: schema,
        skillPaths: [ccfWriterSkill],
        autoSkillPaths: [],
        availableSkillPaths: [ccfWriterSkill, ccfCommonSkill]
      },
      () => undefined,
      new AbortController().signal
    );
    expect(
      await fs.readFile(
        path.join(
          workspace,
          ".scienceevolve",
          "agent-skills",
          "writing",
          "skills",
          "ccf-paper-writer",
          "SKILL.md"
        ),
        "utf8"
      )
    ).toContain("CCFA writer");
    await expect(fs.access(path.join(workspace, ".scienceevolve", "agent-skills", "writing", "skills", "ccf-common", "SKILL.md"))).rejects.toMatchObject({ code: "ENOENT" });

    await fs.writeFile(
      selectedSkill,
      "---\nname: nature-writing\ndescription: refreshed shared-workspace skill\n---\n# Selected\n",
      "utf8"
    );
    await fs.writeFile(
      path.join(codexHome, "config.toml"),
      [
        'model_provider = "updated"',
        "[model_providers.updated]",
        'name = "Updated"',
        'base_url = "https://updated-provider.example/v1"',
        'wire_api = "responses"',
        ""
      ].join("\n"),
      "utf8"
    );
    const secondRuntime = path.join(root, "runtime-second-session");
    const secondResult = await runner.run(
      {
        project,
        agent: "idea",
        kind: "worker",
        invocationId: "inv_test_second_session",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: secondRuntime,
        schemaPath: schema,
        skillPaths: [selectedSkill],
        availableSkillPaths: [
          selectedSkill,
          supportSkill,
          ccfWriterSkill,
          ccfCommonSkill,
          disabledSkill
        ]
      },
      () => undefined,
      new AbortController().signal
    );
    expect(secondResult.threadId).toBe("thread_fake");
    const secondSummary = JSON.parse(
      (JSON.parse(secondResult.handoff!) as { summary: string }).summary
    ) as { args: string[] };
    expect(secondSummary.args.join(" ")).toContain(
      'model_provider="openfars_gateway"'
    );
    expect(secondSummary.args.join(" ")).toContain(invocationRoute.url);
    expect(secondSummary.args.join(" ")).not.toContain(
      'model_provider="updated"'
    );
    expect(secondSummary.args.join(" ")).not.toContain(
      "updated-provider.example/v1"
    );
    expect(
      await fs.readFile(
        path.join(
          workspace,
          ".scienceevolve",
          "agent-skills",
          "idea",
          "skills",
          "nature-writing",
          "SKILL.md"
        ),
        "utf8"
      )
    ).toContain("refreshed shared-workspace skill");
  }, 15_000);

  it("creates one durable public Main thread and resumes it on later invocations", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "scienceevolve-main-session-")
    );
    temporaryRoots.push(root);
    process.env.HOME = path.join(root, "host-home");
    delete process.env.CODEX_HOME;
    await fs.mkdir(path.join(process.env.HOME, ".codex"), {
      recursive: true
    });

    const executable = path.join(root, "fake-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
const args = process.argv.slice(2);
for await (const _chunk of process.stdin) {}
const result = {
  assessment: JSON.stringify({args}),
  nextAgent: "execution",
  message: "Run the next evidence-producing experiment.",
  rationale: "The project still needs experimental evidence.",
  successCriteria: ["Record a reproducible result."],
  display: null
};
const events = [
  {type:"thread.started",thread_id:"thread_project_main"},
  {type:"turn.started"},
  {type:"item.completed",item:{type:"agent_message",text:JSON.stringify(result)}},
  {type:"turn.completed",usage:{input_tokens:10,output_tokens:5}}
];
fs.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
await new Promise((resolve) => setTimeout(resolve, 20));
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);

    const project = testProject();
    project.agents[SYSTEM_CONTROLLER_AGENT].webSearch = true;
    project.agents[SYSTEM_CONTROLLER_AGENT].gatewaySnapshot = testGatewaySnapshot(
      "main-invocation-route-token"
    );
    const projectPath = path.join(root, project.id);
    const workspace = path.join(
      projectPath,
      "workspaces",
      SYSTEM_CONTROLLER_AGENT,
      "shared"
    );
    const inbox = path.join(root, "inbox.md");
    const schema = path.join(root, "schema.json");
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(inbox, "# Main inbox", "utf8");
    await fs.writeFile(schema, "{}", "utf8");

    const runner = createTestCodexRunner(await fs.realpath(executable));
    const startedThreads: string[] = [];
    const first = await runner.run(
      {
        project,
        agent: SYSTEM_CONTROLLER_AGENT,
        kind: "main",
        permission: "yolo",
        invocationId: "inv_main_first",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-first"),
        schemaPath: schema,
        skillPaths: [],
        availableSkillPaths: [],
        onThreadStarted: (threadId) => {
          startedThreads.push(threadId);
        }
      },
      () => undefined,
      new AbortController().signal
    );
    expect(first.threadId).toBe("thread_project_main");
    const firstArgs = JSON.parse(JSON.parse(first.handoff!).assessment).args as string[];
    expect(firstArgs).not.toContain("--ephemeral");
    expect(firstArgs).not.toContain("goals");
    expect(firstArgs).not.toContain("shell_tool");
    expect(firstArgs).toContain("--search");
    expect(firstArgs.find((arg) => arg.startsWith("mcp_servers="))).toContain('"openfars-web"');
    expect(firstArgs).not.toContain('windows.sandbox="elevated"');
    expect(firstArgs[firstArgs.indexOf("exec") + 1]).toBe(
      "--ignore-user-config"
    );

    const second = await runner.run(
      {
        project,
        agent: SYSTEM_CONTROLLER_AGENT,
        kind: "main",
        permission: "yolo",
        invocationId: "inv_main_second",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: path.join(root, "runtime-second"),
        schemaPath: schema,
        skillPaths: [],
        availableSkillPaths: [],
        resumeThreadId: first.threadId,
        onThreadStarted: (threadId) => {
          startedThreads.push(threadId);
        }
      },
      () => undefined,
      new AbortController().signal
    );
    const secondArgs = JSON.parse(JSON.parse(second.handoff!).assessment).args as string[];
    expect(secondArgs.slice(secondArgs.indexOf("exec"), secondArgs.indexOf("exec") + 2)).toEqual([
      "exec",
      "resume"
    ]);
    expect(secondArgs).toContain("thread_project_main");
    expect(secondArgs).not.toContain("--ephemeral");
    expect(secondArgs).not.toContain("goals");
    expect(secondArgs).not.toContain("--color");
    expect(startedThreads).toEqual([
      "thread_project_main",
      "thread_project_main"
    ]);
  }, 15_000);

  it("gives compute Agents host settings, project paths, and Inspire access", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-inspire-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "fake-codex.mjs");
    const inspireExecutable = path.join(root, "fake-inspire.sh");
    const hostHome = path.join(root, "host-home");
    const codexHome = path.join(hostHome, ".codex");
    await fs.mkdir(codexHome, { recursive: true });
    await fs.writeFile(
      path.join(codexHome, "config.toml"),
      [
        'model_provider = "execution-provider"',
        "[model_providers.execution-provider]",
        'name = "Execution Provider"',
        'base_url = "https://execution-provider.example/v1"',
        'wire_api = "responses"',
        ""
      ].join("\n"),
      "utf8"
    );
    const inspireAccountStore = path.join(hostHome, ".inspire");
    const activeAccount = "test-active";
    const activeAccountDirectory = path.join(
      inspireAccountStore,
      "accounts",
      activeAccount
    );
    await fs.mkdir(path.join(activeAccountDirectory, "connections"), {
      recursive: true
    });
    await fs.writeFile(
      path.join(activeAccountDirectory, "config.toml"),
      'username = "test-user"\npassword = "test-password"\n',
      { encoding: "utf8", mode: 0o640 }
    );
    await fs.writeFile(
      path.join(activeAccountDirectory, "web_session.json"),
      '{"session":"test-session"}\n',
      { encoding: "utf8", mode: 0o644 }
    );
    await fs.writeFile(
      path.join(activeAccountDirectory, "connections", "cache.json"),
      "{}\n",
      { encoding: "utf8", mode: 0o644 }
    );
    await fs.writeFile(
      path.join(inspireAccountStore, "current"),
      `${activeAccount}\n`,
      "utf8"
    );
    const ghConfig = path.join(hostHome, ".config", "gh", "hosts.yml");
    await fs.mkdir(path.dirname(ghConfig), { recursive: true });
    await fs.writeFile(ghConfig, "github.example: configured\n", "utf8");
    await fs.writeFile(
      inspireExecutable,
      `#!/bin/sh
if [ "$1" = "job" ] && [ "$2" = "batch" ]; then
  echo "Using compute group: 开发区-H200-cuda12.8版本 (1xNVIDIA H200)"
  echo "OK Job created: batch-ledger-one"
  echo "Quota: 1,20,200"
  echo "Check status with: inspire job status batch-ledger-one --workspace 分布式训练空间"
  echo "Using compute group: 开发区-H200-cuda12.8版本 (1xNVIDIA H200)"
  echo "OK Job created: batch-ledger-two"
  echo "Quota: 1,20,200"
  echo "Check status with: inspire job status batch-ledger-two --workspace 分布式训练空间"
  exit 0
fi
if [ -n "$HTTP_PROXY$HTTPS_PROXY$ALL_PROXY$http_proxy$https_proxy$all_proxy" ]; then
  echo proxy-present
else
  echo proxy-cleared
fi
`,
      "utf8"
    );
    await fs.chmod(inspireExecutable, 0o700);
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeSync } from "node:fs";
import path from "node:path";
for await (const _chunk of process.stdin) {}
const inspireHome = path.join(process.env.HOME, ".inspire");
const currentPath = path.join(inspireHome, "current");
const accountAlias = existsSync(currentPath) ? readFileSync(currentPath, "utf8").trim() : null;
const accountDirectory = accountAlias ? path.join(inspireHome, "accounts", accountAlias) : null;
const accountConfig = accountDirectory ? path.join(accountDirectory, "config.toml") : null;
const accountVisible = Boolean(accountConfig && existsSync(accountConfig));
const sessionVisible = Boolean(accountDirectory && existsSync(path.join(accountDirectory, "web_session.json")));
const nestedCacheVisible = Boolean(accountDirectory && existsSync(path.join(accountDirectory, "connections", "cache.json")));
const proxyEnvironment = Object.fromEntries(
  ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]
    .map((name) => [name, "http://proxy.invalid:9999"])
);
const inspireProbe = spawnSync("inspire", [], {
  encoding: "utf8",
  env: { ...process.env, ...proxyEnvironment }
});
const qbPathProbe = spawnSync("inspire", ["job", "create", "--name", "project-ledger-probe", "--workspace", "分布式训练空间", "--group", "H100", "--quota", "2,20,200", "--nodes", "2", "--command", "cd /inspire/qb-ilm/project/example"], {encoding:"utf8"});
spawnSync("inspire", ["job", "batch", "matrix.json"], {encoding:"utf8"});
const hddPathProbe = spawnSync("inspire", ["job", "create", "--command", "cd /inspire/hdd/project/example"], {encoding:"utf8"});
const result = {
  summary: JSON.stringify({
    args: process.argv.slice(2),
    home: process.env.HOME,
    localSetting: process.env.SCIENCEEVOLVE_EXECUTION_LOCAL_SETTING ?? null,
    ghConfigVisible: existsSync(path.join(process.env.HOME, ".config", "gh", "hosts.yml")),
    inspireConfigPath: process.env.INSPIRE_GLOBAL_CONFIG_PATH ?? null,
    inspireWorkspaceRoot: process.env.SCIENCEEVOLVE_INSPIRE_WORKSPACE_ROOT ?? null,
    projectRoot: process.env.SCIENCEEVOLVE_PROJECT_ROOT ?? null,
    roleWorkspace: process.env.SCIENCEEVOLVE_ROLE_WORKSPACE ?? null,
    natureFigureConfigPath: process.env.NATURE_FIGURE_CONFIG ?? null,
    natureFigureConfig: process.env.NATURE_FIGURE_CONFIG && existsSync(process.env.NATURE_FIGURE_CONFIG)
      ? JSON.parse(readFileSync(process.env.NATURE_FIGURE_CONFIG, "utf8"))
      : null,
    matplotlibBackend: process.env.MPLBACKEND ?? null,
    noProxy: process.env.NO_PROXY ?? null,
    lowercaseNoProxy: process.env.no_proxy ?? null,
    accountVisible,
    sessionVisible,
    nestedCacheVisible,
    accountFileMode: accountConfig ? statSync(accountConfig).mode & 0o777 : null,
    inspireProbe: inspireProbe.stdout?.trim?.() ?? "",
    qbPathStatus: qbPathProbe.status,
    hddPathStatus: hddPathProbe.status,
    hddPathError: hddPathProbe.stderr?.trim?.() ?? ""
  }),
  markdown: ${JSON.stringify(EXECUTION_MARKDOWN)},
  recommendation: "Continue through main."
};
const events = [
  {type:"thread.started",thread_id:"thread_inspire"},
  {type:"turn.started"},
  {type:"item.completed",item:{type:"agent_message",text:JSON.stringify(result)}},
  {type:"turn.completed",usage:{input_tokens:1,output_tokens:1}}
];
writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
await new Promise((resolve) => setTimeout(resolve, 20));
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const projectPath = path.join(root, testProject().id);
    const workspace = path.join(projectPath, "workspace");
    const runtime = path.join(root, "runtime");
    const inbox = path.join(root, "inbox.md");
    const schema = path.join(root, "schema.json");
    const natureFigureSkill = path.join(
      root,
      "nature-figure",
      "SKILL.md"
    );
    await fs.mkdir(workspace, { recursive: true });
    await fs.mkdir(path.dirname(natureFigureSkill), { recursive: true });
    await fs.writeFile(
      natureFigureSkill,
      "---\nname: nature-figure\ndescription: figure test skill\n---\n# Figure\n",
      "utf8"
    );
    await fs.writeFile(inbox, "# Inbox", "utf8");
    await fs.writeFile(schema, "{}", "utf8");
    process.env.HOME = hostHome;
    delete process.env.CODEX_HOME;
    process.env.HTTP_PROXY = "http://proxy.invalid:9999";
    process.env.SCIENCEEVOLVE_EXECUTION_LOCAL_SETTING = "visible-to-execution";

    const inspireConfigPath = "/secure/inspire/config.toml";
    const traces: Array<{
      kind: string;
      message: string;
      data?: Record<string, unknown>;
    }> = [];
    const computeOptions = {
      inspireBin: inspireExecutable,
      inspireConfigPath,
      inspireNoProxy: ["qz.sii.edu.cn"],
      inspireWorkspaceRoot: root
    };
    // Production staging is owned by HarnessRuntimeFacade. This direct
    // CodexRunner compatibility test prepares the same shared runtime first.
    await prepareComputeRuntime({
      permission: "compute",
      workspacePath: workspace,
      runtimePath: runtime
    }, computeOptions);
    const runner = createTestCodexRunner(await fs.realpath(executable), computeOptions);
    const executionProject = testProject();
    executionProject.agents.execution.gatewaySnapshot = testGatewaySnapshot(
      "execution-invocation-route-token"
    );
    const result = await runner.run(
      {
        project: executionProject,
        agent: "execution",
        kind: "worker",
        permission: "compute",
        invocationId: "inv_inspire_test",
        inboxPath: inbox,
        projectPath,
        workspacePath: workspace,
        runtimePath: runtime,
        schemaPath: schema,
        skillPaths: [natureFigureSkill],
        availableSkillPaths: [natureFigureSkill]
      },
      (kind, message, data) => {
        traces.push({ kind, message, data });
      },
      new AbortController().signal
    );

    const summary = JSON.parse(JSON.parse(result.handoff!).summary) as {
      args: string[];
      home: string;
      localSetting: string | null;
      ghConfigVisible: boolean;
      inspireConfigPath: string | null;
      inspireWorkspaceRoot: string | null;
      projectRoot: string | null;
      roleWorkspace: string | null;
      natureFigureConfigPath: string | null;
      natureFigureConfig: { backend: string } | null;
      matplotlibBackend: string | null;
      noProxy: string | null;
      lowercaseNoProxy: string | null;
      accountVisible: boolean;
      sessionVisible: boolean;
      nestedCacheVisible: boolean;
      accountFileMode: number | null;
      inspireProbe: string;
      qbPathStatus: number | null;
      hddPathStatus: number | null;
      hddPathError: string;
    };
    expect(summary.home).toBe(hostHome);
    const mcpConfig = summary.args.find((arg) => arg.startsWith("mcp_servers="));
    expect(mcpConfig).toContain('"scienceevolve-workspace"');
    expect(mcpConfig).toContain('"SCIENCEEVOLVE_AGENT_NAME" = "execution"');
    expect(summary.localSetting).toBeNull();
    expect(summary.ghConfigVisible).toBe(true);
    expect(summary.inspireConfigPath).toBe(inspireConfigPath);
    expect(summary.args).not.toContain(
      "--dangerously-bypass-approvals-and-sandbox"
    );
    expect(summary.args.join(" ")).toContain(
      'model_provider="openfars_gateway"'
    );
    expect(summary.args.join(" ")).toContain(
      executionProject.agents.execution.gatewaySnapshot!.url
    );
    expect(summary.args.join(" ")).not.toContain(
      'model_provider="execution-provider"'
    );
    expect(summary.args.join(" ")).not.toContain(
      "execution-provider.example/v1"
    );
    expect(summary.args.join(" ")).not.toContain(
      executionProject.agents.execution.gatewaySnapshot!.apiKey
    );
    expect(summary.args.slice(summary.args.indexOf("-s"), summary.args.indexOf("-s") + 2)).toEqual([
      "-s",
      "danger-full-access"
    ]);
    expect(summary.args.slice(summary.args.indexOf("-a"), summary.args.indexOf("-a") + 2)).toEqual([
      "-a",
      "never"
    ]);
    expect(summary.args).toContain(
      "sandbox_workspace_write.network_access=true"
    );
    expect(summary.args).not.toContain("shell_tool");
    expect(summary.args).toContain("--search");
    expect(summary.inspireWorkspaceRoot).toBe(root);
    expect(summary.projectRoot).toBe(projectPath);
    expect(summary.roleWorkspace).toBe(workspace);
    const expectedNatureFigureConfig = path.join(
      workspace,
      ".scienceevolve",
      "nature-figure.json"
    );
    expect(summary.natureFigureConfigPath).toBe(expectedNatureFigureConfig);
    expect(summary.natureFigureConfig).toEqual({ backend: "python" });
    expect(summary.matplotlibBackend).toBe("Agg");
    expect(summary.noProxy?.split(",")).toContain("qz.sii.edu.cn");
    expect(summary.lowercaseNoProxy?.split(",")).toContain("qz.sii.edu.cn");
    expect(summary.accountVisible).toBe(true);
    expect(summary.sessionVisible).toBe(true);
    expect(summary.nestedCacheVisible).toBe(true);
    expect(summary.accountFileMode).toBe(0o640);
    expect(summary.inspireProbe).toBe("proxy-cleared");
    const inspireWrapper = await fs.readFile(
      path.join(runtime, "bin", "inspire"),
      "utf8"
    );
    expect(inspireWrapper).toContain(
      "unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY"
    );
    expect(inspireWrapper).not.toContain("INSPIRE_REQUESTS_HTTP_PROXY");
    expect(summary.qbPathStatus).toBe(0);
    expect(summary.hddPathStatus).toBe(64);
    expect(summary.hddPathError).toContain(
      "blocked Inspire access to /inspire/hdd"
    );
    const workloadLedger = (
      await fs.readFile(
        path.join(projectPath, "runtime", "inspire-workloads.jsonl"),
        "utf8"
      )
    )
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(workloadLedger).toEqual([
      expect.objectContaining({
        projectId: executionProject.id,
        invocationId: "inv_inspire_test",
        kind: "job",
        name: "project-ledger-probe",
        workspace: "分布式训练空间",
        requestedGpuCount: 4,
        requestedAcceleratorType: "H100",
        source: "wrapper"
      }),
      expect.objectContaining({
        name: "batch-ledger-one",
        workspace: "分布式训练空间",
        requestedGpuCount: 1,
        requestedAcceleratorType: "H200",
        source: "wrapper"
      }),
      expect.objectContaining({
        name: "batch-ledger-two",
        workspace: "分布式训练空间",
        requestedGpuCount: 1,
        requestedAcceleratorType: "H200",
        source: "wrapper"
      })
    ]);
    expect((await fs.stat(expectedNatureFigureConfig)).mode & 0o777).toBe(0o600);
    await expect(
      fs.access(
        path.join(
          hostHome,
          ".config",
          "nature-skills",
          "nature-figure.json"
        )
      )
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      fs.access(
        path.join(
          workspace,
          ".scienceevolve",
          "agent-skills",
          "execution",
          "skills",
          "nature-figure",
          "SKILL.md"
        )
      )
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(runtime, "home"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      fs.access(path.join(activeAccountDirectory, "invocation-write.tmp"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    expect(traces).toContainEqual({
      kind: "status",
      message:
        "Execution inherited the service user's HOME and may access the current project root",
      data: {
        home: hostHome,
        isolatedHome: false,
        inheritedEnvironment: true,
        authorizedProjectRoot: projectPath,
        roleWorkspace: workspace
      }
    });
  });

  it("finds and terminates an orphaned detached invocation before recovery", async () => {
    if (process.platform === "win32") return;
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orphan-"));
    temporaryRoots.push(root);
    process.env.HOME = path.join(root, "host-home");
    delete process.env.CODEX_HOME;
    const executable = path.join(root, "hanging-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
for await (const _chunk of process.stdin) {}
console.error("orphan-ready");
setInterval(() => {}, 1000);
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const project = testProject();
    const projectPath = path.join(root, project.id);
    const workspace = path.join(projectPath, "workspace");
    const runtime = path.join(root, "runtime");
    const inbox = path.join(root, "inbox.md");
    const schema = path.join(root, "schema.json");
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(inbox, "# Inbox", "utf8");
    await fs.writeFile(schema, "{}", "utf8");

    const signal = new AbortController().signal;
    const commonHost = new CommonProcessHost();
    const invocationSession: SessionRef = {
      schemaVersion: 1,
      harnessId: "codex",
      adapterVersion: "1",
      generation: project.agentSessionMeta?.idea?.generation ?? 0,
      nativeId: "inv_orphan_test",
      durable: project.agents.idea.sessionPersistence,
      createdAt: "2026-09-16T00:00:00.000Z"
    };
    const runner = new CodexRunner(
      await fs.realpath(executable),
      { harnessId: "codex" },
      commonHost.forInvocation({
        invocationId: "inv_orphan_test",
        harnessId: "codex",
        runtimePath: runtime,
        workspacePath: workspace,
        signal,
        recoveryBudget: new InvocationRecoveryController(),
        session: () => invocationSession,
        hostHome: process.env.HOME || os.homedir(),
        authorityEnvironment: {
          SCIENCEEVOLVE_PROJECT_ID: project.id,
          SCIENCEEVOLVE_INVOCATION_ID: "inv_orphan_test",
          SCIENCEEVOLVE_AGENT_NAME: "idea",
          SCIENCEEVOLVE_AGENT_KIND: "worker",
          SCIENCEEVOLVE_AGENT_PERMISSION: "workspace",
          SCIENCEEVOLVE_AGENT_HARNESS: "codex",
          SCIENCEEVOLVE_AGENT_PROTOCOL: "responses",
          SCIENCEEVOLVE_PROJECT_ROOT: projectPath,
          SCIENCEEVOLVE_ROLE_WORKSPACE: workspace,
          SCIENCEEVOLVE_APPEND_ROOT: workspace
        }
      }),
      invocationSession
    );
    const outcome = runner
      .run(
        {
          project,
          agent: "idea",
          kind: "worker",
          permission: "workspace",
          invocationId: "inv_orphan_test",
          inboxPath: inbox,
          projectPath,
          workspacePath: workspace,
          runtimePath: runtime,
          schemaPath: schema,
          skillPaths: [],
          availableSkillPaths: []
        },
        () => undefined,
        signal
      )
      .then(
        () => undefined,
        (error: unknown) => error
      );

    const markerPath = path.join(runtime, "harness-process.json");
    await waitForFile(markerPath);
    const runningMarker = JSON.parse(
      await fs.readFile(markerPath, "utf8")
    ) as { pid: number };
    await commonHost.cleanupInterrupted("inv_orphan_test", runtime);
    expect(await outcome).toBeInstanceOf(Error);
    expect(() => process.kill(runningMarker.pid, 0)).toThrow();
    await expect(
      fs.access(markerPath)
    ).rejects.toMatchObject({ code: "ENOENT" });
  }, 15_000);

  it("returns natural-language handoff and reads staged orchestration actions without an output schema", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-natural-runner-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "natural-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
const context = JSON.parse(process.env.SCIENCEEVOLVE_CONTROL_CONTEXT);
fs.writeFileSync(context.stagingPath, JSON.stringify([{
  projectId: context.projectId,
  agent: context.agent,
  invocationId: context.invocationId,
  callId: "route-1",
  stateVersion: context.stateVersion,
  receivedAt: new Date().toISOString(),
  action: { tool: "route_to_agent", target: "writing", rationale: "The evidence is ready for writing." }
}]));
const args = process.argv.slice(2);
const message = "The experiment completed. Evidence is ready for the writing Agent.";
const mcpConfig = args.find((arg) => arg.startsWith("mcp_servers=")) || "";
fs.writeFileSync(context.stagingPath + ".args", JSON.stringify({
  hasOutputSchema: args.includes("--output-schema"),
  hasControlServer: mcpConfig.includes("scienceevolve-orchestration-control"),
  approvedInternalServerCount: (mcpConfig.match(/default_tools_approval_mode = "approve"/g) || []).length,
  automaticInternalServerCount: (mcpConfig.match(/default_tools_approval_mode = "auto"/g) || []).length,
  forwardsControlContext: mcpConfig.includes("SCIENCEEVOLVE_CONTROL_CONTEXT"),
  forwardsControlCapability: mcpConfig.includes("SCIENCEEVOLVE_CONTROL_CAPABILITY"),
  capabilityInArgs: args.some((arg) => arg.includes(process.env.SCIENCEEVOLVE_CONTROL_CAPABILITY))
}));
const events = [
  {type:"thread.started",thread_id:"thread_natural"},
  {type:"item.completed",item:{type:"agent_message",text:message}},
  {type:"turn.completed",usage:{input_tokens:2,output_tokens:3}}
];
fs.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const projectPath = path.join(root, testProject().id);
    const workspacePath = path.join(projectPath, "workspace");
    const runtimePath = path.join(root, "runtime");
    const inboxPath = path.join(root, "inbox.md");
    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(inboxPath, "# Inbox", "utf8");
    const stagingPath = path.join(runtimePath, "control-actions.json");
    const result = await createTestCodexRunner(await fs.realpath(executable)).run(
      {
        project: testProject(),
        agent: "idea",
        kind: "worker",
        invocationId: "inv_natural",
        inboxPath,
        projectPath,
        workspacePath,
        runtimePath,
        schemaPath: "",
        skillPaths: [],
        availableSkillPaths: [],
        control: {
          stagingPath,
          capability: "opaque-capability",
          stateVersion: 0,
          candidates: ["writing", "review"],
          decisionBy: "agent",
          allowUserIntervention: true,
          canComplete: false
        }
      },
      () => undefined,
      new AbortController().signal
    );
    expect(result.handoff).toBe("The experiment completed. Evidence is ready for the writing Agent.");
    expect(result.controlActions?.[0]?.action).toMatchObject({ tool: "route_to_agent", target: "writing" });
    const argsSummary = JSON.parse(await fs.readFile(`${stagingPath}.args`, "utf8")) as {
      hasOutputSchema: boolean;
      hasControlServer: boolean;
      approvedInternalServerCount: number;
      automaticInternalServerCount: number;
      forwardsControlContext: boolean;
      forwardsControlCapability: boolean;
      capabilityInArgs: boolean;
    };
    expect(argsSummary).toEqual({
      hasOutputSchema: false,
      hasControlServer: true,
      approvedInternalServerCount: 3,
      automaticInternalServerCount: 0,
      forwardsControlContext: true,
      forwardsControlCapability: true,
      capabilityInArgs: false
    });
  });

  it.each([true, false])("approves the SII server only when its URL matches the trusted invocation binding (trusted=%s)", async trusted => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-sii-codex-policy-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "codex.mjs");
    const captured = path.join(root, "mcp-config.txt");
    await fs.writeFile(executable, `#!/usr/bin/env node\nimport fs from 'node:fs';\nfs.writeFileSync(${JSON.stringify(captured)}, process.argv.find(a=>a.startsWith('mcp_servers=')));\nconsole.log(JSON.stringify({type:'thread.started',thread_id:'sii-policy-thread'}));\nconsole.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'Policy fixture finished.'}}));\nconsole.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:1,output_tokens:1}}));\n`, { mode: 0o700 });
    const project = testProject();
    const url = "http://127.0.0.1:49111/sii/trusted-test";
    project.agents.idea!.mcpServers = [{ name: "scienceevolve-sii", url }];
    const projectPath = path.join(root, project.id), workspacePath = path.join(projectPath, "workspace"), runtimePath = path.join(projectPath, "runtime");
    await fs.mkdir(workspacePath, { recursive: true });
    const inboxPath = path.join(root, "inbox.md"); await fs.writeFile(inboxPath, "Inspect the assigned evidence.");
    await createTestCodexRunner(await fs.realpath(executable)).run({ project, agent: "idea", kind: "worker", permission: "workspace",
      invocationId: "sii-policy", inboxPath, projectPath, workspacePath, runtimePath, schemaPath: "", skillPaths: [], availableSkillPaths: [],
      siiMcp: { url: trusted ? url : "http://127.0.0.1:49111/sii/other-binding" } }, () => undefined, new AbortController().signal);
    const rendered = await fs.readFile(captured, "utf8");
    const siiEntry = rendered.match(/"scienceevolve-sii" = \{[^}]*\}/)?.[0];
    expect(siiEntry?.includes('default_tools_approval_mode = "approve"')).toBe(trusted);
  });

  it("lets a terminal Main inspect the full task and perform business work before completing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-terminal-runner-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "terminal-codex.mjs");
    await fs.writeFile(
      executable,
      `#!/usr/bin/env node
if (process.argv[2] === "debug" && process.argv[3] === "models") {
  console.log(JSON.stringify({ models: [{ slug: "fixture-model", use_responses_lite: false, tool_mode: null }] }));
  process.exit(0);
}
import fs from "node:fs";
const prompt = fs.readFileSync(0, "utf8");
const context = JSON.parse(process.env.SCIENCEEVOLVE_CONTROL_CONTEXT);
const inboxMatch = prompt.includes("本轮直接消息：");
const inbox = prompt;
if (inbox.includes("VERIFIED_MAIN_WORK")) {
  fs.writeFileSync(process.env.SCIENCEEVOLVE_ROLE_WORKSPACE + "/main-result.md", "VERIFIED_MAIN_WORK\\n");
}
fs.writeFileSync(context.stagingPath, JSON.stringify([{
  projectId: context.projectId,
  agent: context.agent,
  invocationId: context.invocationId,
  callId: "complete-1",
  stateVersion: context.stateVersion,
  receivedAt: new Date().toISOString(),
  action: { tool: "complete_project", rationale: "done" }
}]));
fs.writeFileSync(context.stagingPath + ".prompt", JSON.stringify({
  fullInboxPrompt: Boolean(inboxMatch),
  readBusinessRequirement: inbox.includes("VERIFIED_MAIN_WORK"),
  allowsBusinessWork: prompt.includes("VERIFIED_MAIN_WORK") && !prompt.includes("only permitted action for this turn"),
  noControlContextFallback: !prompt.includes("SCIENCEEVOLVE_CONTROL_CONTEXT"),
  noCapabilityFallback: !prompt.includes("SCIENCEEVOLVE_CONTROL_CAPABILITY"),
  noSocketFallback: !prompt.includes("socket.socket"),
  capabilityValueInPrompt: prompt.includes(process.env.SCIENCEEVOLVE_CONTROL_CAPABILITY)
}));
const events = [
  {type:"thread.started",thread_id:"thread_terminal"},
  {type:"item.completed",item:{type:"agent_message",text:"Project completion committed."}},
  {type:"turn.completed",usage:{input_tokens:2,output_tokens:3}}
];
fs.writeSync(1, events.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
`,
      "utf8"
    );
    await fs.chmod(executable, 0o700);
    const project = testProject();
    project.phase = "main:running";
    const projectPath = path.join(root, project.id);
    const workspacePath = path.join(projectPath, "workspace");
    const runtimePath = path.join(root, "runtime");
    const inboxPath = path.join(root, "inbox.md");
    const stagingPath = path.join(runtimePath, "control-actions.json");
    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(
      inboxPath,
      "# Task\n\nCreate main-result.md containing VERIFIED_MAIN_WORK before completing.\n",
      "utf8"
    );

    const result = await createTestCodexRunner(await fs.realpath(executable)).run(
      {
        project,
        agent: "main",
        kind: "main",
        invocationId: "inv_terminal",
        inboxPath,
        projectPath,
        workspacePath,
        runtimePath,
        schemaPath: "",
        skillPaths: [],
        availableSkillPaths: [],
        control: {
          stagingPath,
          capability: "terminal-capability",
          stateVersion: 0,
          candidates: [],
          decisionBy: "main",
          allowUserIntervention: false,
          canComplete: true
        }
      },
      () => undefined,
      new AbortController().signal
    );

    expect(result.controlActions?.[0]?.action).toMatchObject({ tool: "complete_project" });
    await expect(fs.readFile(path.join(workspacePath, "main-result.md"), "utf8"))
      .resolves.toBe("VERIFIED_MAIN_WORK\n");
    await expect(fs.readFile(`${stagingPath}.prompt`, "utf8").then(JSON.parse)).resolves.toEqual({
      fullInboxPrompt: true,
      readBusinessRequirement: true,
      allowsBusinessWork: true,
      noControlContextFallback: true,
      noCapabilityFallback: true,
      noSocketFallback: true,
      capabilityValueInPrompt: false
    });
  });
});

/**
 * Direct driver tests still enter through the invocation-scoped process
 * capability used in production. A wrapper is convenient here because some
 * cases intentionally reuse their fixture executable across independent
 * invocation ids; each run must receive a fresh binding and recovery budget.
 */
function createTestCodexRunner(
  codexBin: string,
  options: Omit<CodexRunnerOptions, "harnessId"> & { harnessId?: string } = {}
): Pick<CodexRunner, "run"> {
  const commonHost = new CommonProcessHost();
  return {
    run(
      request: AgentRunRequest,
      onTrace: TraceSink,
      signal: AbortSignal
    ) {
      const gateway = request.project.agents[request.agent]?.gatewaySnapshot;
      const harnessId =
        options.harnessId ??
        request.project.agents[request.agent]?.harness ??
        "codex";
      const durable = Boolean(
        request.project.agents[request.agent]?.sessionPersistence ||
        request.kind === "main"
      );
      const invocationSession: SessionRef = {
        schemaVersion: 1,
        harnessId,
        adapterVersion: "1",
        generation: request.project.agentSessionMeta?.[request.agent]?.generation ?? 0,
        nativeId: request.resumeThreadId ?? request.invocationId,
        durable,
        createdAt: "2026-09-16T00:00:00.000Z"
      };
      const processHost = commonHost.forInvocation({
        invocationId: request.invocationId,
        harnessId,
        runtimePath: request.runtimePath,
        workspacePath: request.workspacePath,
        signal,
        recoveryBudget: new InvocationRecoveryController(),
        session: () => invocationSession,
        hostHome: process.env.HOME || os.homedir(),
        ...(
          request.permission === "compute" &&
          [...request.skillPaths, ...(request.autoSkillPaths ?? [])].some(
            (skillPath) => path.basename(path.dirname(skillPath)) === "nature-figure"
          )
            ? {
                natureFigureConfigPath: path.join(
                  request.workspacePath,
                  ".scienceevolve",
                  "nature-figure.json"
                )
              }
            : {}
        ),
        authorityEnvironment: {
          SCIENCEEVOLVE_PROJECT_ID: request.project.id,
          SCIENCEEVOLVE_INVOCATION_ID: request.invocationId,
          SCIENCEEVOLVE_AGENT_NAME: request.agent,
          SCIENCEEVOLVE_AGENT_KIND: request.kind,
          SCIENCEEVOLVE_AGENT_PERMISSION: request.permission,
          SCIENCEEVOLVE_AGENT_HARNESS: harnessId,
          SCIENCEEVOLVE_AGENT_PROTOCOL: gateway?.protocol ?? "responses",
          SCIENCEEVOLVE_PROJECT_ROOT: request.projectPath,
          SCIENCEEVOLVE_ROLE_WORKSPACE: request.workspacePath,
          SCIENCEEVOLVE_APPEND_ROOT: request.workspacePath,
          ...(request.control?.capability
            ? {
                SCIENCEEVOLVE_CONTROL_CAPABILITY: request.control.capability,
                SCIENCEEVOLVE_CONTROL_CONTEXT: serializeInvocationControlContext(
                  request.control,
                  {
                    projectId: request.project.id,
                    agent: request.agent,
                    invocationId: request.invocationId,
                    kind: request.kind,
                    workspacePath: request.workspacePath
                  }
                )
              }
            : {}),
          ...(gateway?.id ? { SCIENCEEVOLVE_GATEWAY_ID: gateway.id } : {}),
          ...(request.project.agents[request.agent]?.mcpServers.some(isFixedMcpServer) &&
          process.env[FIXED_MCP_TOKEN_ENV_VAR]
            ? { [FIXED_MCP_TOKEN_ENV_VAR]: process.env[FIXED_MCP_TOKEN_ENV_VAR]! }
            : {})
        },
        ...(gateway
          ? { route: { baseUrl: gateway.url, token: gateway.apiKey } }
          : {})
      });
      return new CodexRunner(
        codexBin,
        { ...options, harnessId },
        processHost,
        invocationSession
      ).run(
        request,
        onTrace,
        signal
      );
    }
  };
}

function testProject(): ProjectState {
  const now = new Date().toISOString();
  const orchestration = cloneAgentOrchestrationTemplate();
  const agents = mergeAgentConfigs(undefined, orchestration);
  const agentNames = orchestration.agents.map((definition) => definition.name);
  const emptyTotals = () => ({
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    invocations: 0
  });
  return {
    id: "prj_00000000000000000000000000000000",
    title: "Runner test",
    requirement: "Verify that the Codex process contract is isolated and structured.",
    status: "running",
    phase: "idea:running",
    createdAt: now,
    updatedAt: now,
    turn: 0,
    cycle: 1,
    eventSeq: 0,
    consecutiveFailures: 0,
    completionGeneration: 0,
    runCounts: Object.fromEntries(agentNames.map((name) => [name, 0])),
    mainInvocationSeq: 0,
    agents,
    orchestration,
    userInputs: [],
    tokenUsage: {
      ...emptyTotals(),
      invocations: 0,
      byAgent: Object.fromEntries(agentNames.map((name) => [name, emptyTotals()]))
    },
    computeUsage: emptyProjectComputeUsage()
  };
}

function testGatewaySnapshot(
  apiKey: string
): NonNullable<AgentConfig["gatewaySnapshot"]> {
  return {
    id: "gwy_00000000000000000000000000000001",
    name: "Invocation test gateway",
    url: "https://invocation-gateway.example/v1",
    apiKey,
    models: ["nex-agi/Nex-N2-Pro"],
    defaultModel: "nex-agi/Nex-N2-Pro",
    protocol: "responses"
  };
}

async function waitForFile(filePath: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}
