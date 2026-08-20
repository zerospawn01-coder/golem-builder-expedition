class_name GolemGameCatalog
extends RefCounted

const BODY_ORDER = ["stone", "wood", "iron", "clay"]
const CORE_ORDER = ["fire", "wind", "water", "earth"]
const RUNE_ORDER = ["attack", "defense", "speed", "regen"]
const REGION_ORDER = ["region_quarry", "region_forest", "region_mine", "region_ruins"]

const BODIES = {
    "stone": {"name": "石", "name_en": "Stone Body", "stats": {"power": 4, "armor": 8, "mobility": 2, "work": 5}},
    "wood": {"name": "木", "name_en": "Wood Body", "stats": {"power": 2, "armor": 3, "mobility": 8, "work": 5}},
    "iron": {"name": "鉄", "name_en": "Iron Body", "stats": {"power": 7, "armor": 7, "mobility": 2, "work": 4}},
    "clay": {"name": "粘土", "name_en": "Clay Body", "stats": {"power": 3, "armor": 4, "mobility": 5, "work": 6}},
}

const CORES = {
    "fire": {"name": "火の核", "modifier": {"power": 4}},
    "wind": {"name": "風の核", "modifier": {"mobility": 5}},
    "water": {"name": "水の核", "modifier": {"armor": 3, "work": 2}},
    "earth": {"name": "地の核", "modifier": {"work": 4, "armor": 2}},
}

const RUNES = {
    "attack": {"name": "攻撃ルーン", "modifier": {"power": 3}},
    "defense": {"name": "防御ルーン", "modifier": {"armor": 3}},
    "speed": {"name": "速度ルーン", "modifier": {"mobility": 3}},
    "regen": {"name": "積載ルーン", "modifier": {"work": 3, "armor": 1}},
}

const TRAITS = {
    "flight": {"name": "飛行", "description": "空中を飛行・滑空し、浮遊遺跡へ到達可能にする。"},
    "water_action": {"name": "水中行動", "description": "高水圧下でも作動する。"},
    "poison_proof": {"name": "毒耐性", "description": "腐食性の瘴気・毒霧に抗う。"},
    "heat_proof": {"name": "耐熱", "description": "熱気や溶岩蒸気への耐性。"},
    "night_vision": {"name": "暗視", "description": "暗闇で障害物や敵を感知する。"},
    "mana_sense": {"name": "魔力感知", "description": "微細な魔力波長を察知する。"},
}

const REGIONS = {
    "region_quarry": {
        "name": "風化した採石場", "danger_stars": 1, "access_trait": "", "resist_trait": "",
        "recommended": {"power": 4, "armor": 3, "mobility": 2, "work": 5},
        "hazards": ["崩れかけた岩壁", "採掘用魔導機の暴走"],
        "possible_loot": [
            {"category": "body", "id": "stone", "name": "石材", "rarity": "common", "amount_min": 2, "amount_max": 4},
            {"category": "body", "id": "clay", "name": "魔力粘土", "rarity": "uncommon", "amount_min": 1, "amount_max": 2},
            {"category": "core", "id": "earth", "name": "地の核", "rarity": "uncommon", "amount_min": 1, "amount_max": 1},
            {"category": "rune", "id": "defense", "name": "防御ルーン", "rarity": "rare", "amount_min": 1, "amount_max": 1},
        ],
    },
    "region_forest": {
        "name": "ざわめく深緑林", "danger_stars": 1, "access_trait": "", "resist_trait": "",
        "recommended": {"power": 3, "armor": 3, "mobility": 6, "work": 4},
        "hazards": ["密生する霊樹の根", "縄張りを守る牙獣"],
        "possible_loot": [
            {"category": "body", "id": "wood", "name": "霊木", "rarity": "common", "amount_min": 2, "amount_max": 4},
            {"category": "core", "id": "wind", "name": "風の核", "rarity": "uncommon", "amount_min": 1, "amount_max": 2},
            {"category": "rune", "id": "speed", "name": "速度ルーン", "rarity": "uncommon", "amount_min": 1, "amount_max": 1},
            {"category": "rune", "id": "regen", "name": "積載ルーン", "rarity": "rare", "amount_min": 1, "amount_max": 1},
        ],
    },
    "region_mine": {
        "name": "灯なき廃坑", "danger_stars": 2, "access_trait": "night_vision", "resist_trait": "night_vision",
        "recommended": {"power": 7, "armor": 6, "mobility": 4, "work": 6},
        "hazards": ["洞窟トロール", "連鎖落石", "崩落した昇降路"],
        "possible_loot": [
            {"category": "body", "id": "iron", "name": "黒鉄鉱", "rarity": "common", "amount_min": 2, "amount_max": 4},
            {"category": "core", "id": "fire", "name": "火の核", "rarity": "uncommon", "amount_min": 1, "amount_max": 1},
            {"category": "rune", "id": "attack", "name": "破砕ルーン", "rarity": "uncommon", "amount_min": 1, "amount_max": 1},
            {"category": "core", "id": "water", "name": "地底水晶核", "rarity": "rare", "amount_min": 1, "amount_max": 1},
        ],
    },
    "region_ruins": {
        "name": "封印された古代遺跡", "danger_stars": 3, "access_trait": "mana_sense", "resist_trait": "heat_proof",
        "recommended": {"power": 8, "armor": 8, "mobility": 7, "work": 8},
        "hazards": ["古代守護像", "魔力嵐", "灼熱する封印回廊"],
        "possible_loot": [
            {"category": "body", "id": "iron", "name": "古代合金", "rarity": "uncommon", "amount_min": 1, "amount_max": 3},
            {"category": "core", "id": "water", "name": "蒼古代核", "rarity": "rare", "amount_min": 1, "amount_max": 1},
            {"category": "rune", "id": "defense", "name": "守護ルーン", "rarity": "rare", "amount_min": 1, "amount_max": 1},
            {"category": "rune", "id": "regen", "name": "積載ルーン", "rarity": "rare", "amount_min": 1, "amount_max": 1},
        ],
    },
}

