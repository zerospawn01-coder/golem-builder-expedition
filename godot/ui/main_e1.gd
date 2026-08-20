extends "res://ui/main.gd"

# Phase E2 keeps the frozen E1 source classifications while aligning the
# desktop dashboard with the PC reference's coarse zones and visual hierarchy.

const E2_PANEL := Color("17201e")
const E2_BORDER := Color("586257")
const E2_TEXT := Color("d8cfb3")
const E2_NEUTRAL := Color("82908a")
const E2_GREEN := Color("55c9b6")
const E2_YELLOW := Color("d8af5f")
const E2_RED := Color("e26955")

func _e1_dashboard(model: Dictionary) -> void:
    _heading("EXPEDITION TELEMETRY — PHASE E2")

    var dashboard := HBoxContainer.new()
    dashboard.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    dashboard.add_theme_constant_override("separation", 8)
    var center := VBoxContainer.new()
    center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    center.size_flags_stretch_ratio = 2.0
    center.add_theme_constant_override("separation", 8)

    var log_lines: Array = []
    for row in model["log"]:
        log_lines.append(String(row["label"]))
    if log_lines.is_empty():
        log_lines.append("SYSTEM LOG ONLINE")
        log_lines.append("NO EXPEDITION EVENTS")
    center.add_child(_e2_panel("LOG / STRUCTURED EVENT STREAM", log_lines, E2_GREEN, 124))

    # First E2 judgment cycle: shallow GAME_STATE blocks remain always visible.
    var primary_band := HBoxContainer.new()
    primary_band.add_theme_constant_override("separation", 8)
    var damage: Dictionary = model["damage"]
    var hull := int(damage["hull_integrity"])
    primary_band.add_child(_e2_panel("DAMAGE / GAME_STATE", [
        "HULL INTEGRITY %d%%" % hull,
        "DAMAGE %d%%" % int(damage["damage_percent"]),
        "EXPEDITION %d%%" % int(damage["expedition_total_damage"]),
    ], _threshold_color(hull, 40, 70), 116))

    var cargo: Dictionary = model["cargo"]
    var cargo_color := E2_NEUTRAL
    if bool(cargo["available"]):
        cargo_color = E2_GREEN if bool(cargo["claimed"]) else E2_YELLOW
    primary_band.add_child(_e2_panel("CARGO / GAME_STATE", [
        "SELECTED %d / %d" % [int(cargo["selected_count"]), int(cargo["candidate_count"])],
        "WEIGHT %d / %d" % [int(cargo["selected_weight"]), int(cargo["capacity"])],
        "CLAIMED %s" % str(bool(cargo["claimed"])),
    ], cargo_color, 116))

    var stability: Dictionary = model["stability"]
    primary_band.add_child(_e2_panel("STABILITY / PRESENTATION", [
        "INDEX %d" % int(stability["index"]),
        "DURABILITY PROXY",
        "GAMEPLAY EFFECT false",
    ], _threshold_color(int(stability["index"]), 40, 70), 116))
    center.add_child(primary_band)

    var secondary_band := HBoxContainer.new()
    secondary_band.add_theme_constant_override("separation", 8)
    var route: Dictionary = model["route"]
    secondary_band.add_child(_e2_panel("ROUTE / GAME_STATE", [
        "REGION %s" % _fallback(String(route["region_name"])),
        "REGION ID %s" % _fallback(String(route["region_id"])),
        "DEPTH N/A / UNAVAILABLE",
    ], E2_TEXT, 112))
    var analyzer: Dictionary = model["analyzer"]
    secondary_band.add_child(_e2_panel("ANALYZER / PRESENTATION", [
        "POWER    %s" % _meter(float(analyzer["power"])),
        "ARMOR    %s" % _meter(float(analyzer["armor"])),
        "MOBILITY %s" % _meter(float(analyzer["mobility"])),
        "WORK     %s" % _meter(float(analyzer["work"])),
    ], E2_GREEN, 112))
    center.add_child(secondary_band)

    var golem_status: Dictionary = model["golem_status"]
    var stats: Dictionary = golem_status["stats"]
    center.add_child(_e2_panel("GOLEM STATUS / GAME_STATE", [
        "UNIT %s" % _fallback(String(golem_status["name"])),
        "CORE %s / EFF N/A" % _fallback(String(golem_status["core_id"])),
        "SIGIL %s / EFF N/A" % _fallback(String(golem_status["rune_id"])),
        "P%d  A%d  M%d  W%d" % [int(stats.get("power", 0)), int(stats.get("armor", 0)), int(stats.get("mobility", 0)), int(stats.get("work", 0))],
    ], E2_TEXT, 116))
    dashboard.add_child(center)

    # Heavier presentation-derived blocks follow the established E2 grain.
    var right := VBoxContainer.new()
    right.custom_minimum_size.x = 300
    right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    right.size_flags_stretch_ratio = 1.0
    right.add_theme_constant_override("separation", 8)
    var area_lines: Array = []
    for cell in model["area_map"]:
        var marker := "YOU" if bool(cell["current"]) else " · "
        area_lines.append("%-3s  %s  %s" % [marker, String(cell["name"]), "◆".repeat(int(cell["danger_stars"]))])
    right.add_child(_e2_panel("AREA MAP / PRESENTATION", area_lines, E2_GREEN, 164))

    var navigation: Dictionary = model["navigation"]
    var nav_color := E2_GREEN if String(navigation["status"]) == "RESOLVED" else E2_NEUTRAL
    right.add_child(_e2_panel("NAVIGATION / PRESENTATION", [
        "STATE %s" % String(navigation["status"]),
        "CURRENT %s" % _fallback(String(navigation["current_region_name"])),
        "OBJECTIVE N/A / INFORMATIONAL",
    ], nav_color, 126))

    var day_action: Dictionary = model["day_action"]
    var action_color := E2_GREEN if int(day_action["actions_left"]) > 0 else E2_RED
    right.add_child(_e2_panel("SYSTEM STATUS / GAME_STATE", [
        "DAY %02d" % int(day_action["day"]),
        "ACTION %d / %d" % [int(day_action["actions_left"]), GameState.ACTIONS_PER_DAY],
        "STATUS %s" % ("AVAILABLE" if int(day_action["actions_left"]) > 0 else "BLOCKED"),
    ], action_color, 116))
    right.add_child(_e2_panel("SIGNAL + DIAGNOSTICS / UNAVAILABLE", [
        "SIGNAL STRENGTH N/A", "MAG. NOISE N/A", "JOINT LOAD N/A", "NO CANONICAL SOURCE",
    ], E2_NEUTRAL, 116))
    dashboard.add_child(right)
    content.add_child(dashboard)

