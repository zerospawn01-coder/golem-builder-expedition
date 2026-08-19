extends Node

signal state_changed
signal notice(message: String)

const Catalog = preload("res://domain/game_catalog.gd")
const Fabrication = preload("res://domain/fabrication.gd")
const BlueprintLibrary = preload("res://domain/blueprint_library.gd")

const SAVE_PATH := "user://golem_builder_expedition_godot_v2.json"
const MAX_GOLEMS := 3
const ACTIONS_PER_DAY := 3

var day := 1
var actions_left := ACTIONS_PER_DAY
var inventory: Dictionary = {}
var discovered_traits: Array = []
var golems: Array = []
var active_golem_id := ""
var blueprint_library: Dictionary = {}
var blueprint_telemetry: Array = []
var unit_blueprint_sources: Dictionary = {}
var active_save_opportunity: Dictionary = {}

func _ready() -> void:
    if not _load_state():
        reset_state(false)

func _now_msec() -> int:
    return int(Time.get_unix_time_from_system() * 1000.0)

func _new_id(prefix: String) -> String:
    return "%s-%d-%d" % [prefix, _now_msec(), Time.get_ticks_usec()]

func _starter_golem() -> Dictionary:
    return Catalog.make_golem("stone", "wind", "defense", "golem_starter", _now_msec(), true)

func reset_state(save_after := true) -> void:
    day = 1
    actions_left = ACTIONS_PER_DAY
    inventory = Catalog.DEFAULT_INVENTORY.duplicate(true)
    discovered_traits = []
    golems = [_starter_golem()]
    active_golem_id = "golem_starter"
    blueprint_library = BlueprintLibrary.empty_state()
    blueprint_telemetry = []
    unit_blueprint_sources = {}
    active_save_opportunity = {}
    if save_after:
        _save_state()
    state_changed.emit()

func _save_state() -> void:
    var payload := {
        "version": 2,
        "day": day,
        "actions_left": actions_left,
        "inventory": inventory,
        "discovered_traits": discovered_traits,
        "golems": golems,
        "active_golem_id": active_golem_id,
        "blueprint_library": blueprint_library,
        "blueprint_telemetry": blueprint_telemetry,
        "unit_blueprint_sources": unit_blueprint_sources,
    }
    var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    if file == null:
        notice.emit("SAVE FAILED")
        return
    file.store_string(JSON.stringify(payload))

func _load_state() -> bool:
    if not FileAccess.file_exists(SAVE_PATH):
        return false
    var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
    if file == null:
        return false
    var parsed = JSON.parse_string(file.get_as_text())
    if typeof(parsed) != TYPE_DICTIONARY:
        return false
    var payload: Dictionary = parsed
    if int(payload.get("version", -1)) != 2:
        return false
    if typeof(payload.get("inventory", null)) != TYPE_DICTIONARY or typeof(payload.get("golems", null)) != TYPE_ARRAY:
        return false
    var blueprint_result := BlueprintLibrary.deserialize_library(JSON.stringify(payload.get("blueprint_library", BlueprintLibrary.empty_state())))
    if not blueprint_result.get("ok", false):
        return false
    day = max(1, int(payload.get("day", 1)))
    actions_left = clamp(int(payload.get("actions_left", ACTIONS_PER_DAY)), 0, ACTIONS_PER_DAY)
    inventory = payload["inventory"].duplicate(true)
    discovered_traits = payload.get("discovered_traits", []).duplicate(true)
    golems = payload["golems"].duplicate(true)
    active_golem_id = String(payload.get("active_golem_id", golems[0].get("id", "") if not golems.is_empty() else ""))
    blueprint_library = blueprint_result["state"]
    blueprint_telemetry = payload.get("blueprint_telemetry", []).duplicate(true)
    unit_blueprint_sources = payload.get("unit_blueprint_sources", {}).duplicate(true)
    active_save_opportunity = {}
    return not golems.is_empty()

func _commit_change() -> void:
    _save_state()
    state_changed.emit()

func get_golem(golem_id: String) -> Dictionary:
    for item in golems:
        if String(item.get("id", "")) == golem_id:
            return item
    return {}

func get_active_golem() -> Dictionary:
    var found := get_golem(active_golem_id)
    return found if not found.is_empty() else (golems[0] if not golems.is_empty() else {})

func register_traits(traits: Array) -> void:
    for trait in traits:
        if not discovered_traits.has(trait):
            discovered_traits.append(trait)

