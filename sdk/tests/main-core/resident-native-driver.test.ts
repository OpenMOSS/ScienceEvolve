import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";
import {
  RESIDENT_PROTOCOL_BUFFER_CAPACITY,
  RESIDENT_PROTOCOL_MAX_FRAME_BYTES,
  ResidentNativeDriver,
  ResidentTurnActivityClock,
  codexAppServerCodec,
  dshSdkCodec,
  piRpcCodec,
  type ResidentProtocolCodec,
  type ResidentTurnAuthorityBroker
} from "../../src/core/harness-runtime/resident-native-driver.js";
import type { ResidentTurn } from "../../src/core/harness-runtime/resident-lease.js";
import { ResidentLeaseManager, readResidentProcessIdentity } from "../../src/core/harness-runtime/resident-lease.js";
import { CommonProcessHost, terminateProcessTree } from "../../src/core/harness-runtime/process-host.js";
import { ResidentTurnRetryableError, proxyFailureError } from "../../src/core/harness-runtime/errors.js";

const roots: string[] = [];
const children: ChildProcessWithoutNullStreams[] = [];

afterEach(async () => {
  vi.useRealTimers();
  for (const child of children.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, {
    recursive: true,
    force: true
  })));
});

const fakeSources: Record<string, string> = {
  "codex-app-server": `
    const r=require('node:readline').createInterface({input:process.stdin});
    let turn=0; const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize') return send({id:q.id,result:{userAgent:'fake'}});
      if(q.method==='thread/start') {
        send({method:'configWarning',params:{summary:'fixture warning',details:null}});
        send({method:'mcpServer/startupStatus/updated',params:{threadId:'codex-thread',name:'fixture',status:'ready',error:null,failureReason:null}});
        send({method:'thread/started',params:{thread:{id:'codex-thread'}}});
        send({method:'warning',params:{threadId:'codex-thread',message:'fixture warning'}});
        send({method:'thread/status/changed',params:{threadId:'codex-thread',status:{type:'idle'}}});
        send({method:'thread/goal/cleared',params:{threadId:'codex-thread'}});
        send({method:'thread/goal/updated',params:{threadId:'codex-thread',turnId:null,goal:{threadId:'codex-thread',objective:'Bounded native goal',status:'active',createdAt:1,updatedAt:1,timeUsedSeconds:0,tokensUsed:0,tokenBudget:null}}});
        send({method:'account/rateLimits/updated',params:{rateLimits:{primary:{usedPercent:1}}}});
        send({method:'deprecationNotice',params:{summary:'fixture',details:'fixture details'}});
        send({id:q.id,result:{thread:{id:'codex-thread'}}});
        return setTimeout(()=>send({method:'remoteControl/status/changed',params:{status:'disabled',serverName:'fixture',installationId:'fixture',environmentId:null}}),5);
      }
      if(q.method==='turn/start') { turn++; const id='turn-'+turn;
        send({id:q.id,result:{turn:{id}}});
        const usage={totalTokens:2,inputTokens:1,cachedInputTokens:0,outputTokens:1,reasoningOutputTokens:0};
        send({method:'thread/tokenUsage/updated',params:{threadId:'codex-thread',turnId:id,tokenUsage:{total:usage,last:usage,modelContextWindow:null}}});
        send({method:'item/started',params:{threadId:'codex-thread',turnId:id,item:{type:'toolCall',id:'tool-'+turn}}});
        send({method:'item/completed',params:{threadId:'codex-thread',turnId:id,item:{type:'toolCall',id:'tool-'+turn}}});
        return send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id,status:'completed',items:[{type:'agentMessage',text:'codex-'+turn}]}}}); }
      if(q.method==='thread/unsubscribe') return send({id:q.id,result:{}});
    });`,
  "pi-rpc": `
    const r=require('node:readline').createInterface({input:process.stdin});
    let turn=0; const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.type==='get_state') return send({id:q.id,type:'response',command:'get_state',success:true,data:{isStreaming:false,sessionId:'pi-session'}});
      if(q.type==='prompt') { turn++; send({id:q.id,type:'response',command:'prompt',success:true}); send({type:'agent_start',sessionId:'pi-session'}); send({type:'tool_execution_start',sessionId:'pi-session',toolCallId:'tool-'+turn}); return send({type:'agent_end',sessionId:'pi-session',messages:[{role:'assistant',content:[{type:'text',text:'pi-'+turn}]}]}); }
      if(q.type==='get_last_assistant_text') return send({id:q.id,type:'response',command:'get_last_assistant_text',success:true,data:{text:'pi-'+turn}});
    });`,
  "dsh-sdk-json-rpc": `
    const r=require('node:readline').createInterface({input:process.stdin});
    let turn=0,seq=0; const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize') return send({jsonrpc:'2.0',id:q.id,result:{serverInfo:{name:'deepseek-harness-sdk-runtime',version:'fixture'}}});
      if(q.method==='session/resume') return send({jsonrpc:'2.0',id:q.id,result:{sessionId:q.params.sessionId,lastSequence:seq-1}});
      if(q.method==='session/prompt') { turn++; const sid=q.params.sessionId;
        send({jsonrpc:'2.0',id:q.id,result:{messageId:'message-'+turn}});
        send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'running'}});
        send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'turn/start',seq:seq++,data:{turn}}}});
        send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'assistant/message',seq:seq++,data:{turn,message:{role:'assistant',content:[{type:'text',text:'dsh-'+turn}]}}}}});
        send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'turn/end',seq:seq++,data:{turn,reason:{kind:'completed'}}}}});
        return send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}}); }
      if(q.method==='shutdown') return send({jsonrpc:'2.0',id:q.id,result:{}});
    });`
};

describe("DSH native history surface", () => {
  it.each(["previous-turn", "current-turn"] as const)("keeps DSH compaction surface replacements out of current result attribution (%s)", async mode => {
    const child = await fakeNative("dsh-sdk-json-rpc", dshHistoricalSurfaceSource(mode));
    const delivered: Array<Record<string, unknown>> = [];
    const driver = await ResidentNativeDriver.open({ child, session: { ...session("dsh", "dsh-session"), resumedAt: "2026-10-14T17:25:00.000Z" }, codec: dshSdkCodec({ nativeSessionResume: true, expectedSessionId: "dsh-session" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1, onFrame: frame => { delivered.push(frame); } });
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "current-dsh-response" });
    const events = delivered.map(frame => (frame.params as { event?: { type: string; surfaceOp?: unknown; data: Record<string, unknown> } } | undefined)?.event).filter(Boolean);
    expect(events.filter(event => event!.type === "tool/result")).toHaveLength(1);
    expect(events.some(event => typeof event!.surfaceOp === "object")).toBe(false);
    expect(driver.session).toMatchObject({ nativeId: "dsh-session", generation: 0, resumedAt: "2026-10-14T17:25:00.000Z" });
    await driver.close();
  });

  it.each(["unpaired", "wrong-range", "wrong-source", "future-source", "future-turn", "wrong-session", "sequence-gap"] as const)("rejects invalid DSH surface replacement evidence (%s)", async mode => {
    const child = await fakeNative("dsh-sdk-json-rpc", dshHistoricalSurfaceSource(mode));
    const driver = await ResidentNativeDriver.open({ child, session: { ...session("dsh", "dsh-session"), resumedAt: "2026-10-14T17:25:00.000Z" }, codec: dshSdkCodec({ nativeSessionResume: true, expectedSessionId: "dsh-session" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.submit(turn(1))).rejects.toThrow();
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

});

describe("ResidentTurnActivityClock", () => {
  it("keeps a turn alive beyond 120 seconds while valid model activity and heartbeats continue", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00.000Z"));
    const failures: unknown[] = [];
    const clock = new ResidentTurnActivityClock(
      { modelTimeoutMs: 120_000, toolTimeoutMs: 600_000 },
      (error) => { failures.push(error); }
    );
    clock.begin({ harnessId: "dsh", invocationId: "inv-active" });

    for (let index = 0; index < 5; index += 1) {
      await vi.advanceTimersByTimeAsync(30_000);
      clock.observe(index % 2 === 0
        ? { activities: [{ kind: "model", phase: "delta" }] }
        : { activities: [{ kind: "heartbeat" }] });
    }

    expect(failures).toEqual([]);
    expect(clock.snapshot()).toMatchObject({
      deadlineType: "model-activity-idle",
      lastActivityAt: Date.now()
    });
    clock.end();
  });

  it("times out true silence with structured last-activity and known-usage facts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00.000Z"));
    const failures: Array<{ code: string; details: Record<string, unknown> }> = [];
    const clock = new ResidentTurnActivityClock(
      { modelTimeoutMs: 120_000, toolTimeoutMs: 600_000 },
      (error) => { failures.push(error); }
    );
    clock.begin({ harnessId: "pi", invocationId: "inv-silent" });
    clock.observe({ usage: { inputTokens: 12, outputTokens: 3, totalTokens: 15 } });

    await vi.advanceTimersByTimeAsync(120_000);

    expect(failures).toEqual([expect.objectContaining({
      code: "INVOCATION_TIMED_OUT",
      details: expect.objectContaining({
        harnessId: "pi",
        invocationId: "inv-silent",
        operation: "Resident turn inactivity",
        deadlineType: "model-activity-idle",
        lastActivityType: "turn.started",
        toolSteps: 0,
        knownUsage: { inputTokens: 12, outputTokens: 3, totalTokens: 15 }
      })
    })]);
  });

  it("uses the tool clock while active and gives the model a fresh window after completion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00.000Z"));
    const failures: Array<{ code: string; details: Record<string, unknown> }> = [];
    const clock = new ResidentTurnActivityClock(
      { modelTimeoutMs: 100, toolTimeoutMs: 1_000 },
      (error) => { failures.push(error); }
    );
    clock.begin({ harnessId: "dsh", invocationId: "inv-tool" });
    clock.observe({ activities: [{
      kind: "tool", phase: "started", callId: "call-1", name: "read"
    }] });
    await vi.advanceTimersByTimeAsync(800);
    clock.observe({ activities: [{
      kind: "tool", phase: "updated", callId: "call-1", name: "read"
    }] });
    await vi.advanceTimersByTimeAsync(800);
    expect(failures).toEqual([]);

    clock.observe({ activities: [{
      kind: "tool", phase: "completed", callId: "call-1", name: "read"
    }] });
    expect(clock.snapshot()).toMatchObject({
      deadlineType: "model-activity-idle",
      deadlineAt: Date.now() + 100,
      lastActivityType: "tool.completed",
      toolSteps: 1,
      toolCallId: "call-1",
      toolName: "read"
    });
    await vi.advanceTimersByTimeAsync(99);
    expect(failures).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(failures[0]).toMatchObject({
      code: "INVOCATION_TIMED_OUT",
      details: expect.objectContaining({ deadlineType: "model-activity-idle" })
    });
  });

  it("reports the stale active tool when its own inactivity window expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00.000Z"));
    const failures: Array<{ code: string; details: Record<string, unknown> }> = [];
    const clock = new ResidentTurnActivityClock(
      { modelTimeoutMs: 100, toolTimeoutMs: 500 },
      (error) => { failures.push(error); }
    );
    clock.begin({ harnessId: "codex", invocationId: "inv-tool-stuck" });
    clock.observe({ activities: [{
      kind: "tool", phase: "started", callId: "call-stuck", name: "shell"
    }] });

    await vi.advanceTimersByTimeAsync(500);

    expect(failures[0]).toMatchObject({
      code: "TOOL_EXECUTION_TIMED_OUT",
      details: expect.objectContaining({
        deadlineType: "tool-activity-idle",
        toolCallId: "call-stuck",
        toolName: "shell",
        toolSteps: 1,
        lastActivityType: "tool.started"
      })
    });
  });

  it.each([
    {
      name: "Codex",
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      frame: { method: "item/started", params: { item: { id: "c1", type: "toolCall", name: "read" } } },
      activity: { kind: "tool", phase: "started", callId: "c1", name: "read" }
    },
    {
      name: "Pi",
      codec: piRpcCodec(),
      frame: { type: "tool_execution_update", toolCallId: "p1", toolName: "grep" },
      activity: { kind: "tool", phase: "updated", callId: "p1", name: "grep" }
    },
    {
      name: "DSH",
      codec: dshSdkCodec(),
      frame: { jsonrpc: "2.0", method: "session.event", params: {
        event: { type: "heartbeat", seq: 1, data: {} }
      } },
      activity: { kind: "heartbeat" }
    }
  ])("maps $name native frames into the common activity vocabulary", ({ codec, frame, activity }) => {
    expect(codec.observe(frame)).toMatchObject({ activities: [activity] });
  });

  it("matches conflicting DSH result IDs to the active tool call", () => {
    const codec = dshSdkCodec();
    expect(codec.observe({ method: "session.event", params: { event: {
      type: "tool/call",
      data: { callId: "active-call", name: "read" }
    } } })).toMatchObject({ activities: [{
      kind: "tool", phase: "started", callId: "active-call", name: "read"
    }] });

    expect(codec.observe({ method: "session.event", params: { event: {
      type: "tool/result",
      data: { callId: "fallback-call", message: {
        source: { callId: "legacy-call" },
        content: [{ type: "tool-result", toolCallId: "active-call", content: "ok" }]
      } }
    } } })).toMatchObject({ activities: [{
      kind: "tool", phase: "completed", callId: "active-call", name: "read"
    }] });
  });

  it("does not classify an unknown DSH stream chunk as activity", () => {
    const codec = dshSdkCodec();
    expect(codec.observe({ method: "session.event", params: { event: {
      type: "assistant/chunk",
      data: { chunk: { type: "diagnostic-noise" } }
    } } })).toBeUndefined();
  });
});