func _e2_panel(title_text: String, lines: Array, accent: Color, minimum_height: int) -> PanelContainer:
    var panel := PanelContainer.new()
    panel.custom_minimum_size.y = minimum_height
    panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var style := StyleBoxFlat.new()
    style.bg_color = E2_PANEL
    style.border_color = accent.darkened(0.25) if accent != E2_TEXT else E2_BORDER
    style.set_border_width_all(1)
    style.set_corner_radius_all(2)
    style.content_margin_left = 10
    style.content_margin_right = 10
    style.content_margin_top = 8
    style.content_margin_bottom = 8
    panel.add_theme_stylebox_override("panel", style)
    var box := VBoxContainer.new()
    box.add_theme_constant_override("separation", 4)
    var title := Label.new()
    title.text = title_text
    title.add_theme_color_override("font_color", accent)
    title.add_theme_font_size_override("font_size", 13)
    box.add_child(title)
    var rule := HSeparator.new()
    rule.modulate = accent
    box.add_child(rule)
    for line in lines:
        var label := Label.new()
        label.text = String(line)
        label.add_theme_color_override("font_color", E2_TEXT)
        label.add_theme_font_size_override("font_size", 11)
        label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
        box.add_child(label)
    panel.add_child(box)
    return panel

func _threshold_color(value: int, critical_below: int, caution_below: int) -> Color:
    if value < critical_below:
        return E2_RED
    if value < caution_below:
        return E2_YELLOW
    return E2_GREEN

func _meter(value: float) -> String:
    var filled := clampi(roundi(value * 8.0), 0, 8)
    return "%s%s" % ["■".repeat(filled), "·".repeat(8 - filled)]

func _fallback(value: String) -> String:
    return value if not value.is_empty() else "—"
