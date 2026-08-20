extends "res://ui/main.gd"

# Phase E1 source-classification override.
# Every visible observation panel has exactly one source class.
# MIXED is prohibited by EXPEDITION_PRESENTATION_DATA_CONTRACT.md.

func _e1_dashboard(model: Dictionary) -> void:
    _heading("E1 OBSERVATION BLOCKS — SOURCE CLASSIFIED")
    var grid := GridContainer.new()
    grid.columns = 3
    grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL

    var day_action: Dictionary = model["day_action"]
    grid.add_child(_e1_panel("SYSTEM STATUS / GAME_STATE", [
        "DAY %d" % int(day_action["day"]),
        "ACTION %d" % int(day_action["actions_left"]),
    ]))

    var damage: Dictionary = model["damage"]
    grid.add_child(_e1_panel("DAMAGE / GAME_STATE", [
        "HULL INTEGRITY %d%%" % int(damage["hull_integrity"]),
        "DAMAGE %d%%" % int(damage["damage_percent"]),
        "EXPEDITION DAMAGE %d%%" % int(damage["expedition_total_damage"]),
    ]))

    var stability: Dictionary = model["stability"]
    grid.add_child(_e1_panel("STABILITY / PRESENTATION", [
        "INDEX %d" % int(stability["index"]),
        "BASIS %s" % String(stability["basis"]),
        "GAMEPLAY EFFECT false",
    ]))

    grid.add_child(_e1_panel("JOINT LOAD / UNAVAILABLE", [
        "JOINT LOAD N/A",
        "NO CANONICAL SOURCE",
    ]))

    var cargo: Dictionary = model["cargo"]
    grid.add_child(_e1_panel("CARGO / GAME_STATE", [
        "SELECTED %d / CANDIDATE %d" % [int(cargo["selected_count"]), int(cargo["candidate_count"])],
        "WEIGHT %d / %d" % [int(cargo["selected_weight"]), int(cargo["capacity"])],
        "CLAIMED %s" % str(bool(cargo["claimed"])),
    ]))

    var route: Dictionary = model["route"]
    grid.add_child(_e1_panel("ROUTE / GAME_STATE", [
        "REGION %s" % (String(route["region_name"]) if not String(route["region_name"]).is_empty() else "—"),
        "REGION ID %s" % (String(route["region_id"]) if not String(route["region_id"]).is_empty() else "—"),
    ]))

    var navigation: Dictionary = model["navigation"]
    grid.add_child(_e1_panel("NAVIGATION / PRESENTATION", [
        "STATE %s" % String(navigation["status"]),
        "CURRENT REGION %s" % (String(navigation["current_region_name"]) if not String(navigation["current_region_name"]).is_empty() else "—"),
    ]))

    grid.add_child(_e1_panel("DEPTH / UNAVAILABLE", [
        "NUMERIC DEPTH N/A",
        "NO CANONICAL SOURCE",
    ]))

    var golem_status: Dictionary = model["golem_status"]
    var stats: Dictionary = golem_status["stats"]
    var traits: Array = golem_status.get("traits", [])
    grid.add_child(_e1_panel("GOLEM STATUS / GAME_STATE", [
        "UNIT %s" % String(golem_status["name"]),
        "CORE %s" % String(golem_status["core_id"]),
        "SIGIL %s" % String(golem_status["rune_id"]),
        "P%d A%d M%d W%d" % [int(stats.get("power", 0)), int(stats.get("armor", 0)), int(stats.get("mobility", 0)), int(stats.get("work", 0))],
        "TRAITS %s" % (", ".join(traits) if not traits.is_empty() else "NONE"),
    ]))

    grid.add_child(_e1_panel("GOLEM DIAGNOSTICS / UNAVAILABLE", [
        "POWER CORE EFFICIENCY N/A",
        "RUNE EFFICIENCY N/A",
        "NO CANONICAL SOURCE",
    ]))

    var analyzer: Dictionary = model["analyzer"]
    grid.add_child(_e1_panel("ANALYZER / PRESENTATION", [
        "POWER %.2f" % float(analyzer["power"]),
        "ARMOR %.2f" % float(analyzer["armor"]),
        "MOBILITY %.2f" % float(analyzer["mobility"]),
        "WORK %.2f" % float(analyzer["work"]),
    ]))

    var area_lines: Array = []
    for cell in model["area_map"]:
        area_lines.append("%s %s" % [">" if bool(cell["current"]) else "·", String(cell["name"])])
    grid.add_child(_e1_panel("AREA MAP / PRESENTATION", area_lines))

    grid.add_child(_e1_panel("SIGNAL / UNAVAILABLE", [
        "SIGNAL STRENGTH N/A",
        "MAG. NOISE N/A",
        "NO CANONICAL SOURCE",
    ]))
    content.add_child(grid)

    var log_lines: Array = []
    for row in model["log"]:
        log_lines.append(String(row["label"]))
    if log_lines.is_empty():
        log_lines.append("NO EXPEDITION EVENTS")
    content.add_child(_e1_panel("LOG / STRUCTURED EVENT STREAM", log_lines))