func record_design_opportunity(parts: Dictionary) -> Dictionary:
    if not BlueprintLibrary.is_legal_design(parts):
        return {"ok": false, "error": "INVALID_PART_REFS"}
    var signature := "%s|%s|%s" % [parts["frame_id"], parts["reactor_id"], parts["control_sigil_id"]]
    if String(active_save_opportunity.get("signature", "")) == signature:
        return {"ok": true, "opportunity_id": active_save_opportunity["opportunity_id"], "already_saved": bool(active_save_opportunity.get("saved", false))}
    var opportunity_id := _new_id("save-opportunity")
    var appended := BlueprintLibrary.append_event(blueprint_telemetry, {"type": "blueprint_save_opportunity", "opportunity_id": opportunity_id})
    if not appended.get("ok", false):
        return appended
    blueprint_telemetry = appended["events"]
    active_save_opportunity = {"signature": signature, "opportunity_id": opportunity_id, "saved": false}
    _save_state()
    return {"ok": true, "opportunity_id": opportunity_id, "already_saved": false}

func save_blueprint(parts: Dictionary, purpose_tags: Array, loaded_blueprint_id := "") -> Dictionary:
    var opportunity := record_design_opportunity(parts)
    if not opportunity.get("ok", false):
        return opportunity
    var blueprint_id := loaded_blueprint_id if not loaded_blueprint_id.is_empty() else _new_id("blueprint")
    var existing_refs: Array = []
    if not loaded_blueprint_id.is_empty():
        for item in blueprint_library.get("blueprints", []):
            if String(item.get("blueprint_id", "")) == loaded_blueprint_id:
                existing_refs = item.get("expedition_record_refs", []).duplicate(true)
                break
    var blueprint := {"blueprint_id": blueprint_id, "part_ids": parts.duplicate(true), "purpose_tag_ids": purpose_tags.duplicate(true), "expedition_record_refs": existing_refs}
    var saved := BlueprintLibrary.save_blueprint(blueprint_library, blueprint, "UPDATE" if not loaded_blueprint_id.is_empty() else "CREATE")
    if not saved.get("ok", false):
        return saved
    var next_events := blueprint_telemetry.duplicate(true)
    var appended := BlueprintLibrary.append_event(next_events, {"type": "blueprint_saved", "blueprint_id": blueprint_id, "opportunity_id": opportunity["opportunity_id"]})
    if not appended.get("ok", false):
        return appended
    next_events = appended["events"]
    if not loaded_blueprint_id.is_empty():
        appended = BlueprintLibrary.append_event(next_events, {"type": "blueprint_resaved", "blueprint_id": blueprint_id})
        if not appended.get("ok", false):
            return appended
        next_events = appended["events"]
    blueprint_library = saved["state"]
    blueprint_telemetry = next_events
    active_save_opportunity["saved"] = true
    _commit_change()
    return {"ok": true, "blueprint_id": blueprint_id}

func load_blueprint(blueprint_id: String) -> Dictionary:
    var resolved := BlueprintLibrary.resolve_blueprint(blueprint_library, blueprint_id)
    if not resolved.get("ok", false):
        return resolved
    var opportunity_id := _new_id("load-opportunity")
    var next_events := blueprint_telemetry.duplicate(true)
    var appended := BlueprintLibrary.append_event(next_events, {"type": "blueprint_load_opportunity", "opportunity_id": opportunity_id})
    if not appended.get("ok", false):
        return appended
    next_events = appended["events"]
    appended = BlueprintLibrary.append_event(next_events, {"type": "blueprint_loaded", "blueprint_id": blueprint_id, "opportunity_id": opportunity_id})
    if not appended.get("ok", false):
        return appended
    next_events = appended["events"]
    appended = BlueprintLibrary.append_event(next_events, {"type": "blueprint_applied", "blueprint_id": blueprint_id, "opportunity_index": BlueprintLibrary.count_eligible_redeploy_opportunities(next_events)})
    if not appended.get("ok", false):
        return appended
    blueprint_telemetry = appended["events"]
    _save_state()
    return resolved

func mark_blueprint_modified(blueprint_id: String) -> void:
    var appended := BlueprintLibrary.append_event(blueprint_telemetry, {"type": "blueprint_modified", "blueprint_id": blueprint_id})
    if appended.get("ok", false):
        blueprint_telemetry = appended["events"]
        _save_state()

func fabricate(parts: Dictionary, source := "MANUAL_NEW", blueprint_id := "") -> Dictionary:
    var state := {"inventory": inventory, "actions_left": actions_left, "units": golems, "max_units": MAX_GOLEMS}
    var result := Fabrication.fabricate(state, {"body": parts["frame_id"], "core": parts["reactor_id"], "rune": parts["control_sigil_id"]}, _now_msec())
    if not result.get("ok", false):
        return result
    var next: Dictionary = result["state"]
    inventory = next["inventory"]
    actions_left = int(next["actions_left"])
    golems = next["units"]
    var golem: Dictionary = result["golem"]
    register_traits(golem.get("traits", []))
    active_golem_id = String(golem["id"])
    unit_blueprint_sources[active_golem_id] = {"source": source, "blueprint_id": blueprint_id}
    _commit_change()
    return result

