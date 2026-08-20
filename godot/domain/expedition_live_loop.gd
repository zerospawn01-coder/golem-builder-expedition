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
    events.append({"event_id": "%s:%s:continue_selected" % [runtime["expedition_id"], command_id], "type": "continue_selected", "command_id": command_id, "expedition_id": runtime["expedition_id"], "decision_id": runtime["decision_id"]})
    events.append({"event_id": "%s:%s:step_resolved" % [runtime["expedition_id"], command_id], "type": "step_resolved", "command_id": command_id, "expedition_id": runtime["expedition_id"], "step_id": projection["step_id"]})
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

static func apply_return(state: Dictionary, command: Dictionary) -> Dictionary:
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
    var unit: Dictionary = next.get("unit", {})
    if String(unit.get("id", "")) != String(runtime.get("unit_id", "")):
        return {"ok": false, "error": "UNIT_LOCK_MISMATCH", "state": next}

    var decision_id := String(runtime["decision_id"])
    var expedition_id := String(runtime["expedition_id"])
    runtime["phase"] = "RETURNED"
    runtime["return_reason"] = "PLAYER_RETURN"
    runtime["deepest_completed_step"] = int(runtime.get("next_step_index", 0)) - 1
    var events: Array = next.get("events", []).duplicate(true)
    events.append({"event_id": "%s:%s:return_selected" % [expedition_id, command_id], "type": "return_selected", "command_id": command_id, "expedition_id": expedition_id, "decision_id": decision_id})
    events.append({"event_id": "%s:%s:expedition_returned" % [expedition_id, command_id], "type": "expedition_returned", "command_id": command_id, "expedition_id": expedition_id, "decision_id": decision_id, "deepest_completed_step": runtime["deepest_completed_step"]})
    next["events"] = events
    var result := {"phase": "RETURNED", "return_reason": "PLAYER_RETURN", "deepest_completed_step": runtime["deepest_completed_step"], "command_id": command_id, "expedition_id": expedition_id, "decision_id": decision_id}
    recorded[command_id] = result.duplicate(true)
    runtime["command_results"] = recorded
    next["runtime"] = runtime
    return {"ok": true, "duplicate": false, "state": next, "result": result}

