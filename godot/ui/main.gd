extends Control

const Catalog = preload("res://domain/game_catalog.gd")
const Blueprints = preload("res://domain/blueprint_library.gd")
const ExpeditionPresenter = preload("res://presentation/expedition_presenter.gd")
const ExpeditionQueries = preload("res://state/expedition_queries.gd")

var tab := "workshop"
var body_id := "stone"
var core_id := "fire"
var rune_id := "attack"
var loaded_blueprint_id := ""
var blueprint_source := "MANUAL_NEW"
var blueprint_modified := false
var purpose_tags: Array = ["GENERAL"]
var region_id := "region_quarry"
var golem_id := ""

var root: VBoxContainer
var content: VBoxContainer
var status: Label
var next_day: Button

func _ready() -> void:
    _build_shell()
    GameState.state_changed.connect(_refresh)
    GameState.notice.connect(_notice)
    golem_id = String(GameState.get_active_golem().get("id", ""))
    _refresh()

func _build_shell() -> void:
    var bg := ColorRect.new()
    bg.color = Color("0f1113")
    bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    add_child(bg)
    var margin := MarginContainer.new()
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    for side in ["left", "right", "top", "bottom"]:
        margin.add_theme_constant_override("margin_%s" % side, 16)
    add_child(margin)
    root = VBoxContainer.new()
    root.add_theme_constant_override("separation", 10)
    margin.add_child(root)
    var header := HBoxContainer.new()
    var title := Label.new()
    title.text = "GOLEM BUILDER EXPEDITION — GODOT FOUNDRY"
    title.add_theme_font_size_override("font_size", 20)
    title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    header.add_child(title)
    status = Label.new()
    header.add_child(status)
    var stock := Button.new()
    stock.text = "INVENTORY"
    stock.pressed.connect(_show_inventory)
    header.add_child(stock)
    root.add_child(header)
    var nav := HBoxContainer.new()
    for item in [["workshop", "WORKSHOP"], ["expedition", "EXPEDITION"], ["golems", "GOLEMS"]]:
        var b := Button.new()
        b.text = item[1]
        b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        b.pressed.connect(_switch_tab.bind(item[0]))
        nav.add_child(b)
    next_day = Button.new()
    next_day.text = "NEXT DAY"
    next_day.pressed.connect(_advance_day)
    nav.add_child(next_day)
    root.add_child(nav)
    var scroll := ScrollContainer.new()
    scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    root.add_child(scroll)
    content = VBoxContainer.new()
    content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    content.add_theme_constant_override("separation", 8)
    scroll.add_child(content)

func _refresh() -> void:
    status.text = "DAY %d | ACTION %d/%d | UNIT %d/%d" % [GameState.day, GameState.actions_left, GameState.ACTIONS_PER_DAY, GameState.golems.size(), GameState.MAX_GOLEMS]
    next_day.disabled = GameState.actions_left > 0
    for child in content.get_children():
        content.remove_child(child)
        child.queue_free()
    if tab == "workshop":
        _workshop()
    elif tab == "expedition":
        _expedition()
    else:
        _golems()

func _heading(text: String) -> void:
    var label := Label.new()
    label.text = text
    label.add_theme_font_size_override("font_size", 18)
    content.add_child(label)

func _switch_tab(next: String) -> void:
    tab = next
    _refresh()

func _parts() -> Dictionary:
    return {"frame_id": body_id, "reactor_id": core_id, "control_sigil_id": rune_id}

func _selector(ids: Array, catalog: Dictionary, selected: String, callback: Callable) -> OptionButton:
    var control := OptionButton.new()
    control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    for id in ids:
        var i := control.item_count
        control.add_item("%s — %s" % [catalog[id]["name"], id])
        control.set_item_metadata(i, id)
        if id == selected:
            control.select(i)
    control.item_selected.connect(callback.bind(control))
    return control

