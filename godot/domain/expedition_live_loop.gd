class_name ExpeditionLiveLoop
extends RefCounted

const STEP_IDS := ["ENTRY", "HAZARD", "ENCOUNTER", "RECOVERY"]

static func build_damage_plan(evaluation: Dictionary, starting_durability: int) -> Dictionary:
    if not evaluation.get("ok", false):
        return {"ok": false, "error": "INVALID_EVALUATION"}
    if String(evaluation.get("status", "")) == "BLOCKED":
        return {"ok": false, "error": "ACCESS_BLOCKED"}
    var failure_stage := String(evaluation.get("failure_stage", ""))
    if not ["", "entry", "mobility", "encounter"].has(failure_stage):
        return {"ok": false, "error": "INVALID_FAILURE_STAGE"}
    var components := [
        int(evaluation.get("resist_damage", 0)),
        int(evaluation.get("mobility_damage", 0)),
        int(evaluation.get("encounter_damage", 0)),
        0,
    ]
    var reachable := [
        true,
        failure_stage != "entry",
        failure_stage != "entry" and failure_stage != "mobility",
        failure_stage.is_empty(),
    ]
    var prefixes := [0]
    for damage in components:
        prefixes.append(int(prefixes[-1]) + int(damage))
    var steps: Array = []
    for i in range(STEP_IDS.size()):
        var destroys := (i == 0 and failure_stage == "entry") or (i == 1 and failure_stage == "mobility") or (i == 2 and failure_stage == "encounter")
        steps.append({
            "step_id": STEP_IDS[i],
            "reachable": bool(reachable[i]),
            "step_damage": int(components[i]),
            "prefix_before": int(prefixes[i]),
            "prefix_after": int(prefixes[i + 1]),
            "durability_before": maxi(0, starting_durability - int(prefixes[i])),
            "durability_after": maxi(0, starting_durability - int(prefixes[i + 1])),
            "destroys": destroys,
        })
    return {
        "ok": true,
        "starting_durability": starting_durability,
        "components": components,
        "prefixes": prefixes,
        "failure_stage": failure_stage,
        "total_damage": int(evaluation.get("total_damage", 0)),
        "status": String(evaluation.get("status", "")),
        "steps": steps,
    }

static func project_step(plan: Dictionary, step_index: int) -> Dictionary:
    if not plan.get("ok", false):
        return {"ok": false, "error": "INVALID_PLAN"}
    var steps: Array = plan.get("steps", [])
    if step_index < 0 or step_index >= steps.size():
        return {"ok": false, "error": "STEP_INDEX_INVALID"}
    var step: Dictionary = steps[step_index]
    if not bool(step.get("reachable", false)):
        return {"ok": false, "error": "STEP_UNREACHABLE", "step_id": String(step.get("step_id", ""))}
    var output := step.duplicate(true)
    output["ok"] = true
    output["step_index"] = step_index
    output["terminal_status"] = "DESTROYED" if bool(step["destroys"]) else ("RETURNED" if String(step["step_id"]) == "RECOVERY" else "DECISION")
    return output

static func apply_continue(state: Dictionary, command: Dictionary, projection: Dictionary) -> Dictionary:
    var next := state.duplicate(true)
    var runtime: Dictionary = next.get("runtime", {})
    var command_id := String(command.get("command_id", ""))
    var recorded: Dictionary = runtime.get("command_results", {})
    if not command_id.is_empty() and recorded.has(command_id):
        return {"ok": true, "duplicate": true, "state": next, "result": recorded[command_id].duplicate(true)}
    if command_id.is_empty():
        return {"ok": false, "error": "COMMAND_ID_REQUIRED", "state": next}
    if String(runtime.get("phase", "")) != "DECISION":
        return {"ok": false, "error": "PHASE_INVALID", "state": next}
    if String(command.get("expedition_id", "")) != String(runtime.get("expedition_id", "")):
        return {"ok": false, "error": "EXPEDITION_ID_MISMATCH", "state": next}
    if String(command.get("decision_id", "")) != String(runtime.get("decision_id", "")):
        return {"ok": false, "error": "DECISION_ID_MISMATCH", "state": next}
    if not projection.get("ok", false) or int(projection.get("step_index", -1)) != int(runtime.get("next_step_index", -1)):
        return {"ok": false, "error": "STEP_PROJECTION_INVALID", "state": next}

    var unit: Dictionary = next.get("unit", {})
    if String(unit.get("id", "")) != String(runtime.get("unit_id", "")):
        return {"ok": false, "error": "UNIT_LOCK_MISMATCH", "state": next}
    var checkpoint := next.duplicate(true)
    runtime["phase"] = "IN_PROGRESS"
    runtime["pending_command"] = command.duplicate(true)
    runtime["pre_command_checkpoint"] = checkpoint

    var cargo_delta: Array = projection.get("cargo_delta", []).duplicate(true)
    var pending_cargo: Array = runtime.get("pending_cargo", []).duplicate(true)
    pending_cargo.append_array(cargo_delta)
    runtime["pending_cargo"] = pending_cargo
    var durability_after := int(projection.get("durability_after", unit.get("durability", 0)))
    unit["durability"] = durability_after
    runtime["durability"] = durability_after

    var step_result := projection.duplicate(true)
    step_result["command_id"] = command_id
    step_result["expedition_id"] = String(runtime["expedition_id"])
    step_result["decision_id"] = String(runtime["decision_id"])
    var step_results: Array = runtime.get("step_results", []).duplicate(true)
    step_results.append(step_result)
    runtime["step_results"] = step_results
    var events: Array = next.get("events", []).duplicate(true)
    events.append({"type": "continue_selected", "command_id": command_id, "expedition_id": runtime["expedition_id"], "decision_id": runtime["decision_id"]})
    events.append({"type": "step_resolved", "command_id": command_id, "expedition_id": runtime["expedition_id"], "step_id": projection["step_id"]})
    next["events"] = events

    var terminal := String(projection.get("terminal_status", "DECISION"))
    if terminal == "DESTROYED":
        runtime["pending_cargo"] = []
        runtime["phase"] = "DESTROYED"
    elif terminal == "RETURNED":
        runtime["phase"] = "RETURNED"
    else:
        runtime["phase"] = "DECISION"
        runtime["next_step_index"] = int(runtime["next_step_index"]) + 1
        runtime["decision_id"] = String(command.get("next_decision_id", ""))
        if String(runtime["decision_id"]).is_empty():
            return {"ok": false, "error": "NEXT_DECISION_ID_REQUIRED", "state": state.duplicate(true)}

    runtime.erase("pending_command")
    runtime.erase("pre_command_checkpoint")
    var result := {"phase": runtime["phase"], "step_result": step_result.duplicate(true)}
    recorded[command_id] = result.duplicate(true)
    runtime["command_results"] = recorded
    next["runtime"] = runtime
    next["unit"] = unit
    return {"ok": true, "duplicate": false, "state": next, "result": result}
