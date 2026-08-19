class_name GolemBlueprintLibrary
extends RefCounted

const Catalog = preload("res://domain/game_catalog.gd")
const STORAGE_VERSION := 1
const PURPOSE_TAG_OPTIONS = ["GENERAL", "MINING", "SCOUT", "RUINS", "HIGH_CARGO", "LOW_DAMAGE"]
const OPPORTUNITY_TYPES = ["blueprint_save_opportunity", "blueprint_load_opportunity", "redeploy_decision"]

static func empty_state() -> Dictionary:
    return {"version": STORAGE_VERSION, "blueprints": []}

static func is_legal_design(parts: Dictionary) -> bool:
    return Catalog.BODIES.has(String(parts.get("frame_id", ""))) and Catalog.CORES.has(String(parts.get("reactor_id", ""))) and Catalog.RUNES.has(String(parts.get("control_sigil_id", "")))

static func clone_blueprint(blueprint: Dictionary) -> Dictionary:
    return blueprint.duplicate(true)

static func save_blueprint(state: Dictionary, blueprint: Dictionary, mode: String) -> Dictionary:
    if not is_legal_design(blueprint.get("part_ids", {})):
        return {"ok": false, "error": "REFERENCE_UNAVAILABLE", "state": state}
    var blueprints: Array = state.get("blueprints", []).duplicate(true)
    var index := -1
    for i in range(blueprints.size()):
        if String(blueprints[i].get("blueprint_id", "")) == String(blueprint.get("blueprint_id", "")):
            index = i
            break
    if mode == "CREATE" and index >= 0:
        return {"ok": false, "error": "DUPLICATE_BLUEPRINT_ID", "state": state}
    if mode == "UPDATE" and index < 0:
        return {"ok": false, "error": "BLUEPRINT_NOT_FOUND", "state": state}
    if mode == "UPDATE":
        blueprints[index] = clone_blueprint(blueprint)
    else:
        blueprints.append(clone_blueprint(blueprint))
    return {"ok": true, "state": {"version": STORAGE_VERSION, "blueprints": blueprints}}

static func resolve_blueprint(state: Dictionary, blueprint_id: String) -> Dictionary:
    for item in state.get("blueprints", []):
        var blueprint: Dictionary = item
        if String(blueprint.get("blueprint_id", "")) != blueprint_id:
            continue
        if not is_legal_design(blueprint.get("part_ids", {})):
            return {"ok": false, "error": "REFERENCE_UNAVAILABLE"}
        if not blueprint.get("expedition_record_refs", []).is_empty():
            return {"ok": false, "error": "REFERENCE_UNAVAILABLE"}
        return {"ok": true, "blueprint": clone_blueprint(blueprint), "design": blueprint["part_ids"].duplicate(true)}
    return {"ok": false, "error": "BLUEPRINT_NOT_FOUND"}

static func serialize_library(state: Dictionary) -> String:
    return JSON.stringify(state)

static func deserialize_library(raw: String) -> Dictionary:
    if raw.is_empty():
        return {"ok": true, "state": empty_state()}
    var parsed = JSON.parse_string(raw)
    if typeof(parsed) != TYPE_DICTIONARY:
        return {"ok": false, "error": "INVALID_BLUEPRINT_LIBRARY"}
    var root: Dictionary = parsed
    if int(root.get("version", -1)) != STORAGE_VERSION or typeof(root.get("blueprints", null)) != TYPE_ARRAY:
        return {"ok": false, "error": "INVALID_BLUEPRINT_LIBRARY"}
    var ids := {}
    var clean: Array = []
    for item in root["blueprints"]:
        if typeof(item) != TYPE_DICTIONARY:
            return {"ok": false, "error": "INVALID_BLUEPRINT"}
        var blueprint: Dictionary = item
        var allowed := ["blueprint_id", "part_ids", "purpose_tag_ids", "expedition_record_refs"]
        for key in blueprint.keys():
            if not allowed.has(String(key)):
                return {"ok": false, "error": "CANONICAL_STATE_DUPLICATION"}
        var blueprint_id := String(blueprint.get("blueprint_id", ""))
        if blueprint_id.is_empty() or ids.has(blueprint_id):
            return {"ok": false, "error": "DUPLICATE_BLUEPRINT_ID"}
        ids[blueprint_id] = true
        if typeof(blueprint.get("part_ids", null)) != TYPE_DICTIONARY or not is_legal_design(blueprint["part_ids"]):
            return {"ok": false, "error": "INVALID_PART_REFS"}
        if typeof(blueprint.get("purpose_tag_ids", null)) != TYPE_ARRAY or typeof(blueprint.get("expedition_record_refs", null)) != TYPE_ARRAY:
            return {"ok": false, "error": "INVALID_BLUEPRINT"}
        clean.append(clone_blueprint(blueprint))
    return {"ok": true, "state": {"version": STORAGE_VERSION, "blueprints": clean}}

