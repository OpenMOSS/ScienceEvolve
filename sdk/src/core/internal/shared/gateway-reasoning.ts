import { createHash } from "node:crypto";

export const GATEWAY_REASONING_PARAMETER_PATHS = [
  "reasoning_effort",
  "reasoning.effort",
  "chat_template_kwargs.reasoning_effort",
  "thinking.effort",
  "output_config.effort"
] as const;

export type GatewayReasoningParameterPath =
  typeof GATEWAY_REASONING_PARAMETER_PATHS[number];

export interface GatewayReasoningOption {
  id: string;
  label: string;
  value: string;
}

export interface GatewayModelReasoningConfig {
  parameter: GatewayReasoningParameterPath;
  options: GatewayReasoningOption[];
  /** Confirmed default discovered by the gateway probe; explicit Agent choices win. */
  defaultOptionId?: string;
}

export interface GatewayReasoningDetection {
  status: "verified" | "unconfirmed" | "failed";
  checkedAt: string;
  fingerprint: string;
  message: string;
  config?: GatewayModelReasoningConfig;
  attempts: Array<{ parameter: GatewayReasoningParameterPath; value: string; httpStatus?: number; outcome: string }>;
}

export type GatewayModelReasoningConfigs = Record<
  string,
  GatewayModelReasoningConfig
>;

export interface ResolvedGatewayReasoning {
  mode: "option";
  optionId: string;
  label: string;
  value: string;
  parameter: GatewayReasoningParameterPath;
  fingerprint: string;
}

const OPTION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeGatewayModelReasoningConfigs(
  models: readonly string[],
  input: unknown
): GatewayModelReasoningConfigs {
  if (input === undefined || input === null) return {};
  if (!isRecord(input)) {
    throw new Error("模型思考参数配置必须是按 model 索引的对象");
  }
  const knownModels = new Set(models);
  const normalized: GatewayModelReasoningConfigs = {};
  for (const [model, rawConfig] of Object.entries(input)) {
    if (!knownModels.has(model)) {
      throw new Error(`思考参数配置引用了未声明的 model“${model}”`);
    }
    if (!isRecord(rawConfig)) {
      throw new Error(`model“${model}”的思考参数配置无效`);
    }
    const parameter = rawConfig.parameter;
    if (
      typeof parameter !== "string" ||
      !GATEWAY_REASONING_PARAMETER_PATHS.includes(
        parameter as GatewayReasoningParameterPath
      )
    ) {
      throw new Error(`model“${model}”的思考参数位置不受支持`);
    }
    if (!Array.isArray(rawConfig.options) || rawConfig.options.length > 32) {
      throw new Error(`model“${model}”最多可配置 32 个思考强度选项`);
    }
    const ids = new Set<string>();
    const labels = new Set<string>();
    const options = rawConfig.options.map((rawOption, index) => {
      if (!isRecord(rawOption)) {
        throw new Error(`model“${model}”的第 ${index + 1} 个思考选项无效`);
      }
      const id = typeof rawOption.id === "string" ? rawOption.id.trim() : "";
      const label = typeof rawOption.label === "string"
        ? rawOption.label.trim()
        : "";
      const value = typeof rawOption.value === "string"
        ? rawOption.value.trim()
        : "";
      if (!OPTION_ID_PATTERN.test(id)) {
        throw new Error(`model“${model}”的思考选项 id 无效`);
      }
      if (!label || label.length > 120) {
        throw new Error(`model“${model}”的思考选项标签不能为空且不能超过 120 个字符`);
      }
      if (!value || value.length > 120) {
        throw new Error(`model“${model}”的思考选项值不能为空且不能超过 120 个字符`);
      }
      if (ids.has(id) || labels.has(label.toLocaleLowerCase())) {
        throw new Error(`model“${model}”的思考选项 id 和标签不能重复`);
      }
      ids.add(id);
      labels.add(label.toLocaleLowerCase());
      return { id, label, value };
    });
    normalized[model] = {
      parameter: parameter as GatewayReasoningParameterPath,
      options,
      ...(typeof rawConfig.defaultOptionId === "string" ? { defaultOptionId: rawConfig.defaultOptionId.trim() } : {})
    };
    if (rawConfig.defaultOptionId !== undefined && typeof rawConfig.defaultOptionId !== "string")
      throw new Error(`model“${model}”的默认思考强度必须是选项 ID`);
    if (normalized[model]!.defaultOptionId !== undefined && !options.some(option => option.id === normalized[model]!.defaultOptionId))
      throw new Error(`model“${model}”的默认思考强度不属于已配置选项`);
  }
  return normalized;
}

export function resolveGatewayReasoning(
  configs: GatewayModelReasoningConfigs | undefined,
  model: string,
  optionId: string | undefined
): ResolvedGatewayReasoning | undefined {
  const selected = optionId?.trim();
  if (!selected) return undefined;
  const config = configs?.[model];
  if (!config) {
    throw new Error(`model“${model}”没有可用的网关思考强度选项`);
  }
  const option = config.options.find((candidate) => candidate.id === selected);
  if (!option) {
    throw new Error(`model“${model}”不存在思考强度选项“${selected}”`);
  }
  const identity = {
    model,
    parameter: config.parameter,
    optionId: option.id,
    value: option.value
  };
  return {
    mode: "option",
    optionId: option.id,
    label: option.label,
    value: option.value,
    parameter: config.parameter,
    fingerprint: createHash("sha256")
      .update(JSON.stringify(identity))
      .digest("hex")
  };
}

/** Apply only one allow-listed string field; arbitrary provider-body patches are forbidden. */
export function applyGatewayReasoning(
  body: Record<string, unknown>,
  reasoning: ResolvedGatewayReasoning | undefined
): Record<string, unknown> {
  if (!reasoning) return body;
  if (reasoning.parameter === "reasoning_effort") {
    return { ...body, reasoning_effort: reasoning.value };
  }
  const [container, field] = reasoning.parameter.split(".") as [
    "reasoning" | "chat_template_kwargs" | "thinking" | "output_config",
    "effort" | "reasoning_effort"
  ];
  const existing = isRecord(body[container]) ? body[container] : {};
  return {
    ...body,
    [container]: { ...existing, [field]: reasoning.value }
  };
}
