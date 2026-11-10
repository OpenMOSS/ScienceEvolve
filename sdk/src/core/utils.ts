import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

export function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function safeProjectRelativePath(input: string): string {
  const clean = input.replaceAll("\\", "/").trim();
  if (!clean || clean.includes("\0") || path.posix.isAbsolute(clean)) {
    throw new Error(`Invalid relative path: ${input}`);
  }
  const normalized = path.posix.normalize(clean).replace(/^\.\/+/, "");
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`Path traversal is not allowed: ${input}`);
  }
  return normalized;
}

export function safeRelativePath(input: string): string {
  return safeProjectRelativePath(input);
}

/** Canonical path contract for artifacts whose authority is bound to Git. */
export function safeGitArtifactRelativePath(input: string): string {
  if (input.length > 4_096 || /[\0\r\n]/u.test(input)) {
    throw new Error("Git artifact path contains an invalid control character or is too long");
  }
  const normalized = safeProjectRelativePath(input);
  if (normalized.split("/").some((segment) => segment.startsWith("."))) {
    throw new Error("Git artifact path contains a hidden component");
  }
  if (normalized === "Memory.md" || normalized.split("/")[0] === "agent-memory") {
    throw new Error("Internal Agent memory cannot be published as a Git artifact; publish a committed deliverable file instead");
  }
  return normalized;
}

export function escapeMarkdownCodeFence(value: string): string {
  return value.replaceAll("```", "``\u200b`");
}

export function titleFromRequirement(requirement: string): string {
  const firstLine = requirement.split(/\r?\n/, 1)[0]?.trim() || "未命名科研项目";
  return firstLine.slice(0, 80);
}

export function mediaTypeFor(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".md": "text/markdown; charset=utf-8",
      ".tex": "application/x-tex; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".jsonl": "application/x-ndjson; charset=utf-8",
      ".bib": "text/x-bibtex; charset=utf-8",
      ".csv": "text/csv; charset=utf-8",
      ".txt": "text/plain; charset=utf-8",
      ".py": "text/x-python; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".cjs": "text/javascript; charset=utf-8",
      ".ts": "text/typescript; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".htm": "text/html; charset=utf-8",
      ".svg": "image/svg+xml",
      ".yaml": "text/yaml; charset=utf-8",
      ".yml": "text/yaml; charset=utf-8",
      ".log": "text/plain; charset=utf-8",
      ".b64": "text/plain; charset=utf-8",
      ".pdf": "application/pdf",
      ".zip": "application/zip",
      ".gz": "application/gzip",
      ".xz": "application/x-xz",
      ".tar": "application/x-tar",
      ".png": "image/png",
      ".apng": "image/apng",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".bmp": "image/bmp",
      ".ico": "image/x-icon",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".oga": "audio/ogg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".flac": "audio/flac",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".m4v": "video/x-m4v",
      ".ogv": "video/ogg"
    }[extension] ?? "application/octet-stream"
  );
}

export function redactTrace(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(redactJsonValue(JSON.parse(value) as unknown));
    } catch {
      // Non-JSON command output and stderr fall through to textual redaction.
    }
  }
  return redactPlainText(value);
}

/**
 * Structured durable records use this predicate before serialization, while
 * free-form diagnostics use {@link redactTrace}.  Keep both boundaries on the
 * same credential vocabulary so a spelling that is rejected from state is
 * also removed from an exception message.
 */
export function isSensitiveCredentialKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /(?:authorization|proxyauthorization|password|passwd|secret|secretkey|secretaccesskey|accesskey|accesskeyid|clientsecret|privatekey|credential|credentials|apikey|accesstoken|refreshtoken|idtoken|authtoken|token|cookies?)$/.test(
    normalized
  );
}

/** Conservative detector for text that must never enter a durable payload. */
export function containsCredentialMaterial(value: string): boolean {
  return PRIVATE_KEY_HEADER.test(value) ||
    CREDENTIALLED_URL.test(value) ||
    AUTHORIZATION_VALUE.test(value) ||
    GITHUB_TOKEN.test(value) ||
    OPENAI_STYLE_TOKEN.test(value) ||
    AWS_ACCESS_KEY_ID_TOKEN.test(value) ||
    COOKIE_HEADER.test(value) ||
    CREDENTIAL_ASSIGNMENT.test(value);
}

/**
 * Invocation-local protocol bridges listen on loopback.  Child CLIs inherit
 * the service proxy environment in some deployments; without an explicit
 * bypass those requests can be sent to the corporate HTTP proxy and return a
 * misleading 502 before they ever reach the bridge.  Keep the bypass narrow
 * and only add it when the selected endpoint is actually loopback.
 */
export function ensureLoopbackNoProxy(
  environment: NodeJS.ProcessEnv,
  endpoint: string
): void {
  let hostname = "";
  try {
    hostname = new URL(endpoint).hostname.toLowerCase();
  } catch {
    return;
  }
  if (hostname !== "127.0.0.1" && hostname !== "localhost" && hostname !== "::1") {
    return;
  }
  const additions = ["127.0.0.1", "localhost", "::1"];
  const merge = (current: string | undefined): string => [
    ...new Set([
      ...(current ?? "").split(","),
      ...additions
    ].map((item) => item.trim()).filter(Boolean))
  ].join(",");
  const merged = merge(environment.NO_PROXY ?? environment.no_proxy);
  environment.NO_PROXY = merged;
  environment.no_proxy = merged;
}

