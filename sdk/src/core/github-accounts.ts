import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { GitHubCredential, GitHubCredentialResolver } from "./collaboration-git/contracts.js";
import { GitHubAuthorizationError } from "./collaboration-git/errors.js";
import type { ProjectGitAccountBinding } from "./types.js";
import { newId } from "./utils.js";
import { GitHubRepositoryManagementError, type GitHubRepositoryDeletionIdentity } from "./github-repository-management-types.js";

const ACCOUNT_ID = /^gha_[a-f0-9]{32}$/i;
const OAUTH_SESSION_TTL_MS = 10 * 60_000;
const TOKEN_REFRESH_SKEW_MS = 60_000;
const REQUIRED_SCOPES = ["repo"] as const;

function isLoopbackHttp(url: URL): boolean {
  return url.protocol === "http:" &&
    ["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname);
}

export type GitHubAccountStatus = "ready" | "expired" | "revoked";

export interface GitHubAccountRecord extends ProjectGitAccountBinding {
  status: GitHubAccountStatus;
  scopes: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
}

export interface GitHubOAuthConfiguration {
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
}

export interface GitHubAuthorizationStart {
  authorizationUrl: string;
  expiresAt: string;
}

export interface GitHubAuthorizationResult {
  account: GitHubAccountRecord;
  openerOrigin: string;
}

export interface GitHubRepositoryObservation {
  exists: boolean;
  observedAt: string;
  htmlUrl?: string;
  private?: boolean;
  defaultBranch?: string;
}

interface EncryptedSecret {
  iv: string;
  ciphertext: string;
  tag: string;
}

interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
}

interface StoredGitHubAccount extends Omit<GitHubAccountRecord, "isDefault"> {
  credential: EncryptedSecret;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

interface GitHubAccountDocument {
  schemaVersion: 1;
  accounts: StoredGitHubAccount[];
  defaultAccountId?: string;
}

interface OAuthSession {
  verifier: string;
  openerOrigin: string;
  createdAt: number;
  deletionAccountProviderId?: number;
}

interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

interface GitHubIdentityResponse {
  login: string;
  id: number;
  avatarUrl?: string;
  scopes: string[];
}

export interface GitHubAccountStoreOptions {
  oauth?: GitHubOAuthConfiguration;
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
}

/**
 * Durable, server-only GitHub account library. Public methods never return a
 * token; project runtimes receive only an account-scoped resolver closure.
 */
export class GitHubAccountStore {
  private mutationTail: Promise<void> = Promise.resolve();
  private readonly oauth: GitHubOAuthConfiguration;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;
  private readonly sessions = new Map<string, OAuthSession>();
  private key?: Buffer;

  constructor(
    private readonly root: string,
    options: GitHubAccountStoreOptions = {}
  ) {
    this.oauth = options.oauth ?? {};
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? (() => new Date());
  }

  oauthConfigured(): boolean {
    return Boolean(
      this.oauth.clientId?.trim() &&
      this.oauth.clientSecret?.trim() &&
      this.oauth.callbackUrl?.trim()
    );
  }

  async list(): Promise<GitHubAccountRecord[]> {
    await this.mutationTail;
    const document = await this.read();
    return document.accounts.map((account) => this.publicAccount(account, document.defaultAccountId));
  }

  async get(accountId: string): Promise<GitHubAccountRecord | undefined> {
    this.assertAccountId(accountId);
    await this.mutationTail;
    const document = await this.read();
    const account = document.accounts.find((item) => item.id === accountId);
    return account ? this.publicAccount(account, document.defaultAccountId) : undefined;
  }

