export interface HarnessPromptQuery {
  harness: string;
  model: string;
  forceRefresh?: boolean;
  permission?: string;
  reasoningEffort?: string;
  webSearch?: boolean;
  skills?: string[];
  autoSkills?: string[];
  mcpServers?: string[];
}

export interface HarnessPromptResult {
  harness: string;
  model: string;
  installedVersion?: string;
  resolvedModel?: string;
  status: "available" | "not-installed" | "version-unavailable" | "model-unmatched" | "source-unavailable";
  sourceType: "bundled-default" | "installed-default" | "unavailable";
  source: string;
  scope: "base-default";
  collectedAt: string;
  configurationDigest: string;
  scopeNote?: string;
  text?: string;
  sha256?: string;
  reason?: string;
}
