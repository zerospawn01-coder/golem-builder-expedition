class_name ExpeditionPresenter
extends RefCounted

const Catalog = preload("res://domain/game_catalog.gd")

static func build(snapshot: Dictionary) -> Dictionary:
    var runtime: Dictionary = snapshot.get("expedition_runtime", {}).duplicate(true)
    var golem := _resolve_golem(snapshot, runtime)
    var report: Dictionary = runtime.get("report", {}).duplicate(true)
    var stats: Dictionary = golem.get("stats", {}).duplicate(true)
    var durability := clamp(int(golem.get("durability", 0)), 0, 100)
    var region_id := String(runtime.get("region_id", ""))
    var region: Dictionary = Catalog.REGIONS.get(region_id, {})
    var selected_indexes: Array = runtime.get("selected_loot_indexes", []).duplicate(true)
    var loots: Array = report.get("loots", []).duplicate(true)
    var selected_weight := _selected_weight(loots, selected_indexes)

    return {
        "day_action": {
            "day": max(1, int(snapshot.get("day", 1))),
            "actions_left": max(0, int(snapshot.get("actions_left", 0))),
        },
        "cargo": {
            "available": not report.is_empty(),
            "capacity": max(0, int(runtime.get("cargo_capacity", 0))),
            "candidate_count": loots.size(),
            "selected_count": selected_indexes.size(),
            "selected_weight": selected_weight,
            "claimed": bool(runtime.get("loot_claimed", true)),
        },
        "damage": {
            "hull_integrity": durability,
            "damage_percent": 100 - durability,
            "expedition_total_damage": int(report.get("total_damage", 0)) if not report.is_empty() else 0,
            "joint_load": null,
            "joint_load_status": "UNAVAILABLE",
        },
        "stability": {
            "index": durability,
            "basis": "DURABILITY_PROXY",
            "gameplay_effect": false,
        },
        "route": {
            "region_id": region_id,
            "region_name": String(region.get("name", "")),
            "depth": null,
            "depth_status": "UNAVAILABLE",
        },
        "golem_status": {
            "golem_id": String(golem.get("id", "")),
            "name": String(golem.get("name", "")),
            "core_id": String(golem.get("core", "")),
            "power_core_efficiency": null,
            "power_core_efficiency_status": "UNAVAILABLE",
            "rune_id": String(golem.get("rune", "")),
            "rune_efficiency": null,
            "rune_efficiency_status": "UNAVAILABLE",
            "stats": stats,
            "traits": golem.get("traits", []).duplicate(true),
        },
        "analyzer": _analyzer(stats),
        "area_map": _area_map(region_id),
        "navigation": {
            "current_region_id": region_id,
            "current_region_name": String(region.get("name", "")),
            "status": "RESOLVED" if not report.is_empty() else "IDLE",
        },
        "signal": {
            "strength": null,
            "mag_noise_percent": null,
            "status": "UNAVAILABLE",
        },
        "log": _format_events(report.get("events", [])),
    }

static func _resolve_golem(snapshot: Dictionary, runtime: Dictionary) -> Dictionary:
    var target_id := String(runtime.get("golem_id", snapshot.get("active_golem_id", "")))
    var golems: Array = snapshot.get("golems", [])
    for item in golems:
        var golem: Dictionary = item
        if String(golem.get("id", "")) == target_id:
            return golem.duplicate(true)
    if not golems.is_empty():
        var fallback: Dictionary = golems[0]
        return fallback.duplicate(true)
    return {}

static func _selected_weight(loots: Array, selected_indexes: Array) -> int:
    var total := 0
    for value in selected_indexes:
        var index := int(value)
        if index >= 0 and index < loots.size():
            var loot: Dictionary = loots[index]
            total += int(loot.get("weight", 0))
    return total

static func _analyzer(stats: Dictionary) -> Dictionary:
    return {
        "power": _normalize_axis(int(stats.get("power", 0))),
        "armor": _normalize_axis(int(stats.get("armor", 0))),
        "mobility": _normalize_axis(int(stats.get("mobility", 0))),
        "work": _normalize_axis(int(stats.get("work", 0))),
        "basis": "CANONICAL_STATS_NORMALIZED_TO_15",
        "gameplay_effect": false,
    }

static func _normalize_axis(value: int) -> float:
    return clamp(float(value) / 15.0, 0.0, 1.0)

static func _area_map(current_region_id: String) -> Array:
    var cells: Array = []
    for region_id in Catalog.REGION_ORDER:
        var region: Dictionary = Catalog.REGIONS[region_id]
        cells.append({
            "region_id": region_id,
            "name": String(region.get("name", "")),
            "danger_stars": int(region.get("danger_stars", 0)),
            "current": region_id == current_region_id,
        })
    return cells

static func _format_events(events: Array) -> Array:
    var rows: Array = []
    for raw in events:
        if typeof(raw) != TYPE_DICTIONARY:
            continue
        var event: Dictionary = raw
        var event_type := String(event.get("type", "event"))
        var step := int(event.get("step", 0))
        var label := "STEP %d / %s" % [step, event_type.to_upper()]
        if event_type == "entry":
            label += " / RESIST %d" % int(event.get("damage", 0))
        elif event_type == "hazard":
            label += " / MOBILITY DAMAGE %d" % int(event.get("damage", 0))
        elif event_type == "encounter":
            label += " / ENCOUNTER DAMAGE %d" % int(event.get("damage", 0))
        elif event_type == "loot":
            label += " / ITEMS %d" % int(event.get("item_count", 0))
        elif event_type == "result":
            label += " / %s / TOTAL DAMAGE %d" % [String(event.get("status", "UNKNOWN")), int(event.get("total_damage", 0))]
        rows.append({
            "step": step,
            "type": event_type,
            "label": label,
        })
    return rows
