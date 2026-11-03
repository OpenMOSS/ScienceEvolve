import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExecFileGitCommandRunner } from "../../src/core/collaboration-git/command-runner.js";
import { GitCommandError, GitHubAuthorizationError } from "../../src/core/collaboration-git/errors.js";

const { execFile } = vi.hoisted(() => ({ execFile: vi.fn() }));
vi.mock("node:child_process", () => ({ execFile }));

const URL = "https://github.com/selected-account/private-qa.git";
const TOKEN = "selected_account_opaque_test_secret";
const BASIC = Buffer.from(`x-access-token:${TOKEN}`).toString("base64");
const PUSH = ["push", "--porcelain", "origin", "refs/heads/main:refs/heads/main"];
const FETCH = ["fetch", "--no-tags", "--no-write-fetch-head", "origin", "refs/heads/main:refs/openfars/sync/qa"];
const cwd = path.resolve("runner-qa", "repository");
const commandPrefix = ["-c", "core.hooksPath=/dev/null",
  ...(process.platform === "win32" ? ["-c", "core.longpaths=true"] : [])];
const resolver = vi.fn(async () => ({ token: TOKEN, requestedScopes: ["repo"] }));

function reply(stdout: string, stderr = "", error: Error | null = null): void {
  execFile.mockImplementationOnce((_binary, _args, _options, callback) => {
    callback(error, stdout, stderr);
    return { stdin: { end: vi.fn() } };
  });
}

function config(env: NodeJS.ProcessEnv): [string, string][] {
  return Array.from({ length: Number(env.GIT_CONFIG_COUNT ?? 0) }, (_, index) => [
    env[`GIT_CONFIG_KEY_${index}`]!, env[`GIT_CONFIG_VALUE_${index}`]!
  ]);
}

beforeEach(() => {
  execFile.mockReset();
  resolver.mockReset().mockResolvedValue({ token: TOKEN, requestedScopes: ["repo"] });
});

