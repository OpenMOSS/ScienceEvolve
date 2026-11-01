import type { AgentName, GatewayModelStreamEvent, GatewayTokenUsage, InvocationPerformance, PerformanceAggregate, ProjectState } from "./types.js";

function outputCharacterCount(text: string): number {
  return Array.from(text).length;
}

function estimatedTokenCountFromCharacters(characters: number): number {
  return characters > 0 ? Math.max(1, Math.ceil(characters / 4)) : 0;
}

export class InvocationPerformanceTracker {
  private attempt = 0;
  private readonly requests = new Map<string, { startedAt: number; firstTokenAt?: number; completedAt?: number; streaming: boolean }>();
  private readonly usageIds = new Set<string>();
  private readonly recentDeltas: Array<{ at: number; tokens: number }> = [];
  private firstRequestAt?: number;
  private lastCompletedRequestAt?: number;
  private firstTokenAt?: number;
  private firstTokenRequestStartedAt?: number;
  private latestFirstTokenLatencyMs?: number;
  private latestFirstTokenAt?: number;
  private lastOutputAt?: number;
  private estimatedOutputTokens = 0;
  private streamingOutputCharacters = 0;
  private streamingEstimatedTokens = 0;
  private officialOutputTokens = 0;
  private officialUsageObserved = false;
  private sawStreamingDelta = false;
  private publishTimer?: NodeJS.Timeout;

  constructor(
    private readonly invocationId: string,
    private readonly agent: AgentName,
    private startedAt: number,
    private readonly publish: (performance: InvocationPerformance) => void
  ) {}

  reset(attempt: number): void {
    if (this.publishTimer) clearInterval(this.publishTimer);
    this.publishTimer = undefined;
    this.attempt = attempt;
    this.requests.clear();
    this.usageIds.clear();
    this.recentDeltas.length = 0;
    this.firstRequestAt = undefined;
    this.lastCompletedRequestAt = undefined;
    this.firstTokenAt = undefined;
    this.firstTokenRequestStartedAt = undefined;
    this.latestFirstTokenLatencyMs = undefined;
    this.latestFirstTokenAt = undefined;
    this.lastOutputAt = undefined;
    this.estimatedOutputTokens = 0;
    this.streamingOutputCharacters = 0;
    this.streamingEstimatedTokens = 0;
    this.officialOutputTokens = 0;
    this.officialUsageObserved = false;
    this.sawStreamingDelta = false;
    this.startedAt = Date.now();
  }

  observe(event: GatewayModelStreamEvent): void {
    const at = Date.parse(event.timestamp);
    const observedAt = Number.isFinite(at) ? at : Date.now();
    if (event.phase === "started") {
      if (this.requests.size === 0) this.recentDeltas.length = 0;
      this.firstRequestAt = Math.min(this.firstRequestAt ?? observedAt, observedAt);
      this.requests.set(event.requestId, {
        startedAt: observedAt,
        streaming: event.streaming
      });
      this.publish(this.snapshot("active", observedAt));
      return;
    }
    const request = this.requests.get(event.requestId);
    if (event.phase === "delta" && event.text) {
      if (request && request.firstTokenAt === undefined) {
        request.firstTokenAt = observedAt;
        this.latestFirstTokenLatencyMs = Math.max(0, observedAt - request.startedAt);
        this.latestFirstTokenAt = observedAt;
      }
      this.streamingOutputCharacters += outputCharacterCount(event.text);
      const nextEstimate = estimatedTokenCountFromCharacters(
        this.streamingOutputCharacters
      );
      const tokens = Math.max(0, nextEstimate - this.streamingEstimatedTokens);
      this.streamingEstimatedTokens = nextEstimate;
      if (tokens > 0) {
        this.firstTokenAt ??= observedAt;
        this.firstTokenRequestStartedAt ??= request?.startedAt ?? this.startedAt;
        this.lastOutputAt = observedAt;
        this.estimatedOutputTokens += tokens;
        this.sawStreamingDelta ||= event.streaming;
        this.recentDeltas.push({ at: observedAt, tokens });
        this.trimWindow(observedAt);
        if (event.streaming && !this.publishTimer) {
          this.publishTimer = setInterval(() => {
            this.publish(this.snapshot("active", Date.now()));
          }, 1_000);
          this.publishTimer.unref();
        }
      }
    } else if (event.phase === "completed") {
      if (request) {
        this.requests.delete(event.requestId);
        this.lastCompletedRequestAt = Math.max(this.lastCompletedRequestAt ?? observedAt, observedAt);
      }
      if (
        typeof event.estimatedOutputTokens === "number" &&
        Number.isSafeInteger(event.estimatedOutputTokens) &&
        event.estimatedOutputTokens > 0
      ) {
        this.estimatedOutputTokens += event.estimatedOutputTokens;
      }
      if (this.requests.size === 0) {
        if (this.publishTimer) clearInterval(this.publishTimer);
        this.publishTimer = undefined;
      }
    }
    this.publish(this.snapshot("active", observedAt));
  }

