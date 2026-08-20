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
        var parsed: Variant = JSON.parse_string(file.get_as_text())
        if typeof(parsed) != TYPE_DICTIONARY or String(parsed.get("schema", "")) != SCHEMA or typeof(parsed.get("state", null)) != TYPE_DICTIONARY:
            continue
        return {"ok": true, "state": parsed["state"].duplicate(true), "source": candidate}
    return {"ok": false, "error": "NO_VALID_RUNTIME"}

static func _write_atomic(path: String, payload: Dictionary) -> Dictionary:
    var absolute := ProjectSettings.globalize_path(path)
    var temporary := "%s.tmp" % absolute
    var backup := "%s.bak" % absolute
    var file := FileAccess.open(temporary, FileAccess.WRITE)
    if file == null:
        return {"ok": false, "error": "WRITE_OPEN_FAILED"}
    file.store_string(JSON.stringify(payload))
    file.flush()
    file = null
    if FileAccess.file_exists(backup):
        DirAccess.remove_absolute(backup)
    if FileAccess.file_exists(absolute):
        if DirAccess.rename_absolute(absolute, backup) != OK:
            return {"ok": false, "error": "BACKUP_RENAME_FAILED"}
    if DirAccess.rename_absolute(temporary, absolute) != OK:
        if FileAccess.file_exists(backup):
            DirAccess.rename_absolute(backup, absolute)
        return {"ok": false, "error": "COMMIT_RENAME_FAILED"}
    return {"ok": true}