describe.runIf(process.platform === "linux")("built-in resident native protocols", () => {
  it.each([
    { pending: true, resumed: false, allocation: true, accepted: true },
    { pending: true, resumed: false, allocation: false, accepted: false },
    { pending: false, resumed: false, allocation: true, accepted: false },
    { pending: true, resumed: true, allocation: true, accepted: false }
  ])("restricts extension native identity allocation to a fresh pending session: %j", async row => {
    const child = await fakeNative("pi-rpc");
    const requested = { ...session("fixture-extension", row.pending ? "pending:extension" : "existing-native-id"),
      ...(row.resumed ? { resumedAt: new Date().toISOString() } : {}) };
    const codec: ResidentProtocolCodec = { ...piRpcCodec(), protocol: "fixture-extension-protocol",
      allocatesNativeSessionId: row.allocation,
      initialize: async (_connection, current) => ({ ...current, nativeId: "allocated-native-id" }),
      close: async () => undefined };
    const opening = ResidentNativeDriver.open({ child, session: requested, codec,
      turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    if (row.accepted) {
      const driver = await opening;
      expect(driver.session).toMatchObject({ harnessId: "fixture-extension", nativeId: "allocated-native-id" });
      await driver.close();
    } else await expect(opening).rejects.toThrow(/authoritative native session identity/);
  });

  it.each([
    ["codex", "codex-app-server", "pending:fixture", () => codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" })],
    ["pi", "pi-rpc", "pi-session", piRpcCodec],
    ["dsh", "dsh-sdk-json-rpc", "dsh-session", dshSdkCodec]
  ] as const)("keeps %s at a verified idle boundary after a transient model failure", async (harnessId, protocol, sessionId, codec) => {
    const source = fakeSources[protocol]!
      .replace("status:'completed',items:", "status:turn===1?'failed':'completed',error:{message:'temporary model failure'},items:")
      .replace("is_error:false", "is_error:turn===1")
      .replace("{role:'assistant',content:", "{role:'assistant',stopReason:turn===1?'error':'stop',errorMessage:'temporary model failure',content:")
      .replace("reason:{kind:'completed'}", "reason:{kind:turn===1?'error':'completed'}");
    const child = await fakeNative(protocol, source);
    const releases: Array<{ outcome: string; alive: boolean }> = [];
    const driver = await ResidentNativeDriver.open({ child, session: session(harnessId, sessionId), codec: codec(),
      ownershipEpoch: 7, turnAuthority: { activate: async current => ({ inputId: current.inputId,
        invocationId: current.invocationId, ownershipEpoch: 7,
        classifyFailure: error => proxyFailureError({ code: "PROTOCOL_TOOL_ARGUMENTS_INVALID",
          message: "Provider returned invalid tool JSON", sourceProtocol: "responses", targetProtocol: "chat-completions",
          model: "neutral-test-model" }, harnessId, error),
        release: async outcome => { releases.push({ outcome, alive: (await driver.probe()).alive }); }
      }) } });
    try {
      const identity = structuredClone(driver.identity), nativeSession = structuredClone(driver.session);
      await expect(driver.submit(turn(1))).rejects.toBeInstanceOf(ResidentTurnRetryableError);
      expect(await driver.probe()).toMatchObject({ alive: true, identity });
      expect(driver.session).toEqual(nativeSession);
      expect((await driver.submit(turn(2))).handoff).toContain("-2");
      expect(releases).toEqual([{ outcome: "failed", alive: true }, { outcome: "completed", alive: true }]);
      await expect(driver.submit(turn(1))).rejects.toThrow(/duplicate input/);
    } finally { await driver.close(); }
  });
  it.each([
    {
      harnessId: "codex",
      protocol: "codex-app-server",
      sessionId: "pending:fixture",
      codec: () => codexAppServerCodec({
        cwd: process.cwd(), model: "fixture", sandbox: "read-only"
      }),
      handoff: "codex-2",
      recovery: "native-session-resume"
    },
    {
      harnessId: "pi",
      protocol: "pi-rpc",
      sessionId: "pi-session",
      codec: piRpcCodec,
      handoff: "pi-2",
      recovery: "native-session-resume"
    },
    {
      harnessId: "dsh",
      protocol: "dsh-sdk-json-rpc",
      sessionId: "dsh-session",
      codec: dshSdkCodec,
      handoff: "dsh-2",
      recovery: "durable-rehydrate"
    }
  ])("$protocol keeps the same real PID for two completed turns", async (fixture) => {
    const child = await fakeNative(fixture.protocol);
    const activations: string[] = [];
    const released: string[] = [];
    const authority: ResidentTurnAuthorityBroker = {
      activate: async (turn) => {
        if (activations.includes(turn.route.token)) throw new Error("stale token reused");
        activations.push(turn.route.token);
        return {
          inputId: turn.inputId,
          invocationId: turn.invocationId,
          ownershipEpoch: 7,
          release: async (outcome) => { released.push(`${turn.inputId}:${outcome}`); }
        };
      }
    };
    const frames: Array<{ inputId: string; kind: string }> = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session(fixture.harnessId, fixture.sessionId),
      codec: fixture.codec() as ResidentProtocolCodec,
      turnAuthority: authority,
      ownershipEpoch: 7,
      onFrame: (frame, nativeTurn) => {
        frames.push({
          inputId: nativeTurn?.inputId ?? "none",
          kind: String(frame.method ?? frame.type ?? "response")
        });
      }
    });
    const identity = structuredClone(driver.identity);
    const first = await driver.submit(turn(1));
    expect(first.handoff).toContain("-1");
    expect((await driver.probe())).toMatchObject({ alive: true, stopped: false, identity });

    await driver.pause();
    expect((await driver.probe())).toMatchObject({ alive: true, stopped: true, identity });
    await driver.resume();
    expect((await driver.probe())).toMatchObject({ alive: true, stopped: false, identity });

    const second = await driver.submit(turn(2));
    expect(second.handoff).toBe(fixture.handoff);
    expect(driver.identity).toEqual(identity);
    expect(driver.recoveryStrategy).toBe(fixture.recovery);
    expect(activations).toEqual(["turn-token-1", "turn-token-2"]);
    expect(released).toEqual(["input-1:completed", "input-2:completed"]);
    const firstFrames = frames.filter((frame) => frame.inputId === "input-1");
    const secondFrames = frames.filter((frame) => frame.inputId === "input-2");
    expect(firstFrames.length).toBeGreaterThan(1);
    expect(secondFrames.length).toBe(firstFrames.length);
    expect(frames.findLastIndex((frame) => frame.inputId === "input-1"))
      .toBeLessThan(frames.findIndex((frame) => frame.inputId === "input-2"));
    expect(frames.some((frame) => [
      "item/started", "system", "tool_execution_start", "session.event"
    ].includes(frame.kind))).toBe(true);
    // A retained task is not a replay of its original native message. Keep
    // the same real process/session, but issue a distinct transport input.
    await expect(driver.submit({ ...turn(3), inputId: "input-1" }))
      .rejects.toThrow("rejected a duplicate input id");
    const repairInputId = "input-1-mechanism-repair-inv-3";
    const repaired = await driver.submit({ ...turn(3), inputId: repairInputId });
    expect(repaired.handoff).toContain("-3");
    expect(driver.identity).toEqual(identity);
    expect(activations).toEqual(["turn-token-1", "turn-token-2", "turn-token-3"]);
    expect(released).toEqual(["input-1:completed", "input-2:completed", `${repairInputId}:completed`]);
    await driver.close();
    expect((await driver.probe()).alive).toBe(false);
  }, 30_000);

  it.each([
    {
      harnessId: "codex",
      protocol: "codex-app-server",
      sessionId: "pending:fixture",
      codec: () => codexAppServerCodec({
        cwd: process.cwd(), model: "fixture", sandbox: "read-only"
      })
    },
    {
      harnessId: "pi",
      protocol: "pi-rpc",
      sessionId: "pi-session",
      codec: piRpcCodec
    },
    {
      harnessId: "dsh",
      protocol: "dsh-sdk-json-rpc",
      sessionId: "dsh-session",
      codec: dshSdkCodec
    }
  ])("$protocol completes after more than 10,000 valid turn events", async (fixture) => {
    const eventCount = 10_001;
    const child = await fakeNative(
      fixture.protocol,
      longTurnSource(fixture.protocol, eventCount)
    );
    let delivered = 0;
    const driver = await ResidentNativeDriver.open({
      child,
      session: session(fixture.harnessId, fixture.sessionId),
      codec: fixture.codec() as ResidentProtocolCodec,
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: () => { delivered += 1; }
    });

    await expect(driver.submit(turn(1))).resolves.toMatchObject({
      handoff: expect.stringContaining("long-complete")
    });
    expect(delivered).toBeGreaterThan(eventCount);
    expect(driver.protocolBufferState().maxObservedBufferedFrames)
      .toBeLessThanOrEqual(RESIDENT_PROTOCOL_BUFFER_CAPACITY);
    await driver.close();
  }, 60_000);

  it("delivers a legal multi-megabyte native result without truncating the protocol frame", async () => {
    const largeOutput = "x".repeat(2 * 1024 * 1024);
    const child = await fakeNative("pi-rpc", piTurnSource(`const large=${JSON.stringify(largeOutput)}; send({type:'message_update',event:{delta:{text:large}}}); finish('large-result-complete');`));
    let observedLength = 0;
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: (frame) => {
        const event = frame.event as Record<string, unknown> | undefined;
        const delta = event?.delta as Record<string, unknown> | undefined;
        if (typeof delta?.text === "string") observedLength = delta.text.length;
      }
    });

    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "large-result-complete" });
    expect(observedLength).toBe(largeOutput.length);
    expect(driver.protocolBufferState().maxObservedFrameBytes).toBeGreaterThan(2 * 1024 * 1024);
    await driver.close();
  }, 30_000);

  it.each([
    "turn-end-idle-tail",
    "idle-turn-end-tail"
  ] as const)("settles the legal DSH completion order %s", async (mode) => {
    const child = await fakeNative("dsh-sdk-json-rpc", dshCompletionTailSource(mode));
    const delivered: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("dsh", "dsh-session"),
      codec: dshSdkCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: (frame) => {
        const params = frame.params as Record<string, unknown> | undefined;
        const event = params?.event as Record<string, unknown> | undefined;
        delivered.push(String(event?.type ?? params?.status ?? frame.id));
      }
    });

    await expect(driver.submit(turn(1))).resolves.toMatchObject({
      handoff: "dsh-tail-complete"
    });
    expect(delivered).toContain("turn/end");
    expect(delivered.at(-1)).toBe(mode === "turn-end-idle-tail" ? "idle" : "turn/end");
    await driver.close();
  });

  it.each([
    "cross-session",
    "unknown-frame",
    "new-turn",
    "sequence-gap"
  ] as const)("rejects the invalid DSH completion tail %s", async (mode) => {
    const child = await fakeNative("dsh-sdk-json-rpc", dshCompletionTailSource(mode));
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("dsh", "dsh-session"),
      codec: dshSdkCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    });

    await expect(driver.submit(turn(1))).rejects.toThrow(/unexpected completion-tail frame/);
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("requires both DSH idle and turn/end completion evidence", async () => {
    const child = await fakeNative(
      "dsh-sdk-json-rpc",
      dshCompletionTailSource("missing-turn-end")
    );
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("dsh", "dsh-session"),
      codec: dshSdkCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    });

    await expect(driver.submit(turn(1))).rejects.toThrow(
      /completion evidence did not arrive within its bounded window/
    );
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("resumes a large Codex history without hydrating it into one protocol frame", async () => {
    const child = await fakeNative("codex-app-server", `
      const r=require('node:readline').createInterface({input:process.stdin});
      const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
      let retained='retained-native-context';
      r.on('line',line=>{const q=JSON.parse(line);
        if(q.method==='initialize')return send({id:q.id,result:{}});
        if(q.method==='thread/resume'){
          const thread={id:q.params.threadId};
          // Metadata projection changes the reply, never the native session's memory.
          if(!q.params.excludeTurns)thread.turns=[{id:'old-turn',items:[{type:'agentMessage',text:'x'.repeat(${RESIDENT_PROTOCOL_MAX_FRAME_BYTES})}]}];
          return send({id:q.id,result:{thread}});
        }
        if(q.method==='turn/start'){
          send({id:q.id,result:{turn:{id:'next-turn'}}});
          return send({method:'turn/completed',params:{threadId:q.params.threadId,turn:{id:'next-turn',status:'completed',items:[{type:'agentMessage',text:retained}]}}});
        }
        if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
      });
    `);
    const original = {
      ...session("codex", "retained-codex-thread"),
      resumedAt: "2026-10-09T05:00:00.000Z"
    };
    const driver = await ResidentNativeDriver.open({
      child, session: original,
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1
    });

    expect(driver.session).toEqual(original);
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "retained-native-context" });
    expect(driver.protocolBufferState().maxObservedFrameBytes).toBeLessThan(4096);
    await driver.close();
  });

  it("consumes a delayed same-turn Codex usage tail", async () => {
    const child = await fakeNative("codex-app-server", `
      const r=require('node:readline').createInterface({input:process.stdin});
      const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
      r.on('line',line=>{const q=JSON.parse(line);
        if(q.method==='initialize')return send({id:q.id,result:{}});
        if(q.method==='thread/start')return send({id:q.id,result:{thread:{id:'codex-thread'}}});
        if(q.method==='turn/start'){
          const id='turn-tail';
          send({id:q.id,result:{turn:{id}}});
          send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id,status:'completed',items:[{type:'agentMessage',text:'codex-tail-complete'}]}}});
          const usage={totalTokens:5,inputTokens:3,cachedInputTokens:0,outputTokens:2,reasoningOutputTokens:0};
          return setTimeout(()=>send({method:'thread/tokenUsage/updated',params:{threadId:'codex-thread',turnId:id,tokenUsage:{total:usage,last:usage,modelContextWindow:null}}}),20);
        }
        if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
      });
    `);
    const delivered: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({
        cwd: process.cwd(), model: "fixture", sandbox: "read-only"
      }),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: (frame) => { delivered.push(String(frame.method ?? frame.id)); }
    });

    await expect(driver.submit(turn(1))).resolves.toMatchObject({
      handoff: "codex-tail-complete"
    });
    expect(delivered.at(-1)).toBe("thread/tokenUsage/updated");
    await driver.close();
  });

  it.each([2, RESIDENT_PROTOCOL_BUFFER_CAPACITY + 8])(
    "preserves a finite %i-frame completion tail through slow durable delivery",
    async (frameCount) => {
      const child = await fakeNative("codex-app-server", codexUsageTailSource(frameCount));
      let beginPersistence!: () => void;
      const persistenceStarted = new Promise<void>((resolve) => { beginPersistence = resolve; });
      let finishPersistence!: () => void;
      const persistence = new Promise<void>((resolve) => { finishPersistence = resolve; });
      const persisted: number[] = [];
      const releases: string[] = [];
      const driver = await ResidentNativeDriver.open({
        child, session: session("codex", "pending:fixture"),
        codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
        turnAuthority: { activate: async (value) => ({
          inputId: value.inputId, invocationId: value.invocationId, ownershipEpoch: 1,
          release: (outcome) => { releases.push(outcome); }
        }) },
        ownershipEpoch: 1,
        onFrame: async (frame) => {
          if (frame.method !== "thread/tokenUsage/updated") return;
          if (persisted.length === 0) {
            beginPersistence();
            await persistence;
          }
          persisted.push(Number((frame.params as { tokenUsage: { total: { totalTokens: number } } })
            .tokenUsage.total.totalTokens));
        }
      });
      const submission = driver.submit(turn(1));
      // Observe any rejection immediately while the deliberately slow local write is pending.
      const result = submission.then(value => ({ value }), error => ({ error }));
      await persistenceStarted;
      if (frameCount > RESIDENT_PROTOCOL_BUFFER_CAPACITY) {
        await expect.poll(() => driver.protocolBufferState().backpressured).toBe(true);
        expect(driver.protocolBufferState().maxObservedBufferedFrames)
          .toBe(RESIDENT_PROTOCOL_BUFFER_CAPACITY);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      expect(releases).toEqual([]);
      finishPersistence();

      expect(await result).toMatchObject({ value: { handoff: "codex-tail-complete" } });
      expect(persisted).toEqual(Array.from({ length: frameCount }, (_, index) => index + 1));
      expect(releases).toEqual(["completed"]);
      await driver.close();
    }
  );

  it("keeps the native quiet deadline when a late finite tail has slow delivery", async () => {
    const child = await fakeNative("codex-app-server", codexUsageTailSource(19, 50));
    const driver = await ResidentNativeDriver.open({
      child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1,
      onFrame: async (frame) => {
        if (frame.method === "thread/tokenUsage/updated" &&
          (frame.params as { tokenUsage: { total: { totalTokens: number } } })
            .tokenUsage.total.totalTokens === 19) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    });

    await expect(driver.submit(turn(1))).rejects.toThrow(
      /completion tail did not quiesce within its bounded window/
    );
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("still stops a continuously producing native completion tail during slow delivery", async () => {
    const child = await fakeNative("codex-app-server", codexUsageTailSource("continuous"));
    const releases: Array<{ outcome: string; alive: boolean }> = [];
    const driver = await ResidentNativeDriver.open({
      child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: { activate: async (value) => ({
        inputId: value.inputId, invocationId: value.invocationId, ownershipEpoch: 1,
        release: async (outcome) => { releases.push({ outcome, alive: (await driver.probe()).alive }); }
      }) },
      ownershipEpoch: 1,
      onFrame: async (frame) => {
        if (frame.method === "thread/tokenUsage/updated") {
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    });

    await expect(driver.submit(turn(1))).rejects.toThrow(
      /completion tail did not quiesce within its bounded window/
    );
    expect(releases).toEqual([{ outcome: "failed", alive: false }]);
  });

  it("holds the Pi turn through the native two-second retry backoff and isolates the next turn", async () => {
    const child = await fakeNative("pi-rpc", piRetrySource("retry"));
    const released: string[] = [];
    const frames: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child, session: session("pi", "pi-session"), codec: piRpcCodec(),
      turnAuthority: {
        activate: async (value) => ({
          inputId: value.inputId, invocationId: value.invocationId, ownershipEpoch: 1,
          release: (outcome) => { released.push(`${value.inputId}:${outcome}`); }
        })
      },
      ownershipEpoch: 1,
      onFrame: (frame) => { frames.push(String(frame.type)); }
    });
    const result = driver.submit(turn(1));
    await expect.poll(() => frames.includes("auto_retry_start")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    expect(released).toEqual([]);
    expect(driver.activityState()?.invocationId).toBe("inv-1");
    await expect(driver.submit(turn(2))).rejects.toThrow(/concurrent/);
    await expect(driver.pause()).rejects.toThrow(/busy/);
    await expect(result).resolves.toMatchObject({ handoff: "pi-retry-final" });
    expect(frames.filter((type) => type === "auto_retry_end")).toHaveLength(1);
    expect(released).toEqual(["input-1:completed"]);
    await expect(driver.submit(turn(2))).resolves.toMatchObject({ handoff: "pi-next-turn" });
    expect(released).toEqual(["input-1:completed", "input-2:completed"]);
    await driver.close();
  });

  it.each(["multiple", "stale-read", "tools", "compaction", "overflow"] as const)(
    "waits for the final Pi agent_end and current text after %s", async (mode) => {
      const child = await fakeNative("pi-rpc", piRetrySource(mode));
      let released = false;
      const driver = await ResidentNativeDriver.open({
        child, session: session("pi", "pi-session"), codec: piRpcCodec(),
        turnAuthority: { activate: async (value) => ({
          inputId: value.inputId, invocationId: value.invocationId, ownershipEpoch: 1,
          release: () => { released = true; }
        }) },
        ownershipEpoch: 1,
        onFrame: (frame) => {
          if (frame.type === "tool_execution_start" || frame.type === "compaction_end") {
            expect(released).toBe(false);
          }
        }
      });
      await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "pi-retry-final" });
      expect(released).toBe(true);
      await driver.close();
    }
  );

  it.each([
    ["cross-session", /different native session identity/],
    ["missing-final", /no valid activity/],
    ["exhausted", /automatic retry failed/],
    ["cancelled", /Retry cancelled/],
    ["late-activity", /late activity/],
    ["duplicate-end", /duplicate agent_end/],
    ["bad-attempt", /invalid automatic retry evidence/],
    ["unknown-frame", /unknown or out-of-turn/],
    ["missing-retry-end", /without auto_retry_end/],
    ["overflow-exhausted", /Pi compaction failed: Context overflow recovery failed/],
    ["exit", /process exited/],
    ["error", /turn ended with error/],
    ["aborted", /turn ended with aborted/]
  ] as const)("stops Pi before failed authority release for %s", async (mode, error) => {
    const child = await fakeNative("pi-rpc", piRetrySource(mode));
    const releases: unknown[] = [];
    const driver = await ResidentNativeDriver.open({
      child, session: session("pi", "pi-session"), codec: piRpcCodec(),
      turnAuthority: { activate: async (value) => ({
        inputId: value.inputId, invocationId: value.invocationId, ownershipEpoch: 1,
        release: async (outcome) => { releases.push({ outcome, alive: (await driver.probe()).alive }); }
      }) },
      ownershipEpoch: 1,
      inactivityPolicy: { modelTimeoutMs: 350, toolTimeoutMs: 350 }
    });
    await expect(driver.submit(turn(1))).rejects.toThrow(error);
    expect(releases).toEqual([{ outcome: "failed", alive: false }]);
  });

  it("backpressures an unlimited fast producer while keeping the frame queue bounded", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`(async()=>{for(let seq=0;;seq++){if(!send({type:'message_update',event:{seq}}))await new Promise(ok=>process.stdout.once('drain',ok));}})();`));
    let releaseFirstFrame!: () => void;
    const firstFrameBlocked = new Promise<void>((resolve) => {
      releaseFirstFrame = resolve;
    });
    let block = true;
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: async () => {
        if (!block) return;
        block = false;
        await firstFrameBlocked;
      }
    });
    const submission = driver.submit(turn(1));

    await expect.poll(() => driver.protocolBufferState(), { timeout: 10_000 })
      .toMatchObject({
        bufferedFrames: RESIDENT_PROTOCOL_BUFFER_CAPACITY,
        capacity: RESIDENT_PROTOCOL_BUFFER_CAPACITY,
        backpressured: true
      });
    expect(driver.protocolBufferState().maxObservedBufferedFrames)
      .toBe(RESIDENT_PROTOCOL_BUFFER_CAPACITY);

    child.kill("SIGKILL");
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
    releaseFirstFrame();
    await expect(submission).rejects.toThrow(/exited while awaiting a protocol frame/);
  }, 30_000);

  it("accepts an exact large native user input split into its normal text blocks", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`const text=q.message,index=text.indexOf('\\n'); send({type:'message_end',message:{role:'user',content:[{type:'text',text:text.slice(0,index)},{type:'output_text',text:text.slice(index+1)}]}});finish('split-input-complete');`));
    const received: unknown[] = [], driver = await ResidentNativeDriver.open({ child, session: session("pi", "pi-session"),
      codec: piRpcCodec(), turnAuthority: inertAuthority(), ownershipEpoch: 1,
      onFrame: frame => { if (frame.type === "message_end") received.push(frame.message); } });
    try {
      await expect(driver.submit({ ...turn(1), prompt: "Exact first block\n" + "原样长输入".repeat(600_000) })).resolves.toMatchObject({ handoff: "split-input-complete" });
      expect(received).toHaveLength(1); expect(driver.protocolBufferState().maxObservedFrameBytes).toBeGreaterThan(RESIDENT_PROTOCOL_MAX_FRAME_BYTES);
    } finally { await driver.close(); }
  }, 30_000);

  it("backpressures repeated exact oversized input frames while their original durable sink is held", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`for(let index=0;index<4;index++)send({type:'message_end',message:{role:'user',content:[{type:'text',text:q.message}]}});finish('exact-large-input-complete');`));
    let release!: () => void, entered!: () => void, count = 0;
    const gate = new Promise<void>(resolve => { release = resolve; }), received = new Promise<void>(resolve => { entered = resolve; });
    const driver = await ResidentNativeDriver.open({ child, session: session("pi", "pi-session"), codec: piRpcCodec(),
      turnAuthority: inertAuthority(), ownershipEpoch: 1, onFrame: async frame => {
        if (frame.type === "message_end" && ++count === 1) { entered(); await gate; }
      } });
    const running = driver.submit({ ...turn(1), prompt: "complete-bound-input ".repeat(500_000) });
    try {
      await Promise.race([received, running.then(() => { throw new Error("Input ended before its durable sink"); })]);
      await expect.poll(() => driver.protocolBufferState().backpressured).toBe(true);
      expect(driver.protocolBufferState().oversizedBufferedFrames).toBe(2);
      expect(driver.protocolBufferState().maxObservedOversizedFrames).toBe(2);
      release(); await expect(running).resolves.toMatchObject({ handoff: "exact-large-input-complete" });
      expect(count).toBe(4); expect(driver.protocolBufferState().oversizedBufferedFrames).toBe(0);
    } finally { release(); await driver.close(); }
  }, 30_000);

  it.each(["assistant", "foreign-session", "changed-input", "metadata", "tool-result"])(
    "rejects an oversized %s frame while an exact large input is bound", async mode => {
      const child = await fakeNative("pi-rpc", piTurnSource(`const mode=${JSON.stringify(mode)};const message={role:'user',content:[{type:'text',text:q.message}]}; const frame={type:'message_end',sessionId:'pi-session',message};if(mode==='assistant'){frame.message={...message,role:'assistant'};}if(mode==='foreign-session')frame.sessionId='foreign-native-session';if(mode==='changed-input')frame.message={...message,content:[{type:'text',text:'X'+q.message.slice(1)}]};if(mode==='metadata')frame.padding='m'.repeat(64*1024+1);if(mode==='tool-result')frame.message={...message,content:[{type:'tool_result',tool_use_id:'other-call',content:q.message}]};send(frame);`));
      const observed = vi.fn(), driver = await ResidentNativeDriver.open({ child, session: session("pi", "pi-session"),
        codec: piRpcCodec(), turnAuthority: inertAuthority(), ownershipEpoch: 1, onFrame: frame => { if(frame.type === "message_end") observed(frame); } });
      await expect(driver.submit({ ...turn(1), prompt: "large-bound-input ".repeat(600_000) })).rejects.toThrow(mode === "foreign-session" ? /different native session identity/ : /frame exceeded its byte limit/);
      expect(observed).not.toHaveBeenCalled();
      await expect.poll(async () => (await driver.probe()).alive).toBe(false);
    }, 30_000);

  it("retains the per-frame byte limit independently of turn length", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`process.stdout.write('x'.repeat(${RESIDENT_PROTOCOL_MAX_FRAME_BYTES + 1})+'\\n');`));
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    });

    await expect(driver.submit(turn(1))).rejects.toThrow(/frame exceeded its byte limit/);
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("does not let meaningless protocol noise refresh resident inactivity", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`const timer=setInterval(()=>send({type:'queue_update'}),5);process.on('exit',()=>clearInterval(timer));`));
    const traces: Array<Record<string, unknown> | undefined> = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      inactivityPolicy: { modelTimeoutMs: 50, toolTimeoutMs: 500 },
      onTrace: (_kind, _message, data) => { traces.push(data); }
    });

    await expect(driver.submit(turn(1))).rejects.toMatchObject({
      code: "INVOCATION_TIMED_OUT",
      details: expect.objectContaining({
        operation: "Resident turn inactivity",
        deadlineType: "model-activity-idle",
        lastActivityType: "turn.started"
      })
    });
    expect(traces).toContainEqual(expect.objectContaining({
      diagnostic: true,
      deadlineType: "model-activity-idle",
      lastActivityType: "turn.started",
      toolSteps: 0
    }));
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("requires explicit provenance for a recovered DSH durable rehydrate", async () => {
    const child = await fakeNative("dsh-sdk-json-rpc");
    const authority: ResidentTurnAuthorityBroker = {
      activate: async (value) => ({
        inputId: value.inputId,
        invocationId: value.invocationId,
        ownershipEpoch: 8,
        release: () => undefined
      })
    };
    const driver = await ResidentNativeDriver.open({
      child,
      session: { ...session("dsh", "new-dsh-session"), resumedAt: "2026-09-22T01:00:00.000Z" },
      codec: dshSdkCodec(),
      turnAuthority: authority,
      ownershipEpoch: 8
    });
    await expect(driver.submit(turn(3))).rejects.toThrow(/explicit provenance/);
    await expect(driver.submit({
      ...turn(3),
      durableRehydrate: {
        sourceDigest: createHash("sha256")
          .update("turn-one-marker\nturn-two-marker")
          .digest("hex"),
        lastBusinessTurn: 2,
        lastInputId: "input-2",
        transcript: "turn-one-marker\nturn-two-marker"
      }
    })).resolves.toMatchObject({ handoff: "dsh-1" });
    await driver.close();
  });

  it("continues a validated fixed DSH native session without rehydrate provenance", async () => {
    const child = await fakeNative("dsh-sdk-json-rpc");
    const driver = await ResidentNativeDriver.open({ child,
      session: { ...session("dsh", "fixed-dsh-session"), resumedAt: "2026-09-22T01:00:00.000Z" },
      codec: dshSdkCodec({ nativeSessionResume: true, expectedSessionId: "fixed-dsh-session" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "dsh-1" });
    expect(driver.session.nativeId).toBe("fixed-dsh-session");
    expect(driver.recoveryStrategy).toBe("native-session-resume");
    await driver.close();
  });

  it("continues from the official DSH resume sequence instead of accepting a new log", async () => {
    const child = await fakeNative("dsh-sdk-json-rpc", fakeSources["dsh-sdk-json-rpc"]!.replace("seq=0", "seq=101"));
    const driver = await ResidentNativeDriver.open({ child,
      session: { ...session("dsh", "fixed-dsh-session"), resumedAt: "2026-09-22T01:00:00.000Z" },
      codec: dshSdkCodec({ nativeSessionResume: true }), turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "dsh-1" });
    await driver.close();
  });

  it.each(["error", "aborted", "interrupted", "blocked", "max-tokens"])("rejects DSH %s turn completion", async kind => {
    const child = await fakeNative("dsh-sdk-json-rpc",
      fakeSources["dsh-sdk-json-rpc"]!.replace("reason:{kind:'completed'}", `reason:{kind:${JSON.stringify(kind)}}`));
    const driver = await ResidentNativeDriver.open({ child, session: session("dsh", "dsh-session"),
      codec: dshSdkCodec(), turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.submit(turn(1))).rejects.toThrow(/ended without success/);
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it.each(["active", "tail", "idle", "child-failure", "resume", "rejected-resume", "late"])("keeps Codex native subagents inside their parent execution (%s)", async mode => {
    const child = await fakeNative("codex-app-server", codexSubagentSource(mode));
    const delivered: Array<{ frame: Readonly<Record<string, unknown>>; turn?: ResidentTurn }> = [];
    const releases: string[] = [];
    const parentUsage: Array<number | undefined> = [];
    const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: { activate: async value => ({ inputId: value.inputId, invocationId: value.invocationId,
        ownershipEpoch: 1, release: outcome => { releases.push(`${value.inputId}:${outcome}`); } }) },
      ownershipEpoch: 1, onFrame: (frame, turn) => {
        delivered.push({ frame, turn });
        if (frame.method === "turn/completed" && (frame.params as { threadId?: string })?.threadId === "codex-thread") parentUsage.push(driver.activityState()?.knownUsage?.totalTokens);
      } });
    const identity = driver.identity;
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "parent-1", threadId: "codex-thread" });
    if (mode === "idle") await new Promise(resolve => setTimeout(resolve, 250));
    await expect(driver.submit(turn(2))).resolves.toMatchObject({ handoff: "parent-2" });
    expect(driver.identity).toEqual(identity);
    expect(driver.session.nativeId).toBe("codex-thread");
    expect(releases).toEqual(["input-1:completed", "input-2:completed"]);
    const childMessages = delivered.filter(({ frame }) => ["child-thread", "grandchild-thread"].includes(
      (frame.params as { threadId?: string } | undefined)?.threadId ?? ""));
    if (mode === "late") {
      expect(childMessages.length).toBeGreaterThan(0);
      expect(childMessages.every(event => event.turn?.inputId === "input-1")).toBe(true);
    } else expect(childMessages).toEqual([]);
    expect(delivered.filter(({ frame }) => frame.method === "turn/completed" &&
      (frame.params as { threadId?: string })?.threadId === "codex-thread")).toHaveLength(2);
    expect(parentUsage).toEqual([17, 17]);
    expect((await driver.probe()).alive).toBe(true);
    await driver.close();
  });

  it.each(["foreign-turn", "wrong-child-turn", "missing-child-turn", "bad-status", "bad-flag", "missing-thread", "request-frame", "bad-spawn"])(
    "rejects invalid Codex subagent protocol evidence (%s)", async mode => {
      const child = await fakeNative("codex-app-server", codexSubagentSource(mode));
      const releases: string[] = [];
      const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
        codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
        turnAuthority: { activate: async value => ({ inputId: value.inputId, invocationId: value.invocationId,
          ownershipEpoch: 1, release: outcome => { releases.push(outcome); } }) }, ownershipEpoch: 1 });
      await expect(driver.submit(turn(1))).rejects.toMatchObject({ code: "HARNESS_CONTRACT_VIOLATION" });
      expect(releases).toEqual(["failed"]);
      expect((await driver.probe()).alive).toBe(false);
    }
  );

  it("lets Codex retry a valid error notification under the same native turn", async () => {
    const source = fakeSources["codex-app-server"]!.replace("return send({method:'turn/completed'",
      "send({method:'error',params:{threadId:'codex-thread',turnId:id,willRetry:true,error:{message:'temporary provider failure',additionalDetails:null}}}); return send({method:'turn/completed'");
    const child = await fakeNative("codex-app-server", source);
    const onFrame = vi.fn();
    const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1, onFrame });
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "codex-1" });
    expect(onFrame).toHaveBeenCalledWith(expect.objectContaining({ method: "error" }), expect.objectContaining({ invocationId: "inv-1" }));
    await expect(driver.submit(turn(2))).resolves.toMatchObject({ handoff: "codex-2" });
    await driver.close();
  });

  it.each(["thread", "turn", "retry-flag", "message"])("rejects an invalid Codex %s error notification", async (invalid) => {
    const params: Record<string, unknown> = { threadId: "codex-thread", turnId: "turn-1", willRetry: true, error: { message: "temporary provider failure" } };
    if (invalid === "thread") params.threadId = "another-thread";
    if (invalid === "turn") params.turnId = "another-turn";
    if (invalid === "retry-flag") delete params.willRetry;
    if (invalid === "message") params.error = { message: 123 };
    const source = fakeSources["codex-app-server"]!.replace("return send({method:'turn/completed'",
      `send(${JSON.stringify({ method: "error", params })}); return send({method:'turn/completed'`);
    const child = await fakeNative("codex-app-server", source);
    const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.submit(turn(1))).rejects.toThrow(/invalid or out-of-turn error notification/);
  });

  it("retains a redacted provider reason after a terminal failed Codex turn", async () => {
    const source = fakeSources["codex-app-server"]!.replace("status:'completed',items:",
      "status:'failed',error:{message:'rate limit: api_key=secret-fixture-value'},items:");
    const child = await fakeNative("codex-app-server", source);
    const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    const failure = await driver.submit(turn(1)).catch(error => error as Error);
    expect(failure.message).toContain("rate limit");
    expect(failure.message).not.toContain("secret-fixture-value");
  });

  it("rejects an unknown Codex initialization notification instead of assigning it to turn one", async () => {
    const child = await fakeNative("codex-app-server", `
      const r=require('node:readline').createInterface({input:process.stdin});
      const s=v=>process.stdout.write(JSON.stringify(v)+'\\n');
      r.on('line',line=>{const q=JSON.parse(line);
        if(q.method==='initialize') return s({id:q.id,result:{}});
        if(q.method==='thread/start') {
          s({id:q.id,result:{thread:{id:'codex-thread'}}});
          return s({method:'account/updated',params:{accountId:'unexpected'}});
        }
      });
    `);
    await expect(ResidentNativeDriver.open({
      child,
      session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({
        cwd: process.cwd(), model: "fixture", sandbox: "read-only"
      }),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    })).rejects.toThrow(/unexpected frame after native session initialization/);
  });

  it("rejects a known Codex initialization method whose params do not match its schema", async () => {
    const child = await fakeNative("codex-app-server", `
      const r=require('node:readline').createInterface({input:process.stdin});
      const s=v=>process.stdout.write(JSON.stringify(v)+'\\n');
      r.on('line',line=>{const q=JSON.parse(line);
        if(q.method==='initialize') return s({id:q.id,result:{}});
        if(q.method==='thread/start') {
          s({id:q.id,result:{thread:{id:'codex-thread'}}});
          return s({method:'configWarning',params:{message:'legacy shape must fail closed'}});
        }
      });
    `);
    await expect(ResidentNativeDriver.open({
      child,
      session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({
        cwd: process.cwd(), model: "fixture", sandbox: "read-only"
      }),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    })).rejects.toThrow(/unexpected frame after native session initialization/);
  });

  it("preserves a shutdown protocol failure instead of replacing it with the containment signal", async () => {
    const child = await fakeNative("pi-rpc", `${fakeSources["pi-rpc"]}
      process.stdin.on('end', () => { process.stdout.write('malformed shutdown frame\\n'); });
      setInterval(() => {}, 1000);
    `);
    const driver = await ResidentNativeDriver.open({ child, session: session("pi", "pi-session"),
      codec: piRpcCodec(), turnAuthority: inertAuthority(), ownershipEpoch: 1 });
    await expect(driver.close()).rejects.toThrow("Resident native protocol emitted malformed JSON");
    expect((await driver.probe()).alive).toBe(false);
  });

  it("allows close to be retried after graceful protocol shutdown fails", async () => {
    const child = await fakeNative("pi-rpc");
    let closeAttempts = 0;
    const base = piRpcCodec();
    const codec: ResidentProtocolCodec = {
      ...base,
      close: async () => {
        closeAttempts += 1;
        throw new Error("fixture graceful close failed");
      }
    };
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec,
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    });
    await expect(driver.close()).rejects.toThrow(/fixture graceful close failed/);
    expect((await driver.probe()).alive).toBe(false);
    await expect(driver.close()).resolves.toBeUndefined();
    expect(closeAttempts).toBe(1);
  });

  it.each([
    { harnessId: "codex", protocol: "codex-app-server", nativeId: "pending:fixture", codec: () => codexAppServerCodec({ cwd: process.cwd(), model: "fixture", sandbox: "read-only" }) },
    { harnessId: "pi", protocol: "pi-rpc", nativeId: "pi-session", codec: piRpcCodec },
    { harnessId: "dsh", protocol: "dsh-sdk-json-rpc", nativeId: "dsh-session", codec: dshSdkCodec }
  ].flatMap(fixture => [true, false].map(waitForExit => ({ ...fixture, waitForExit }))))(
    "settles a paused never-input $harnessId lease after ProcessHost cancellation (waitForExit=$waitForExit)", async fixture => {
    const runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-aborted-resident-"));
    roots.push(runtimePath);
    const controller = new AbortController();
    const managed = new CommonProcessHost().startRaw({
      command: process.execPath, args: ["-e", fakeSources[fixture.protocol]!],
      cwd: runtimePath, env: process.env, eventFormat: "jsonl", rawLogLimitBytes: 1024,
      session: session(fixture.harnessId, fixture.nativeId)
    }, controller.signal);
    children.push(managed.child);
    const driver = await ResidentNativeDriver.open({
      child: managed.child, session: session(fixture.harnessId, fixture.nativeId),
      codec: fixture.codec(), turnAuthority: inertAuthority(), ownershipEpoch: 1,
      processCompletion: managed.completed, processSignal: controller.signal
    });
    const manager = new ResidentLeaseManager();
    await manager.open({ executionId: "cancel-before-input", harnessId: fixture.harnessId,
      ownershipEpoch: 1, runtimePath, workspacePath: runtimePath, driver });
    const authority = { executionId: "cancel-before-input", harnessId: fixture.harnessId, ownershipEpoch: 1 };
    const paused = await manager.pause({ ...authority, controlSeq: 1 });
    expect(paused).toMatchObject({ state: "paused", inputStarted: false });
    controller.abort();
    if (fixture.waitForExit) {
      await managed.completed.catch(() => undefined);
      await managed.waitForQuiescence();
      expect((await driver.probe()).alive).toBe(false);
    }
    const stopped = await manager.close({ ...authority, controlSeq: 2 });
    await managed.completed.catch(() => undefined);
    await managed.waitForQuiescence();
    expect(stopped).toMatchObject({ state: "stopped", inputStarted: false,
      controlSeq: 2, acknowledgedControlSeq: 2, pid: paused.pid, startTicks: paused.startTicks,
      session: paused.session, ownershipEpoch: 1 });
    expect(JSON.parse(await fs.readFile(path.join(runtimePath, "resident-process.json"), "utf8"))).toEqual(stopped);
  }, 20_000);

  it.runIf(process.platform === "linux")("closes the captured process group when its native leader already exited", async () => {
    const runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-orphan-resident-"));
    roots.push(runtimePath);
    const pidFile = path.join(runtimePath, "descendant.pid");
    const managed = new CommonProcessHost().startRaw({
      command: process.execPath, args: ["-e", `${fakeSources["pi-rpc"]}
        const child = require('node:child_process').spawn(process.execPath,
          ['-e', 'process.on("SIGTERM",()=>{});setInterval(()=>{},1000)'], {stdio:'ignore'});
        require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));`],
      cwd: runtimePath, env: process.env, eventFormat: "jsonl", rawLogLimitBytes: 1024,
      session: session("pi", "pi-session")
    }, new AbortController().signal);
    children.push(managed.child);
    try {
      const driver = await ResidentNativeDriver.open({ child: managed.child,
        session: session("pi", "pi-session"), codec: piRpcCodec(),
        turnAuthority: inertAuthority(), ownershipEpoch: 1 });
      await vi.waitFor(async () => expect(await fs.readFile(pidFile, "utf8")).toMatch(/^\d+$/));
      const descendant = Number(await fs.readFile(pidFile, "utf8"));
      expect((await readResidentProcessIdentity(descendant)).processGroupId).toBe(driver.identity.processGroupId);
      managed.child.kill("SIGKILL");
      await managed.completed;
      expect((await driver.probe()).alive).toBe(false);
      await driver.close();
      await vi.waitFor(async () => {
        const status = await fs.readFile(`/proc/${descendant}/status`, "utf8").catch(error => {
          if (error.code === "ENOENT") return "";
          throw error;
        });
        expect(status === "" || /^State:\s+Z\b/m.test(status)).toBe(true);
      });
    } finally {
      await terminateProcessTree(managed.child, { initialSignal: "SIGKILL", killAfterMs: 0 });
    }
  });

  it.each([false, true])("requires the trusted host cancellation for an interrupted shutdown response (cancelled=%s)", async cancelled => {
    const child = await fakeNative("pi-rpc");
    const controller = new AbortController();
    const driver = await ResidentNativeDriver.open({ child,
      session: session("pi", "pi-session"), turnAuthority: inertAuthority(), ownershipEpoch: 1,
      processSignal: controller.signal,
      codec: { ...piRpcCodec(), close: async () => {
        if (cancelled) controller.abort();
        throw new Error("fixture interrupted shutdown response");
      } }
    });
    if (cancelled) await expect(driver.close()).resolves.toBeUndefined();
    else await expect(driver.close()).rejects.toThrow("fixture interrupted shutdown response");
    expect((await driver.probe()).alive).toBe(false);
  });

  it("rejects a Pi process that reports a different official session identity", async () => {
    const child = await fakeNative("pi-rpc");
    await expect(ResidentNativeDriver.open({
      child,
      session: session("pi", "expected-pi-session"),
      codec: piRpcCodec({ expectedSessionId: "expected-pi-session" }),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    })).rejects.toThrow(/different native session identity/);
  });

  it("rejects DSH durable recovery that collides with its source native session", async () => {
    const child = await fakeNative("dsh-sdk-json-rpc");
    await expect(ResidentNativeDriver.open({
      child,
      session: { ...session("dsh", "source-session"), resumedAt: "2026-09-22T01:00:00.000Z" },
      codec: dshSdkCodec({
        expectedSessionId: "source-session",
        recoverySourceSessionId: "source-session"
      }),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1
    })).rejects.toThrow(/reused the source native session identity/);
  });

  it("fails closed instead of attributing an unknown idle frame to the active turn", async () => {
    const child = await fakeNative("pi-rpc", piTurnSource(`send({type:'message_update'});send({type:'fixture-unknown-frame'});`));
    const delivered: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      turnAuthority: inertAuthority(),
      ownershipEpoch: 1,
      onFrame: (frame) => { delivered.push(String(frame.type)); }
    });
    await expect(driver.submit(turn(1))).rejects.toThrow(/unknown or out-of-turn frame/);
    expect(delivered).toEqual(["response", "message_update"]);
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("releases a mismatched broker acknowledgement and kills the resident process", async () => {
    const child = await fakeNative("pi-rpc");
    const released: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      ownershipEpoch: 7,
      turnAuthority: {
        activate: async (value) => ({
          inputId: value.inputId,
          invocationId: value.invocationId,
          ownershipEpoch: 6,
          release: (outcome) => { released.push(outcome); }
        })
      }
    });
    await expect(driver.submit(turn(1))).rejects.toThrow(/mismatched acknowledgement/);
    expect(released).toEqual(["failed"]);
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
  });

  it("rejects reused per-turn routes and control capabilities before broker activation", async () => {
    const child = await fakeNative("pi-rpc");
    const activations: string[] = [];
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      ownershipEpoch: 1,
      turnAuthority: {
        activate: async (value) => {
          activations.push(value.inputId);
          return {
            inputId: value.inputId,
            invocationId: value.invocationId,
            ownershipEpoch: 1,
            release: () => undefined
          };
        }
      }
    });
    const first = turn(1);
    await driver.submit(first);
    await expect(driver.submit({
      ...turn(2),
      route: { baseUrl: "http://127.0.0.1:49999/v1", token: first.route.token }
    })).rejects.toThrow(/stale per-turn route/);
    await expect(driver.submit({
      ...turn(3),
      controlCapability: first.controlCapability
    })).rejects.toThrow(/stale per-turn control capability/);
    expect(activations).toEqual(["input-1"]);
    expect((await driver.probe()).alive).toBe(true);
    await driver.close();
  });

  it("observes a retained ProcessHost callback failure and terminates the process", async () => {
    const child = await fakeNative("pi-rpc");
    let failCompletion!: (error: Error) => void;
    const processCompletion = new Promise<never>((_resolve, reject) => {
      failCompletion = reject;
    });
    const driver = await ResidentNativeDriver.open({
      child,
      session: session("pi", "pi-session"),
      codec: piRpcCodec(),
      ownershipEpoch: 1,
      turnAuthority: inertAuthority(),
      processCompletion
    });
    failCompletion(new Error("fixture trace callback rejected"));
    await expect.poll(async () => (await driver.probe()).alive).toBe(false);
    await expect(driver.submit(turn(1))).rejects.toThrow(/callback failed/);
  });
});