  recordUsage(usage: GatewayTokenUsage): void {
    if (this.usageIds.has(usage.usageId)) return;
    this.usageIds.add(usage.usageId);
    this.officialUsageObserved = true;
    this.officialOutputTokens += usage.outputTokens;
    this.publish(this.snapshot("active", Date.now()));
  }

  finish(status: "completed" | "incomplete"): InvocationPerformance {
    if (this.publishTimer) clearInterval(this.publishTimer);
    this.publishTimer = undefined;
    const performance = this.snapshot(status, Date.now());
    this.publish(performance);
    return performance;
  }

  private trimWindow(now: number): void {
    while (this.recentDeltas[0] && this.recentDeltas[0].at < now - 5_000) {
      this.recentDeltas.shift();
    }
  }

  private snapshot(
    status: InvocationPerformance["status"],
    now: number
  ): InvocationPerformance {
    this.trimWindow(now);
    const activeRequests = [...this.requests.values()];
    const requestActive = status === "active" && activeRequests.length > 0;
    const streaming = requestActive ? activeRequests.some((request) => request.streaming) : this.sawStreamingDelta;
    const firstRequestAt = this.firstRequestAt ?? this.startedAt;
    const lastRequestAt = this.lastCompletedRequestAt ?? this.lastOutputAt ?? firstRequestAt;
    const outputTokens = this.officialUsageObserved
      ? this.officialOutputTokens
      : this.estimatedOutputTokens;
    const averageStart = this.firstTokenAt ?? firstRequestAt;
    const averageEnd = this.lastOutputAt === undefined
      ? lastRequestAt
      : Math.max(this.lastOutputAt, lastRequestAt);
    const outputDurationMs = Math.max(0, averageEnd - averageStart);
    const averageSeconds = Math.max(0.001, outputDurationMs / 1_000);
    const windowTokens = this.recentDeltas.reduce((sum, item) => sum + item.tokens, 0);
    const windowStart = this.recentDeltas[0]?.at;
    const windowSeconds = windowStart === undefined
      ? 0
      : Math.max(0.25, (now - Math.max(windowStart, now - 5_000)) / 1_000);
    return {
      invocationId: this.invocationId,
      agent: this.agent,
      attempt: this.attempt,
      status,
      startedAt: new Date(firstRequestAt).toISOString(),
      ...(this.firstTokenAt === undefined
        ? {}
        : {
            firstTokenAt: new Date(this.latestFirstTokenAt ?? this.firstTokenAt).toISOString(),
            firstTokenLatencyMs: this.latestFirstTokenLatencyMs ?? Math.max(
              0,
              this.firstTokenAt - (this.firstTokenRequestStartedAt ?? firstRequestAt)
            )
          }),
      ...(status === "active" ? {} : { completedAt: new Date(now).toISOString() }),
      requestActive,
      ...(requestActive && streaming && activeRequests.some((request) => request.firstTokenAt !== undefined)
        ? {
            currentTokensPerSecond: windowSeconds > 0
              ? Math.round(windowTokens / windowSeconds * 10) / 10
              : 0
          }
        : {}),
      ...((status !== "active" || !requestActive) && outputTokens > 0
        ? {
            averageTokensPerSecond: Math.round(outputTokens / averageSeconds * 10) / 10,
            outputDurationMs
          }
        : {}),
      outputTokens,
      tokenSource: this.officialUsageObserved ? "official" : "estimated",
      streaming
    };
  }
}

