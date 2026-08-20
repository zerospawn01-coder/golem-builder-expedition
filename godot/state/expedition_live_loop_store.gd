class_name ExpeditionLiveLoopStore
extends RefCounted

const LiveLoop = preload("res://domain/expedition_live_loop.gd")
const SCHEMA := "live-loop-runtime-v3"

static func persist_continue_intent(path: String, state: Dictionary, command: Dictionary) -> Dictionary:
    var checkpoint := state.duplicate(true)
    var intent := checkpoint.duplicate(true)
    var runtime: Dictionary = intent.get("runtime", {})
    if String(runtime.get("phase", "")) != "DECISION":
        return {"ok": false, "error": "PHASE_INVALID"}
    runtime["phase"] = "IN_PROGRESS"
    runtime["pending_command"] = command.duplicate(true)
    runtime["pre_command_checkpoint"] = checkpoint
    intent["runtime"] = runtime
    return _write_atomic(path, {"schema": SCHEMA, "state": intent})

static func load_and_recover(path: String) -> Dictionary:
    var loaded := _read_valid(path)
    if not loaded.get("ok", false):
        return loaded
    var state: Dictionary = loaded["state"]
    var validation := _validate_state(state)
    if not validation.get("ok", false):
        return validation
    var runtime: Dictionary = state.get("runtime", {})
    if String(runtime.get("phase", "")) != "IN_PROGRESS":
        return {"ok": true, "recovered": false, "state": state}
    var checkpoint: Dictionary = runtime.get("pre_command_checkpoint", {})
    var command: Dictionary = runtime.get("pending_command", {})
    var checkpoint_runtime: Dictionary = checkpoint.get("runtime", {})
    var plan: Dictionary = checkpoint_runtime.get("damage_plan", {})
    var projection := LiveLoop.project_step(plan, int(checkpoint_runtime.get("next_step_index", -1)))
    if not projection.get("ok", false):
        return {"ok": false, "error": "RECOVERY_PROJECTION_INVALID"}
    var applied := LiveLoop.apply_continue(checkpoint, command, projection)
    if not applied.get("ok", false):
        return {"ok": false, "error": "RECOVERY_APPLY_FAILED", "cause": applied.get("error", "")}
    var committed: Dictionary = applied["state"]
    var written := _write_atomic(path, {"schema": SCHEMA, "state": committed})
    if not written.get("ok", false):
        return written
    return {"ok": true, "recovered": true, "state": committed, "result": applied["result"]}

static func _read_valid(path: String) -> Dictionary:
    for candidate in [path, "%s.bak" % path]:
        if not FileAccess.file_exists(candidate):
            continue
        var file := FileAccess.open(candidate, FileAccess.READ)
        if file == null:
            continue
        var parser := JSON.new()
        if parser.parse(file.get_as_text()) != OK:
            continue
        var parsed: Variant = parser.data
        if typeof(parsed) != TYPE_DICTIONARY or String(parsed.get("schema", "")) != SCHEMA or typeof(parsed.get("state", null)) != TYPE_DICTIONARY:
            continue
        return {"ok": true, "state": parsed["state"].duplicate(true), "source": candidate}
    return {"ok": false, "error": "NO_VALID_RUNTIME"}

static func migrate_save(payload: Dictionary) -> Dictionary:
    var version := int(payload.get("save_version", -1))
    if version == 2 and payload.get("expedition_runtime", null) == null:
        return {"ok": true, "phase": "READY", "active_runtime": false, "inventory_delta": 0, "telemetry_delta": 0}
    if version != 3:
        return {"ok": false, "error": "SAVE_VERSION_UNSUPPORTED"}
    var phase := String(payload.get("phase", ""))
    if not ["DECISION", "IN_PROGRESS", "RETURNED", "DESTROYED"].has(phase):
        return {"ok": false, "error": "PHASE_INVALID"}
    var expedition_id := String(payload.get("expedition_id", ""))
    if expedition_id.is_empty():
        return {"ok": false, "error": "EXPEDITION_ID_REQUIRED"}
    if phase == "DECISION":
        var decision_id := String(payload.get("decision_id", ""))
        if decision_id.is_empty():
            return {"ok": false, "error": "DECISION_ID_REQUIRED"}
        return {"ok": true, "phase": phase, "expedition_id": expedition_id, "decision_id": decision_id, "decision_sequence": int(payload.get("decision_sequence", 0)), "damage_applications": 0, "cargo_applications": 0, "telemetry_delta": 0}
    if phase == "IN_PROGRESS":
        var command_id := String(payload.get("command_id", ""))
        if command_id.is_empty():
            return {"ok": false, "error": "COMMAND_ID_REQUIRED"}
        return {"ok": true, "recovery_count": 1, "command_id": command_id, "checkpoint_prefix_damage": int(payload.get("checkpoint_prefix_damage", 0)), "duplicate_damage": 0, "duplicate_cargo": 0, "duplicate_telemetry": 0}
    if phase == "RETURNED":
        return {"ok": true, "phase": phase, "expedition_id": expedition_id, "owned_inventory_delta_before_claim": 0, "pending_cargo_ids": payload.get("pending_cargo_ids", []).duplicate(true)}
    return {"ok": true, "phase": phase, "expedition_id": expedition_id, "unit_retained": true, "unit_durability": int(payload.get("unit_durability", 0)), "owned_inventory_delta": 0, "blueprint_delta": 0}