const DEFAULT_INVENTORY = {
    "body": {"stone": 3, "wood": 2, "clay": 0, "iron": 0},
    "core": {"fire": 1, "wind": 1, "water": 0, "earth": 0},
    "rune": {"attack": 1, "speed": 1, "defense": 0, "regen": 0},
}

static func calculate_golem_stats(body_id: String, core_id: String, rune_id: String) -> Dictionary:
    if not BODIES.has(body_id) or not CORES.has(core_id) or not RUNES.has(rune_id):
        return {}
    var base: Dictionary = BODIES[body_id]["stats"]
    var core: Dictionary = CORES[core_id]["modifier"]
    var rune: Dictionary = RUNES[rune_id]["modifier"]
    return {
        "power": int(base["power"]) + int(core.get("power", 0)) + int(rune.get("power", 0)),
        "armor": int(base["armor"]) + int(core.get("armor", 0)) + int(rune.get("armor", 0)),
        "mobility": int(base["mobility"]) + int(core.get("mobility", 0)) + int(rune.get("mobility", 0)),
        "work": int(base["work"]) + int(core.get("work", 0)) + int(rune.get("work", 0)),
    }

static func get_golem_traits(body_id: String, core_id: String, rune_id: String) -> Array:
    var traits: Array = []
    if (body_id == "wood" and core_id == "wind") or (body_id == "wood" and rune_id == "speed"):
        traits.append("flight")
    if body_id == "clay" and (core_id == "water" or core_id == "earth"):
        traits.append("water_action")
    if body_id == "iron" and (rune_id == "defense" or core_id == "earth"):
        traits.append("poison_proof")
    if body_id == "stone" and (core_id == "fire" or rune_id == "regen"):
        traits.append("heat_proof")
    if (body_id == "wood" and core_id == "fire") or (core_id == "earth" and rune_id == "regen"):
        traits.append("night_vision")
    if core_id == "water" and rune_id == "attack":
        traits.append("mana_sense")
    return traits

static func generate_golem_name(body_id: String, core_id: String, rune_id: String) -> String:
    var special := {
        "stone-fire-attack": "火炎石像ゴーレム",
        "iron-earth-defense": "城塞ゴーレム",
        "wood-wind-speed": "疾風飛空木偶",
        "clay-water-regen": "潜水泥人形",
        "iron-fire-attack": "灼熱鋼鉄兵",
        "stone-earth-defense": "金剛巌石像",
        "wood-fire-attack": "爆炎機巧木偶",
        "clay-earth-defense": "大地の泥巨人",
    }
    var key := "%s-%s-%s" % [body_id, core_id, rune_id]
    if special.has(key):
        return special[key]
    var core_prefix := {"fire": "火炎の", "water": "流水の", "wind": "疾風の", "earth": "金剛の"}
    var body_noun := {"stone": "石像", "iron": "鋼鉄兵", "wood": "木偶", "clay": "泥人形"}
    var rune_title := {"attack": " [破砕]", "defense": " [金剛]", "speed": " [飛空]", "regen": " [積載]"}
    return "%s%s%s" % [core_prefix.get(core_id, ""), body_noun.get(body_id, "ゴーレム"), rune_title.get(rune_id, "")]