  async requireReady(accountId: string): Promise<GitHubAccountRecord> {
    if (!ACCOUNT_ID.test(accountId)) {
      throw new GitHubAuthorizationError(401, "启用 Git 时必须选择已登录的 GitHub 账号");
    }
    return this.serialize(async () => {
      const document = await this.read();
      const account = document.accounts.find((item) => item.id === accountId);
      if (!account) throw new GitHubAuthorizationError(401, "所选 GitHub 账号不存在，请重新选择");
      if (account.status !== "ready") {
        throw new GitHubAuthorizationError(401, `GitHub 账号 ${account.login} 需要重新授权`);
      }
      try {
        // Resolve once before project creation so a known-expired token is
        // refreshed (or rejected) before any project/Git state is persisted.
        await this.resolveTokenBundle(document, account);
        return this.publicAccount(account, document.defaultAccountId);
      } catch (error) {
        account.status = "expired";
        account.updatedAt = this.timestamp();
        await this.write(document);
        if (error instanceof GitHubAuthorizationError) throw error;
        throw new GitHubAuthorizationError(401, "所选 GitHub 账号需要重新授权");
      }
    });
  }

  credentialResolver(accountId: string): GitHubCredentialResolver {
    this.assertAccountId(accountId);
    return async (signal) => this.resolveCredential(accountId, signal);
  }

  async setDefault(accountId: string): Promise<GitHubAccountRecord> {
    return this.serialize(async () => {
      const document = await this.read();
      const account = document.accounts.find((item) => item.id === accountId);
      if (!account) throw new Error("GitHub account not found");
      if (account.status !== "ready") {
        throw new GitHubAuthorizationError(401, `GitHub 账号 ${account.login} 需要重新授权`);
      }
      document.defaultAccountId = accountId;
      account.updatedAt = this.timestamp();
      await this.write(document);
      return this.publicAccount(account, accountId);
    });
  }

  async remove(accountId: string): Promise<boolean> {
    this.assertAccountId(accountId);
    return this.serialize(async () => {
      const document = await this.read();
      const remaining = document.accounts.filter((item) => item.id !== accountId);
      if (remaining.length === document.accounts.length) return false;
      document.accounts = remaining;
      if (document.defaultAccountId === accountId) {
        document.defaultAccountId = remaining.find((item) => item.status === "ready")?.id;
      }
      await this.write(document);
      return true;
    });
  }

  async startRepositoryDeletionAuthorization(accountId: string, openerOrigin?: string): Promise<GitHubAuthorizationStart> {
    const account = await this.get(accountId);
    if (!account) throw new Error("GitHub account not found");
    return this.startAuthorization(openerOrigin, account);
  }

  startAuthorization(openerOrigin?: string, deletionAccount?: GitHubAccountRecord): GitHubAuthorizationStart {
    const config = this.requireOAuthConfiguration();
    const callbackOrigin = new URL(config.callbackUrl).origin;
    const origin = openerOrigin ? this.safeOrigin(openerOrigin) : callbackOrigin;
    if (origin !== callbackOrigin) {
      throw new Error("GitHub 登录只能从 OAuth callback 所属的 ScienceEvolve 站点发起");
    }
    this.pruneSessions();
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const createdAt = this.now().getTime();
    this.sessions.set(state, { verifier, openerOrigin: origin, createdAt,
      ...(deletionAccount ? { deletionAccountProviderId: deletionAccount.providerUserId } : {}) });
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.callbackUrl);
    url.searchParams.set("scope", [...REQUIRED_SCOPES, ...(deletionAccount ? ["delete_repo"] : [])].join(" "));
    if (deletionAccount) url.searchParams.set("login", deletionAccount.login);
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
    return {
      authorizationUrl: url.toString(),
      expiresAt: new Date(createdAt + OAUTH_SESSION_TTL_MS).toISOString()
    };
  }

  authorizationOpenerOrigin(state?: string): string | undefined {
    this.pruneSessions();
    const normalized = state?.trim();
    return normalized ? this.sessions.get(normalized)?.openerOrigin : undefined;
  }

  cancelAuthorization(state?: string): string | undefined {
    const normalized = state?.trim();
    if (!normalized) return undefined;
    const openerOrigin = this.authorizationOpenerOrigin(normalized);
    this.sessions.delete(normalized);
    return openerOrigin;
  }

