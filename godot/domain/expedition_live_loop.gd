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