function piTurnSource(onPrompt: string): string {
  return `
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=value=>process.stdout.write(JSON.stringify(value)+'\\n');
    let lastText='';
    const finish=text=>{lastText=text;send({type:'agent_end',messages:[{role:'assistant',content:[{type:'text',text}]}]});};
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.type==='get_state')return send({id:q.id,type:'response',command:'get_state',success:true,data:{isStreaming:false,sessionId:'pi-session'}});
      if(q.type==='get_last_assistant_text')return send({id:q.id,type:'response',command:'get_last_assistant_text',success:true,data:{text:lastText}});
      if(q.type!=='prompt')throw new Error('Unexpected Pi fixture command');
      send({id:q.id,type:'response',command:'prompt',success:true});
      ${onPrompt}
    });
  `;
}

function codexSubagentSource(mode: string): string {
  return `
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    const mode=${JSON.stringify(mode)}; let turn=0;
    const status=(threadId,type='idle')=>send({method:'thread/status/changed',params:{threadId,status:type==='active'?{type,activeFlags:[]}:{type}}});
    const collab=(threadId,turnId,id,receiver,completed)=>send({method:completed?'item/completed':'item/started',params:{threadId,turnId,item:{type:'collabAgentToolCall',id,tool:mode==='resume'&&threadId==='codex-thread'?'resumeAgent':'spawnAgent',status:completed?'completed':'inProgress',senderThreadId:threadId,receiverThreadIds:completed?[receiver]:[],agentsStates:{}}}});
    const childEvents=()=>{
      const tid='child-turn-'+turn;
      status('child-thread','active');
      send({method:'turn/started',params:{threadId:'child-thread',turn:{id:tid,status:'inProgress',items:[]}}});
      send({method:'item/completed',params:{threadId:'child-thread',turnId:tid,item:{id:'child-user-'+turn,type:'userMessage',content:[{type:'text',text:'Internal child input, not the parent receipt.'}]}}});
      collab('child-thread',tid,'nested-'+turn,'grandchild-thread',false);
      status('grandchild-thread');
      collab('child-thread',tid,'nested-'+turn,'grandchild-thread',true);
      send({method:'turn/started',params:{threadId:'grandchild-thread',turn:{id:'grand-turn-'+turn,status:'inProgress',items:[]}}});
      send({method:'turn/completed',params:{threadId:'grandchild-thread',turn:{id:'grand-turn-'+turn,status:'completed',items:[{type:'agentMessage',text:'Not the parent result.'}]}}});
      send({method:'item/started',params:{threadId:'child-thread',turnId:tid,item:{type:'commandExecution',id:'child-tool-'+turn,command:'fixture'}}});
      send({method:'item/completed',params:{threadId:'child-thread',turnId:tid,item:{type:'commandExecution',id:'child-tool-'+turn,status:'completed'}}});
      send({method:'error',params:{threadId:'child-thread',turnId:tid,willRetry:true,error:{message:'child retry',additionalDetails:null}}});
      send({method:'turn/completed',params:{threadId:'child-thread',turn:{id:tid,status:mode==='child-failure'?'failed':'completed',items:[{type:'agentMessage',text:'Not the parent result.'}]}}});
      const usage={totalTokens:2,inputTokens:1,cachedInputTokens:0,outputTokens:1,reasoningOutputTokens:0};
      send({method:'thread/tokenUsage/updated',params:{threadId:'child-thread',turnId:tid,tokenUsage:{total:usage,last:usage,modelContextWindow:null}}});
      status('child-thread');
      send({method:'thread/closed',params:{threadId:'child-thread'}});
    };
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize')return send({id:q.id,result:{}});
      if(q.method==='thread/start')return send({id:q.id,result:{thread:{id:'codex-thread'}}});
      if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
      if(q.method!=='turn/start')return;
      turn++; const tid='turn-'+turn;
      send({id:q.id,result:{turn:{id:tid}}});
      const usage={totalTokens:17,inputTokens:10,cachedInputTokens:0,outputTokens:7,reasoningOutputTokens:0};
      send({method:'thread/tokenUsage/updated',params:{threadId:'codex-thread',turnId:tid,tokenUsage:{total:usage,last:usage,modelContextWindow:null}}});
      if(mode!=='late'||turn===1){
      collab('codex-thread',tid,'spawn-'+turn,'child-thread',false);
      // Native 0.153.4 broadcasts these before the spawn result identifies the child.
      status('child-thread');
      send({method:'warning',params:{threadId:'child-thread',message:'Native child warning'}});
      if(mode==='bad-spawn')return collab('codex-thread',tid,'spawn-'+turn,'codex-thread',true);
      collab('codex-thread',tid,'spawn-'+turn,'child-thread',true);
      }
      if(mode==='rejected-resume'){
        for(const status of ['inProgress','failed'])send({method:status==='failed'?'item/completed':'item/started',params:{threadId:'codex-thread',turnId:tid,item:{type:'collabAgentToolCall',id:'rejected-resume-'+turn,tool:'resumeAgent',status,senderThreadId:'codex-thread',receiverThreadIds:['codex-thread'],agentsStates:{}}}});
      }
      if(mode==='foreign-turn')return send({method:'turn/completed',params:{threadId:'unrelated-thread',turn:{id:'foreign',status:'completed',items:[]}}});
      if(mode==='wrong-child-turn'||mode==='missing-child-turn'){
        send({method:'turn/started',params:{threadId:'child-thread',turn:{id:'actual-child-turn',status:'inProgress',items:[]}}});
        return send({method:'item/started',params:{threadId:'child-thread',...(mode==='wrong-child-turn'?{turnId:'wrong-turn'}:{}),item:{type:'commandExecution',id:'wrong'}}});
      }
      if(mode==='bad-status')return status('child-thread','unknown');
      if(mode==='bad-flag')return send({method:'thread/status/changed',params:{threadId:'child-thread',status:{type:'active',activeFlags:['unknown']}}});
      if(mode==='missing-thread')return status('');
      if(mode==='request-frame')return send({id:999,method:'thread/status/changed',params:{threadId:'child-thread',status:{type:'idle'}}});
      if(['active','child-failure','resume','rejected-resume'].includes(mode)||mode==='late'&&turn===2)childEvents();
      send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id:tid,status:'completed',items:[{type:'agentMessage',text:'parent-'+turn}]}}});
      if(mode==='tail')childEvents();
      if(mode==='idle')setTimeout(childEvents,175);
    });
  `;
}