func _workshop() -> void:
    _heading("WORKSHOP — FRAME / REACTOR / CONTROL SIGIL")
    var row := HBoxContainer.new()
    row.add_child(_selector(Catalog.BODY_ORDER, Catalog.BODIES, body_id, _body_changed))
    row.add_child(_selector(Catalog.CORE_ORDER, Catalog.CORES, core_id, _core_changed))
    row.add_child(_selector(Catalog.RUNE_ORDER, Catalog.RUNES, rune_id, _rune_changed))
    content.add_child(row)
    var stats := Catalog.calculate_golem_stats(body_id, core_id, rune_id)
    var traits := Catalog.get_golem_traits(body_id, core_id, rune_id)
    var preview := Label.new()
    preview.text = "%s\nPOWER %d | ARMOR %d | MOBILITY %d | WORK %d\nTRAITS %s" % [Catalog.generate_golem_name(body_id, core_id, rune_id), stats["power"], stats["armor"], stats["mobility"], stats["work"], ", ".join(traits) if not traits.is_empty() else "NONE"]
    content.add_child(preview)
    var opportunity := GameState.record_design_opportunity(_parts())
    var tags := HBoxContainer.new()
    for tag in Blueprints.PURPOSE_TAG_OPTIONS:
        var check := CheckButton.new()
        check.text = tag
        check.button_pressed = purpose_tags.has(tag)
        check.toggled.connect(_tag_changed.bind(tag))
        tags.add_child(check)
    content.add_child(tags)
    var actions := HBoxContainer.new()
    var save := Button.new()
    save.text = "SAVE AS NEW"
    save.disabled = not opportunity.get("ok", false) or bool(opportunity.get("already_saved", false))
    save.pressed.connect(_save_as_new)
    actions.add_child(save)
    if not loaded_blueprint_id.is_empty() and blueprint_modified:
        var update := Button.new()
        update.text = "UPDATE LOADED"
        update.disabled = not opportunity.get("ok", false)
        update.pressed.connect(_update_loaded)
        actions.add_child(update)
    var fabricate := Button.new()
    fabricate.text = "FABRICATE — 1 ACTION"
    fabricate.disabled = GameState.actions_left <= 0 or GameState.golems.size() >= GameState.MAX_GOLEMS
    fabricate.pressed.connect(_fabricate)
    actions.add_child(fabricate)
    content.add_child(actions)
    _heading("BLUEPRINT LIBRARY")
    for blueprint in GameState.blueprint_library.get("blueprints", []):
        var bp_row := HBoxContainer.new()
        var label := Label.new()
        label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
        var p: Dictionary = blueprint["part_ids"]
        label.text = "%s | %s/%s/%s | %s" % [blueprint["blueprint_id"], p["frame_id"], p["reactor_id"], p["control_sigil_id"], ",".join(blueprint.get("purpose_tag_ids", []))]
        bp_row.add_child(label)
        var load := Button.new()
        load.text = "LOAD"
        load.pressed.connect(_load_blueprint.bind(String(blueprint["blueprint_id"])))
        bp_row.add_child(load)
        content.add_child(bp_row)
    var measured := Blueprints.calculate_metrics(GameState.blueprint_telemetry)
    if measured.get("ok", false):
        var m: Dictionary = measured["metrics"]
        var telemetry := Label.new()
        telemetry.text = "R2 | SAVE OP %d | REDEPLOY OP %d | REUSE %s | ASSISTED %s" % [m["eligible_save_opportunities"], m["eligible_redeploy_decisions"], _rate(m["reuse_rate"]), _rate(m["blueprint_redeploy_rate"])]
        content.add_child(telemetry)

func _rate(value) -> String:
    return "n/a" if value == null else "%.2f" % float(value)

func _body_changed(_index: int, selector: OptionButton) -> void:
    body_id = String(selector.get_item_metadata(selector.selected))
    _design_modified()
func _core_changed(_index: int, selector: OptionButton) -> void:
    core_id = String(selector.get_item_metadata(selector.selected))
    _design_modified()
func _rune_changed(_index: int, selector: OptionButton) -> void:
    rune_id = String(selector.get_item_metadata(selector.selected))
    _design_modified()

func _design_modified() -> void:
    if not loaded_blueprint_id.is_empty() and not blueprint_modified:
        GameState.mark_blueprint_modified(loaded_blueprint_id)
        blueprint_source = "BLUEPRINT_MODIFIED"
        blueprint_modified = true
    _refresh()