static func make_golem(body_id: String, core_id: String, rune_id: String, golem_id: String, created_at: int, starter := false) -> Dictionary:
    return {
        "id": golem_id,
        "name": generate_golem_name(body_id, core_id, rune_id),
        "body": body_id,
        "core": core_id,
        "rune": rune_id,
        "stats": calculate_golem_stats(body_id, core_id, rune_id),
        "traits": get_golem_traits(body_id, core_id, rune_id),
        "created_at": created_at,
        "expeditions_count": 0,
        "durability": 100,
        "is_starter": starter,
    }

static func evaluate_expedition_damage(region_id: String, golem: Dictionary) -> Dictionary:
    if not REGIONS.has(region_id):
        return {"ok": false, "error": "REGION_NOT_FOUND"}
    var region: Dictionary = REGIONS[region_id]
    var stats: Dictionary = golem.get("stats", {})
    var traits: Array = golem.get("traits", [])
    var durability := int(golem.get("durability", 100))
    var access_trait := String(region.get("access_trait", ""))
    var resist_trait := String(region.get("resist_trait", ""))
    var has_access := access_trait.is_empty() or traits.has(access_trait)
    var has_resist := resist_trait.is_empty() or traits.has(resist_trait)
    if not has_access:
        return {
            "ok": true, "has_access_key": false, "has_resist_key": has_resist,
            "resist_damage": 0, "mobility_damage": 0, "encounter_damage": 0,
            "total_damage": 0, "failure_stage": "", "status": "BLOCKED",
        }

    var resist_damage := 0 if has_resist else int(region["danger_stars"]) * 22
    var total_damage := resist_damage
    if total_damage >= durability:
        return {"ok": true, "has_access_key": true, "has_resist_key": has_resist, "resist_damage": resist_damage, "mobility_damage": 0, "encounter_damage": 0, "total_damage": total_damage, "failure_stage": "entry", "status": "FAILED"}

    var recommended: Dictionary = region["recommended"]
    var mobility_diff := int(stats.get("mobility", 0)) - int(recommended["mobility"])
    var mobility_damage := abs(mobility_diff) * 9 if mobility_diff < 0 else 0
    total_damage += mobility_damage
    if total_damage >= durability:
        return {"ok": true, "has_access_key": true, "has_resist_key": has_resist, "resist_damage": resist_damage, "mobility_damage": mobility_damage, "encounter_damage": 0, "total_damage": total_damage, "failure_stage": "mobility", "status": "FAILED"}

    var power_diff := int(stats.get("power", 0)) - int(recommended["power"])
    var armor_bonus: int = max(0, int(stats.get("armor", 0)) - int(recommended["armor"]))
    var base_encounter_damage: int = max(12, int(region["danger_stars"]) * 20 - armor_bonus * 2)
    var encounter_damage: int
    if power_diff >= 0:
        encounter_damage = max(5, int(floor(float(base_encounter_damage) * 0.35)))
    else:
        encounter_damage = int(floor(float(base_encounter_damage) * 1.5 + float(abs(power_diff) * 6)))
    total_damage += encounter_damage
    var failure_stage := "encounter" if total_damage >= durability else ""
    var status := "FAILED" if not failure_stage.is_empty() else ("PARTIAL" if total_damage >= 55 else "SUCCESS")
    return {
        "ok": true, "has_access_key": true, "has_resist_key": has_resist,
        "resist_damage": resist_damage, "mobility_damage": mobility_damage, "encounter_damage": encounter_damage,
        "total_damage": total_damage, "failure_stage": failure_stage, "status": status,
    }

static func predict_expedition(region_id: String, golem: Dictionary) -> Dictionary:
    var evaluation := evaluate_expedition_damage(region_id, golem)
    if not evaluation.get("ok", false):
        return evaluation
    var region: Dictionary = REGIONS[region_id]
    var recommended: Dictionary = region["recommended"]
    var stats: Dictionary = golem.get("stats", {})
    var prediction := evaluation.duplicate(true)
    prediction["status_prediction"] = "BLOCKED" if evaluation["status"] == "BLOCKED" else ("DANGER" if evaluation["status"] == "FAILED" else ("PARTIAL" if evaluation["status"] == "PARTIAL" else "SAFE"))
    prediction["min_estimated_damage"] = evaluation["total_damage"]
    prediction["max_estimated_damage"] = evaluation["total_damage"]
    prediction["stat_analysis"] = {
        "power": {"current": int(stats.get("power", 0)), "required": int(recommended["power"]), "ok": int(stats.get("power", 0)) >= int(recommended["power"])},
        "armor": {"current": int(stats.get("armor", 0)), "required": int(recommended["armor"]), "ok": int(stats.get("armor", 0)) >= int(recommended["armor"])},
        "mobility": {"current": int(stats.get("mobility", 0)), "required": int(recommended["mobility"]), "ok": int(stats.get("mobility", 0)) >= int(recommended["mobility"])},
        "work": {"current": int(stats.get("work", 0)), "required": int(recommended["work"]), "ok": int(stats.get("work", 0)) >= int(recommended["work"])},
    }
    return prediction