func set_active_golem(golem_id: String) -> Dictionary:
    if get_golem(golem_id).is_empty():
        return {"ok": false, "error": "GOLEM_NOT_FOUND"}
    active_golem_id = golem_id
    _commit_change()
    return {"ok": true}

func repair_golem(golem_id: String) -> Dictionary:
    var target := get_golem(golem_id)
    if target.is_empty():
        return {"ok": false, "error": "GOLEM_NOT_FOUND"}
    if actions_left <= 0:
        return {"ok": false, "error": "NO_ACTION"}
    var body_id := String(target["body"])
    if int(inventory["body"].get(body_id, 0)) <= 0:
        return {"ok": false, "error": "MISSING_FRAME"}
    actions_left -= 1
    inventory["body"][body_id] = int(inventory["body"][body_id]) - 1
    for i in range(golems.size()):
        if String(golems[i].get("id", "")) == golem_id:
            golems[i]["durability"] = min(100, int(golems[i].get("durability", 0)) + 25)
            break
    _commit_change()
    return {"ok": true}

func disassemble_golem(golem_id: String) -> Dictionary:
    var target := get_golem(golem_id)
    if target.is_empty():
        return {"ok": false, "error": "GOLEM_NOT_FOUND"}
    if bool(target.get("is_starter", false)) or golem_id == "golem_starter":
        return {"ok": false, "error": "STARTER_LOCKED"}
    var body_id := String(target["body"])
    var core_id := String(target["core"])
    inventory["body"][body_id] = int(inventory["body"].get(body_id, 0)) + 1
    inventory["core"][core_id] = int(inventory["core"].get(core_id, 0)) + 1
    var remaining: Array = []
    for item in golems:
        if String(item.get("id", "")) != golem_id:
            remaining.append(item)
    golems = remaining
    unit_blueprint_sources.erase(golem_id)
    if active_golem_id == golem_id:
        active_golem_id = String(golems[0].get("id", "")) if not golems.is_empty() else ""
    _commit_change()
    return {"ok": true}

func advance_day() -> Dictionary:
    if actions_left > 0:
        return {"ok": false, "error": "ACTIONS_REMAIN"}
    day += 1
    actions_left = ACTIONS_PER_DAY
    _commit_change()
    return {"ok": true}

func start_expedition(golem_id: String, region_id: String, seed := -1) -> Dictionary:
    var golem := get_golem(golem_id)
    if golem.is_empty():
        return {"ok": false, "error": "GOLEM_NOT_FOUND"}
    if actions_left <= 0:
        return {"ok": false, "error": "NO_ACTION"}
    var prediction := Catalog.predict_expedition(region_id, golem)
    if prediction.get("status", "") == "BLOCKED":
        return {"ok": false, "error": "ACCESS_BLOCKED"}
    var opportunity_id := _new_id("redeploy-opportunity")
    var blueprint_available := blueprint_library.get("blueprints", []).size() > 0
    var next_events := blueprint_telemetry.duplicate(true)
    var appended := BlueprintLibrary.append_event(next_events, {"type": "redeploy_decision", "opportunity_id": opportunity_id, "blueprint_available": blueprint_available})
    if not appended.get("ok", false):
        return appended
    next_events = appended["events"]
    var attribution: Dictionary = unit_blueprint_sources.get(golem_id, {"source": "MANUAL_NEW", "blueprint_id": ""})
    appended = BlueprintLibrary.append_event(next_events, {"type": "expedition_started", "opportunity_id": opportunity_id, "source": String(attribution.get("source", "MANUAL_NEW")), "blueprint_id": String(attribution.get("blueprint_id", ""))})
    if not appended.get("ok", false):
        return appended
    next_events = appended["events"]
    var rng := RandomNumberGenerator.new()
    if int(seed) >= 0:
        rng.seed = int(seed)
    else:
        rng.randomize()
    var report := Catalog.run_expedition_simulation(region_id, golem, rng)
    if not report.get("ok", false):
        return report
    actions_left -= 1
    blueprint_telemetry = next_events
    for i in range(golems.size()):
        if String(golems[i].get("id", "")) == golem_id:
            golems[i]["durability"] = max(0, int(golems[i].get("durability", 100)) - int(report["total_damage"]))
            golems[i]["expeditions_count"] = int(golems[i].get("expeditions_count", 0)) + 1
            break
    _commit_change()
    return {"ok": true, "report": report, "cargo_capacity": int(golem["stats"]["work"]) * 2}

func add_loot(loots: Array) -> void:
    for loot in loots:
        var category := String(loot.get("category", ""))
        var item_id := String(loot.get("id", ""))
        var count := int(loot.get("count", 0))
        if inventory.has(category) and inventory[category].has(item_id):
            inventory[category][item_id] = int(inventory[category][item_id]) + count
    _commit_change()
