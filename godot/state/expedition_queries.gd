class_name ExpeditionStateQueries
extends RefCounted

const Catalog = preload("res://domain/game_catalog.gd")

static func prediction(snapshot: Dictionary, golem_id: String, region_id: String) -> Dictionary:
    var golem := _find_golem(snapshot.get("golems", []), golem_id)
    if golem.is_empty():
        return {"ok": false, "error": "GOLEM_NOT_FOUND"}
    return Catalog.predict_expedition(region_id, golem)

static func region_options() -> Array:
    var options: Array = []
    for region_id in Catalog.REGION_ORDER:
        var region: Dictionary = Catalog.REGIONS[region_id]
        options.append({"id": region_id, "name": String(region.get("name", region_id))})
    return options

static func _find_golem(golems: Array, golem_id: String) -> Dictionary:
    for item in golems:
        var golem: Dictionary = item
        if String(golem.get("id", "")) == golem_id:
            return golem.duplicate(true)
    return {}