static func _structured_events(damage: Dictionary, final_status: String, item_count: int) -> Array:
    var events: Array = []
    if String(damage.get("status", "")) == "BLOCKED":
        events.append({"step": 1, "type": "result", "status": "FAILED", "reason": "ACCESS_BLOCKED", "total_damage": 0})
        return events
    events.append({"step": 1, "type": "entry", "damage": int(damage.get("resist_damage", 0)), "has_resist_key": bool(damage.get("has_resist_key", false))})
    if String(damage.get("failure_stage", "")) == "entry":
        events.append({"step": 2, "type": "result", "status": "FAILED", "total_damage": int(damage.get("total_damage", 0))})
        return events
    events.append({"step": 2, "type": "hazard", "damage": int(damage.get("mobility_damage", 0))})
    if String(damage.get("failure_stage", "")) == "mobility":
        events.append({"step": 3, "type": "result", "status": "FAILED", "total_damage": int(damage.get("total_damage", 0))})
        return events
    events.append({"step": 3, "type": "encounter", "damage": int(damage.get("encounter_damage", 0))})
    if String(damage.get("failure_stage", "")) == "encounter":
        events.append({"step": 4, "type": "result", "status": "FAILED", "total_damage": int(damage.get("total_damage", 0))})
        return events
    events.append({"step": 4, "type": "loot", "item_count": item_count})
    events.append({"step": 5, "type": "result", "status": final_status, "total_damage": int(damage.get("total_damage", 0))})
    return events

static func run_expedition_simulation(region_id: String, golem: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
    var damage := evaluate_expedition_damage(region_id, golem)
    if not damage.get("ok", false):
        return {"ok": false, "error": damage.get("error", "DAMAGE_EVALUATION_FAILED")}
    var region: Dictionary = REGIONS[region_id]
    if damage["status"] == "BLOCKED":
        return {"ok": true, "region_id": region_id, "region_name": region["name"], "golem_name": golem["name"], "events": _structured_events(damage, "FAILED", 0), "total_damage": 0, "loots": [], "status": "FAILED"}
    if damage["status"] == "FAILED":
        return {"ok": true, "region_id": region_id, "region_name": region["name"], "golem_name": golem["name"], "events": _structured_events(damage, "FAILED", 0), "total_damage": damage["total_damage"], "loots": [], "status": "FAILED"}

    var stats: Dictionary = golem["stats"]
    var loot_slot_count: int = min(3, 1 + int(floor(float(stats["work"]) / 5.0)))
    var work_quantity_bonus: int = 1 + int(floor(float(stats["work"]) / 6.0))
    var has_mana_sense := golem.get("traits", []).has("mana_sense")
    var selected_loots: Array = []
    var pool: Array = region["possible_loot"].duplicate(true)
    for _slot in range(loot_slot_count):
        if pool.is_empty():
            break
        var random_index := rng.randi_range(0, pool.size() - 1)
        var item: Dictionary = pool[random_index]
        var drop_chance := 0.8
        if item["rarity"] == "uncommon":
            drop_chance = 0.55
        elif item["rarity"] == "rare":
            drop_chance = 0.3
        if has_mana_sense:
            drop_chance += 0.2
        if rng.randf() < drop_chance:
            var base_count := rng.randi_range(int(item["amount_min"]), int(item["amount_max"]))
            var final_count: int = max(1, base_count + work_quantity_bonus - 1)
            var unit_weight := 3 if item["category"] == "body" else (2 if item["category"] == "core" else 1)
            selected_loots.append({"category": item["category"], "id": item["id"], "name": item["name"], "count": final_count, "weight": unit_weight * final_count})
            pool.remove_at(random_index)

    var final_status := "PARTIAL" if int(damage["total_damage"]) >= 55 else "SUCCESS"
    if final_status == "PARTIAL":
        for loot in selected_loots:
            loot["count"] = max(1, int(floor(float(loot["count"]) * 0.5)))
            var unit_weight := 3 if loot["category"] == "body" else (2 if loot["category"] == "core" else 1)
            loot["weight"] = unit_weight * int(loot["count"])
    return {
        "ok": true, "region_id": region_id, "region_name": region["name"], "golem_name": golem["name"],
        "events": _structured_events(damage, final_status, selected_loots.size()),
        "total_damage": int(damage["total_damage"]), "loots": selected_loots, "status": final_status,
    }
