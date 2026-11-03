import { describe, expect, it } from "vitest";
import {
  applyGatewayReasoning,
  normalizeGatewayModelReasoningConfigs,
  resolveGatewayReasoning
} from "../../src/core/internal/shared/gateway-reasoning.js";

describe("shared Gateway reasoning", () => {
  const configs = normalizeGatewayModelReasoningConfigs(["model-a"], {
    "model-a": {
      parameter: "reasoning.effort",
      options: [
        { id: "balanced", label: "Balanced", value: "medium" },
        { id: "deep", label: "Deep", value: "xhigh" }
      ]
    }
  });

  it("normalizes model mappings and resolves a stable exact fingerprint", () => {
    const first = resolveGatewayReasoning(configs, "model-a", "deep");
    const second = resolveGatewayReasoning(structuredClone(configs), "model-a", "deep");
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      mode: "option",
      optionId: "deep",
      label: "Deep",
      value: "xhigh",
      parameter: "reasoning.effort"
    });
    expect(first?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(resolveGatewayReasoning(configs, "model-a", undefined)).toBeUndefined();
  });

  it("changes the fingerprint when the outbound field or value changes", () => {
    const baseline = resolveGatewayReasoning(configs, "model-a", "deep")!;
    const changedValue = resolveGatewayReasoning({
      "model-a": {
        parameter: "reasoning.effort",
        options: [{ id: "deep", label: "Deep", value: "max" }]
      }
    }, "model-a", "deep")!;
    const changedPath = resolveGatewayReasoning({
      "model-a": {
        parameter: "reasoning_effort",
        options: [{ id: "deep", label: "Deep", value: "xhigh" }]
      }
    }, "model-a", "deep")!;
    expect(changedValue.fingerprint).not.toBe(baseline.fingerprint);
    expect(changedPath.fingerprint).not.toBe(baseline.fingerprint);
  });

  it("injects only the selected allow-listed path and preserves sibling fields", () => {
    const reasoning = resolveGatewayReasoning(configs, "model-a", "balanced");
    expect(applyGatewayReasoning({
      model: "model-a",
      reasoning: { summary: "auto" }
    }, reasoning)).toEqual({
      model: "model-a",
      reasoning: { summary: "auto", effort: "medium" }
    });
    const body = { model: "model-a" };
    expect(applyGatewayReasoning(body, undefined)).toBe(body);
  });

  it("rejects unknown models, arbitrary paths, duplicate options and unknown selections", () => {
    expect(() => normalizeGatewayModelReasoningConfigs(["model-a"], {
      "model-b": { parameter: "reasoning_effort", options: [] }
    })).toThrow(/未声明/);
    expect(() => normalizeGatewayModelReasoningConfigs(["model-a"], {
      "model-a": { parameter: "arbitrary.patch", options: [] }
    })).toThrow(/不受支持/);
    expect(() => normalizeGatewayModelReasoningConfigs(["model-a"], {
      "model-a": {
        parameter: "reasoning_effort",
        options: [
          { id: "deep", label: "Deep", value: "high" },
          { id: "deep", label: "Other", value: "max" }
        ]
      }
    })).toThrow(/不能重复/);
    expect(() => resolveGatewayReasoning(configs, "model-a", "missing")).toThrow(/不存在/);
  });

  it("validates default option identities and preserves sibling output settings", () => {
    const config = { parameter: "output_config.effort", defaultOptionId: "high",
      options: [{ id: "high", label: "High", value: "high" }] };
    const normalized = normalizeGatewayModelReasoningConfigs(["model-a"], { "model-a": config });
    expect(applyGatewayReasoning({ output_config: { format: "json" } }, resolveGatewayReasoning(normalized, "model-a", "high")))
      .toEqual({ output_config: { format: "json", effort: "high" } });
    // Existing snapshots do not silently acquire newly discovered defaults.
    expect(resolveGatewayReasoning(normalized, "model-a", undefined)).toBeUndefined();
    expect(() => normalizeGatewayModelReasoningConfigs(["model-a"], { "model-a": { ...config, defaultOptionId: "missing" } })).toThrow(/默认/);
    expect(() => normalizeGatewayModelReasoningConfigs(["model-a"], { "model-a": { ...config, defaultOptionId: 2 } })).toThrow(/默认/);
  });
});