static func apply_claim(state: Dictionary, command: Dictionary, selection: Array, catalog: Dictionary, capacity: int) -> Dictionary:
    var next := state.duplicate(true)
    var runtime: Dictionary = next.get("runtime", {})
    var command_id := String(command.get("command_id", ""))
    var recorded: Dictionary = runtime.get("claim_results", {})
    if not command_id.is_empty() and recorded.has(command_id):
        return {"ok": true, "duplicate": true, "state": next, "result": recorded[command_id].duplicate(true)}
    if command_id.is_empty():
        return {"ok": false, "error": "COMMAND_ID_REQUIRED", "state": next}
    if String(runtime.get("phase", "")) != "RETURNED":
        return {"ok": false, "error": "PHASE_INVALID", "state": next}
    if String(command.get("expedition_id", "")) != String(runtime.get("expedition_id", "")):
        return {"ok": false, "error": "EXPEDITION_ID_MISMATCH", "state": next}
    if String(runtime.get("claim_state", "OPEN")) != "OPEN":
        return {"ok": false, "error": "CARGO_ALREADY_CLAIMED", "state": next}
    var requested := {}
    for entry in selection:
        if typeof(entry) != TYPE_DICTIONARY or String(entry.get("item_id", "")).is_empty() or typeof(entry.get("quantity", null)) != TYPE_INT or int(entry["quantity"]) <= 0:
            return {"ok": false, "error": "CLAIM_SELECTION_INVALID", "state": next}
        var item_id := String(entry["item_id"])
        requested[item_id] = int(requested.get(item_id, 0)) + int(entry["quantity"])
    var pending_by_id := {}
    for cargo in runtime.get("pending_cargo", []):
        var item_id := String(cargo.get("item_id", ""))
        if item_id.is_empty() or pending_by_id.has(item_id):
            return {"ok": false, "error": "PENDING_CARGO_INVALID", "state": next}
        pending_by_id[item_id] = cargo
    var claimed: Array = []
    var total_weight := 0
    for item_id in requested:
        if not pending_by_id.has(item_id):
            return {"ok": false, "error": "CLAIM_ITEM_NOT_PENDING", "state": next}
        var cargo: Dictionary = pending_by_id[item_id]
        var catalog_id := String(cargo.get("catalog_id", ""))
        if not catalog.has(catalog_id):
            return {"ok": false, "error": "CLAIM_ITEM_NOT_CATALOGED", "state": next}
        var quantity := int(requested[item_id])
        if quantity > int(cargo.get("quantity", 0)):
            return {"ok": false, "error": "CLAIM_QUANTITY_EXCEEDED", "state": next}
        var unit_weight := int(catalog[catalog_id].get("weight", -1))
        if unit_weight < 0:
            return {"ok": false, "error": "CLAIM_ITEM_NOT_CATALOGED", "state": next}
        total_weight += quantity * unit_weight
        claimed.append({"item_id": item_id, "catalog_id": catalog_id, "quantity": quantity})
    if total_weight > capacity:
        return {"ok": false, "error": "CLAIM_CAPACITY_EXCEEDED", "state": next}
    claimed.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return String(a["item_id"]) < String(b["item_id"]))
    var inventory: Dictionary = next.get("inventory", {}).duplicate(true)
    for cargo in claimed:
        var catalog_id := String(cargo["catalog_id"])
        inventory[catalog_id] = int(inventory.get(catalog_id, 0)) + int(cargo["quantity"])
    next["inventory"] = inventory
    var claimed_ids := {}
    for cargo in claimed:
        claimed_ids[String(cargo["item_id"])] = int(cargo["quantity"])
    var discarded: Array = []
    for cargo in runtime.get("pending_cargo", []):
        var remaining := int(cargo.get("quantity", 0)) - int(claimed_ids.get(String(cargo.get("item_id", "")), 0))
        if remaining > 0:
            var leftover: Dictionary = cargo.duplicate(true)
            leftover["quantity"] = remaining
            discarded.append(leftover)
    runtime["pending_cargo"] = []
    runtime["discarded_cargo"] = discarded
    runtime["claim_state"] = "CLAIMED"
    var expedition_id := String(runtime["expedition_id"])
    var result := {"phase": "RETURNED", "claim_state": "CLAIMED", "command_id": command_id, "expedition_id": expedition_id, "claimed": claimed, "total_weight": total_weight}
    recorded[command_id] = result.duplicate(true)
    runtime["claim_results"] = recorded
    next["runtime"] = runtime
    var events: Array = next.get("events", []).duplicate(true)
    events.append({"event_id": "%s:%s:cargo_claimed" % [expedition_id, command_id], "type": "cargo_claimed", "command_id": command_id, "expedition_id": expedition_id, "claimed": claimed.duplicate(true)})
    next["events"] = events
    next = commit_telemetry(next)
    return {"ok": true, "duplicate": false, "state": next, "result": result}

static func commit_telemetry(state: Dictionary) -> Dictionary:
    var next := state.duplicate(true)
    var durable: Array = next.get("durable_telemetry", []).duplicate(true)
    var committed_ids := {}
    for event in durable:
        committed_ids[String(event.get("event_id", ""))] = true
    for event in next.get("events", []):
        var event_id := String(event.get("event_id", ""))
        if not event_id.is_empty() and not committed_ids.has(event_id):
            durable.append(event.duplicate(true))
            committed_ids[event_id] = true
    next["durable_telemetry"] = durable
    return next

static func export_telemetry(state: Dictionary, sink: Callable) -> Dictionary:
    var snapshot := state.duplicate(true)
    var accepted := bool(sink.call(snapshot.get("durable_telemetry", []).duplicate(true)))
    return {"ok": accepted, "error": "TELEMETRY_SINK_FAILED" if not accepted else "", "state": snapshot}
