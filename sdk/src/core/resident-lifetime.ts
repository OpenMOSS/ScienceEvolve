type Close = () => Promise<void>;

async function drain(stops: Set<Close>): Promise<void> {
  const results = await Promise.allSettled([...stops].map(async stop => { await stop(); stops.delete(stop); }));
  const errors = results.filter(result => result.status === "rejected").map(result => result.reason);
  if (errors.length || stops.size) throw new AggregateError(errors, "Resident Stop was not confirmed");
}

/** A launcher acquired a resource but could neither publish it nor prove its cleanup. */
class UnconfirmedResidentOpen extends AggregateError {
  constructor(cause: unknown, cleanup: unknown, readonly close: Close) {
    super([cause, cleanup], "Resident open failed and cleanup was not confirmed", { cause });
  }
}

export async function rejectResidentOpen(cause: unknown, ...cleanup: Close[]): Promise<never> {
  const outstanding = new Set(cleanup);
  try { await drain(outstanding); }
  catch (error) {
    if (cause instanceof UnconfirmedResidentOpen) outstanding.add(cause.close);
    throw new UnconfirmedResidentOpen(cause, error, () => drain(outstanding));
  }
  throw cause;
}

/** One tracker per owner. Business retirement may drop its scheduling entry, but
 * only a confirmed close/stop releases the corresponding physical obligation. */
export function trackResidentOpens<T extends { open: (...args: any[]) => Promise<{ close(): Promise<void> }> }>(launcher: T) {
  type Handle = Awaited<ReturnType<T["open"]>>;
  const pending = new Set<Close>();
  let sealed = false;
  const unavailable = () => new Error("Resident launch or turn cannot start during shutdown or retirement");
  const open = async (...args: Parameters<T["open"]>): Promise<Handle> => {
    if (sealed) throw unavailable();
    let retiring = false, stopped = false, closing: Promise<void> | undefined;
    // Enrol before invoking even an opener that synchronously initiates shutdown.
    const acquired = Promise.resolve().then(() => {
      if (sealed) throw unavailable();
      return launcher.open(...args) as Promise<Handle>;
    });
    const confirm = () => { stopped = true; pending.delete(close); };
    const close = (): Promise<void> => {
      if (stopped) return Promise.resolve();
      retiring = true;
      return closing ??= acquired.then(handle => handle.close(), async error => {
        if (error instanceof UnconfirmedResidentOpen) await error.close();
      }).then(confirm, error => { closing = undefined; throw error; });
    };
    pending.add(close);
    let handle: Handle;
    try { handle = await acquired; }
    catch (error) { if (!(error instanceof UnconfirmedResidentOpen)) pending.delete(close); throw error; }
    if (sealed) throw unavailable(); // Shutdown owns the late handle; never give it to a scheduler.
    return new Proxy(handle, { get(target, key) {
      if (key === "close") return close;
      const method = Reflect.get(target, key, target);
      if (typeof method !== "function") return method;
      if (key === "stop") return async () => { retiring = true; await method.call(target); confirm(); };
      if (key === "submit" || key === "resume") return (...input: unknown[]) => {
        if (sealed || retiring) return Promise.reject(unavailable());
        return method.apply(target, input);
      };
      return method.bind(target);
    } });
  };
  return {
    launcher: new Proxy(launcher, { get(target, key) {
      if (key === "open") return open;
      const method = Reflect.get(target, key, target);
      return typeof method === "function" ? method.bind(target) : method;
    } }),
    seal() { sealed = true; },
    async stopRemaining(): Promise<void> { sealed = true; await drain(pending); }
  };
}