function codexUsageTailSource(frameCount: number | "continuous", intervalMs = 0): string {
  return `
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize')return send({id:q.id,result:{}});
      if(q.method==='thread/start')return send({id:q.id,result:{thread:{id:'codex-thread'}}});
      if(q.method==='turn/start'){
        const id='turn-tail'; let count=0;
        send({id:q.id,result:{turn:{id}}});
        send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id,status:'completed',items:[{type:'agentMessage',text:'codex-tail-complete'}]}}});
        const usage=()=>{
          const total={totalTokens:++count,inputTokens:count,cachedInputTokens:0,outputTokens:0,reasoningOutputTokens:0};
          send({method:'thread/tokenUsage/updated',params:{threadId:'codex-thread',turnId:id,tokenUsage:{total,last:total,modelContextWindow:null}}});
        };
        ${frameCount === "continuous"
          ? "return setInterval(usage,10);"
          : intervalMs > 0
            ? `const timer=setInterval(()=>{usage();if(count===${frameCount})clearInterval(timer);},${intervalMs});return;`
            : `return setTimeout(()=>{for(let index=0;index<${frameCount};index++)usage();},20);`}
      }
      if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
    });
  `;
}

function inertAuthority(): ResidentTurnAuthorityBroker {
  return {
    activate: async (value) => ({
      inputId: value.inputId,
      invocationId: value.invocationId,
      ownershipEpoch: 1,
      release: () => undefined
    })
  };
}