  async completeAuthorization(input: {
    code?: string;
    state?: string;
  }): Promise<GitHubAuthorizationResult> {
    const config = this.requireOAuthConfiguration();
    const state = input.state?.trim() ?? "";
    const session = this.sessions.get(state);
    this.sessions.delete(state);
    if (!session || this.now().getTime() - session.createdAt > OAUTH_SESSION_TTL_MS) {
      throw new GitHubAuthorizationError(401, "GitHub 登录会话已失效，请重新登录");
    }
    const code = input.code?.trim();
    if (!code) throw new GitHubAuthorizationError(401, "GitHub 未返回授权码");
    const token = await this.exchangeToken({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      callbackUrl: config.callbackUrl,
      code,
      verifier: session.verifier
    });
    if (!token.scopes.includes("repo")) {
      throw new GitHubAuthorizationError(403, "GitHub 授权缺少创建个人私有仓库所需的 repo 权限");
    }
    const identity = await this.fetchIdentity(token.accessToken);
    if (session.deletionAccountProviderId !== undefined) {
      if (identity.id !== session.deletionAccountProviderId)
        throw new GitHubAuthorizationError(403, "请使用所选 GitHub 账号完成仓库删除授权");
      if (!token.scopes.includes("delete_repo"))
        throw new GitHubAuthorizationError(403, "GitHub 未授予 delete_repo 删除权限，原账号授权保持不变");
    }
    const account = await this.upsertAuthorizedAccount(identity, token);
    return { account, openerOrigin: session.openerOrigin };
  }

  async verify(accountId: string): Promise<GitHubAccountRecord> {
    return this.serialize(async () => {
      const document = await this.read();
      const account = document.accounts.find((item) => item.id === accountId);
      if (!account) throw new Error("GitHub account not found");
      try {
        const token = await this.resolveTokenBundle(document, account);
        const identity = await this.fetchIdentity(token.accessToken);
        // GitHub login names can change; the numeric provider id is the stable
        // account identity that project bindings and reauthorization trust.
        if (identity.id !== account.providerUserId) {
          account.status = "revoked";
          account.updatedAt = this.timestamp();
          await this.write(document);
          throw new GitHubAuthorizationError(403, "GitHub 凭证身份与已保存账号不一致");
        }
        account.status = "ready";
        account.login = identity.login;
        account.avatarUrl = identity.avatarUrl;
        account.scopes = identity.scopes.length ? identity.scopes : account.scopes;
        account.lastVerifiedAt = this.timestamp();
        account.updatedAt = account.lastVerifiedAt;
        await this.write(document);
        return this.publicAccount(account, document.defaultAccountId);
      } catch (error) {
        if (!(error instanceof GitHubAuthorizationError && account.status === "revoked")) {
          account.status = "expired";
          account.updatedAt = this.timestamp();
          await this.write(document);
        }
        throw error;
      }
    });
  }

