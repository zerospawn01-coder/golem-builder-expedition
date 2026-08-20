class_name LiveLoopD2Vectors
extends RefCounted

const Catalog = preload("res://domain/game_catalog.gd")
const DURABILITY_VALUES := [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
const SCHEMA := "live-loop-d2-damage-vector-v1"

static func build_all() -> Array:
    var vectors: Array = []
    for frame_id in Catalog.BODY_ORDER:
        for reactor_id in Catalog.CORE_ORDER:
            for control_sigil_id in Catalog.RUNE_ORDER:
                for region_id in Catalog.REGION_ORDER:
                    for durability in DURABILITY_VALUES:
                        vectors.append(build_one(frame_id, reactor_id, control_sigil_id, region_id, durability))
    return vectors

static func build_one(frame_id: String, reactor_id: String, control_sigil_id: String, region_id: String, durability: int) -> Dictionary:
    var golem := Catalog.make_golem(frame_id, reactor_id, control_sigil_id, "vector-unit", 0, false)
    golem["durability"] = durability
    var evaluation: Dictionary = Catalog.evaluate_expedition_damage(region_id, golem)
    var has_access := bool(evaluation.get("has_access_key", false))
    var failure_stage := String(evaluation.get("failure_stage", ""))
    var entry_damage := int(evaluation.get("resist_damage", 0))
    var hazard_damage := int(evaluation.get("mobility_damage", 0))
    var encounter_damage := int(evaluation.get("encounter_damage", 0))
    var entry_prefix := entry_damage
    var hazard_prefix := entry_damage + hazard_damage
    var encounter_prefix := hazard_prefix + encounter_damage
    var entry_reachable := has_access
    var hazard_reachable := has_access and failure_stage != "entry"
    var encounter_reachable := hazard_reachable and failure_stage != "mobility"
    var recovery_reachable := encounter_reachable and failure_stage != "encounter"
    var stats: Dictionary = golem["stats"]
    var traits: Array = golem["traits"]
    return {
        "schema": SCHEMA,
        "vector_id": "%s|%s|%s|%s|%03d" % [frame_id, reactor_id, control_sigil_id, region_id, durability],
        "input": {
            "frame_id": frame_id,
            "reactor_id": reactor_id,
            "control_sigil_id": control_sigil_id,
            "region_id": region_id,
            "starting_durability": durability,
            "stats": {
                "power": int(stats.get("power", 0)),
                "armor": int(stats.get("armor", 0)),
                "mobility": int(stats.get("mobility", 0)),
                "work": int(stats.get("work", 0)),
            },
            "traits": traits.duplicate(true),
        },
        "legacy": {
            "has_access_key": has_access,
            "has_resist_key": bool(evaluation.get("has_resist_key", false)),
            "components": [entry_damage, hazard_damage, encounter_damage, 0],
            "prefixes": [0, entry_prefix, hazard_prefix, encounter_prefix, encounter_prefix],
            "failure_stage": failure_stage,
            "total_damage": int(evaluation.get("total_damage", 0)),
            "status": String(evaluation.get("status", "")),
        },
        "steps": [
            _step("ENTRY", entry_reachable, entry_damage, 0, entry_prefix, durability, failure_stage == "entry"),
            _step("HAZARD", hazard_reachable, hazard_damage, entry_prefix, hazard_prefix, durability, failure_stage == "mobility"),
            _step("ENCOUNTER", encounter_reachable, encounter_damage, hazard_prefix, encounter_prefix, durability, failure_stage == "encounter"),
            _step("RECOVERY", recovery_reachable, 0, encounter_prefix, encounter_prefix, durability, false),
        ],
    }

static func _step(step_id: String, reachable: bool, damage: int, prefix_before: int, prefix_after: int, starting_durability: int, destroys: bool) -> Dictionary:
    return {
        "step_id": step_id,
        "reachable": reachable,
        "step_damage": damage,
        "prefix_before": prefix_before,
        "prefix_after": prefix_after,
        "durability_before": maxi(0, starting_durability - prefix_before),
        "durability_after": maxi(0, starting_durability - prefix_after),
        "destroys": destroys,
    }

static func to_tsv(vectors: Array) -> String:
    var header := PackedStringArray([
        "vector_id", "frame_id", "reactor_id", "control_sigil_id", "region_id", "starting_durability",
        "power", "armor", "mobility", "work", "traits", "has_access", "has_resist",
        "entry_damage", "hazard_damage", "encounter_damage", "recovery_damage",
        "prefix_0", "prefix_entry", "prefix_hazard", "prefix_encounter", "prefix_recovery",
        "failure_stage", "status", "total_damage",
        "entry_reachable", "hazard_reachable", "encounter_reachable", "recovery_reachable",
        "entry_durability_before", "entry_durability_after", "entry_destroys",
        "hazard_durability_before", "hazard_durability_after", "hazard_destroys",
        "encounter_durability_before", "encounter_durability_after", "encounter_destroys",
        "recovery_durability_before", "recovery_durability_after", "recovery_destroys",
    ])
    var lines: Array[String] = []
    lines.append("\t".join(header))
    for vector in vectors:
        var input: Dictionary = vector["input"]
        var stats: Dictionary = input["stats"]
        var legacy: Dictionary = vector["legacy"]
        var components: Array = legacy["components"]
        var prefixes: Array = legacy["prefixes"]
        var steps: Array = vector["steps"]
        var fields: Array[String] = [
            String(vector["vector_id"]), String(input["frame_id"]), String(input["reactor_id"]), String(input["control_sigil_id"]),
            String(input["region_id"]), str(int(input["starting_durability"])), str(int(stats["power"])), str(int(stats["armor"])),
            str(int(stats["mobility"])), str(int(stats["work"])), ",".join(input["traits"]), _bit(bool(legacy["has_access_key"])),
            _bit(bool(legacy["has_resist_key"])), str(int(components[0])), str(int(components[1])), str(int(components[2])),
            str(int(components[3])), str(int(prefixes[0])), str(int(prefixes[1])), str(int(prefixes[2])), str(int(prefixes[3])),
            str(int(prefixes[4])), String(legacy["failure_stage"]), String(legacy["status"]), str(int(legacy["total_damage"])),
        ]
        for step in steps:
            fields.append(_bit(bool(step["reachable"])))
        for step in steps:
            fields.append(str(int(step["durability_before"])))
            fields.append(str(int(step["durability_after"])))
            fields.append(_bit(bool(step["destroys"])))
        lines.append("\t".join(fields))
    return "\n".join(lines) + "\n"

static func _bit(value: bool) -> String:
    return "1" if value else "0"