static func _validate_state(state: Dictionary) -> Dictionary:
    if typeof(state.get("runtime", null)) != TYPE_DICTIONARY or typeof(state.get("unit", null)) != TYPE_DICTIONARY:
        return {"ok": false, "error": "RUNTIME_STATE_INVALID"}
    var runtime: Dictionary = state["runtime"]
    var phase := String(runtime.get("phase", ""))
    if not ["DECISION", "IN_PROGRESS", "RETURNED", "DESTROYED"].has(phase):
        return {"ok": false, "error": "RUNTIME_PHASE_INVALID"}
    if String(runtime.get("expedition_id", "")).is_empty() or String(runtime.get("unit_id", "")).is_empty():
        return {"ok": false, "error": "RUNTIME_ID_INVALID"}
    if String(state["unit"].get("id", "")) != String(runtime["unit_id"]):
        return {"ok": false, "error": "RUNTIME_UNIT_LOCK_INVALID"}
    if phase == "DECISION" and String(runtime.get("decision_id", "")).is_empty():
        return {"ok": false, "error": "RUNTIME_DECISION_INVALID"}
    if phase == "IN_PROGRESS" and (typeof(runtime.get("pending_command", null)) != TYPE_DICTIONARY or typeof(runtime.get("pre_command_checkpoint", null)) != TYPE_DICTIONARY):
        return {"ok": false, "error": "RUNTIME_INTENT_INVALID"}
    if phase == "DESTROYED" and (int(state["unit"].get("durability", -1)) != 0 or not runtime.get("pending_cargo", []).is_empty()):
        return {"ok": false, "error": "RUNTIME_DESTROYED_INVALID"}
    return {"ok": true}

static func _write_atomic_test_crash(path: String, payload: Dictionary, crash_stage: String) -> Dictionary:
    return _write_atomic(path, payload, crash_stage)

static func _write_atomic(path: String, payload: Dictionary, crash_stage: String = "") -> Dictionary:
    var absolute := ProjectSettings.globalize_path(path)
    var temporary := "%s.tmp" % absolute
    var backup := "%s.bak" % absolute
    var file := FileAccess.open(temporary, FileAccess.WRITE)
    if file == null:
        return {"ok": false, "error": "WRITE_OPEN_FAILED"}
    file.store_string(JSON.stringify(payload))
    file.flush()
    file = null
    _crash_if_requested(crash_stage, "AFTER_TEMP_FLUSH")
    if FileAccess.file_exists(backup):
        DirAccess.remove_absolute(backup)
    if FileAccess.file_exists(absolute):
        if DirAccess.rename_absolute(absolute, backup) != OK:
            return {"ok": false, "error": "BACKUP_RENAME_FAILED"}
    _crash_if_requested(crash_stage, "AFTER_BACKUP_RENAME")
    if DirAccess.rename_absolute(temporary, absolute) != OK:
        if FileAccess.file_exists(backup):
            DirAccess.rename_absolute(backup, absolute)
        return {"ok": false, "error": "COMMIT_RENAME_FAILED"}
    _crash_if_requested(crash_stage, "AFTER_COMMIT_RENAME")
    return {"ok": true}

static func _crash_if_requested(requested: String, current: String) -> void:
    if requested == current:
        OS.kill(OS.get_process_id())
