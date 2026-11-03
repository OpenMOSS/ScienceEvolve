import type { DatabaseSync } from "node:sqlite";
import {
  COLLABORATION_STATE_SCHEMA_VERSION,
  type WriterLeaseToken
} from "./contracts.js";
import { CollaborationStateError } from "./errors.js";

interface SchemaMigrationAuthority {
  writerLease: WriterLeaseToken;
  nowMs: number;
}

const SCOPED_RUN_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_group_runs (
    group_run_id TEXT PRIMARY KEY CHECK (length(group_run_id) > 0),
    project_id TEXT NOT NULL,
    group_id TEXT NOT NULL CHECK (length(group_id) > 0),
    parent_group_run_id TEXT,
    parent_arrival_id TEXT,
    activation_request_id TEXT NOT NULL CHECK (length(activation_request_id) > 0),
    workflow_revision INTEGER NOT NULL CHECK (workflow_revision >= 1),
    workflow_snapshot_json TEXT NOT NULL CHECK (json_valid(workflow_snapshot_json)),
    leader_agent_id TEXT NOT NULL CHECK (length(leader_agent_id) > 0),
    base_commit TEXT NOT NULL CHECK (length(base_commit) > 0),
    group_branch TEXT NOT NULL CHECK (length(group_branch) > 0),
    integration_target TEXT NOT NULL CHECK (length(integration_target) > 0),
    status TEXT NOT NULL CHECK (status IN (
      'preparing','coordinating','running','integrating',
      'paused','blocked','cancelled','failed','completed'
    )),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    UNIQUE (project_id, activation_request_id),
    UNIQUE (project_id, group_branch),
    UNIQUE (parent_arrival_id),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id, workflow_revision)
      REFERENCES workflow_revisions(project_id, workflow_revision) ON DELETE RESTRICT,
    FOREIGN KEY (parent_group_run_id)
      REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_arrival_id)
      REFERENCES scoped_arrivals(request_id) DEFERRABLE INITIALLY DEFERRED
  ) STRICT;

  CREATE TABLE IF NOT EXISTS scoped_arrivals (
    arrival_seq INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL UNIQUE CHECK (length(request_id) > 0),
    group_run_id TEXT NOT NULL,
    source_run_id TEXT NOT NULL CHECK (length(source_run_id) > 0),
    target_node_id TEXT NOT NULL CHECK (length(target_node_id) > 0),
    target_kind TEXT NOT NULL CHECK (target_kind IN ('agent','collaboration')),
    agent_id TEXT,
    child_group_id TEXT,
    node_run_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN (
      'queued','running','integrating','completed','failed','paused','cancelled','skipped'
    )),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (
      (target_kind = 'agent' AND agent_id IS NOT NULL AND child_group_id IS NULL) OR
      (target_kind = 'collaboration' AND child_group_id IS NOT NULL AND agent_id IS NULL)
    ),
    UNIQUE (group_run_id, source_run_id, target_node_id),
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT
  ) STRICT;

  CREATE INDEX IF NOT EXISTS scoped_arrivals_agent_fifo
    ON scoped_arrivals(agent_id, arrival_seq)
    WHERE agent_id IS NOT NULL AND status IN ('queued','running','integrating','failed','paused');
  CREATE INDEX IF NOT EXISTS scoped_arrivals_group_status
    ON scoped_arrivals(group_run_id, status);
`;

const SCOPED_EXECUTION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_executions (
    execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
    project_id TEXT NOT NULL,
    group_run_id TEXT NOT NULL,
    arrival_request_id TEXT NOT NULL UNIQUE,
    agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
    ownership_epoch INTEGER NOT NULL DEFAULT 1 CHECK (ownership_epoch >= 1),
    execution_branch TEXT NOT NULL CHECK (execution_branch = 'executions/' || execution_id),
    worktree_path TEXT NOT NULL CHECK (length(worktree_path) > 0),
    status TEXT NOT NULL CHECK (status IN (
      'running','integrating','merged','failed','paused','stopped','completed','cancelled'
    )),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    UNIQUE (project_id, execution_branch),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (arrival_request_id) REFERENCES scoped_arrivals(request_id) ON DELETE RESTRICT
  ) STRICT;

  CREATE UNIQUE INDEX IF NOT EXISTS scoped_executions_one_active_agent
    ON scoped_executions(project_id, agent_id)
    WHERE status IN ('running','integrating','merged','failed','paused');
  CREATE UNIQUE INDEX IF NOT EXISTS scoped_executions_one_active_worktree
    ON scoped_executions(project_id, worktree_path)
    WHERE status IN ('running','integrating','merged','failed','paused');
`;