  /**
   * Observe a repository through the account bound to the project. A 404 is a
   * durable provider fact (including private repositories, because the check
   * is authenticated); authorization and network failures remain errors so
   * callers never mislabel an inaccessible repository as deleted.
   */
  async observeRepository(
    accountId: string,
    owner: string,
    repository: string,
    signal?: AbortSignal
  ): Promise<GitHubRepositoryObservation> {
    const normalizedOwner = owner.trim();
    const normalizedRepository = repository.trim();
    if (!normalizedOwner || normalizedOwner.length > 100 || !normalizedRepository || normalizedRepository.length > 100) {
      throw new Error("Invalid GitHub repository identity");
    }
    const credential = await this.credentialResolver(accountId)(signal);
    let response: globalThis.Response;
    try {
      response = await this.fetchImpl(
        `https://api.github.com/repos/${encodeURIComponent(normalizedOwner)}/${encodeURIComponent(normalizedRepository)}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${credential.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "OpenFARS"
          },
          signal
        }
      );
    } catch {
      throw new Error("无法连接 GitHub 检查仓库状态");
    }
    const observedAt = this.timestamp();
    if (response.status === 404) return { exists: false, observedAt };
    const data = await this.safeJson(response);
    if (!response.ok) {
      if (response.status === 401) {
        throw new GitHubAuthorizationError(401, "GitHub 账号授权已失效，请重新登录");
      }
      if (response.status === 403) {
        throw new GitHubAuthorizationError(403, "GitHub 拒绝检查仓库状态，请稍后重试或重新授权");
      }
      throw new Error(`GitHub 仓库状态检查失败（HTTP ${response.status}）`);
    }
    const htmlUrl = typeof data.html_url === "string" && data.html_url.startsWith("https://github.com/")
      ? data.html_url
      : undefined;
    const defaultBranch = typeof data.default_branch === "string" && data.default_branch
      ? data.default_branch.slice(0, 255)
      : undefined;
    return {
      exists: true,
      observedAt,
      ...(htmlUrl ? { htmlUrl } : {}),
      ...(typeof data.private === "boolean" ? { private: data.private } : {}),
      ...(defaultBranch ? { defaultBranch } : {})
    };
  }

  async inspectRepositoryForDeletion(accountId: string, owner: string, name: string): Promise<GitHubRepositoryDeletionIdentity> {
    this.assertDeletionRepositoryName(owner, name);
    const { credential, account } = await this.deletionCredential(accountId);
    let response: Response;
    try {
      response = await this.fetchImpl(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
        headers: this.deletionHeaders(credential.token), redirect: "manual", signal: AbortSignal.timeout(15_000)
      });
    } catch { throw new GitHubRepositoryManagementError(502, "无法连接 GitHub 核验待删除仓库，请稍后重试"); }
    if (response.status >= 300 && response.status < 400)
      throw new GitHubRepositoryManagementError(409, "仓库已移动或重命名，请刷新列表后重新选择");
    if (!response.ok) throw this.deletionProviderError(response.status);
    const data = await this.safeJson(response);
    const repositoryOwner = data.owner as { id?: unknown; login?: unknown } | undefined;
    if (!Number.isSafeInteger(data.id) || Number(data.id) <= 0 ||
      repositoryOwner?.id !== account.providerUserId ||
      typeof repositoryOwner.login !== "string" || repositoryOwner.login.toLowerCase() !== owner.toLowerCase() ||
      typeof data.name !== "string" || data.name.toLowerCase() !== name.toLowerCase() ||
      owner.toLowerCase() !== account.login.toLowerCase())
      throw new GitHubRepositoryManagementError(409, "仓库身份或所属账号已变化，请重新核对后操作");
    if (!data.permissions || (data.permissions as { admin?: boolean }).admin !== true)
      throw new GitHubRepositoryManagementError(403, "当前 GitHub 账号没有此仓库的管理员权限");
    return { providerId: Number(data.id), owner: repositoryOwner.login, name: data.name };
  }

  async deleteRepository(accountId: string, expected: GitHubRepositoryDeletionIdentity): Promise<void> {
    const current = await this.inspectRepositoryForDeletion(accountId, expected.owner, expected.name);
    if (current.providerId !== expected.providerId)
      throw new GitHubRepositoryManagementError(409, "仓库 ID 已变化，可能是同名新仓库；已停止删除");
    const { credential } = await this.deletionCredential(accountId);
    let response: Response;
    try {
      response = await this.fetchImpl(`https://api.github.com/repos/${encodeURIComponent(current.owner)}/${encodeURIComponent(current.name)}`, {
        method: "DELETE", headers: this.deletionHeaders(credential.token), redirect: "manual", signal: AbortSignal.timeout(15_000)
      });
    } catch {
      throw new GitHubRepositoryManagementError(502, "GitHub 删除请求结果尚未确认，请先核对仓库状态，避免重复操作", "github_repository_deletion_uncertain");
    }
    if (response.status === 204) return;
    if (response.status >= 500)
      throw new GitHubRepositoryManagementError(502, "GitHub 删除请求返回服务错误，结果待核对；不会自动重试删除", "github_repository_deletion_uncertain");
    if (response.status >= 300 && response.status < 400)
      throw new GitHubRepositoryManagementError(409, "GitHub 返回仓库重定向，已停止删除；请重新核对仓库");
    throw this.deletionProviderError(response.status);
  }

  private assertDeletionRepositoryName(owner: string, name: string) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,99}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(name) || [".", ".."].includes(name))
      throw new GitHubRepositoryManagementError(400, "GitHub 仓库名称无效");
  }
  private async deletionCredential(accountId: string) {
    const credential = await this.credentialResolver(accountId)();
    const account = await this.get(accountId);
    if (!account?.scopes.includes("delete_repo"))
      throw new GitHubRepositoryManagementError(403, "请先为此 GitHub 账号授权 delete_repo 删除权限", "github_repository_deletion_scope_required");
    return { credential, account };
  }
  private deletionHeaders(token: string) {
    return { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ScienceEvolve" };
  }
  private deletionProviderError(status: number) {
    if (status === 401) return new GitHubRepositoryManagementError(401, "GitHub 账号授权已失效，请重新登录");
    if (status === 403) return new GitHubRepositoryManagementError(403, "GitHub 拒绝删除操作，请核对删除权限、组织策略或 API 额度");
    if (status === 404) return new GitHubRepositoryManagementError(404, "仓库不存在或当前账号无权访问，未确认删除成功");
    return new GitHubRepositoryManagementError(502, `GitHub 仓库操作失败（HTTP ${status}）`);
  }

  private async resolveCredential(accountId: string, signal?: AbortSignal): Promise<GitHubCredential> {
    if (signal?.aborted) throw new GitHubAuthorizationError(401, "GitHub 凭证解析已取消");
    return this.serialize(async () => {
      const document = await this.read();
      const account = document.accounts.find((item) => item.id === accountId);
      if (!account || account.status !== "ready") {
        throw new GitHubAuthorizationError(401, "项目绑定的 GitHub 账号需要重新授权");
      }
      try {
        const bundle = await this.resolveTokenBundle(document, account, signal);
        return { token: bundle.accessToken, requestedScopes: [...REQUIRED_SCOPES] };
      } catch (error) {
        account.status = "expired";
        account.updatedAt = this.timestamp();
        await this.write(document);
        if (error instanceof GitHubAuthorizationError) throw error;
        throw new GitHubAuthorizationError(401, "项目绑定的 GitHub 账号需要重新授权");
      }
    });
  }

  private async resolveTokenBundle(
    document: GitHubAccountDocument,
    account: StoredGitHubAccount,
    signal?: AbortSignal
  ): Promise<TokenBundle> {
    let bundle = await this.decrypt(account.credential);
    const expiresAt = account.accessTokenExpiresAt
      ? Date.parse(account.accessTokenExpiresAt)
      : Number.POSITIVE_INFINITY;
    if (expiresAt - this.now().getTime() > TOKEN_REFRESH_SKEW_MS) return bundle;
    if (!bundle.refreshToken) {
      throw new GitHubAuthorizationError(401, "GitHub access token 已过期，请重新授权");
    }
    const refreshExpiresAt = account.refreshTokenExpiresAt
      ? Date.parse(account.refreshTokenExpiresAt)
      : Number.POSITIVE_INFINITY;
    if (refreshExpiresAt <= this.now().getTime()) {
      throw new GitHubAuthorizationError(401, "GitHub refresh token 已过期，请重新授权");
    }
    const config = this.requireOAuthConfiguration();
    const refreshed = await this.refreshToken(config, bundle.refreshToken, signal);
    bundle = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? bundle.refreshToken
    };
    account.credential = await this.encrypt(bundle);
    account.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    account.refreshTokenExpiresAt = refreshed.refreshTokenExpiresAt ?? account.refreshTokenExpiresAt;
    account.scopes = refreshed.scopes.length ? refreshed.scopes : account.scopes;
    account.updatedAt = this.timestamp();
    await this.write(document);
    return bundle;
  }

  private async upsertAuthorizedAccount(
    identity: GitHubIdentityResponse,
    token: OAuthTokenResponse
  ): Promise<GitHubAccountRecord> {
    return this.serialize(async () => {
      const document = await this.read();
      const existing = document.accounts.find((item) => item.providerUserId === identity.id);
      const timestamp = this.timestamp();
      const account: StoredGitHubAccount = {
        id: existing?.id ?? newId("gha"),
        login: identity.login,
        providerUserId: identity.id,
        ...(identity.avatarUrl ? { avatarUrl: identity.avatarUrl } : {}),
        status: "ready",
        scopes: token.scopes.length ? token.scopes : identity.scopes,
        credential: await this.encrypt({
          accessToken: token.accessToken,
          ...(token.refreshToken ? { refreshToken: token.refreshToken } : {})
        }),
        ...(token.accessTokenExpiresAt ? { accessTokenExpiresAt: token.accessTokenExpiresAt } : {}),
        ...(token.refreshTokenExpiresAt ? { refreshTokenExpiresAt: token.refreshTokenExpiresAt } : {}),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        lastVerifiedAt: timestamp
      };
      const index = existing ? document.accounts.indexOf(existing) : -1;
      if (index >= 0) document.accounts[index] = account;
      else document.accounts.push(account);
      document.defaultAccountId ??= account.id;
      await this.write(document);
      return this.publicAccount(account, document.defaultAccountId);
    });
  }

  private async exchangeToken(input: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    code: string;
    verifier: string;
  }): Promise<OAuthTokenResponse> {
    return this.tokenRequest(new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.callbackUrl,
      code_verifier: input.verifier
    }));
  }

  private async refreshToken(
    config: Required<GitHubOAuthConfiguration>,
    refreshToken: string,
    signal?: AbortSignal
  ): Promise<OAuthTokenResponse> {
    return this.tokenRequest(new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }), signal);
  }

  private async tokenRequest(body: URLSearchParams, signal?: AbortSignal): Promise<OAuthTokenResponse> {
    let response: globalThis.Response;
    try {
      response = await this.fetchImpl("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal
      });
    } catch {
      throw new GitHubAuthorizationError(401, "无法连接 GitHub 完成授权");
    }
    const data = await this.safeJson(response);
    const accessToken = typeof data.access_token === "string" ? data.access_token : "";
    if (!response.ok || !accessToken) {
      throw new GitHubAuthorizationError(401, "GitHub 授权码无效或已过期");
    }
    const scopes = this.parseScopes(data.scope);
    const now = this.now().getTime();
    const expiresIn = this.positiveSeconds(data.expires_in);
    const refreshExpiresIn = this.positiveSeconds(data.refresh_token_expires_in);
    return {
      accessToken,
      ...(typeof data.refresh_token === "string" && data.refresh_token
        ? { refreshToken: data.refresh_token }
        : {}),
      scopes,
      ...(expiresIn ? { accessTokenExpiresAt: new Date(now + expiresIn * 1_000).toISOString() } : {}),
      ...(refreshExpiresIn ? { refreshTokenExpiresAt: new Date(now + refreshExpiresIn * 1_000).toISOString() } : {})
    };
  }

  private async fetchIdentity(accessToken: string): Promise<GitHubIdentityResponse> {
    let response: globalThis.Response;
    try {
      response = await this.fetchImpl("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "OpenFARS"
        }
      });
    } catch {
      throw new GitHubAuthorizationError(401, "无法连接 GitHub 验证账号");
    }
    const data = await this.safeJson(response);
    if (!response.ok || typeof data.login !== "string" || !Number.isSafeInteger(data.id)) {
      throw new GitHubAuthorizationError(response.status === 403 ? 403 : 401, "GitHub 账号验证失败");
    }
    const advertised = this.parseScopes(response.headers.get("x-oauth-scopes"));
    if (advertised.length && !advertised.includes("repo")) {
      throw new GitHubAuthorizationError(403, "GitHub 授权缺少 repo 权限");
    }
    const avatar = typeof data.avatar_url === "string" ? this.safeAvatarUrl(data.avatar_url) : undefined;
    return {
      login: data.login.slice(0, 100),
      id: Number(data.id),
      ...(avatar ? { avatarUrl: avatar } : {}),
      scopes: advertised
    };
  }

  private requireOAuthConfiguration(): Required<GitHubOAuthConfiguration> {
    const clientId = this.oauth.clientId?.trim();
    const clientSecret = this.oauth.clientSecret?.trim();
    const callbackUrl = this.oauth.callbackUrl?.trim();
    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error("GitHub OAuth 尚未配置，请设置 SCIENCEEVOLVE_GITHUB_OAUTH_CLIENT_ID、SCIENCEEVOLVE_GITHUB_OAUTH_CLIENT_SECRET 和 SCIENCEEVOLVE_GITHUB_OAUTH_CALLBACK_URL");
    }
    const callback = new URL(callbackUrl);
    if (callback.protocol !== "https:" && !isLoopbackHttp(callback)) {
      throw new Error("GitHub OAuth callback 必须使用 HTTPS（本机 loopback 除外）");
    }
    return { clientId, clientSecret, callbackUrl: callback.toString() };
  }

  private safeOrigin(value: string): string {
    const parsed = new URL(value);
    if ((parsed.protocol !== "https:" && !isLoopbackHttp(parsed)) || parsed.username || parsed.password || parsed.origin !== value) {
      throw new Error("无效的 GitHub 登录返回地址");
    }
    return parsed.origin;
  }

  private safeAvatarUrl(value: string): string | undefined {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password
        ? parsed.toString()
        : undefined;
    } catch {
      return undefined;
    }
  }

  private pruneSessions(): void {
    const cutoff = this.now().getTime() - OAUTH_SESSION_TTL_MS;
    for (const [state, session] of this.sessions) {
      if (session.createdAt < cutoff) this.sessions.delete(state);
    }
  }

  private parseScopes(value: unknown): string[] {
    if (typeof value !== "string") return [];
    return [...new Set(value.split(/[ ,]+/).map((item) => item.trim().toLowerCase()).filter(Boolean))];
  }

  private positiveSeconds(value: unknown): number | undefined {
    const number = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : undefined;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private async safeJson(response: globalThis.Response): Promise<Record<string, unknown>> {
    try {
      const value = await response.json() as unknown;
      return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }

  private publicAccount(account: StoredGitHubAccount, defaultAccountId?: string): GitHubAccountRecord {
    return {
      id: account.id,
      login: account.login,
      providerUserId: account.providerUserId,
      ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}),
      status: account.status,
      scopes: [...account.scopes],
      isDefault: account.id === defaultAccountId,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      ...(account.lastVerifiedAt ? { lastVerifiedAt: account.lastVerifiedAt } : {})
    };
  }

  private assertAccountId(accountId: string): void {
    if (!ACCOUNT_ID.test(accountId)) throw new Error("Invalid GitHub account id");
  }

  private filePath(): string {
    return path.join(this.root, "github-accounts.json");
  }

  private keyPath(): string {
    return path.join(this.root, "github-accounts.key");
  }

  private async encryptionKey(): Promise<Buffer> {
    if (this.key) return this.key;
    await fs.mkdir(this.root, { recursive: true });
    let encoded: string;
    try {
      encoded = await fs.readFile(this.keyPath(), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const candidate = randomBytes(32).toString("base64");
      try {
        await fs.writeFile(this.keyPath(), `${candidate}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
        encoded = candidate;
      } catch (writeError) {
        if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError;
        encoded = await fs.readFile(this.keyPath(), "utf8");
      }
    }
    const key = Buffer.from(encoded.trim(), "base64");
    if (key.length !== 32) throw new Error("GitHub account encryption key is invalid");
    this.key = key;
    return key;
  }

  private async encrypt(bundle: TokenBundle): Promise<EncryptedSecret> {
    const key = await this.encryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(bundle), "utf8"),
      cipher.final()
    ]);
    return {
      iv: iv.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
      tag: cipher.getAuthTag().toString("base64")
    };
  }

  private async decrypt(secret: EncryptedSecret): Promise<TokenBundle> {
    const key = await this.encryptionKey();
    const iv = Buffer.from(secret.iv, "base64");
    const tag = Buffer.from(secret.tag, "base64");
    if (iv.length !== 12 || tag.length !== 16) throw new Error("GitHub credential envelope is invalid");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final()
    ]).toString("utf8");
    const value = JSON.parse(plaintext) as Partial<TokenBundle>;
    if (typeof value.accessToken !== "string" || !value.accessToken) {
      throw new Error("GitHub credential payload is invalid");
    }
    return {
      accessToken: value.accessToken,
      ...(typeof value.refreshToken === "string" && value.refreshToken
        ? { refreshToken: value.refreshToken }
        : {})
    };
  }

  private async read(): Promise<GitHubAccountDocument> {
    try {
      const raw = JSON.parse(await fs.readFile(this.filePath(), "utf8")) as unknown;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error();
      const document = raw as Record<string, unknown>;
      if (document.schemaVersion !== 1 || !Array.isArray(document.accounts)) throw new Error();
      const accounts = document.accounts.flatMap((value) => {
        try {
          if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
          const account = value as Partial<StoredGitHubAccount>;
          if (
            typeof account.id !== "string" || !ACCOUNT_ID.test(account.id) ||
            typeof account.login !== "string" || !account.login ||
            !Number.isSafeInteger(account.providerUserId) ||
            (account.status !== "ready" && account.status !== "expired" && account.status !== "revoked") ||
            !Array.isArray(account.scopes) ||
            !account.credential || typeof account.credential !== "object" ||
            typeof account.credential.iv !== "string" ||
            typeof account.credential.ciphertext !== "string" ||
            typeof account.credential.tag !== "string" ||
            typeof account.createdAt !== "string" || typeof account.updatedAt !== "string"
          ) throw new Error();
          return [{
            ...account,
            scopes: account.scopes.filter((scope): scope is string => typeof scope === "string")
          } as StoredGitHubAccount];
        } catch {
          return [];
        }
      });
      if (accounts.length !== document.accounts.length) throw new Error();
      if (
        new Set(accounts.map((account) => account.id)).size !== accounts.length ||
        new Set(accounts.map((account) => account.providerUserId)).size !== accounts.length
      ) throw new Error();
      if (
        document.defaultAccountId !== undefined &&
        (typeof document.defaultAccountId !== "string" ||
          !accounts.some((item) => item.id === document.defaultAccountId))
      ) throw new Error();
      return {
        schemaVersion: 1,
        accounts,
        ...(typeof document.defaultAccountId === "string"
          ? { defaultAccountId: document.defaultAccountId }
          : {})
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { schemaVersion: 1, accounts: [] };
      }
      throw new Error("GitHub account store is invalid", { cause: error });
    }
  }

  private async write(document: GitHubAccountDocument): Promise<void> {
    await fs.mkdir(this.root, { recursive: true });
    const destination = this.filePath();
    const temporary = `${destination}.${process.pid}.${newId("tmp")}`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx"
      });
      await fs.rename(temporary, destination);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw error;
    }
  }

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.mutationTail.then(operation, operation);
    this.mutationTail = result.then(() => undefined, () => undefined);
    return result;
  }
}
