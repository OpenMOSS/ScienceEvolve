import { readFileSync } from "node:fs";
import { ProbeIdentityGuard } from "./identity-guard.mjs";

const options = JSON.parse(process.argv[2]);
let guard;
try {
  guard = ProbeIdentityGuard.acquire({ databasePath: options.databasePath,
    expectedBinding: JSON.parse(readFileSync(options.bindingPath, "utf8")) });
  process.send({ held: true });
} catch (error) {
  process.send({ held: false, code: error.code, message: error.message });
  process.disconnect();
}
if (guard) {
  process.on("message", async message => {
    if (message === "fail-drain") {
      const closing = guard.close(async () => { throw new Error("Injected unknown worker shutdown"); });
      const same = closing === guard.close(async () => { throw new Error("Must not run a second drain"); });
      try { await closing; } catch (error) { process.send({ failed: true, same, message: error.message }); }
    } else if (message === "close") {
      await guard.close(async () => {});
      process.send({ closed: true });
      process.disconnect();
    }
  });
  // The fixture parent always waits for process exit before taking over a failed
  // drain. A real runtime cannot substitute this for child/effect reconciliation.
  process.on("disconnect", () => process.exit(0));
}