export function updatedPerformanceAggregate(
  current: PerformanceAggregate | undefined,
  performance: InvocationPerformance
): PerformanceAggregate {
  const invocations = (current?.invocations ?? 0) + 1;
  const outputTokens = (current?.outputTokens ?? 0) + performance.outputTokens;
  const outputDurationMs =
    (current?.outputDurationMs ?? 0) + (performance.outputDurationMs ?? 0);
  const hasFirstToken = performance.firstTokenLatencyMs !== undefined;
  const firstTokenSamples = (current?.firstTokenSamples ?? 0) + (hasFirstToken ? 1 : 0);
  const totalFirstTokenLatencyMs =
    (current?.totalFirstTokenLatencyMs ?? 0) + (performance.firstTokenLatencyMs ?? 0);
  const previousSource = current?.tokenSource;
  const tokenSource = !previousSource || previousSource === performance.tokenSource
    ? performance.tokenSource
    : "mixed";
  return {
    invocations,
    outputTokens,
    outputDurationMs,
    firstTokenSamples,
    totalFirstTokenLatencyMs,
    ...(firstTokenSamples > 0
      ? {
          averageFirstTokenLatencyMs:
            Math.round(totalFirstTokenLatencyMs / firstTokenSamples * 10) / 10
        }
      : {}),
    ...(outputTokens > 0 && outputDurationMs > 0
      ? {
          averageTokensPerSecond:
            Math.round(outputTokens / (outputDurationMs / 1_000) * 10) / 10
        }
      : {}),
    tokenSource,
    updatedAt: performance.completedAt ?? new Date().toISOString()
  };
}

export function recordTerminalPerformance(
  state: ProjectState,
  performance: InvocationPerformance,
  includeInAggregate: boolean
): void {
  const existing = state.performance;
  const records = [...(existing?.history ?? []), performance];
  // Buffered requests cannot measure TTFT. Retain each Agent's last actual
  // measurement even after it falls outside the normal recent-history window.
  const lastTokens = new Map<string, InvocationPerformance>();
  for (const value of records) {
    if (value.firstTokenLatencyMs === undefined) continue;
    const prior = lastTokens.get(value.agent);
    if (!prior || (value.firstTokenAt ?? value.startedAt) >= (prior.firstTokenAt ?? prior.startedAt)) lastTokens.set(value.agent, value);
  }
  const retained = new Set([...lastTokens.values(), ...records.slice(-100)]);
  const history = records.filter((value) => retained.has(value));
  state.performance = {
    byAgent: {
      ...(existing?.byAgent ?? {}),
      [performance.agent]: performance
    },
    ...(existing?.aggregateByAgent
      ? { aggregateByAgent: { ...existing.aggregateByAgent } }
      : {}),
    ...(existing?.aggregate ? { aggregate: existing.aggregate } : {}),
    history,
    latest: performance
  };
  if (!includeInAggregate) return;
  state.performance.aggregateByAgent = {
    ...(state.performance.aggregateByAgent ?? {}),
    [performance.agent]: updatedPerformanceAggregate(
      state.performance.aggregateByAgent?.[performance.agent],
      performance
    )
  };
  state.performance.aggregate = updatedPerformanceAggregate(
    state.performance.aggregate,
    performance
  );
}
