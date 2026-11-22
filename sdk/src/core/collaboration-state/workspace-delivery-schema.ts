import type { DatabaseSync } from "node:sqlite";
import { CollaborationStateError } from "./errors.js";

// Rebuild with the stored table definitions so databases upgraded through older
// releases keep their existing columns, constraints, indexes and triggers.
export function installWorkspaceDeliverySchema(database: DatabaseSync): void {
  const tables: Record<string, string[]> = {
    scoped_group_runs: ["base_commit", "group_branch", "integration_target"],
    scoped_executions: ["execution_branch"],
    scoped_agent_turns: ["base_commit"],
    member_executions: ["execution_branch"],
    project_state_domains: []
  };
  for (const [table, fields] of Object.entries(tables)) {
    const objects = database.prepare("SELECT type, name, sql FROM sqlite_schema WHERE tbl_name=? AND sql IS NOT NULL ORDER BY type")
      .all(table);
    const definition = objects.find(item => item.type === "table")?.sql;
    if (typeof definition !== "string") throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", `Missing delivery table ${table}`);
    const replacement = `workspace_v31_${table}`;
    let sql = `CREATE TABLE ${replacement} ${definition.slice(definition.indexOf("("))}`;
    for (const field of fields) {
      const declaration = new RegExp(`\\b${field}\\s+TEXT\\s+NOT\\s+NULL\\b`, "i");
      if (!declaration.test(sql)) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", `Missing Git constraint on ${table}.${field}`);
      sql = sql.replace(declaration, `${field} TEXT`);
    }
    if (table === "project_state_domains") {
      const schedulers = /'git'\s*,\s*'serial'/;
      if (!schedulers.test(sql)) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Unknown project scheduler constraint");
      sql = sql.replace(schedulers, "'git','serial','scoped'");
    }
    database.exec(sql);
    database.exec(`INSERT INTO ${replacement} SELECT * FROM ${table}; DROP TABLE ${table}; ALTER TABLE ${replacement} RENAME TO ${table}`);
    for (const item of objects) if (item.type !== "table") {
      const ddl = String(item.sql);
      database.exec(item.name === "scoped_executions_one_active_worktree" ? ddl.replace(/WHERE\s+/i, "WHERE execution_branch IS NOT NULL AND ") : ddl);
    }
    if (!fields.length) continue;
    const mode = "(SELECT json_extract(git_state_json,'$.enabled') FROM project_heads WHERE project_id=NEW.project_id)";
    const mismatch = fields.map(field => `(NEW.${field} IS NOT NULL) IS NOT ${mode}`).join(" OR ");
    for (const operation of ["INSERT", "UPDATE OF project_id, " + fields.join(", ")]) {
      database.exec(`CREATE TRIGGER ${table}_delivery_${operation.startsWith("UPDATE") ? "update" : "insert"} BEFORE ${operation} ON ${table}
        WHEN ${mismatch} BEGIN SELECT RAISE(ABORT,'Execution delivery fields disagree with project Git mode'); END`);
    }
  }
  if (database.prepare("PRAGMA foreign_key_check").get())
    throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Workspace delivery upgrade left invalid foreign keys");
}
