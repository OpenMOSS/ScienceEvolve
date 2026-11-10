import { HarnessRuntimeError, isSessionResumeFailure } from "./harness-runtime/errors.js";
import { redactTrace } from "./utils.js";

export const MAX_TASK_REPAIR_WAKEUPS = 3;

export interface TaskSupervisionResult<T> {
  value: T;
  remaining: string[];
  outcome: "resolved" | "exhausted" | "unavailable" | "unconfirmed";
}

export interface TaskSupervisionInput<T> {
  key: string;
  value: T;
  signal?: AbortSignal;
  inspect(): Promise<string[]> | string[];
  /** Atomically reserve from the original task's durable, shared allowance.
   * Unknown history or an unreceived request must not grant another wakeup. */
  reserve(missing: string[]): Promise<number | undefined> | number | undefined;
  invoke(attempt: number, missing: string[], previous: T): Promise<T>;
  accept?(value: T, attempt: number): Promise<void> | void;
  record(outcome: TaskSupervisionResult<T>["outcome"] | "inspection_failed" | "reservation_failed",
    remaining: string[], reason?: string): Promise<void> | void;
}

const active = new Map<string, Promise<TaskSupervisionResult<unknown>>>();

/** Supervision observes and offers finite same-task supplements. It cannot
 * decide business actions, infer tool success, or impose a time limit. */
export function superviseTask<T>(input: TaskSupervisionInput<T>): Promise<TaskSupervisionResult<T>> {
  const running = active.get(input.key);
  if (running) return running as Promise<TaskSupervisionResult<T>>;
  const work = perform(input).finally(() => { if (active.get(input.key) === work) active.delete(input.key); });
  active.set(input.key, work);
  return work;
}

type SupervisionStepInput = Pick<TaskSupervisionInput<unknown>, "key" | "signal" | "inspect" | "reserve" | "record">;
type SupervisionStep = { attempt: number; remaining: string[] } |
  { outcome: TaskSupervisionResult<unknown>["outcome"]; remaining: string[] };

async function recordSupervision(input: SupervisionStepInput,
  outcome: Parameters<SupervisionStepInput["record"]>[0], remaining: string[], reason?: string): Promise<void> {
  try { await input.record(outcome, remaining, reason); }
  catch (error) {
    input.signal?.throwIfAborted();
    console.warn(`Task supervision record unavailable (${input.key}): ${supervisionError(error)}`);
  }
}

/** One decision point also supports Harnesses whose native loop requests the
 * next input through a callback. It shares the same persistence boundary. */
export async function nextTaskRepair(input: SupervisionStepInput, lastAttempt = 0): Promise<SupervisionStep> {
  let remaining: string[] = [];
  const finish = async (outcome: TaskSupervisionResult<unknown>["outcome"]) => {
    await recordSupervision(input, outcome, remaining);
    return { outcome, remaining };
  };
  input.signal?.throwIfAborted();
  try { remaining = [...new Set(await input.inspect())]; }
  catch (error) {
    input.signal?.throwIfAborted();
    await recordSupervision(input, "inspection_failed", remaining, supervisionError(error));
    return finish("unconfirmed");
  }
  if (!remaining.length) return finish("resolved");
  if (lastAttempt >= MAX_TASK_REPAIR_WAKEUPS) return finish("exhausted");
  let attempt: number | undefined;
  try { attempt = await input.reserve(remaining); }
  catch (error) {
    input.signal?.throwIfAborted();
    await recordSupervision(input, "reservation_failed", remaining, supervisionError(error));
    return finish("unconfirmed");
  }
  if (attempt === undefined) return finish("exhausted");
  if (!Number.isSafeInteger(attempt) || attempt <= lastAttempt || attempt > MAX_TASK_REPAIR_WAKEUPS) {
    await recordSupervision(input, "reservation_failed", remaining, "Invalid or unknown cumulative repair allowance");
    return finish("unconfirmed");
  }
  return { attempt, remaining };
}

async function perform<T>(input: TaskSupervisionInput<T>): Promise<TaskSupervisionResult<T>> {
  let value = input.value, lastAttempt = 0;
  for (;;) {
    const step = await nextTaskRepair(input, lastAttempt);
    if ("outcome" in step) return { value, ...step };
    input.signal?.throwIfAborted();
    lastAttempt = step.attempt;
    try { value = await input.invoke(step.attempt, step.remaining, value); }
    catch (error) {
      input.signal?.throwIfAborted();
      if (!supervisionSessionUnavailable(error)) throw error;
      await recordSupervision(input, "unavailable", step.remaining, supervisionError(error));
      return { value, remaining: step.remaining, outcome: "unavailable" };
    }
    try { await input.accept?.(value, step.attempt); }
    catch (error) {
      input.signal?.throwIfAborted();
      await recordSupervision(input, "inspection_failed", step.remaining, supervisionError(error));
      await recordSupervision(input, "unconfirmed", step.remaining);
      return { value, remaining: step.remaining, outcome: "unconfirmed" };
    }
  }
}

export function supervisionError(error: unknown): string {
  return redactTrace(error instanceof Error ? error.message : String(error)).slice(0, 2000);
}

export function supervisionSessionUnavailable(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    if (isSessionResumeFailure(current) || current instanceof HarnessRuntimeError &&
      current.code === "HARNESS_CONTRACT_VIOLATION" &&
      /resident.*(?:closing or closed|already closed)|^No resident Harness lease owns this execution$/i.test(current.message)) return true;
    current = current.cause;
  }
  return false;
}

export function supervisionHandoff(output: string, result: Pick<TaskSupervisionResult<unknown>, "remaining" | "outcome">): string {
  if (result.outcome === "resolved") return output;
  return `System supervision ended (${result.outcome}). Retained gaps belong to this returned task and do not create requirements for the next task. Do not reopen the task or delegate its mechanical cleanup, or request User intervention, solely to clear these supervision gaps. Further work needs an independently necessary User requirement. Existing material is available; Git and publication outcomes remain as actually recorded. Remaining facts: ${result.remaining.length
    ? result.remaining.join("; ") : "verification was not completed"}.\n\n${output}`;
}