describe("project-bound Git transport", () => {
  it("returns complete read output beyond 16KB and rejects credentials or mutation requests in that mode", async () => {
    const patch = `diff --git a/result.txt b/result.txt\n+${"科学数据".repeat(9000)}\n`;
    reply(patch);
    const runner = new ExecFileGitCommandRunner();
    expect((await runner.run({ cwd, args: ["diff", "--no-ext-diff", "--"], completeOutput: true })).stdout).toBe(patch);
    reply("diff --git a/result.txt b/result.txt\n+password=private-fixture-value\n");
    await expect(runner.run({ cwd, args: ["diff", "--"], completeOutput: true })).rejects.toThrow("credential material");
    await expect(runner.run({ cwd, args: PUSH, completeOutput: true })).rejects.toThrow("restricted to fixed read");
    expect(execFile).toHaveBeenCalledTimes(2);
  });
  it.each([PUSH, FETCH])("authenticates the fixed %s operation without argv or persistent credentials", async (...args) => {
    reply(`${URL}\n`);
    reply("ok\n");
    const runner = new ExecFileGitCommandRunner({ credentialResolver: resolver });
    await runner.run({ cwd, args });
    expect(resolver).toHaveBeenCalledOnce();
    expect(execFile.mock.calls[0]![1]).toEqual([
      ...commandPrefix, "remote", "get-url",
      ...(args[0] === "push" ? ["--push"] : []), "--all", "origin"
    ]);
    const [, argv, options] = execFile.mock.calls[1]!;
    expect(argv).toEqual([...commandPrefix, ...args]);
    expect(JSON.stringify(argv)).not.toContain(TOKEN);
    expect(JSON.stringify(argv)).not.toContain(BASIC);
    expect(config(options.env)).toEqual([
      ["credential.helper", ""],
      [`credential.${URL}.helper`, ""],
      [`http.${URL}.extraHeader`, ""],
      [`http.${URL}.extraHeader`, `Authorization: Basic ${BASIC}`],
      [`http.${URL}.sslVerify`, "true"],
      [`http.${URL}.followRedirects`, "false"]
    ]);
    expect(execFile.mock.calls[0]![2].env.GIT_CONFIG_COUNT).toBeUndefined();
  });

  it("resolves refreshed credentials for every operation", async () => {
    const renewed = "different_account_test_secret";
    resolver.mockResolvedValueOnce({ token: TOKEN, requestedScopes: ["repo"] })
      .mockResolvedValueOnce({ token: renewed, requestedScopes: ["repo"] });
    for (let i = 0; i < 2; i++) { reply(`${URL}\n`); reply(""); }
    const runner = new ExecFileGitCommandRunner({ credentialResolver: resolver });
    await runner.run({ cwd, args: PUSH });
    await runner.run({ cwd, args: PUSH });
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(execFile.mock.calls[3]![2].env)).not.toContain(BASIC);
    expect(config(execFile.mock.calls[3]![2].env)).toContainEqual([
      `http.${URL}.extraHeader`,
      `Authorization: Basic ${Buffer.from(`x-access-token:${renewed}`).toString("base64")}`
    ]);
  });

  it.each([
    "https://attacker.example/owner/repo.git",
    "http://github.com/owner/repo.git",
    "ssh://git@github.com/owner/repo.git",
    "https://user:secret@github.com/owner/repo.git",
    "https://github.com:8443/owner/repo.git",
    "https://github.com/owner/repo.git?redirect=1",
    "https://github.com/owner/repo.git\nhttps://github.com/other/repo.git"
  ])("rejects unsafe or rewritten destinations before resolving a credential: %s", async (url) => {
    reply(`${url}\n`);
    await expect(new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: PUSH }))
      .rejects.toThrow("GitHub HTTPS repository");
    expect(resolver).not.toHaveBeenCalled();
    expect(execFile).toHaveBeenCalledOnce();
  });

  it("does not fall back to an ambient helper when the selected account is unavailable", async () => {
    reply(`${URL}\n`);
    resolver.mockRejectedValue(new Error(`unavailable ${TOKEN}`));
    await expect(new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: PUSH }))
      .rejects.toThrow("credential could not be resolved");
    expect(execFile).toHaveBeenCalledOnce();
  });

  it("preserves the account store's actionable authorization reason and status", async () => {
    reply(`${URL}\n`);
    const error = new GitHubAuthorizationError(403, "项目绑定的 GitHub 账号缺少仓库权限");
    resolver.mockRejectedValue(error);
    await expect(new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: PUSH })).rejects.toBe(error);
    expect(execFile).toHaveBeenCalledOnce();
  });

  it.each([
    { token: "", requestedScopes: ["repo"] },
    { token: "invalid\nheader", requestedScopes: ["repo"] },
    { token: TOKEN, requestedScopes: [] },
    { token: TOKEN, requestedScopes: ["repo", "workflow"] }
  ])("rejects invalid credentials without starting transport", async (credential) => {
    reply(`${URL}\n`);
    resolver.mockResolvedValue(credential);
    await expect(new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: PUSH }))
      .rejects.toMatchObject({ code: "GITHUB_WAITING_FOR_AUTHORIZATION" });
    expect(execFile).toHaveBeenCalledOnce();
  });

  it("redacts opaque tokens and Basic encodings from output, diagnostics and error causes", async () => {
    reply(`${URL}\n`);
    reply(`echo ${TOKEN}`, `echo ${BASIC}`, Object.assign(new Error(`failed ${TOKEN} ${BASIC}`), { code: 128 }));
    const error = await new ExecFileGitCommandRunner({ credentialResolver: resolver })
      .run({ cwd, args: PUSH }).catch((failure) => failure as GitCommandError);
    expect(error).toBeInstanceOf(GitCommandError);
    const diagnostic = `${JSON.stringify(error.publicData)} ${error.cause.message}`;
    expect(diagnostic).not.toContain(TOKEN);
    expect(diagnostic).not.toContain(BASIC);
    expect(diagnostic).toContain("[REDACTED]");
    reply(`${URL}\n`);
    reply(`echo ${TOKEN}`, `echo ${BASIC}`);
    const result = await new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: FETCH });
    expect(result.stdout).toContain("[REDACTED]");
    expect(result.stderr).toContain("[REDACTED]");
  });

  it("inherits trusted proxies but excludes ambient tokens and Git configuration injection", async () => {
    reply(`${URL}\n`); reply("");
    const runner = new ExecFileGitCommandRunner({ credentialResolver: resolver, hostEnvironment: {
      HTTPS_PROXY: "http://127.0.0.1:7877", NO_PROXY: "localhost",
      GITHUB_TOKEN: "ambient-secret", GIT_CONFIG_COUNT: "1", GIT_SSL_NO_VERIFY: "1", NODE_OPTIONS: "unsafe"
    } });
    await runner.run({ cwd, args: PUSH });
    const environment = execFile.mock.calls[1]![2].env;
    expect(environment.HTTPS_PROXY).toBe("http://127.0.0.1:7877");
    expect(environment.NO_PROXY).toBe("localhost");
    for (const key of ["GITHUB_TOKEN", "GIT_SSL_NO_VERIFY", "NODE_OPTIONS"]) expect(environment[key]).toBeUndefined();
    await expect(runner.run({ cwd, args: PUSH, environment: { GIT_CONFIG_COUNT: "1" } }))
      .rejects.toThrow("service allowlist");
  });

  it("rejects alternate remotes and argument layouts before invoking Git", async () => {
    const runner = new ExecFileGitCommandRunner({ credentialResolver: resolver });
    await expect(runner.run({ cwd, args: ["push", "--porcelain", "other", "main"] }))
      .rejects.toThrow("fixed origin operation");
    expect(execFile).not.toHaveBeenCalled();
    expect(resolver).not.toHaveBeenCalled();
  });

  it("keeps local operations credential-free", async () => {
    reply("main\n");
    await new ExecFileGitCommandRunner({ credentialResolver: resolver }).run({ cwd, args: ["rev-parse", "main"] });
    expect(resolver).not.toHaveBeenCalled();
    expect(execFile.mock.calls[0]![2].env.GIT_CONFIG_COUNT).toBeUndefined();
  });
});