function longTurnSource(protocol: string, eventCount: number): string {
  const prelude = `
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=async v=>{if(process.stdout.write(JSON.stringify(v)+'\\n'))return;await new Promise(ok=>process.stdout.once('drain',ok));};
    let chain=Promise.resolve();
  `;
  if (protocol === "codex-app-server") return `${prelude}
    let turn=0;
    const handle=async q=>{
      if(q.method==='initialize')return send({id:q.id,result:{userAgent:'long-fixture'}});
      if(q.method==='thread/start')return send({id:q.id,result:{thread:{id:'codex-thread'}}});
      if(q.method==='turn/start'){
        turn+=1;const id='turn-'+turn;
        await send({id:q.id,result:{turn:{id}}});
        await send({method:'item/started',params:{threadId:'codex-thread',turnId:id,item:{type:'toolCall',id:'tool-long'}}});
        for(let index=0;index<${eventCount};index+=1)await send({method:'item/updated',params:{threadId:'codex-thread',turnId:id,item:{type:'toolCall',id:'tool-long'}}});
        await send({method:'item/completed',params:{threadId:'codex-thread',turnId:id,item:{type:'toolCall',id:'tool-long'}}});
        return send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id,status:'completed',items:[{type:'agentMessage',text:'long-complete-codex'}]}}});
      }
      if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
    };
    r.on('line',line=>{chain=chain.then(()=>handle(JSON.parse(line)));});
  `;
  if (protocol === "pi-rpc") return `${prelude}
    const handle=async q=>{
      if(q.type==='get_state')return send({id:q.id,type:'response',command:'get_state',success:true,data:{isStreaming:false,sessionId:'pi-session'}});
      if(q.type==='prompt'){
        await send({id:q.id,type:'response',command:'prompt',success:true});
        for(let index=0;index<${eventCount};index+=1)await send({type:'agent_start',sessionId:'pi-session',index});
        return send({type:'agent_end',sessionId:'pi-session',messages:[{role:'assistant',content:[{type:'text',text:'long-complete-pi'}]}]});
      }
      if(q.type==='get_last_assistant_text')return send({id:q.id,type:'response',command:'get_last_assistant_text',success:true,data:{sessionId:'pi-session',text:'long-complete-pi'}});
    };
    r.on('line',line=>{chain=chain.then(()=>handle(JSON.parse(line)));});
  `;
  if (protocol === "dsh-sdk-json-rpc") return `${prelude}
    let turn=0,seq=0;
    const handle=async q=>{
      if(q.method==='initialize')return send({jsonrpc:'2.0',id:q.id,result:{serverInfo:{name:'deepseek-harness-sdk-runtime',version:'long-fixture'}}});
      if(q.method==='session/prompt'){
        turn+=1;
        const sid=q.params.sessionId;
        await send({jsonrpc:'2.0',id:q.id,result:{messageId:'message-long'}});
        await send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'running'}});
        await send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'turn/start',seq:seq++,data:{turn}}}});
        for(let index=0;index<${eventCount};index+=1)await send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'assistant/message',seq:seq++,data:{turn,message:{role:'assistant',content:[{type:'text',text:'tick'}]}}}}});
        await send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'assistant/message',seq:seq++,data:{turn,message:{role:'assistant',content:[{type:'text',text:'long-complete-dsh'}]}}}}});
        await send({jsonrpc:'2.0',method:'session.event',params:{sessionId:sid,event:{type:'turn/end',seq:seq++,data:{turn,reason:{kind:'completed'}}}}});
        return send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}});
      }
      if(q.method==='shutdown')return send({jsonrpc:'2.0',id:q.id,result:{}});
    };
    r.on('line',line=>{chain=chain.then(()=>handle(JSON.parse(line)));});
  `;
  throw new Error(`Unsupported long-turn protocol: ${protocol}`);
}