const SCOPED_INTEGRATION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_agent_merge_facts (
    arrival_request_id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL UNIQUE,
    group_run_id TEXT NOT NULL,
    proof_hash TEXT NOT NULL CHECK (length(proof_hash) > 0),
    pull_request_json TEXT NOT NULL CHECK (json_valid(pull_request_json)),
    synchronization_json TEXT NOT NULL CHECK (json_valid(synchronization_json)),
    route_json TEXT NOT NULL CHECK (json_valid(route_json)),
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (arrival_request_id) REFERENCES scoped_arrivals(request_id) ON DELETE RESTRICT,
    FOREIGN KEY (execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT
  ) STRICT;

  CREATE TABLE IF NOT EXISTS scoped_finish_tokens (
    request_id TEXT PRIMARY KEY CHECK (length(request_id) > 0),
    group_run_id TEXT NOT NULL,
    source_arrival_request_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (source_arrival_request_id) REFERENCES scoped_arrivals(request_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX IF NOT EXISTS scoped_finish_tokens_group
    ON scoped_finish_tokens(group_run_id);
`;

const SCOPED_GROUP_FINAL_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_group_final_merge_facts (
    group_run_id TEXT PRIMARY KEY,
    proof_hash TEXT NOT NULL CHECK (length(proof_hash) > 0),
    pull_request_json TEXT NOT NULL CHECK (json_valid(pull_request_json)),
    synchronization_json TEXT NOT NULL CHECK (json_valid(synchronization_json)),
    parent_route_json TEXT CHECK (parent_route_json IS NULL OR json_valid(parent_route_json)),
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT
  ) STRICT;
`;

/** Scoped Git writes have their own FK to scoped_executions. The v2 journal
 * keeps its original member_executions FK and is never weakened or rebuilt. */
const SCOPED_OPERATION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_operations (
    operation_id TEXT PRIMARY KEY CHECK (length(operation_id) > 0),
    project_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN (
      'git.push','pull.create','pull.merge','pull.close','pull.update','memory.commit','git.revert'
    )),
    payload_hash TEXT NOT NULL CHECK (length(payload_hash) > 0),
    status TEXT NOT NULL CHECK (status IN ('prepared','observed','finalized','uncertain','failed') OR (status = 'superseded' AND kind = 'git.push')),
    owner_execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    expected_head TEXT,
    expected_base TEXT,
    remote_fact_json TEXT CHECK (remote_fact_json IS NULL OR json_valid(remote_fact_json)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (owner_execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT
  ) STRICT;
`;

/** A Leader's management invocation is a scoped, durable owner of the same
 * Agent session used by business work. Releasing it requires a confirmed
 * resident stop; a writer restart must never silently resume an old turn. */
const SCOPED_LEADER_TURN_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_leader_turns (
    project_id TEXT NOT NULL,
    invocation_id TEXT NOT NULL CHECK (length(invocation_id) > 0),
    group_run_id TEXT NOT NULL,
    agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
    management_slot INTEGER NOT NULL CHECK (management_slot >= 1),
    writer_lease_epoch INTEGER NOT NULL CHECK (writer_lease_epoch >= 1),
    status TEXT NOT NULL CHECK (status IN ('active','released')),
    coordinator_epoch INTEGER NOT NULL DEFAULT 1 CHECK (coordinator_epoch >= 1),
    runtime_path TEXT,
    opened_at TEXT,
    management_role TEXT NOT NULL DEFAULT 'leader' CHECK (management_role IN ('leader','global-main')),
    created_at TEXT NOT NULL,
    released_at TEXT,
    PRIMARY KEY (project_id, invocation_id),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT
  ) STRICT;

  CREATE UNIQUE INDEX IF NOT EXISTS scoped_leader_turns_one_active_group
    ON scoped_leader_turns(project_id, group_run_id) WHERE status = 'active';
  CREATE UNIQUE INDEX IF NOT EXISTS scoped_leader_turns_one_active_agent
    ON scoped_leader_turns(project_id, agent_id) WHERE status = 'active';
`;

/** A group final PR is owned by the trusted runtime rather than a Worker or
 * Leader. Separate FKs retain the member journal's arrival/Agent guarantees. */
const SCOPED_FINAL_INTEGRATION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_final_integrations (
    execution_id TEXT PRIMARY KEY CHECK (execution_id = 'group-final-' || group_run_id),
    project_id TEXT NOT NULL,
    group_run_id TEXT NOT NULL UNIQUE,
    ownership_epoch INTEGER NOT NULL DEFAULT 1 CHECK (ownership_epoch >= 1),
    writer_lease_epoch INTEGER NOT NULL CHECK (writer_lease_epoch >= 1),
    execution_branch TEXT NOT NULL CHECK (execution_branch = 'groups/' || group_run_id),
    integration_target TEXT NOT NULL CHECK (length(integration_target) > 0),
    expected_head_sha TEXT NOT NULL CHECK (length(expected_head_sha) = 40),
    status TEXT NOT NULL CHECK (status IN ('integrating','completed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT
  ) STRICT;

  CREATE TABLE IF NOT EXISTS scoped_final_operations (
    operation_id TEXT PRIMARY KEY CHECK (length(operation_id) > 0),
    project_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('pull.create','pull.merge','pull.close','pull.update')),
    payload_hash TEXT NOT NULL CHECK (length(payload_hash) > 0),
    status TEXT NOT NULL CHECK (status IN ('prepared','observed','finalized','uncertain','failed')),
    owner_execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    expected_head TEXT NOT NULL,
    expected_base TEXT NOT NULL,
    remote_fact_json TEXT CHECK (remote_fact_json IS NULL OR json_valid(remote_fact_json)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (owner_execution_id) REFERENCES scoped_final_integrations(execution_id) ON DELETE RESTRICT
  ) STRICT;
`;

function assertMigrationLease(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  const lease = database.prepare(
    "SELECT * FROM writer_service_lease WHERE singleton = 1"
  ).get() as Record<string, unknown> | undefined;
  if (
    !authority || !lease ||
    lease.service_id !== authority.writerLease.serviceId ||
    lease.instance_id !== authority.writerLease.instanceId ||
    lease.host_id !== authority.writerLease.hostId ||
    Number(lease.epoch) !== authority.writerLease.epoch ||
    Number(lease.expires_at_ms) <= authority.nowMs
  ) {
    throw new CollaborationStateError(
      "WRITER_LEASE_HELD",
      "Schema migration requires the exact live writer lease"
    );
  }
}

function migrateSchemaV15ToV16(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec("ALTER TABLE scoped_final_operations RENAME TO scoped_final_operations_v15");
    database.exec(SCOPED_FINAL_INTEGRATION_SCHEMA_SQL);
    database.exec("INSERT INTO scoped_final_operations SELECT * FROM scoped_final_operations_v15");
    database.exec("DROP TABLE scoped_final_operations_v15");
    if (database.prepare("PRAGMA foreign_key_check").all().length) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped final cancellation migration left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 16 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV16ToV17(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    if (!(database.prepare("PRAGMA table_info(scoped_leader_turns)").all() as Array<{ name: string }>).some((column) => column.name === "management_role"))
      database.exec("ALTER TABLE scoped_leader_turns ADD COLUMN management_role TEXT NOT NULL DEFAULT 'leader' CHECK (management_role IN ('leader','global-main'))");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 17 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV17ToV18(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_AGENT_TASK_COMPLETION_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped task completion migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 18 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

// These indexes contain request metadata only. Immutable full proposals remain
// solely in the append-only event journal, including after migration/restart.
const WORKFLOW_ADJUSTMENT_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS workflow_adjustment_submissions
    ON project_events(project_id, json_extract(payload_json, '$.submission.requestId'),
      json_extract(payload_json, '$.submission.source.kind'), seq)
    WHERE event_type = 'workflow.adjustment.submitted';
  CREATE INDEX IF NOT EXISTS workflow_adjustment_transitions
    ON project_events(project_id, json_extract(payload_json, '$.transition.requestId'),
      seq DESC, json_extract(payload_json, '$.transition.status'))
    WHERE event_type = 'workflow.adjustment.transitioned';
`;

// Cover immutable browsing metadata without copying proposal bodies.
const WORKFLOW_ADJUSTMENT_PAGE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS workflow_adjustment_summary
    ON project_events(project_id, seq DESC,
      json_extract(payload_json, '$.submission.requestId'),
      json_remove(json_extract(payload_json, '$.submission.source'), '$.session'),
      json_extract(payload_json, '$.submission.submittedAt'),
      json_extract(payload_json, '$.submission.base'),
      json_array_length(payload_json, '$.submission.changes'),
      json_extract(payload_json, '$.submission.replacesRequestId'),
      json_extract(payload_json, '$.protocol'))
    WHERE event_type = 'workflow.adjustment.submitted';
`;

const WORKFLOW_NATIVE_HARNESS_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS workflow_native_session_harness
    ON project_events(project_id, agent_id, json_extract(payload_json, '$.binding.session.harnessId'))
    WHERE event_type = 'agent.native_binding.opened';
`;

const PROJECT_STATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS project_state_object_changes
    ON project_events(project_id, json_extract(payload_json, '$.object.kind'),
      json_extract(payload_json, '$.object.id'), seq DESC)
    WHERE event_type = 'project.state.extensions.changed';
`;

const PROJECT_STATE_DOCUMENT_SQL = `
  CREATE TABLE IF NOT EXISTS project_state_domains (
    project_id TEXT PRIMARY KEY,
    protocol TEXT NOT NULL CHECK (protocol = 'project-state-v1'),
    scheduler TEXT NOT NULL CHECK (scheduler IN ('git','serial')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TABLE IF NOT EXISTS project_state_documents (
    project_id TEXT NOT NULL,
    document_name TEXT NOT NULL CHECK (document_name IN ('project.checkpoint','sii.ledger','serial.invocation','invocation.commit')),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    version TEXT NOT NULL CHECK (length(version) = 64),
    value_json TEXT NOT NULL CHECK (json_valid(value_json)),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (project_id, document_name),
    FOREIGN KEY (project_id) REFERENCES project_state_domains(project_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TRIGGER IF NOT EXISTS project_state_domains_no_update
    BEFORE UPDATE ON project_state_domains BEGIN SELECT RAISE(ABORT, 'project state domains are immutable'); END;
  CREATE TRIGGER IF NOT EXISTS project_state_domains_no_delete
    BEFORE DELETE ON project_state_domains BEGIN SELECT RAISE(ABORT, 'project state domains are immutable'); END;
`;

const STANDALONE_DELIVERY_PULL_SQL = `
  CREATE TABLE IF NOT EXISTS standalone_delivery_pull_requests (
    pull_request_id TEXT PRIMARY KEY CHECK (length(pull_request_id) > 0),
    project_id TEXT NOT NULL,
    owner_execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    original_pull_request_id TEXT NOT NULL,
    head_sha TEXT NOT NULL CHECK (length(head_sha) IN (40,64)),
    record_json TEXT NOT NULL CHECK (json_valid(record_json)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (project_id, owner_execution_id, ownership_epoch, head_sha),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (owner_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT,
    FOREIGN KEY (original_pull_request_id) REFERENCES pull_requests(pull_request_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TRIGGER IF NOT EXISTS standalone_delivery_pull_identity_no_update
    BEFORE UPDATE ON standalone_delivery_pull_requests
    WHEN NEW.pull_request_id != OLD.pull_request_id OR NEW.project_id != OLD.project_id
      OR NEW.owner_execution_id != OLD.owner_execution_id OR NEW.ownership_epoch != OLD.ownership_epoch
      OR NEW.original_pull_request_id != OLD.original_pull_request_id
    BEGIN SELECT RAISE(ABORT, 'Standalone delivery PR identity is immutable'); END;
  CREATE TRIGGER IF NOT EXISTS standalone_delivery_pull_no_delete
    BEFORE DELETE ON standalone_delivery_pull_requests
    BEGIN SELECT RAISE(ABORT, 'Standalone delivery PR facts cannot be deleted'); END;
`;

// Projection readers select immutable facts by event type. The project/seq
// primary key otherwise scans every event, including large unrelated payloads.
const PROJECT_EVENT_TYPE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS project_events_project_type_seq
    ON project_events(project_id, event_type, seq);
`;

function migrateSchemaV26ToV27(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(PROJECT_EVENT_TYPE_INDEX_SQL);
    database.exec("UPDATE collaboration_state_meta SET schema_version = 27 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

/** Extend the existing journals without changing any historical outcome. */
function migrateSchemaV27ToV28(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    for (const table of ["operations", "scoped_operations", "scoped_final_operations"] as const) {
      const row = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) as { sql: string } | undefined;
      if (!row?.sql.includes("'pull.close'")) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Git journal kind constraint is missing");
      if (row.sql.includes("'pull.update'")) continue;
      const auxiliary = database.prepare("SELECT sql FROM sqlite_master WHERE tbl_name = ? AND type IN ('index','trigger') AND sql IS NOT NULL").all(table) as Array<{ sql: string }>;
      const sql = row.sql.replace(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?[\"\x60]?${table}[\"\x60]?`), `CREATE TABLE ${table}_v28`)
        .replace("'pull.close'", "'pull.close','pull.update'");
      database.exec(sql);
      database.exec(`INSERT INTO ${table}_v28 SELECT * FROM ${table} ORDER BY rowid`);
      database.exec(`DROP TABLE ${table}`);
      database.exec(`ALTER TABLE ${table}_v28 RENAME TO ${table}`);
      for (const item of auxiliary) database.exec(item.sql);
    }
    if (database.prepare("PRAGMA foreign_key_check").all().length) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "PR metadata journal migration left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 28 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { if (database.isTransaction) { try { database.exec("ROLLBACK"); } catch { /* Preserve the original migration failure. */ } } throw error; }
}

/** Extend the existing journals without changing any historical outcome. */
function migrateSchemaV25ToV26(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    for (const table of ["operations", "scoped_operations"] as const) {
      const row = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) as { sql: string } | undefined;
      if (!row?.sql.includes("'memory.commit'")) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Git journal kind constraint is missing");
      if (row.sql.includes("'git.revert'")) continue;
      const auxiliary = database.prepare("SELECT sql FROM sqlite_master WHERE tbl_name = ? AND type IN ('index','trigger') AND sql IS NOT NULL").all(table) as Array<{ sql: string }>;
      const sql = row.sql.replace(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?[\"\x60]?${table}[\"\x60]?`), `CREATE TABLE ${table}_v26`)
        .replace("'memory.commit'", "'memory.commit','git.revert'");
      database.exec(sql);
      database.exec(`INSERT INTO ${table}_v26 SELECT * FROM ${table} ORDER BY rowid`);
      database.exec(`DROP TABLE ${table}`);
      database.exec(`ALTER TABLE ${table}_v26 RENAME TO ${table}`);
      for (const item of auxiliary) database.exec(item.sql);
    }
    if (database.prepare("PRAGMA foreign_key_check").all().length) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Revert journal migration left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 26 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV24ToV25(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    // Add empty storage only. Existing project/PR/report rows are untouched.
    database.exec(STANDALONE_DELIVERY_PULL_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length)
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Standalone delivery facts left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 25 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV23ToV24(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(PROJECT_STATE_DOCUMENT_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length)
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Unified state documents left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 24 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV22ToV23(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(PROJECT_STATE_INDEX_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length)
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Project state index left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 23 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV21ToV22(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(WORKFLOW_NATIVE_HARNESS_INDEX_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Native Session Harness index left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 22 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV20ToV21(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(WORKFLOW_ADJUSTMENT_PAGE_INDEX_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Workflow history index left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 21 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV19ToV20(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(WORKFLOW_ADJUSTMENT_INDEX_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Workflow adjustment indexes left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 20 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

/** Upgrade constraints only. Never scan or reinterpret old unknown results. */
function migrateSchemaV18ToV19(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    for (const table of ["operations", "scoped_operations"] as const) {
      const row = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(table) as { sql: string } | undefined;
      const constraint = "status IN ('prepared','observed','finalized','uncertain','failed')";
      if (!row?.sql.includes(constraint)) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Push journal status constraint is missing");
      if (row.sql.includes("'superseded'")) continue;
      const sql = row.sql.replace(new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?[\"\x60]?${table}[\"\x60]?`), `CREATE TABLE ${table}_v19`)
        .replace(constraint, `${constraint} OR (status = 'superseded' AND kind = 'git.push')`);
      database.exec(sql);
      database.exec(`INSERT INTO ${table}_v19 SELECT * FROM ${table} ORDER BY rowid`);
      database.exec(`DROP TABLE ${table}`);
      database.exec(`ALTER TABLE ${table}_v19 RENAME TO ${table}`);
    }
    if (database.prepare("PRAGMA foreign_key_check").all().length) throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Push journal upgrade left invalid foreign keys");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 19 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV2ToV3(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_RUN_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped schema migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 3 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

/** A v3 execution path was unique forever. v4 permits a finished Agent's next
 * execution to reuse its fixed checkout, while one active/failed owner still
 * fences every other execution from that physical directory. */
function migrateSchemaV3ToV4(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("PRAGMA foreign_keys=OFF");
  database.exec("PRAGMA legacy_alter_table=ON");
  try {
    database.exec("BEGIN IMMEDIATE");
    assertMigrationLease(database, authority);
    database.exec(`
      DROP INDEX IF EXISTS member_executions_one_active_per_group_member;
      DROP INDEX IF EXISTS member_executions_one_active_per_normal_member;
      DROP INDEX IF EXISTS member_executions_one_active_branch;
      ALTER TABLE member_executions RENAME TO member_executions_schema_v3;

      CREATE TABLE member_executions (
        execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
        project_id TEXT NOT NULL,
        node_run_id TEXT NOT NULL,
        group_run_id TEXT,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
        purpose TEXT NOT NULL CHECK (purpose IN ('delivery', 'final-integration')),
        ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
        status TEXT NOT NULL CHECK (status IN (
          'queued','working','waiting_authorization','waiting_review','pr_open',
          'resolving','merged','stop_requested','stopped','superseded',
          'succeeded','failed','cancelled'
        )),
        execution_branch TEXT NOT NULL CHECK (length(execution_branch) > 0),
        worktree_path TEXT NOT NULL CHECK (length(worktree_path) > 0),
        pull_request_id TEXT,
        invocation_id TEXT,
        session_id TEXT,
        predecessor_execution_id TEXT,
        successor_execution_id TEXT,
        process_stop_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (process_stop_confirmed IN (0, 1)),
        failure_reason TEXT,
        wait_reason TEXT,
        output TEXT,
        queued_at TEXT NOT NULL,
        started_at TEXT,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        UNIQUE (task_id, ownership_epoch),
        FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
        FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
        FOREIGN KEY (pull_request_id)
          REFERENCES pull_requests(pull_request_id) DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (predecessor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT,
        FOREIGN KEY (successor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
      ) STRICT;

      INSERT INTO member_executions SELECT * FROM member_executions_schema_v3;
      DROP TABLE member_executions_schema_v3;

      CREATE UNIQUE INDEX member_executions_one_active_per_group_member
        ON member_executions(group_run_id, agent_id)
        WHERE group_run_id IS NOT NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_per_normal_member
        ON member_executions(node_run_id, agent_id)
        WHERE group_run_id IS NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_branch
        ON member_executions(project_id, execution_branch)
        WHERE status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_worktree
        ON member_executions(project_id, worktree_path)
        WHERE status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested','failed'
        );
    `);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "v4 worktree migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 4 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* Failed statement may have rolled back already. */ }
    throw error;
  } finally {
    database.exec("PRAGMA legacy_alter_table=OFF");
    database.exec("PRAGMA foreign_keys=ON");
  }
}

function migrateSchemaV4ToV5(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_EXECUTION_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped execution migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 5 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV5ToV6(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_INTEGRATION_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped integration migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 6 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV6ToV7(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_GROUP_FINAL_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped group final migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 7 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV7ToV8(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_OPERATION_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped Git operation migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 8 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV8ToV9(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_LEADER_TURN_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped Leader migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 9 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV9ToV10(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_FINAL_INTEGRATION_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped final ownership migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 10 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

const SCOPED_AGENT_REPORT_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_agent_reports (
    project_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    writer_lease_epoch INTEGER NOT NULL CHECK (writer_lease_epoch >= 1),
    invocation_id TEXT NOT NULL CHECK (length(invocation_id) > 0),
    output TEXT NOT NULL,
    selected_weak_target TEXT,
    report_hash TEXT NOT NULL CHECK (length(report_hash) > 0),
    head_sha TEXT CHECK (head_sha IS NULL OR length(head_sha) = 40),
    recorded_at TEXT NOT NULL,
    head_recorded_at TEXT,
    PRIMARY KEY (execution_id, ownership_epoch),
    UNIQUE (project_id, invocation_id),
    CHECK ((head_sha IS NULL) = (head_recorded_at IS NULL)),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT
  ) STRICT;
`;

const SCOPED_AGENT_TASK_COMPLETION_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_agent_task_completions (
    project_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
    invocation_id TEXT NOT NULL CHECK (length(invocation_id) > 0),
    call_id TEXT NOT NULL CHECK (length(call_id) > 0),
    summary TEXT CHECK (summary IS NULL OR length(summary) > 0),
    memory TEXT CHECK (memory IS NULL OR length(memory) > 0),
    requested_at TEXT NOT NULL,
    PRIMARY KEY (execution_id, ownership_epoch),
    UNIQUE (project_id, invocation_id),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE INDEX IF NOT EXISTS scoped_agent_task_completions_project
    ON scoped_agent_task_completions(project_id, execution_id, ownership_epoch);
`;

function migrateSchemaV10ToV11(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_AGENT_REPORT_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped Agent report migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 11 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

const SCOPED_AGENT_TURN_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_agent_turns (
    execution_id TEXT NOT NULL,
    ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
    project_id TEXT NOT NULL,
    writer_lease_epoch INTEGER NOT NULL CHECK (writer_lease_epoch >= 1),
    invocation_id TEXT NOT NULL CHECK (length(invocation_id) > 0),
    runtime_path TEXT NOT NULL CHECK (length(runtime_path) > 0),
    base_commit TEXT NOT NULL CHECK (length(base_commit) = 40),
    status TEXT NOT NULL CHECK (status IN ('reserved','opened','stopped')),
    created_at TEXT NOT NULL,
    opened_at TEXT,
    stopped_at TEXT,
    PRIMARY KEY (execution_id, ownership_epoch),
    UNIQUE (project_id, invocation_id),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT
  ) STRICT;
`;

const SCOPED_PATH_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_arrival_contexts (
    request_id TEXT PRIMARY KEY,
    path_context_json TEXT NOT NULL CHECK (json_valid(path_context_json)),
    FOREIGN KEY (request_id) REFERENCES scoped_arrivals(request_id) ON DELETE RESTRICT
  ) STRICT;
  CREATE TRIGGER IF NOT EXISTS scoped_arrival_contexts_immutable
    BEFORE UPDATE ON scoped_arrival_contexts BEGIN
      SELECT RAISE(ABORT, 'scoped path contexts are immutable');
    END;
  CREATE TRIGGER IF NOT EXISTS scoped_arrival_contexts_append_only
    BEFORE DELETE ON scoped_arrival_contexts BEGIN
      SELECT RAISE(ABORT, 'scoped path contexts are append-only');
    END;
`;

const SCOPED_USAGE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS scoped_usage_records (
    usage_id TEXT PRIMARY KEY CHECK (length(usage_id) > 0),
    request_id TEXT, project_id TEXT NOT NULL, node_run_id TEXT,
    group_run_id TEXT NOT NULL, agent_id TEXT NOT NULL,
    task_id TEXT CHECK (task_id IS NULL), execution_id TEXT,
    invocation_id TEXT NOT NULL, ownership_epoch INTEGER CHECK (ownership_epoch IS NULL OR ownership_epoch >= 1),
    input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
    cached_input_tokens INTEGER NOT NULL CHECK (cached_input_tokens >= 0),
    output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0), total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
    model TEXT, protocol TEXT, recorded_at TEXT NOT NULL,
    scope_kind TEXT NOT NULL DEFAULT 'scoped' CHECK (scope_kind = 'scoped'),
    UNIQUE (project_id, request_id),
    CHECK ((execution_id IS NULL) = (ownership_epoch IS NULL)),
    FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
    FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (group_run_id) REFERENCES scoped_group_runs(group_run_id) ON DELETE RESTRICT,
    FOREIGN KEY (execution_id) REFERENCES scoped_executions(execution_id) ON DELETE RESTRICT
  ) STRICT;
`;

function migrateSchemaV14ToV15(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_USAGE_SCHEMA_SQL);
    database.exec("UPDATE collaboration_state_meta SET schema_version = 15 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV13ToV14(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    const columns = database.prepare("PRAGMA table_info(scoped_leader_turns)").all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "coordinator_epoch")) database.exec("ALTER TABLE scoped_leader_turns ADD COLUMN coordinator_epoch INTEGER NOT NULL DEFAULT 1 CHECK (coordinator_epoch >= 1)");
    if (!columns.some((column) => column.name === "runtime_path")) database.exec("ALTER TABLE scoped_leader_turns ADD COLUMN runtime_path TEXT");
    if (!columns.some((column) => column.name === "opened_at")) database.exec("ALTER TABLE scoped_leader_turns ADD COLUMN opened_at TEXT");
    database.exec("UPDATE collaboration_state_meta SET schema_version = 14 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV12ToV13(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_PATH_SCHEMA_SQL);
    // Do not invent iteration counts for previously executed paths.
    database.exec("UPDATE collaboration_state_meta SET schema_version = 13 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function migrateSchemaV11ToV12(database: DatabaseSync, authority?: SchemaMigrationAuthority): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    assertMigrationLease(database, authority);
    database.exec(SCOPED_AGENT_TURN_SCHEMA_SQL);
    if (database.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Scoped native turn migration left invalid foreign keys");
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version = 12 WHERE singleton = 1");
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function migrateSchemaV1ToV2(
  database: DatabaseSync,
  authority?: SchemaMigrationAuthority
): void {
  database.exec("PRAGMA foreign_keys=OFF");
  database.exec("PRAGMA legacy_alter_table=ON");
  try {
    database.exec("BEGIN IMMEDIATE");
    const lease = database.prepare(
      "SELECT * FROM writer_service_lease WHERE singleton = 1"
    ).get() as Record<string, unknown> | undefined;
    if (
      !authority || !lease ||
      lease.service_id !== authority.writerLease.serviceId ||
      lease.instance_id !== authority.writerLease.instanceId ||
      lease.host_id !== authority.writerLease.hostId ||
      Number(lease.epoch) !== authority.writerLease.epoch ||
      Number(lease.expires_at_ms) <= authority.nowMs
    ) {
      throw new CollaborationStateError(
        "WRITER_LEASE_HELD",
        "Schema migration requires the exact live writer lease"
      );
    }
    database.exec(`

      CREATE TABLE IF NOT EXISTS legacy_v1_direct_main_markers (
        marker_id TEXT PRIMARY KEY CHECK (length(marker_id) > 0),
        execution_id TEXT NOT NULL CHECK (length(execution_id) > 0),
        project_id TEXT NOT NULL CHECK (length(project_id) > 0),
        group_run_id TEXT NOT NULL CHECK (length(group_run_id) > 0),
        source_kind TEXT NOT NULL CHECK (source_kind IN ('pull','operation')),
        source_id TEXT NOT NULL CHECK (length(source_id) > 0),
        head TEXT NOT NULL CHECK (length(head) > 0),
        base TEXT NOT NULL CHECK (length(base) > 0),
        UNIQUE (source_kind, source_id)
      ) STRICT;
      CREATE TRIGGER IF NOT EXISTS legacy_v1_direct_main_markers_no_update
        BEFORE UPDATE ON legacy_v1_direct_main_markers BEGIN
          SELECT RAISE(ABORT, 'legacy v1 direct-main facts are immutable');
        END;
      CREATE TRIGGER IF NOT EXISTS legacy_v1_direct_main_markers_no_delete
        BEFORE DELETE ON legacy_v1_direct_main_markers BEGIN
          SELECT RAISE(ABORT, 'legacy v1 direct-main facts are immutable');
        END;

      CREATE TABLE IF NOT EXISTS legacy_v1_untrusted_final_repairs (
        execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
        project_id TEXT NOT NULL CHECK (length(project_id) > 0),
        group_run_id TEXT NOT NULL CHECK (length(group_run_id) > 0),
        head TEXT NOT NULL CHECK (length(head) > 0)
      ) STRICT;
      CREATE TRIGGER IF NOT EXISTS legacy_v1_untrusted_final_repairs_no_update
        BEFORE UPDATE ON legacy_v1_untrusted_final_repairs BEGIN
          SELECT RAISE(ABORT, 'legacy v1 untrusted final repairs are immutable');
        END;
      CREATE TRIGGER IF NOT EXISTS legacy_v1_untrusted_final_repairs_no_delete
        BEFORE DELETE ON legacy_v1_untrusted_final_repairs BEGIN
          SELECT RAISE(ABORT, 'legacy v1 untrusted final repairs are immutable');
        END;

      DROP INDEX IF EXISTS member_executions_one_active_per_group_member;
      DROP INDEX IF EXISTS member_executions_one_active_per_normal_member;
      DROP INDEX IF EXISTS member_executions_one_active_branch;
      ALTER TABLE member_executions RENAME TO member_executions_schema_v1;

      CREATE TABLE member_executions (
        execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
        project_id TEXT NOT NULL,
        node_run_id TEXT NOT NULL,
        group_run_id TEXT,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
        purpose TEXT NOT NULL CHECK (purpose IN ('delivery', 'final-integration')),
        ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
        status TEXT NOT NULL CHECK (status IN (
          'queued','working','waiting_authorization','waiting_review','pr_open',
          'resolving','merged','stop_requested','stopped','superseded',
          'succeeded','failed','cancelled'
        )),
        execution_branch TEXT NOT NULL CHECK (length(execution_branch) > 0),
        worktree_path TEXT NOT NULL CHECK (length(worktree_path) > 0),
        pull_request_id TEXT,
        invocation_id TEXT,
        session_id TEXT,
        predecessor_execution_id TEXT,
        successor_execution_id TEXT,
        process_stop_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (process_stop_confirmed IN (0, 1)),
        failure_reason TEXT,
        wait_reason TEXT,
        output TEXT,
        queued_at TEXT NOT NULL,
        started_at TEXT,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        UNIQUE (task_id, ownership_epoch),
        UNIQUE (project_id, worktree_path),
        FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
        FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
        FOREIGN KEY (pull_request_id)
          REFERENCES pull_requests(pull_request_id) DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (predecessor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT,
        FOREIGN KEY (successor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
      ) STRICT;

      INSERT INTO member_executions(
        execution_id, project_id, node_run_id, group_run_id, task_id, agent_id,
        purpose, ownership_epoch, status, execution_branch, worktree_path,
        pull_request_id, invocation_id, session_id, predecessor_execution_id,
        successor_execution_id, process_stop_confirmed, failure_reason,
        wait_reason, output, queued_at, started_at, updated_at, completed_at
      )
      SELECT
        execution_id, project_id, node_run_id, group_run_id, task_id, agent_id,
        purpose, ownership_epoch, status, execution_branch, worktree_path,
        pull_request_id, invocation_id, session_id, predecessor_execution_id,
        successor_execution_id, process_stop_confirmed, failure_reason,
        wait_reason, output, queued_at, started_at, updated_at, completed_at
      FROM member_executions_schema_v1;

      DROP TABLE member_executions_schema_v1;

      CREATE UNIQUE INDEX member_executions_one_active_per_group_member
        ON member_executions(group_run_id, agent_id)
        WHERE group_run_id IS NOT NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_per_normal_member
        ON member_executions(node_run_id, agent_id)
        WHERE group_run_id IS NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_branch
        ON member_executions(project_id, execution_branch)
        WHERE status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );

      INSERT OR IGNORE INTO legacy_v1_direct_main_markers(
        marker_id, execution_id, project_id, group_run_id,
        source_kind, source_id, head, base
      )
      SELECT
        'pull:' || p.pull_request_id,
        e.execution_id,
        e.project_id,
        e.group_run_id,
        'pull',
        p.pull_request_id,
        e.execution_branch,
        p.base
      FROM member_executions e
      JOIN group_runs g ON g.group_run_id = e.group_run_id
      JOIN pull_requests p ON p.owner_execution_id = e.execution_id
      WHERE e.purpose = 'final-integration'
        AND e.execution_branch != g.group_branch
        AND p.head = e.execution_branch
        AND p.base = g.integration_target;

      INSERT OR IGNORE INTO legacy_v1_direct_main_markers(
        marker_id, execution_id, project_id, group_run_id,
        source_kind, source_id, head, base
      )
      SELECT
        'operation:' || o.operation_id,
        e.execution_id,
        e.project_id,
        e.group_run_id,
        'operation',
        o.operation_id,
        e.execution_branch,
        o.expected_base
      FROM member_executions e
      JOIN group_runs g ON g.group_run_id = e.group_run_id
      JOIN operations o ON o.owner_execution_id = e.execution_id
        AND o.ownership_epoch = e.ownership_epoch
      JOIN operations pushed ON pushed.owner_execution_id = e.execution_id
        AND pushed.ownership_epoch = e.ownership_epoch
        AND pushed.kind = 'git.push'
        AND pushed.status IN ('observed','finalized')
        AND pushed.expected_base = e.execution_branch
        AND pushed.expected_head = o.expected_head
      WHERE e.purpose = 'final-integration'
        AND e.execution_branch != g.group_branch
        AND o.kind = 'pull.create'
        AND o.status IN ('prepared','uncertain','observed','finalized')
        AND o.expected_base = g.integration_target
        AND NOT EXISTS (
          SELECT 1 FROM pull_requests p WHERE p.owner_execution_id = e.execution_id
        );

      -- A v1 non-canonical final branch without an exact durable base fact
      -- cannot safely be reopened after upgrade: older code may have created
      -- it for a direct-to-main repair. Quarantine that immutable identity so
      -- v2 performs a fresh member-owned handoff based on the group branch.
      INSERT OR IGNORE INTO legacy_v1_untrusted_final_repairs(
        execution_id, project_id, group_run_id, head
      )
      SELECT
        e.execution_id,
        e.project_id,
        e.group_run_id,
        e.execution_branch
      FROM member_executions e
      JOIN group_runs g ON g.group_run_id = e.group_run_id
      WHERE e.purpose = 'final-integration'
        AND e.execution_branch != g.group_branch
        AND NOT EXISTS (
          SELECT 1 FROM legacy_v1_direct_main_markers marker
          WHERE marker.execution_id = e.execution_id
            AND marker.project_id = e.project_id
            AND marker.group_run_id = e.group_run_id
            AND marker.head = e.execution_branch
        )
        AND NOT EXISTS (
          SELECT 1 FROM pull_requests pull
          WHERE pull.owner_execution_id = e.execution_id
            AND pull.head = e.execution_branch
            AND pull.base = g.group_branch
        )
        AND NOT EXISTS (
          SELECT 1 FROM operations operation
          WHERE operation.owner_execution_id = e.execution_id
            AND operation.ownership_epoch = e.ownership_epoch
            AND operation.kind = 'pull.create'
            AND operation.expected_base = g.group_branch
        );
    `);
    const violations = database.prepare("PRAGMA foreign_key_check").all();
    if (violations.length > 0) {
      throw new CollaborationStateError(
        "DATABASE_INTEGRITY_FAILED",
        "Collaboration schema migration left invalid foreign-key references"
      );
    }
    database.exec(`
      UPDATE collaboration_state_meta SET schema_version = 2 WHERE singleton = 1;
      COMMIT;
    `);
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The failed statement may already have ended the transaction.
    }
    throw error;
  } finally {
    database.exec("PRAGMA legacy_alter_table=OFF");
    database.exec("PRAGMA foreign_keys=ON");
  }
}

export function initializeCollaborationStateSchema(
  database: DatabaseSync,
  migrationAuthority?: SchemaMigrationAuthority
): void {
  const metaExists = Boolean(database.prepare(`
    SELECT 1 FROM sqlite_schema
    WHERE type = 'table' AND name = 'collaboration_state_meta'
  `).get());
  if (metaExists) {
    const existing = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (existing?.schema_version === 1 && COLLABORATION_STATE_SCHEMA_VERSION >= 2) {
      // Every v2 DDL statement belongs to the migration transaction. A failed
      // FK check must leave both schema SQL and version exactly at v1.
      migrateSchemaV1ToV2(database, migrationAuthority);
    }
    const current = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (current?.schema_version === 2 && COLLABORATION_STATE_SCHEMA_VERSION >= 3) {
      migrateSchemaV2ToV3(database, migrationAuthority);
    }
    const scoped = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scoped?.schema_version === 3 && COLLABORATION_STATE_SCHEMA_VERSION >= 4) {
      migrateSchemaV3ToV4(database, migrationAuthority);
    }
    const fixedWorktree = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (fixedWorktree?.schema_version === 4 && COLLABORATION_STATE_SCHEMA_VERSION >= 5) {
      migrateSchemaV4ToV5(database, migrationAuthority);
    }
    const scopedExecution = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedExecution?.schema_version === 5 && COLLABORATION_STATE_SCHEMA_VERSION >= 6) {
      migrateSchemaV5ToV6(database, migrationAuthority);
    }
    const mergedArrival = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (mergedArrival?.schema_version === 6 && COLLABORATION_STATE_SCHEMA_VERSION >= 7) {
      migrateSchemaV6ToV7(database, migrationAuthority);
    }
    const scopedFinal = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedFinal?.schema_version === 7 && COLLABORATION_STATE_SCHEMA_VERSION >= 8) {
      migrateSchemaV7ToV8(database, migrationAuthority);
    }
    const scopedOperations = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedOperations?.schema_version === 8 && COLLABORATION_STATE_SCHEMA_VERSION >= 9) {
      migrateSchemaV8ToV9(database, migrationAuthority);
    }
    const scopedLeader = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedLeader?.schema_version === 9 && COLLABORATION_STATE_SCHEMA_VERSION >= 10) {
      migrateSchemaV9ToV10(database, migrationAuthority);
    }
    const scopedFinalOwner = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedFinalOwner?.schema_version === 10 && COLLABORATION_STATE_SCHEMA_VERSION >= 11) {
      migrateSchemaV10ToV11(database, migrationAuthority);
    }
    const scopedReport = database.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number } | undefined;
    if (scopedReport?.schema_version === 11 && COLLABORATION_STATE_SCHEMA_VERSION >= 12) {
      migrateSchemaV11ToV12(database, migrationAuthority);
    }
    const scopedTurn = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1")
      .get() as { schema_version: number } | undefined;
    if (scopedTurn?.schema_version === 12 && COLLABORATION_STATE_SCHEMA_VERSION >= 13) {
      migrateSchemaV12ToV13(database, migrationAuthority);
    }
    const scopedPath = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1")
      .get() as { schema_version: number } | undefined;
    if (scopedPath?.schema_version === 13 && COLLABORATION_STATE_SCHEMA_VERSION >= 14) {
      migrateSchemaV13ToV14(database, migrationAuthority);
    }
    const scopedManagement = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1")
      .get() as { schema_version: number } | undefined;
    if (scopedManagement?.schema_version === 14 && COLLABORATION_STATE_SCHEMA_VERSION >= 15) {
      migrateSchemaV14ToV15(database, migrationAuthority);
    }
    const scopedUsage = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1")
      .get() as { schema_version: number } | undefined;
    if (scopedUsage?.schema_version === 15 && COLLABORATION_STATE_SCHEMA_VERSION >= 16) migrateSchemaV15ToV16(database, migrationAuthority);
    const scopedCancellation = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (scopedCancellation?.schema_version === 16 && COLLABORATION_STATE_SCHEMA_VERSION >= 17) migrateSchemaV16ToV17(database, migrationAuthority);
    const scopedTaskCompletion = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (scopedTaskCompletion?.schema_version === 17 && COLLABORATION_STATE_SCHEMA_VERSION >= 18) migrateSchemaV17ToV18(database, migrationAuthority);
    const pushJournal = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (pushJournal?.schema_version === 18 && COLLABORATION_STATE_SCHEMA_VERSION >= 19) migrateSchemaV18ToV19(database, migrationAuthority);
    const adjustmentJournal = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (adjustmentJournal?.schema_version === 19 && COLLABORATION_STATE_SCHEMA_VERSION >= 20) migrateSchemaV19ToV20(database, migrationAuthority);
    const historyJournal = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (historyJournal?.schema_version === 20 && COLLABORATION_STATE_SCHEMA_VERSION >= 21) migrateSchemaV20ToV21(database, migrationAuthority);
    const nativeHarness = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (nativeHarness?.schema_version === 21 && COLLABORATION_STATE_SCHEMA_VERSION >= 22) migrateSchemaV21ToV22(database, migrationAuthority);
    const projectState = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (projectState?.schema_version === 22 && COLLABORATION_STATE_SCHEMA_VERSION >= 23) migrateSchemaV22ToV23(database, migrationAuthority);
    const stateDocuments = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (stateDocuments?.schema_version === 23 && COLLABORATION_STATE_SCHEMA_VERSION >= 24) migrateSchemaV23ToV24(database, migrationAuthority);
    const standaloneDelivery = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (standaloneDelivery?.schema_version === 24 && COLLABORATION_STATE_SCHEMA_VERSION >= 25) migrateSchemaV24ToV25(database, migrationAuthority);
    const revertJournal = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (revertJournal?.schema_version === 25 && COLLABORATION_STATE_SCHEMA_VERSION >= 26) migrateSchemaV25ToV26(database, migrationAuthority);
    const eventTypeIndex = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (eventTypeIndex?.schema_version === 26 && COLLABORATION_STATE_SCHEMA_VERSION >= 27) migrateSchemaV26ToV27(database, migrationAuthority);
    const metadataJournal = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1").get() as { schema_version: number } | undefined;
    if (metadataJournal?.schema_version === 27 && COLLABORATION_STATE_SCHEMA_VERSION >= 28) migrateSchemaV27ToV28(database, migrationAuthority);
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS collaboration_state_meta (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      schema_version INTEGER NOT NULL CHECK (schema_version >= 1)
    ) STRICT;

    INSERT OR IGNORE INTO collaboration_state_meta(singleton, schema_version)
    VALUES (1, ${COLLABORATION_STATE_SCHEMA_VERSION});

    CREATE TABLE IF NOT EXISTS writer_service_lease (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      service_id TEXT NOT NULL CHECK (length(service_id) > 0),
      instance_id TEXT NOT NULL CHECK (length(instance_id) > 0),
      host_id TEXT NOT NULL CHECK (length(host_id) > 0),
      epoch INTEGER NOT NULL CHECK (epoch >= 1),
      expires_at_ms INTEGER NOT NULL CHECK (expires_at_ms >= 0),
      renewed_at_ms INTEGER NOT NULL CHECK (renewed_at_ms >= 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS project_heads (
      project_id TEXT PRIMARY KEY CHECK (length(project_id) > 0),
      revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
      workflow_revision INTEGER NOT NULL CHECK (workflow_revision >= 1),
      active_node_run_id TEXT,
      frozen INTEGER NOT NULL DEFAULT 0 CHECK (frozen IN (0, 1)),
      freeze_reason TEXT,
      freeze_expected_json TEXT,
      recovery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (recovery_attempts >= 0),
      recovery_limit INTEGER NOT NULL DEFAULT 2 CHECK (recovery_limit >= 1),
      next_event_seq INTEGER NOT NULL DEFAULT 1 CHECK (next_event_seq >= 1),
      git_state_json TEXT NOT NULL CHECK (json_valid(git_state_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (active_node_run_id) REFERENCES node_runs(node_run_id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT;

    CREATE TABLE IF NOT EXISTS workflow_revisions (
      project_id TEXT NOT NULL,
      workflow_revision INTEGER NOT NULL CHECK (workflow_revision >= 1),
      snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
      created_at TEXT NOT NULL,
      PRIMARY KEY (project_id, workflow_revision),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS node_runs (
      node_run_id TEXT PRIMARY KEY CHECK (length(node_run_id) > 0),
      project_id TEXT NOT NULL,
      node_kind TEXT NOT NULL CHECK (node_kind IN ('agent', 'collaboration')),
      node_id TEXT NOT NULL CHECK (length(node_id) > 0),
      agent_id TEXT,
      group_id TEXT,
      workflow_revision INTEGER NOT NULL CHECK (workflow_revision >= 1),
      activation_request_id TEXT NOT NULL CHECK (length(activation_request_id) > 0),
      activation_payload_hash TEXT NOT NULL CHECK (length(activation_payload_hash) > 0),
      activation_origin_json TEXT CHECK (activation_origin_json IS NULL OR json_valid(activation_origin_json)),
      input_snapshot_ref TEXT NOT NULL CHECK (length(input_snapshot_ref) > 0),
      optional_task TEXT,
      source_node_run_id TEXT,
      source_agent_id TEXT,
      activated_by_agent_id TEXT NOT NULL CHECK (length(activated_by_agent_id) > 0),
      status TEXT NOT NULL CHECK (status IN (
        'preparing','queued','coordinating','running','integrating',
        'paused','blocked','cancelled','failed','completed'
      )),
      route_emission_id TEXT,
      output TEXT,
      failure_reason TEXT,
      activated_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      CHECK (
        (node_kind = 'agent' AND agent_id IS NOT NULL AND group_id IS NULL) OR
        (node_kind = 'collaboration' AND group_id IS NOT NULL AND agent_id IS NULL)
      ),
      UNIQUE (project_id, activation_request_id),
      UNIQUE (project_id, route_emission_id),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (project_id, workflow_revision)
        REFERENCES workflow_revisions(project_id, workflow_revision) ON DELETE RESTRICT,
      FOREIGN KEY (source_node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE UNIQUE INDEX IF NOT EXISTS node_runs_one_active_outer
      ON node_runs(project_id)
      WHERE status IN (
        'preparing','queued','coordinating','running','integrating','paused','blocked'
      );

    CREATE TABLE IF NOT EXISTS group_runs (
      group_run_id TEXT PRIMARY KEY CHECK (length(group_run_id) > 0),
      node_run_id TEXT NOT NULL UNIQUE,
      member_snapshot_json TEXT NOT NULL CHECK (json_valid(member_snapshot_json)),
      leader_agent_id TEXT NOT NULL CHECK (length(leader_agent_id) > 0),
      acting_coordinator_id TEXT,
      coordinator_epoch INTEGER NOT NULL DEFAULT 1 CHECK (coordinator_epoch >= 1),
      base_commit TEXT NOT NULL CHECK (length(base_commit) > 0),
      group_branch TEXT NOT NULL CHECK (length(group_branch) > 0),
      integration_target TEXT NOT NULL DEFAULT 'main' CHECK (integration_target = 'main'),
      integration_owner_execution_id TEXT,
      final_pull_request_id TEXT,
      status TEXT NOT NULL CHECK (status IN (
        'preparing','coordinating','running','integrating',
        'paused','blocked','cancelled','failed','completed'
      )),
      pause_reason TEXT,
      completion_decided_by TEXT,
      completion_decision_epoch INTEGER,
      leader_decision TEXT,
      output TEXT,
      failure_reason TEXT,
      cancellation_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancellation_requested IN (0, 1)),
      member_recovery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (member_recovery_attempts >= 0),
      member_recovery_limit INTEGER NOT NULL DEFAULT 2 CHECK (member_recovery_limit >= 1),
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (integration_owner_execution_id)
        REFERENCES member_executions(execution_id) DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY (final_pull_request_id)
        REFERENCES pull_requests(pull_request_id) DEFERRABLE INITIALLY DEFERRED
    ) STRICT;

    CREATE TABLE IF NOT EXISTS group_members (
      group_run_id TEXT NOT NULL,
      agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
      snapshot_ordinal INTEGER NOT NULL CHECK (snapshot_ordinal >= 0),
      failed_excluded INTEGER NOT NULL DEFAULT 0 CHECK (failed_excluded IN (0, 1)),
      PRIMARY KEY (group_run_id, agent_id),
      UNIQUE (group_run_id, snapshot_ordinal),
      FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS work_tasks (
      task_id TEXT PRIMARY KEY CHECK (length(task_id) > 0),
      node_run_id TEXT NOT NULL,
      group_run_id TEXT,
      assignment TEXT NOT NULL CHECK (length(trim(assignment)) > 0),
      assignee_agent_id TEXT,
      dependency_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(dependency_ids_json)),
      queue_ordinal INTEGER NOT NULL CHECK (queue_ordinal >= 1),
      purpose TEXT NOT NULL DEFAULT 'delivery' CHECK (purpose IN ('delivery', 'final-integration')),
      current_execution_id TEXT,
      status TEXT NOT NULL CHECK (status IN (
        'pending','assigned','working','waiting','continuation_pending',
        'succeeded','failed','cancelled'
      )),
      predecessor_task_id TEXT,
      successor_task_id TEXT,
      wait_reason TEXT,
      failure_reason TEXT,
      cancel_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      CHECK (purpose = 'delivery' OR group_run_id IS NOT NULL),
      CHECK (status != 'assigned' OR assignee_agent_id IS NOT NULL),
      UNIQUE (node_run_id, queue_ordinal),
      FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (current_execution_id)
        REFERENCES member_executions(execution_id) DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY (predecessor_task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
      FOREIGN KEY (successor_task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS task_dependencies (
      task_id TEXT NOT NULL,
      dependency_task_id TEXT NOT NULL,
      PRIMARY KEY (task_id, dependency_task_id),
      CHECK (task_id != dependency_task_id),
      FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
      FOREIGN KEY (dependency_task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS member_executions (
      execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
      project_id TEXT NOT NULL,
      node_run_id TEXT NOT NULL,
      group_run_id TEXT,
      task_id TEXT NOT NULL,
      agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
      purpose TEXT NOT NULL CHECK (purpose IN ('delivery', 'final-integration')),
      ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
      status TEXT NOT NULL CHECK (status IN (
        'queued','working','waiting_authorization','waiting_review','pr_open',
        'resolving','merged','stop_requested','stopped','superseded',
        'succeeded','failed','cancelled'
      )),
      execution_branch TEXT NOT NULL CHECK (length(execution_branch) > 0),
      worktree_path TEXT NOT NULL CHECK (length(worktree_path) > 0),
      pull_request_id TEXT,
      invocation_id TEXT,
      session_id TEXT,
      predecessor_execution_id TEXT,
      successor_execution_id TEXT,
      process_stop_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (process_stop_confirmed IN (0, 1)),
      failure_reason TEXT,
      wait_reason TEXT,
      output TEXT,
      queued_at TEXT NOT NULL,
      started_at TEXT,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      UNIQUE (task_id, ownership_epoch),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
      FOREIGN KEY (pull_request_id)
        REFERENCES pull_requests(pull_request_id) DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY (predecessor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT,
      FOREIGN KEY (successor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE UNIQUE INDEX IF NOT EXISTS member_executions_one_active_per_group_member
      ON member_executions(group_run_id, agent_id)
      WHERE group_run_id IS NOT NULL AND status IN (
        'queued','working','waiting_authorization','waiting_review',
        'pr_open','resolving','merged','stop_requested'
      );

    CREATE UNIQUE INDEX IF NOT EXISTS member_executions_one_active_per_normal_member
      ON member_executions(node_run_id, agent_id)
      WHERE group_run_id IS NULL AND status IN (
        'queued','working','waiting_authorization','waiting_review',
        'pr_open','resolving','merged','stop_requested'
      );

    CREATE UNIQUE INDEX IF NOT EXISTS member_executions_one_active_branch
      ON member_executions(project_id, execution_branch)
      WHERE status IN (
        'queued','working','waiting_authorization','waiting_review',
        'pr_open','resolving','merged','stop_requested'
      );

    CREATE UNIQUE INDEX IF NOT EXISTS member_executions_one_active_worktree
      ON member_executions(project_id, worktree_path)
      WHERE status IN (
        'queued','working','waiting_authorization','waiting_review',
        'pr_open','resolving','merged','stop_requested','failed'
      );

    CREATE TABLE IF NOT EXISTS pull_requests (
      pull_request_id TEXT PRIMARY KEY CHECK (length(pull_request_id) > 0),
      project_id TEXT NOT NULL,
      owner_execution_id TEXT NOT NULL UNIQUE,
      provider_number INTEGER NOT NULL CHECK (provider_number >= 1),
      html_url TEXT NOT NULL CHECK (length(html_url) > 0),
      head TEXT NOT NULL CHECK (length(head) > 0),
      base TEXT NOT NULL CHECK (length(base) > 0),
      status TEXT NOT NULL CHECK (status IN ('open','conflicted','closed','merged','unknown')),
      head_sha TEXT,
      base_sha TEXT,
      mergeable INTEGER CHECK (mergeable IS NULL OR mergeable IN (0, 1)),
      merge_commit_sha TEXT,
      diff_url TEXT,
      head_commit_url TEXT,
      conflict_paths_json TEXT CHECK (conflict_paths_json IS NULL OR json_valid(conflict_paths_json)),
      checks_json TEXT CHECK (checks_json IS NULL OR json_valid(checks_json)),
      blockers_json TEXT CHECK (blockers_json IS NULL OR json_valid(blockers_json)),
      reconciliation_json TEXT CHECK (reconciliation_json IS NULL OR json_valid(reconciliation_json)),
      observed_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (owner_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS operations (
      operation_id TEXT PRIMARY KEY CHECK (length(operation_id) > 0),
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN (
        'repository.create','git.push','pull.create','pull.merge','pull.close','pull.update','memory.commit','git.revert'
      )),
      payload_hash TEXT NOT NULL CHECK (length(payload_hash) > 0),
      status TEXT NOT NULL CHECK (status IN ('prepared','observed','finalized','uncertain','failed') OR (status = 'superseded' AND kind = 'git.push')),
      owner_execution_id TEXT,
      ownership_epoch INTEGER CHECK (ownership_epoch IS NULL OR ownership_epoch >= 1),
      expected_head TEXT,
      expected_base TEXT,
      remote_fact_json TEXT CHECK (remote_fact_json IS NULL OR json_valid(remote_fact_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (
        (owner_execution_id IS NULL AND ownership_epoch IS NULL) OR
        (owner_execution_id IS NOT NULL AND ownership_epoch IS NOT NULL)
      ),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (owner_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
    ) STRICT;

    -- Narrow upgrade-only compatibility facts. Fresh v2 rows never enter
    -- this table; migration records only exact legacy final-repair pulls (or
    -- their durable pull.create operation) that already targeted main.
    CREATE TABLE IF NOT EXISTS legacy_v1_direct_main_markers (
      marker_id TEXT PRIMARY KEY CHECK (length(marker_id) > 0),
      execution_id TEXT NOT NULL CHECK (length(execution_id) > 0),
      project_id TEXT NOT NULL CHECK (length(project_id) > 0),
      group_run_id TEXT NOT NULL CHECK (length(group_run_id) > 0),
      source_kind TEXT NOT NULL CHECK (source_kind IN ('pull','operation')),
      source_id TEXT NOT NULL CHECK (length(source_id) > 0),
      head TEXT NOT NULL CHECK (length(head) > 0),
      base TEXT NOT NULL CHECK (length(base) > 0),
      UNIQUE (source_kind, source_id)
    ) STRICT;

    -- Upgrade-only quarantine. Fresh v2 projects never insert rows here.
    CREATE TABLE IF NOT EXISTS legacy_v1_untrusted_final_repairs (
      execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
      project_id TEXT NOT NULL CHECK (length(project_id) > 0),
      group_run_id TEXT NOT NULL CHECK (length(group_run_id) > 0),
      head TEXT NOT NULL CHECK (length(head) > 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS initialization_checkpoints (
      checkpoint_seq INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      operation_id TEXT NOT NULL,
      attempt INTEGER NOT NULL CHECK (attempt >= 1),
      state_json TEXT NOT NULL CHECK (json_valid(state_json)),
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS project_events (
      project_id TEXT NOT NULL,
      seq INTEGER NOT NULL CHECK (seq >= 1),
      event_id TEXT NOT NULL CHECK (length(event_id) > 0),
      request_id TEXT,
      workflow_revision INTEGER,
      node_id TEXT,
      node_run_id TEXT,
      group_run_id TEXT,
      agent_id TEXT,
      task_id TEXT,
      execution_id TEXT,
      invocation_id TEXT,
      ownership_epoch INTEGER CHECK (ownership_epoch IS NULL OR ownership_epoch >= 1),
      coordinator_epoch INTEGER CHECK (coordinator_epoch IS NULL OR coordinator_epoch >= 1),
      occurred_at TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (length(event_type) > 0),
      payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
      PRIMARY KEY (project_id, seq),
      UNIQUE (project_id, event_id),
      UNIQUE (project_id, request_id),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
      FOREIGN KEY (execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS usage_records (
      usage_id TEXT PRIMARY KEY CHECK (length(usage_id) > 0),
      request_id TEXT,
      project_id TEXT NOT NULL,
      node_run_id TEXT,
      group_run_id TEXT,
      agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
      task_id TEXT,
      execution_id TEXT,
      invocation_id TEXT,
      ownership_epoch INTEGER CHECK (ownership_epoch IS NULL OR ownership_epoch >= 1),
      input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
      cached_input_tokens INTEGER NOT NULL CHECK (cached_input_tokens >= 0),
      output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
      total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
      model TEXT,
      protocol TEXT,
      recorded_at TEXT NOT NULL,
      UNIQUE (project_id, request_id),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
      FOREIGN KEY (execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS route_decisions (
      decision_id TEXT PRIMARY KEY CHECK (length(decision_id) > 0),
      project_id TEXT NOT NULL,
      source_node_run_id TEXT NOT NULL,
      source_group_run_id TEXT,
      decision_kind TEXT NOT NULL CHECK (decision_kind IN ('fixed','weak')),
      target_node_id TEXT NOT NULL CHECK (length(target_node_id) > 0),
      selected_by_agent_id TEXT,
      decision_request_id TEXT,
      created_at TEXT NOT NULL,
      CHECK (
        (decision_kind = 'fixed' AND selected_by_agent_id IS NULL AND decision_request_id IS NULL) OR
        (decision_kind = 'weak' AND selected_by_agent_id IS NOT NULL AND decision_request_id IS NOT NULL)
      ),
      UNIQUE (project_id, source_node_run_id),
      UNIQUE (project_id, decision_request_id),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (source_node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (source_group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS route_outbox (
      route_emission_id TEXT PRIMARY KEY CHECK (length(route_emission_id) > 0),
      project_id TEXT NOT NULL,
      source_node_run_id TEXT NOT NULL,
      source_group_run_id TEXT,
      target_node_id TEXT NOT NULL CHECK (length(target_node_id) > 0),
      decision_kind TEXT NOT NULL CHECK (decision_kind IN ('fixed','weak')),
      decision_id TEXT NOT NULL UNIQUE,
      payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered')),
      delivery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
      created_at TEXT NOT NULL,
      delivered_at TEXT,
      UNIQUE (project_id, source_node_run_id),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
      FOREIGN KEY (source_node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (source_group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
      FOREIGN KEY (decision_id) REFERENCES route_decisions(decision_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS downstream_activations (
      route_emission_id TEXT PRIMARY KEY,
      activation_request_id TEXT NOT NULL UNIQUE,
      target_node_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (route_emission_id) REFERENCES route_outbox(route_emission_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS lane_capacity (
      project_id TEXT NOT NULL,
      lane TEXT NOT NULL CHECK (lane IN ('worker','management')),
      capacity INTEGER NOT NULL CHECK (capacity >= 1),
      PRIMARY KEY (project_id, lane),
      FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS lane_leases (
      project_id TEXT NOT NULL,
      lane TEXT NOT NULL CHECK (lane IN ('worker','management')),
      slot INTEGER NOT NULL CHECK (slot >= 1),
      owner_kind TEXT NOT NULL CHECK (owner_kind IN ('execution','coordinator')),
      owner_id TEXT NOT NULL CHECK (length(owner_id) > 0),
      acquired_at TEXT NOT NULL,
      PRIMARY KEY (project_id, lane, slot),
      UNIQUE (project_id, owner_kind, owner_id),
      FOREIGN KEY (project_id, lane) REFERENCES lane_capacity(project_id, lane) ON DELETE RESTRICT
    ) STRICT;

    CREATE TRIGGER IF NOT EXISTS workflow_revisions_no_update
      BEFORE UPDATE ON workflow_revisions BEGIN
        SELECT RAISE(ABORT, 'workflow revisions are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS workflow_revisions_no_delete
      BEFORE DELETE ON workflow_revisions BEGIN
        SELECT RAISE(ABORT, 'workflow revisions are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS project_events_no_update
      BEFORE UPDATE ON project_events BEGIN
        SELECT RAISE(ABORT, 'events are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS project_events_no_delete
      BEFORE DELETE ON project_events BEGIN
        SELECT RAISE(ABORT, 'events are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS usage_records_no_update
      BEFORE UPDATE ON usage_records BEGIN
        SELECT RAISE(ABORT, 'usage is append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS usage_records_no_delete
      BEFORE DELETE ON usage_records BEGIN
        SELECT RAISE(ABORT, 'usage is append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS initialization_checkpoints_no_update
      BEFORE UPDATE ON initialization_checkpoints BEGIN
        SELECT RAISE(ABORT, 'initialization checkpoints are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS initialization_checkpoints_no_delete
      BEFORE DELETE ON initialization_checkpoints BEGIN
        SELECT RAISE(ABORT, 'initialization checkpoints are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS route_decisions_no_update
      BEFORE UPDATE ON route_decisions BEGIN
        SELECT RAISE(ABORT, 'route decisions are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS route_decisions_no_delete
      BEFORE DELETE ON route_decisions BEGIN
        SELECT RAISE(ABORT, 'route decisions are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS route_outbox_no_delete
      BEFORE DELETE ON route_outbox BEGIN
        SELECT RAISE(ABORT, 'route outbox is append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS route_outbox_payload_immutable
      BEFORE UPDATE ON route_outbox
      WHEN OLD.route_emission_id != NEW.route_emission_id
        OR OLD.project_id != NEW.project_id
        OR OLD.source_node_run_id != NEW.source_node_run_id
        OR COALESCE(OLD.source_group_run_id, '') != COALESCE(NEW.source_group_run_id, '')
        OR OLD.target_node_id != NEW.target_node_id
        OR OLD.decision_kind != NEW.decision_kind
        OR OLD.decision_id != NEW.decision_id
        OR OLD.payload_json != NEW.payload_json
        OR OLD.created_at != NEW.created_at
        OR (OLD.status = 'delivered' AND NEW.status != 'delivered')
        OR NEW.delivery_attempts < OLD.delivery_attempts
      BEGIN
        SELECT RAISE(ABORT, 'route outbox identity and payload are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS legacy_v1_direct_main_markers_no_update
      BEFORE UPDATE ON legacy_v1_direct_main_markers BEGIN
        SELECT RAISE(ABORT, 'legacy v1 direct-main facts are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS legacy_v1_direct_main_markers_no_delete
      BEFORE DELETE ON legacy_v1_direct_main_markers BEGIN
        SELECT RAISE(ABORT, 'legacy v1 direct-main facts are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS legacy_v1_untrusted_final_repairs_no_update
      BEFORE UPDATE ON legacy_v1_untrusted_final_repairs BEGIN
        SELECT RAISE(ABORT, 'legacy v1 untrusted final repairs are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS legacy_v1_untrusted_final_repairs_no_delete
      BEFORE DELETE ON legacy_v1_untrusted_final_repairs BEGIN
        SELECT RAISE(ABORT, 'legacy v1 untrusted final repairs are immutable');
      END;
    CREATE TRIGGER IF NOT EXISTS downstream_activations_no_update
      BEFORE UPDATE ON downstream_activations BEGIN
        SELECT RAISE(ABORT, 'downstream activations are append-only');
      END;
    CREATE TRIGGER IF NOT EXISTS downstream_activations_no_delete
      BEFORE DELETE ON downstream_activations BEGIN
        SELECT RAISE(ABORT, 'downstream activations are append-only');
      END;
  `);

  // Fresh stores already advertise the current version above; older stores
  // reach this point only after each lease-fenced migration transaction.
  database.exec(SCOPED_RUN_SCHEMA_SQL);
  database.exec(SCOPED_EXECUTION_SCHEMA_SQL);
  database.exec(SCOPED_INTEGRATION_SCHEMA_SQL);
  database.exec(SCOPED_GROUP_FINAL_SCHEMA_SQL);
  database.exec(SCOPED_OPERATION_SCHEMA_SQL);
  database.exec(SCOPED_LEADER_TURN_SCHEMA_SQL);
  database.exec(SCOPED_FINAL_INTEGRATION_SCHEMA_SQL);
  database.exec(SCOPED_AGENT_REPORT_SCHEMA_SQL);
  database.exec(SCOPED_AGENT_TASK_COMPLETION_SCHEMA_SQL);
  database.exec(SCOPED_AGENT_TURN_SCHEMA_SQL);
  database.exec(SCOPED_PATH_SCHEMA_SQL);
  database.exec(SCOPED_USAGE_SCHEMA_SQL);
  database.exec(WORKFLOW_ADJUSTMENT_INDEX_SQL);
  database.exec(WORKFLOW_ADJUSTMENT_PAGE_INDEX_SQL);
  database.exec(WORKFLOW_NATIVE_HARNESS_INDEX_SQL);

  database.exec(PROJECT_STATE_INDEX_SQL);
  database.exec(PROJECT_STATE_DOCUMENT_SQL);
  database.exec(STANDALONE_DELIVERY_PULL_SQL);
  database.exec(PROJECT_EVENT_TYPE_INDEX_SQL);

  const row = database.prepare(
    "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
  ).get() as { schema_version: number } | undefined;
  if (row?.schema_version !== COLLABORATION_STATE_SCHEMA_VERSION) {
    throw new CollaborationStateError(
      "UNSAFE_CONFIGURATION",
      `Unsupported collaboration state schema ${String(row?.schema_version)}`
    );
  }
}
