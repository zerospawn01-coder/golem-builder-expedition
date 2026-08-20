class_name ExpeditionLiveLoopPresenter
extends RefCounted

static func build(snapshot: Dictionary) -> Dictionary:
    var runtime: Dictionary = snapshot.get("runtime", {}).duplicate(true)
    var phase := String(runtime.get("phase", "READY"))
    var pending: Array = runtime.get("pending_cargo", []).duplicate(true)
    return {
        "phase": phase,
        "expedition_id": String(runtime.get("expedition_id", "")),
        "decision_id": String(runtime.get("decision_id", "")),
        "next_step_id": _next_step_id(runtime),
        "durability": int(snapshot.get("unit", {}).get("durability", 0)),
        "pending_cargo": pending,
        "can_continue": phase == "DECISION",
        "can_return": phase == "DECISION",
        "can_claim": phase == "RETURNED" and String(runtime.get("claim_state", "OPEN")) == "OPEN" and not pending.is_empty(),
        "claim_state": String(runtime.get("claim_state", "OPEN")),
        "events": snapshot.get("events", []).duplicate(true),
    }

static func _next_step_id(runtime: Dictionary) -> String:
    var plan: Dictionary = runtime.get("damage_plan", {})
    var index := int(runtime.get("next_step_index", -1))
    var steps: Array = plan.get("steps", [])
    if index < 0 or index >= steps.size():
        return ""
    return String(steps[index].get("step_id", ""))