function dshCompletionTailSource(mode:
  | "turn-end-idle-tail"
  | "idle-turn-end-tail"
  | "cross-session"
  | "unknown-frame"
  | "new-turn"
  | "sequence-gap"
  | "missing-turn-end"
): string {
  return `
    const mode=${JSON.stringify(mode)};
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    let seq=0;
    const event=(sessionId,type,data,eventSeq=seq++)=>send({jsonrpc:'2.0',method:'session.event',params:{sessionId,event:{type,seq:eventSeq,data}}});
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize')return send({jsonrpc:'2.0',id:q.id,result:{serverInfo:{name:'deepseek-harness-sdk-runtime',version:'tail-fixture'}}});
      if(q.method==='session/prompt'){
        const sid=q.params.sessionId;
        send({jsonrpc:'2.0',id:q.id,result:{messageId:'message-tail'}});
        send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'running'}});
        event(sid,'turn/start',{turn:1});
        event(sid,'assistant/message',{turn:1,step:1,message:{role:'assistant',content:[{type:'text',text:'dsh-tail-complete'}]}});
        if(mode==='idle-turn-end-tail'){
          send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}});
          return setTimeout(()=>event(sid,'turn/end',{turn:1,reason:{kind:'completed'}}),20);
        }
        if(mode==='missing-turn-end'){
          return send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}});
        }
        event(sid,'turn/end',{turn:1,reason:{kind:'completed'}});
        send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}});
        if(mode==='turn-end-idle-tail')return setTimeout(()=>send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}}),20);
        if(mode==='cross-session')return setTimeout(()=>send({jsonrpc:'2.0',method:'session.status',params:{sessionId:'other-session',status:'idle'}}),20);
        if(mode==='unknown-frame')return setTimeout(()=>event(sid,'session/unknown',{turn:1}),20);
        if(mode==='new-turn')return setTimeout(()=>event(sid,'turn/start',{turn:2}),20);
        if(mode==='sequence-gap')return setTimeout(()=>event(sid,'step/end',{turn:1,step:1},seq+1),20);
      }
      if(q.method==='shutdown')return send({jsonrpc:'2.0',id:q.id,result:{}});
    });
  `;
}