function redactJsonValue(value: unknown, key?: string): unknown {
  if (key && isSensitiveCredentialKey(key)) return "[REDACTED]";
  if (Array.isArray(value)) {
    return value.map((item) => redactJsonValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactJsonValue(childValue, childKey)
      ])
    );
  }
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(redactJsonValue(JSON.parse(value) as unknown));
    } catch {
      // It only resembles JSON; redact it as ordinary text.
    }
  }
  return redactPlainText(value);
}

const PRIVATE_KEY_HEADER = /-----BEGIN [^-\r\n]*PRIVATE KEY(?: BLOCK)?-----/i;
const PRIVATE_KEY_BLOCK = /-----BEGIN [^-\r\n]*PRIVATE KEY(?: BLOCK)?-----[\s\S]*?(?:-----END [^-\r\n]*PRIVATE KEY(?: BLOCK)?-----|$)/gi;
const CREDENTIALLED_URL = /\b[a-z][a-z0-9+.-]*:\/\/(?!\[REDACTED\]@)[^\s/@]+(?::[^\s/@]*)?@/i;
const CREDENTIALLED_URL_GLOBAL = /(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi;
const AUTHORIZATION_VALUE = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{4,}/i;
const AUTHORIZATION_VALUE_GLOBAL = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{4,}/gi;
const GITHUB_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})(?=$|[^A-Za-z0-9_])/i;
const GITHUB_TOKEN_GLOBAL = /\b(?:gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})(?=$|[^A-Za-z0-9_])/gi;
const OPENAI_STYLE_TOKEN = /\bsk-[A-Za-z0-9_-]{12,}(?=$|[^A-Za-z0-9_-])/i;
const OPENAI_STYLE_TOKEN_GLOBAL = /\bsk-[A-Za-z0-9_-]{12,}(?=$|[^A-Za-z0-9_-])/gi;
const AWS_ACCESS_KEY_ID_TOKEN = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/i;
const AWS_ACCESS_KEY_ID_TOKEN_GLOBAL = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/gi;
// Playwright errors include request headers, sometimes with literal escaped
// newlines. Remove the whole Cookie/Set-Cookie value, including every pair.
const COOKIE_HEADER = /\b(?:set-cookie|cookie)[ \t]*:(?![ \t]*\[REDACTED\])[ \t]*[^\\\r\n]+/i;
const COOKIE_HEADER_GLOBAL = /(\b(?:set-cookie|cookie)[ \t]*:[ \t]*)[^\\\r\n]+/gi;
// Keep this expression linear on multi-megabyte model/tool output. A repeated
// arbitrary-prefix group here causes catastrophic backtracking before a key
// near the end of a long Assistant body. Structured objects use the broader
// normalized-key predicate above; free text permits one bounded vendor prefix.
const CREDENTIAL_KEY_TEXT = String.raw`(?:[A-Za-z0-9]{1,32}[_-])?(?:api[_-]?key|secret[_-]?access[_-]?key|access[_-]?key(?:[_-]?id)?|access[_-]?token|refresh[_-]?token|id[_-]?token|auth[_-]?token|authorization|proxy[_-]?authorization|client[_-]?secret|private[_-]?key|secret[_-]?key|password|passwd|credentials?|secret|token)`;
const CREDENTIAL_ASSIGNMENT = new RegExp(
  String.raw`(?<![A-Za-z0-9])["']?${CREDENTIAL_KEY_TEXT}["']?\s*[=:]\s*(?!\[?REDACTED\]?)(?:"(?:\\.|[^"\\])+"|'(?:\\.|[^'\\])+'|[^\s,;}]+)`,
  "i"
);
const CREDENTIAL_ASSIGNMENT_GLOBAL = new RegExp(
  String.raw`((?<![A-Za-z0-9])["']?${CREDENTIAL_KEY_TEXT}["']?\s*[=:]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}]+)`,
  "gi"
);

function redactPlainText(value: string): string {
  return value
    .replace(PRIVATE_KEY_BLOCK, "[REDACTED PRIVATE KEY]")
    .replace(CREDENTIALLED_URL_GLOBAL, "$1[REDACTED]@")
    .replace(GITHUB_TOKEN_GLOBAL, "[REDACTED]")
    .replace(OPENAI_STYLE_TOKEN_GLOBAL, "[REDACTED]")
    .replace(AWS_ACCESS_KEY_ID_TOKEN_GLOBAL, "[REDACTED]")
    .replace(AUTHORIZATION_VALUE_GLOBAL, "[REDACTED]")
    .replace(COOKIE_HEADER_GLOBAL, "$1[REDACTED]")
    .replace(CREDENTIAL_ASSIGNMENT_GLOBAL, "$1[REDACTED]");
}