func _tag_changed(enabled: bool, tag: String) -> void:
    if enabled and tag == "GENERAL":
        purpose_tags = ["GENERAL"]
    elif enabled:
        purpose_tags.erase("GENERAL")
        if not purpose_tags.has(tag):
            purpose_tags.append(tag)
    else:
        purpose_tags.erase(tag)
        if purpose_tags.is_empty():
            purpose_tags = ["GENERAL"]
    _refresh()

func _save_as_new() -> void:
    var result := GameState.save_blueprint(_parts(), purpose_tags, "")
    _notice("BLUEPRINT SAVED" if result.get("ok", false) else String(result.get("error", "SAVE FAILED")))
    _refresh()

func _update_loaded() -> void:
    var result := GameState.save_blueprint(_parts(), purpose_tags, loaded_blueprint_id)
    if result.get("ok", false):
        blueprint_modified = false
        blueprint_source = "BLUEPRINT_DIRECT"
        _notice("BLUEPRINT UPDATED")
    else:
        _notice(String(result.get("error", "UPDATE FAILED")))
    _refresh()

func _load_blueprint(id: String) -> void:
    var result := GameState.load_blueprint(id)
    if not result.get("ok", false):
        _notice(String(result.get("error", "LOAD FAILED")))
        return
    var design: Dictionary = result["design"]
    body_id = String(design["frame_id"])
    core_id = String(design["reactor_id"])
    rune_id = String(design["control_sigil_id"])
    purpose_tags = result["blueprint"].get("purpose_tag_ids", ["GENERAL"]).duplicate(true)
    loaded_blueprint_id = id
    blueprint_source = "BLUEPRINT_DIRECT"
    blueprint_modified = false
    _refresh()

func _fabricate() -> void:
    var result := GameState.fabricate(_parts(), blueprint_source, loaded_blueprint_id)
    if result.get("ok", false):
        golem_id = String(result["golem"]["id"])
        _notice("FABRICATION COMPLETE")
    else:
        _notice(String(result.get("reason", result.get("error", "FABRICATION BLOCKED"))))
    _refresh()