static func _same_opportunity_definition(left: Dictionary, right: Dictionary) -> bool:
    if String(left.get("type", "")) != String(right.get("type", "")) or String(left.get("opportunity_id", "")) != String(right.get("opportunity_id", "")):
        return false
    if left["type"] == "redeploy_decision":
        return bool(left.get("blueprint_available", false)) == bool(right.get("blueprint_available", false))
    return true

static func append_event(events: Array, event: Dictionary) -> Dictionary:
    var next := events.duplicate(true)
    var event_type := String(event.get("type", ""))
    if OPPORTUNITY_TYPES.has(event_type):
        var opportunity_id := String(event.get("opportunity_id", ""))
        for candidate in next:
            if OPPORTUNITY_TYPES.has(String(candidate.get("type", ""))) and String(candidate.get("opportunity_id", "")) == opportunity_id:
                if _same_opportunity_definition(candidate, event):
                    return {"ok": true, "events": next}
                return {"ok": false, "error": "DUPLICATE_OPPORTUNITY_ID: %s" % opportunity_id, "events": events}
    next.append(event.duplicate(true))
    return {"ok": true, "events": next}

static func count_eligible_redeploy_opportunities(events: Array) -> int:
    var ids := {}
    for event in events:
        if String(event.get("type", "")) == "redeploy_decision" and bool(event.get("blueprint_available", false)):
            ids[String(event.get("opportunity_id", ""))] = true
    return ids.size()

