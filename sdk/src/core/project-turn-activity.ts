/** In-process safe points for pausing native turns in each project. */
export class ProjectTurnActivity {
  private readonly paused = new Map<string, Set<() => void>>();
  private readonly active = new Map<string, { count: number; idleWaiters: Array<() => void> }>();

  isPaused(projectId: string): boolean {
    return this.paused.has(projectId);
  }

  pause(projectId: string): void {
    if (!this.paused.has(projectId)) this.paused.set(projectId, new Set());
  }

  resume(projectId: string): void {
    const waiters = this.paused.get(projectId);
    if (!waiters) return;
    this.paused.delete(projectId);
    for (const resume of waiters) resume();
  }

  async waitWhilePaused(projectId: string, signal: AbortSignal): Promise<void> {
    for (;;) {
      const waiters = this.paused.get(projectId);
      if (!waiters) return;
      if (signal.aborted) throw new Error("Collaboration turn was cancelled while paused");
      await new Promise<void>((resolve, reject) => {
        const resume = () => {
          signal.removeEventListener("abort", abort);
          resolve();
        };
        const abort = () => {
          waiters.delete(resume);
          reject(new Error("Collaboration turn was cancelled while paused"));
        };
        waiters.add(resume);
        signal.addEventListener("abort", abort, { once: true });
      });
    }
  }

  hasActiveTurns(projectId: string): boolean {
    return this.active.has(projectId);
  }

  async beginWhenRunning(projectId: string, signal: AbortSignal): Promise<void> {
    while (this.isPaused(projectId)) await this.waitWhilePaused(projectId, signal);
    signal.throwIfAborted();
    this.beginTurn(projectId);
  }

  beginTurn(projectId: string): void {
    const turns = this.active.get(projectId);
    if (turns) turns.count += 1;
    else this.active.set(projectId, { count: 1, idleWaiters: [] });
  }

  endTurn(projectId: string): void {
    const turns = this.active.get(projectId);
    if (!turns) throw new Error(`Project ${projectId} has no active turn to finish`);
    turns.count -= 1;
    if (turns.count === 0) {
      this.wakeIdleWaiters(projectId);
      this.active.delete(projectId);
    }
  }

  waitForIdle(projectId: string): Promise<void> {
    const turns = this.active.get(projectId);
    return turns ? new Promise(resolve => turns.idleWaiters.push(resolve)) : Promise.resolve();
  }

  /** Stop can interrupt the wait for a safe point while the native turn is still active. */
  wakeIdleWaiters(projectId: string): void {
    const turns = this.active.get(projectId);
    if (turns) for (const resolve of turns.idleWaiters.splice(0)) resolve();
  }
}