func _expedition() -> void:
    _heading("EXPEDITION — PHASE E2 / PC HIERARCHY")
    var row := HBoxContainer.new()
    var region_ids: Array = []
    var region_catalog := {}
    for option in ExpeditionQueries.region_options():
        var id := String(option["id"])
        region_ids.append(id)
        region_catalog[id] = {"name": String(option["name"])}
    row.add_child(_selector(region_ids, region_catalog, region_id, _region_changed))
    var unit_ids: Array = []
    var unit_catalog := {}
    for golem in GameState.golems:
        unit_ids.append(String(golem["id"]))
        unit_catalog[String(golem["id"])] = {"name": "%s | DUR %d%%" % [golem["name"], golem["durability"]]}
    if golem_id.is_empty() and not unit_ids.is_empty():
        golem_id = unit_ids[0]
    row.add_child(_selector(unit_ids, unit_catalog, golem_id, _golem_changed))
    content.add_child(row)

    var snapshot := GameState.get_presentation_snapshot()
    var prediction := ExpeditionQueries.prediction(snapshot, golem_id, region_id)
    var golem := GameState.get_golem(golem_id)
    if prediction.get("ok", false) and not golem.is_empty():
        var label := Label.new()
        label.text = "PREDICTION %s | DAMAGE %d%% | DURABILITY %d%%\nPOWER %d | ARMOR %d | MOBILITY %d | WORK %d" % [prediction.get("status_prediction", "?"), prediction.get("total_damage", 0), golem["durability"], golem["stats"]["power"], golem["stats"]["armor"], golem["stats"]["mobility"], golem["stats"]["work"]]
        content.add_child(label)
        var deploy := Button.new()
        deploy.text = "DEPLOY — 1 ACTION"
        deploy.disabled = GameState.actions_left <= 0 or prediction.get("status", "") == "BLOCKED" or GameState.has_pending_cargo()
        deploy.pressed.connect(_deploy)
        content.add_child(deploy)

    _e1_dashboard(ExpeditionPresenter.build(snapshot))
    if not GameState.expedition_runtime.is_empty():
        _report()

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
    var stability: Dictionary = model["stability"]
    grid.add_child(_e1_panel("DAMAGE / GAME_STATE", [
        "HULL INTEGRITY %d%%" % int(damage["hull_integrity"]),
        "DAMAGE %d%%" % int(damage["damage_percent"]),
        "JOINT LOAD N/A",
        "STABILITY %d / %s" % [int(stability["index"]), String(stability["basis"])],
    ]))

    var cargo: Dictionary = model["cargo"]
    grid.add_child(_e1_panel("CARGO / GAME_STATE", [
        "SELECTED %d / CANDIDATE %d" % [int(cargo["selected_count"]), int(cargo["candidate_count"])],
        "WEIGHT %d / %d" % [int(cargo["selected_weight"]), int(cargo["capacity"])],
        "CLAIMED %s" % str(bool(cargo["claimed"])),
    ]))

    var route: Dictionary = model["route"]
    var navigation: Dictionary = model["navigation"]
    grid.add_child(_e1_panel("ROUTE / NAVIGATION", [
        "REGION %s" % (String(route["region_name"]) if not String(route["region_name"]).is_empty() else "—"),
        "DEPTH N/A",
        "STATE %s" % String(navigation["status"]),
    ]))

    var golem_status: Dictionary = model["golem_status"]
    var stats: Dictionary = golem_status["stats"]
    grid.add_child(_e1_panel("GOLEM STATUS / MIXED", [
        String(golem_status["name"]),
        "CORE %s / EFF N/A" % String(golem_status["core_id"]),
        "SIGIL %s / EFF N/A" % String(golem_status["rune_id"]),
        "P%d A%d M%d W%d" % [int(stats.get("power", 0)), int(stats.get("armor", 0)), int(stats.get("mobility", 0)), int(stats.get("work", 0))],
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

    grid.add_child(_e1_panel("SIGNAL / PRESENTATION", [
        "SIGNAL STRENGTH N/A",
        "MAG. NOISE N/A",
        "STATUS UNAVAILABLE",
    ]))
    content.add_child(grid)

    var log_lines: Array = []
    for row in model["log"]:
        log_lines.append(String(row["label"]))
    if log_lines.is_empty():
        log_lines.append("NO EXPEDITION EVENTS")
    content.add_child(_e1_panel("LOG / STRUCTURED EVENT STREAM", log_lines))

func _e1_panel(title_text: String, lines: Array) -> PanelContainer:
    var panel := PanelContainer.new()
    panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var box := VBoxContainer.new()
    var title := Label.new()
    title.text = title_text
    title.add_theme_font_size_override("font_size", 13)
    box.add_child(title)
    for line in lines:
        var label := Label.new()
        label.text = String(line)
        label.add_theme_font_size_override("font_size", 11)
        box.add_child(label)
    panel.add_child(box)
    return panel

func _region_changed(_index: int, selector: OptionButton) -> void:
    region_id = String(selector.get_item_metadata(selector.selected))
    _refresh()
func _golem_changed(_index: int, selector: OptionButton) -> void:
    golem_id = String(selector.get_item_metadata(selector.selected))
    _refresh()

func _deploy() -> void:
    var result := GameState.start_expedition(golem_id, region_id)
    if not result.get("ok", false):
        _notice(String(result.get("error", "DEPLOY BLOCKED")))

func _report() -> void:
    var runtime: Dictionary = GameState.expedition_runtime
    var report: Dictionary = runtime.get("report", {})
    if report.is_empty():
        return
    _heading("REPORT — %s | DAMAGE %d%% | CARGO %d" % [report["status"], report["total_damage"], runtime["cargo_capacity"]])
    var selected_indexes: Array = runtime.get("selected_loot_indexes", [])
    var claimed := bool(runtime.get("loot_claimed", true))
    for i in range(report.get("loots", []).size()):
        var loot: Dictionary = report["loots"][i]
        var check := CheckButton.new()
        check.text = "%s x%d | weight %d" % [loot["name"], loot["count"], loot["weight"]]
        check.button_pressed = selected_indexes.has(i)
        check.disabled = claimed
        check.toggled.connect(_loot_toggled.bind(i))
        content.add_child(check)
    if not report.get("loots", []).is_empty():
        var weight := Label.new()
        weight.text = "SELECTED WEIGHT %d / %d" % [GameState.expedition_selected_cargo_weight(), runtime["cargo_capacity"]]
        content.add_child(weight)
        var claim := Button.new()
        claim.text = "CONFIRM CARGO"
        claim.disabled = claimed
        claim.pressed.connect(_claim_cargo)
        content.add_child(claim)

func _loot_toggled(enabled: bool, index: int) -> void:
    var result := GameState.set_expedition_loot_selected(index, enabled)
    if not result.get("ok", false):
        _notice(String(result.get("error", "CARGO SELECTION FAILED")))
        _refresh()

func _claim_cargo() -> void:
    var result := GameState.claim_expedition_cargo()
    if result.get("ok", false):
        _notice("CARGO STORED")
    else:
        _notice(String(result.get("error", "CARGO CLAIM FAILED")))

func _golems() -> void:
    _heading("UNIT HANGAR — 3 UNIT LIMIT")
    for golem in GameState.golems:
        var label := Label.new()
        label.text = "%s%s | %s/%s/%s | DUR %d%% | P%d A%d M%d W%d" % ["★ " if String(golem["id"]) == GameState.active_golem_id else "", golem["name"], golem["body"], golem["core"], golem["rune"], golem["durability"], golem["stats"]["power"], golem["stats"]["armor"], golem["stats"]["mobility"], golem["stats"]["work"]]
        content.add_child(label)
        var row := HBoxContainer.new()
        var active := Button.new()
        active.text = "SET ACTIVE"
        active.pressed.connect(_set_active.bind(String(golem["id"])))
        row.add_child(active)
        var repair := Button.new()
        repair.text = "REPAIR +25 — 1 ACTION / SAME FRAME"
        repair.disabled = GameState.actions_left <= 0 or int(golem["durability"]) >= 100 or int(GameState.inventory["body"].get(String(golem["body"]), 0)) <= 0
        repair.pressed.connect(_repair.bind(String(golem["id"])))
        row.add_child(repair)
        if not bool(golem.get("is_starter", false)):
            var disassemble := Button.new()
            disassemble.text = "DISASSEMBLE — 0 ACTION"
            disassemble.pressed.connect(_disassemble.bind(String(golem["id"])))
            row.add_child(disassemble)
        content.add_child(row)

func _set_active(id: String) -> void:
    golem_id = id
    GameState.set_active_golem(id)
func _repair(id: String) -> void:
    var result := GameState.repair_golem(id)
    if not result.get("ok", false): _notice(String(result.get("error", "REPAIR BLOCKED")))
func _disassemble(id: String) -> void:
    var result := GameState.disassemble_golem(id)
    if not result.get("ok", false): _notice(String(result.get("error", "DISASSEMBLE BLOCKED")))
func _advance_day() -> void:
    var result := GameState.advance_day()
    if not result.get("ok", false): _notice("Spend all ACTION before advancing the day.")

func _show_inventory() -> void:
    var dialog := AcceptDialog.new()
    dialog.title = "INVENTORY"
    var lines: Array[String] = []
    for id in Catalog.BODY_ORDER: lines.append("FRAME %-6s %d" % [id, GameState.inventory["body"].get(id, 0)])
    for id in Catalog.CORE_ORDER: lines.append("REACTOR %-5s %d" % [id, GameState.inventory["core"].get(id, 0)])
    for id in Catalog.RUNE_ORDER: lines.append("SIGIL %-7s %d" % [id, GameState.inventory["rune"].get(id, 0)])
    dialog.dialog_text = "\n".join(lines)
    add_child(dialog)
    dialog.popup_centered(Vector2i(500, 400))
    dialog.confirmed.connect(dialog.queue_free)
    dialog.canceled.connect(dialog.queue_free)

func _notice(message: String) -> void:
    status.text = "%s | %s" % [status.text, message]