// Event order and retry fields mirror Pi 0.73.1 AgentSession._processAgentEvent
// and _handleRetryableError; official RPC events have no sessionId.
function piRetrySource(mode: string): string {
  return `
    const mode=${JSON.stringify(mode)};
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    let turn=0, text='stale-error', reads=0;
    const assistant=(stopReason='stop')=>({role:'assistant',stopReason,
      errorMessage:stopReason==='error'?'503 service unavailable':undefined,
      content:[{type:'text',text}]});
    const end=(reason)=>send({type:'agent_end',messages:[assistant(reason)]});
    const start=(attempt,delayMs)=>send({type:'auto_retry_start',attempt,maxAttempts:3,delayMs,
      errorMessage:'503 service unavailable',...(mode==='cross-session'?{sessionId:'other-session'}:{})});
    const finish=()=>{
      text='pi-retry-final';
      send({type:'agent_start'});
      send({type:'message_start',message:assistant()});
      send({type:'message_update',assistantMessageEvent:{type:'text_delta',delta:text}});
      send({type:'message_end',message:assistant()});
      if(mode!=='missing-retry-end' && mode!=='overflow')send({type:'auto_retry_end',success:true,attempt:mode==='multiple'?2:1});
      send({type:'turn_end'});
      if(mode==='tools'){
        send({type:'tool_execution_start',toolCallId:'tool-1',toolName:'fixture'});
        return setTimeout(()=>{
          send({type:'tool_execution_end',toolCallId:'tool-1',toolName:'fixture'});
          send({type:'message_end',message:assistant()}); end();
        },150);
      }
      end();
    };
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.type==='get_state')return send({id:q.id,type:'response',command:'get_state',success:true,data:{isStreaming:false,sessionId:'pi-session'}});
      if(q.type==='prompt'){
        turn++;
        send({id:q.id,type:'response',command:'prompt',success:true});
        if(turn>1){text='pi-next-turn';end();return;}
        if(mode==='compaction'){
          text='pi-retry-final';end();send({type:'compaction_start',reason:'threshold'});
          return setTimeout(()=>send({type:'compaction_end',willRetry:false}),75);
        }
        end(mode==='aborted'?'aborted':'error');
        if(mode==='error'||mode==='aborted')return;
        if(mode==='overflow-exhausted')return send({type:'compaction_end',reason:'overflow',willRetry:false,errorMessage:'Context overflow recovery failed after one compact-and-retry attempt.'});
        if(mode==='exit')return process.exit(1);
        if(mode==='overflow'){
          send({type:'compaction_start',reason:'overflow'});
          return setTimeout(()=>{send({type:'compaction_end',willRetry:true});finish();},75);
        }
        if(mode==='late-activity')return send({type:'message_update'});
        if(mode==='duplicate-end')return end();
        if(mode==='unknown-frame')return send({type:'future_activity'});
        start(mode==='bad-attempt'?2:1,mode==='retry'?2000:50);
        if(['missing-final','cross-session','bad-attempt'].includes(mode))return;
        if(mode==='cancelled')return send({type:'auto_retry_end',success:false,attempt:1,finalError:'Retry cancelled'});
        if(mode==='exhausted')return setTimeout(()=>{end('error');send({type:'auto_retry_end',success:false,attempt:1,finalError:'503 exhausted'});},50);
        if(mode==='multiple')return setTimeout(()=>{end('error');start(2,100);setTimeout(finish,100);},50);
        setTimeout(finish,mode==='retry'?2000:50);
      }
      if(q.type==='get_last_assistant_text'){
        const value=text;
        const reply=()=>send({id:q.id,type:'response',command:'get_last_assistant_text',success:true,data:{text:value}});
        reads++;
        if(mode==='stale-read'&&reads===1)return setTimeout(reply,125);
        reply();
      }
    });
  `;
}

