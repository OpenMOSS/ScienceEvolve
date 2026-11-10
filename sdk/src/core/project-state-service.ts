import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import type { GitHubPullRequestFact } from "./collaboration-git/contracts.js";
import { projectStateDigest, validateProjectStateRequest, type ProjectStatePrincipal,
  type ProjectStatePullPreparation } from "./project-state.js";
import { redactTrace } from "./utils.js";

const inFlight = new WeakMap<CollaborationStateDatabase, Map<string, { requestHash: string; result: Promise<unknown> }>>();

/** Provider access is an exact read selected by the current Main. It never
 * retries a business operation or manufactures an observation from a report. */
export async function executeProjectStateRequest(database: CollaborationStateDatabase, principal: ProjectStatePrincipal,
  value: unknown, services: { observePullRequest: (preparation: ProjectStatePullPreparation) => Promise<GitHubPullRequestFact | undefined> }): Promise<unknown> {
  const input = validateProjectStateRequest(value);
  if (input.operation !== "reconcile_pull") return database.projectStateRequest(principal, input);
  const checked = await database.prepareProjectStatePullReconciliation(principal, input);
  if (checked.replay !== undefined) return checked.replay;
  const preparation = checked.preparation!;
  const queryRequestId = `project-state-query:${projectStateDigest({ principal, callId: input.callId })}`;
  const requests = inFlight.get(database) ?? new Map<string, { requestHash: string; result: Promise<unknown> }>();
  inFlight.set(database, requests);
  const requestHash = projectStateDigest(input), pending = requests.get(queryRequestId);
  if (pending) {
    if (pending.requestHash !== requestHash)
      throw new CollaborationStateError("IDEMPOTENCY_CONFLICT", "State callId already belongs to another in-flight provider query");
    return pending.result;
  }
  const result = Promise.resolve().then(async () => {
    const prior = await database.eventByRequestId(principal.projectId, queryRequestId);
    if (prior) {
      const observation = prior.payload.observation as { error?: { name: string; message: string; code?: string } };
      if (observation.error) {
        const error = new Error(observation.error.message);
        error.name = observation.error.name;
        Object.assign(error, { code: observation.error.code, queryRequestId });
        throw error;
      }
    } else {
      let pull: GitHubPullRequestFact | undefined;
      try { pull = await services.observePullRequest(preparation); }
      catch (error) {
        const record = error instanceof Error ? error : new Error(String(error));
        await database.recordProjectStatePullQuery(principal, input, preparation, { error: {
          name: redactTrace(record.name), message: redactTrace(record.message),
          ...("code" in record && typeof record.code === "string" ? { code: redactTrace(record.code) } : {})
        } });
        // The first call returns the provider's actual error to its original caller.
        throw error;
      }
      await database.recordProjectStatePullQuery(principal, input, preparation, { ...(pull ? { pull } : {}) });
    }
    return database.commitProjectStatePullReconciliation(principal, input, preparation, queryRequestId);
  });
  requests.set(queryRequestId, { requestHash, result });
  try { return await result; } finally { if (requests.get(queryRequestId)?.result === result) requests.delete(queryRequestId); }
}