static func calculate_metrics(events: Array) -> Dictionary:
    var opportunity_definitions := {}
    for event in events:
        var event_type := String(event.get("type", ""))
        if not OPPORTUNITY_TYPES.has(event_type):
            continue
        var opportunity_id := String(event.get("opportunity_id", ""))
        if opportunity_definitions.has(opportunity_id) and not _same_opportunity_definition(opportunity_definitions[opportunity_id], event):
            return {"ok": false, "error": "DUPLICATE_OPPORTUNITY_ID: %s" % opportunity_id}
        if not opportunity_definitions.has(opportunity_id):
            opportunity_definitions[opportunity_id] = event

    var save_opportunities := {}
    var saved_opportunities := {}
    var saved_opportunity_blueprint := {}
    var saved_blueprints := {}
    var reused_blueprints := {}
    var first_reuse: Array = []
    var eligible_redeploy := {}
    var final_redeploy_decision := {}
    var modified := 0
    var resaved := 0

    for event_index in range(events.size()):
        var event: Dictionary = events[event_index]
        var event_type := String(event.get("type", ""))
        if event_type == "blueprint_save_opportunity":
            save_opportunities[String(event["opportunity_id"])] = true
        elif event_type == "redeploy_decision":
            var redeploy_id := String(event["opportunity_id"])
            if bool(event.get("blueprint_available", false)) and not eligible_redeploy.has(redeploy_id):
                eligible_redeploy[redeploy_id] = event
        elif event_type == "blueprint_saved":
            var save_id := String(event["opportunity_id"])
            var blueprint_id := String(event["blueprint_id"])
            if not save_opportunities.has(save_id):
                return {"ok": false, "error": "UNKNOWN_SAVE_OPPORTUNITY: %s" % save_id}
            if saved_opportunity_blueprint.has(save_id) and String(saved_opportunity_blueprint[save_id]) != blueprint_id:
                return {"ok": false, "error": "CONFLICTING_SAVE_RESULT: %s" % save_id}
            saved_opportunity_blueprint[save_id] = blueprint_id
            saved_opportunities[save_id] = true
            if not saved_blueprints.has(blueprint_id):
                saved_blueprints[blueprint_id] = {"event_index": event_index, "eligible_redeploy_index": eligible_redeploy.size()}
        elif event_type == "blueprint_applied":
            var applied_id := String(event["blueprint_id"])
            if not saved_blueprints.has(applied_id) or reused_blueprints.has(applied_id):
                continue
            var saved_at: Dictionary = saved_blueprints[applied_id]
            if event_index <= int(saved_at["event_index"]):
                continue
            var opportunity_index := int(event.get("opportunity_index", -1))
            if opportunity_index != eligible_redeploy.size() or opportunity_index < int(saved_at["eligible_redeploy_index"]):
                return {"ok": false, "error": "INVALID_REUSE_OPPORTUNITY_INDEX: %s" % applied_id}
            reused_blueprints[applied_id] = true
            first_reuse.append(opportunity_index - int(saved_at["eligible_redeploy_index"]))
        elif event_type == "expedition_started":
            var expedition_id := String(event.get("opportunity_id", ""))
            if eligible_redeploy.has(expedition_id):
                final_redeploy_decision[expedition_id] = event
        elif event_type == "blueprint_modified":
            modified += 1
        elif event_type == "blueprint_resaved":
            resaved += 1

    var assisted_redeploy := 0
    for opportunity_id in final_redeploy_decision.keys():
        if eligible_redeploy.has(opportunity_id) and String(final_redeploy_decision[opportunity_id].get("source", "MANUAL_NEW")) != "MANUAL_NEW":
            assisted_redeploy += 1

    first_reuse.sort()
    var median = null
    if first_reuse.size() > 0:
        var mid := int(first_reuse.size() / 2)
        if first_reuse.size() % 2 == 0:
            median = (float(first_reuse[mid - 1]) + float(first_reuse[mid])) / 2.0
        else:
            median = float(first_reuse[mid])
    var metrics := {
        "save_rate": float(saved_opportunities.size()) / float(save_opportunities.size()) if save_opportunities.size() > 0 else null,
        "reuse_rate": float(reused_blueprints.size()) / float(saved_blueprints.size()) if saved_blueprints.size() > 0 else null,
        "median_time_to_first_reuse": median,
        "blueprint_redeploy_rate": float(assisted_redeploy) / float(eligible_redeploy.size()) if eligible_redeploy.size() > 0 else null,
        "modified_resave_rate": float(resaved) / float(modified) if modified > 0 else null,
        "eligible_save_opportunities": save_opportunities.size(),
        "eligible_redeploy_decisions": eligible_redeploy.size(),
    }
    for metric_name in ["save_rate", "reuse_rate", "blueprint_redeploy_rate", "modified_resave_rate"]:
        var value = metrics[metric_name]
        if value != null and (float(value) < 0.0 or float(value) > 1.0):
            return {"ok": false, "error": "INVALID_METRIC_RANGE: %s" % metric_name}
    if metrics["median_time_to_first_reuse"] != null and float(metrics["median_time_to_first_reuse"]) < 0.0:
        return {"ok": false, "error": "INVALID_METRIC_RANGE: median_time_to_first_reuse"}
    return {"ok": true, "metrics": metrics}

static func assess_behavioral_evidence(events: Array) -> Dictionary:
    var result := calculate_metrics(events)
    if not result.get("ok", false):
        return result
    var metrics: Dictionary = result["metrics"]
    var sample_sufficient := int(metrics["eligible_save_opportunities"]) >= 30 and int(metrics["eligible_redeploy_decisions"]) >= 30
    var behavioral_pass := sample_sufficient and metrics["reuse_rate"] != null and float(metrics["reuse_rate"]) >= 0.3 and metrics["blueprint_redeploy_rate"] != null and float(metrics["blueprint_redeploy_rate"]) >= 0.3 and metrics["median_time_to_first_reuse"] != null and float(metrics["median_time_to_first_reuse"]) <= 3.0
    var verdict := "INSUFFICIENT EVIDENCE" if not sample_sufficient else ("PASS — PREFERRED CANDIDATE / CANONICAL HOLD" if behavioral_pass else "FAIL — REJECT")
    return {"ok": true, "metrics": metrics, "sample_sufficient": sample_sufficient, "behavioral_pass": behavioral_pass, "verdict": verdict}