describe("Codex asynchronous item ownership", () => {
  it.each(["owned", "unknown-item", "wrong-turn", "old-completion"])("handles a previous turn notification by its recorded item owner (%s)", async mode => {
    const source = `
      const r=require('node:readline').createInterface({input:process.stdin});
      const send=v=>process.stdout.write(JSON.stringify(v)+'\\n'); let n=0;
      r.on('line',line=>{const q=JSON.parse(line);
        if(q.method==='initialize')return send({id:q.id,result:{}});
        if(q.method==='thread/start')return send({id:q.id,result:{thread:{id:'codex-thread'}}});
        if(q.method==='thread/unsubscribe')return send({id:q.id,result:{}});
        if(q.method!=='turn/start')return;
        const id='turn-'+(++n);send({id:q.id,result:{turn:{id}}});
        if(n===1)send({method:'item/started',params:{threadId:'codex-thread',turnId:id,item:{type:'commandExecution',id:'background',command:'fixture'}}});
        if(n===2) {
          if(${JSON.stringify(mode)}==='old-completion')send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id:'turn-1',status:'completed',items:[]}}});
          else send({method:'item/completed',params:{threadId:'codex-thread',turnId:${JSON.stringify(mode === "wrong-turn" ? "unknown-turn" : "turn-1")},item:{type:'commandExecution',id:${JSON.stringify(mode === "unknown-item" ? "unknown-command" : "background")},exitCode:143,status:'completed'}}});
        }
        send({method:'turn/completed',params:{threadId:'codex-thread',turn:{id,status:'completed',items:[{type:'agentMessage',text:'result-'+n}]}}});
      });`;
    const child = await fakeNative("codex-app-server", source);
    const delivered: Array<{ frame: Record<string, unknown>; invocation?: string }> = [];
    const driver = await ResidentNativeDriver.open({ child, session: session("codex", "pending:fixture"),
      codec: codexAppServerCodec({ cwd: "/fixture", model: "fixture", sandbox: "workspace-write" }),
      turnAuthority: inertAuthority(), ownershipEpoch: 1,
      onFrame: (frame, origin) => { delivered.push({ frame, invocation: origin?.invocationId }); } });
    await expect(driver.submit(turn(1))).resolves.toMatchObject({ handoff: "result-1" });
    if (mode === "owned") {
      await expect(driver.submit(turn(2))).resolves.toMatchObject({ handoff: "result-2" });
      const late = delivered.find(item => item.frame.method === "item/completed");
      expect(late?.invocation).toBe("inv-1");
      expect((late?.frame.params as { item: { exitCode: number } }).item.exitCode).toBe(143);
      await driver.close();
    } else await expect(driver.submit(turn(2))).rejects.toThrow(/different native turn/);
  });
});

async function fakeNative(
  protocol: string,
  source = fakeSources[protocol]!
): Promise<ChildProcessWithoutNullStreams> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-native-protocol-"));
  roots.push(root);
  const script = path.join(root, `${protocol}.cjs`);
  await fs.writeFile(script, source, { mode: 0o700 });
  const child = spawn(process.execPath, [script], {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
    detached: true
  });
  children.push(child);
  return child;
}

function session(harnessId: string, nativeId: string): SessionRef {
  return {
    schemaVersion: 1,
    harnessId,
    adapterVersion: "resident-fixture",
    generation: 0,
    nativeId,
    durable: true,
    createdAt: "2026-09-22T00:00:00.000Z"
  };
}

function turn(index: number): ResidentTurn {
  return {
    inputId: `input-${index}`,
    invocationId: `inv-${index}`,
    prompt: `provider turn ${index}`,
    route: {
      baseUrl: `http://127.0.0.1:${45000 + index}/v1`,
      token: `turn-token-${index}`
    },
    controlCapability: `control-capability-${index}`
  };
}

function dshHistoricalSurfaceSource(mode: string): string {
  return `
    const mode=${JSON.stringify(mode)};
    const r=require('node:readline').createInterface({input:process.stdin});
    const send=v=>process.stdout.write(JSON.stringify(v)+'\\n');
    let seq=12;
    const event=(sessionId,type,data,extras={})=>send({jsonrpc:'2.0',method:'session.event',params:{sessionId,event:{type,seq:seq++,...extras,data}}});
    r.on('line',line=>{const q=JSON.parse(line);
      if(q.method==='initialize')return send({jsonrpc:'2.0',id:q.id,result:{serverInfo:{name:'deepseek-harness-sdk-runtime',version:'surface-fixture'}}});
      if(q.method==='session/resume')return send({jsonrpc:'2.0',id:q.id,result:{sessionId:q.params.sessionId,lastSequence:11}});
      if(q.method==='session/prompt'){
        const sid=q.params.sessionId;
        send({jsonrpc:'2.0',id:q.id,result:{messageId:'message-surface'}});
        send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'running'}});
        event(sid,'turn/start',{turn:2});
        event(sid,'step/start',{turn:2,step:1});
        event(sid,'tool/call',{turn:2,step:1,callId:'current-call',name:'current-tool'});
        event(sid,'tool/result',{turn:2,step:1,message:{source:{kind:'tool',callId:'current-call'},role:'tool',content:[]}},
          {surfaceOp:'append',sourceEventSeqs:[14]});
        const source=mode==='current-turn'?15:3;
        if(mode!=='unpaired')event(sid,'compaction/prune',{shadowedRange:{start:source,end:source},shadowedSeqs:[source],shadowedTokenCount:12});
        if(mode==='sequence-gap')seq++;
        event(mode==='wrong-session'?'another-session':sid,'tool/result',{turn:mode==='current-turn'?2:mode==='future-turn'?3:1,step:1,
          message:{source:{kind:'tool',callId:'old-call'},role:'tool',content:[{type:'text',text:'historical replacement, never a new result'}]}},
          {surfaceOp:{op:'replace',start:mode==='wrong-range'?4:source,end:mode==='wrong-range'?4:source},sourceEventSeqs:[mode==='wrong-source'?4:mode==='future-source'?seq+10:source]});
        event(sid,'step/start',{turn:2,step:2});
        event(sid,'assistant/message',{turn:2,step:2,message:{role:'assistant',content:[{type:'text',text:'current-dsh-response'}]}});
        event(sid,'turn/end',{turn:2,reason:{kind:'completed'}});
        return send({jsonrpc:'2.0',method:'session.status',params:{sessionId:sid,status:'idle'}});
      }
      if(q.method==='shutdown')return send({jsonrpc:'2.0',id:q.id,result:{}});
    });
  `;
}
