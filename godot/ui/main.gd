extends Control

const Catalog = preload("res://domain/game_catalog.gd")
const Blueprints = preload("res://domain/blueprint_library.gd")

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
var pending_expedition: Dictionary = {}
var selected_loot: Array = []
var loot_claimed := true

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
    GameState.record_design_opportunity(_parts())
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
    save.text = "SAVE BLUEPRINT" if loaded_blueprint_id.is_empty() else "UPDATE BLUEPRINT"
    save.pressed.connect(_save_blueprint)
    actions.add_child(save)
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
    if enabled and not purpose_tags.has(tag):
        purpose_tags.append(tag)
    elif not enabled:
        purpose_tags.erase(tag)
    if purpose_tags.is_empty():
        purpose_tags.append("GENERAL")

func _save_blueprint() -> void:
    var result := GameState.save_blueprint(_parts(), purpose_tags, loaded_blueprint_id)
    if result.get("ok", false):
        loaded_blueprint_id = String(result["blueprint_id"])
        if blueprint_source == "MANUAL_NEW":
            blueprint_source = "BLUEPRINT_DIRECT"
        _notice("BLUEPRINT SAVED")
    else:
        _notice(String(result.get("error", "SAVE FAILED")))
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
    _heading("EXPEDITION — PREDICTION = RESOLUTION DAMAGE PATH")
    var row := HBoxContainer.new()
    row.add_child(_selector(Catalog.REGION_ORDER, Catalog.REGIONS, region_id, _region_changed))
    var unit_ids: Array = []
    var unit_catalog := {}
    for golem in GameState.golems:
        unit_ids.append(String(golem["id"]))
        unit_catalog[String(golem["id"])] = {"name": "%s | DUR %d%%" % [golem["name"], golem["durability"]]}
    if golem_id.is_empty() and not unit_ids.is_empty():
        golem_id = unit_ids[0]
    row.add_child(_selector(unit_ids, unit_catalog, golem_id, _golem_changed))
    content.add_child(row)
    var golem := GameState.get_golem(golem_id)
    if not golem.is_empty():
        var prediction := Catalog.predict_expedition(region_id, golem)
        var label := Label.new()
        label.text = "PREDICTION %s | DAMAGE %d%% | DURABILITY %d%%\nPOWER %d | ARMOR %d | MOBILITY %d | WORK %d" % [prediction.get("status_prediction", "?"), prediction.get("total_damage", 0), golem["durability"], golem["stats"]["power"], golem["stats"]["armor"], golem["stats"]["mobility"], golem["stats"]["work"]]
        content.add_child(label)
        var deploy := Button.new()
        deploy.text = "DEPLOY — 1 ACTION"
        deploy.disabled = GameState.actions_left <= 0 or prediction.get("status", "") == "BLOCKED" or (not pending_expedition.is_empty() and not loot_claimed)
        deploy.pressed.connect(_deploy)
        content.add_child(deploy)
    if not pending_expedition.is_empty():
        _report()

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
        return
    pending_expedition = result
    selected_loot = []
    loot_claimed = result["report"].get("loots", []).is_empty()
    _refresh()

func _report() -> void:
    var report: Dictionary = pending_expedition["report"]
    _heading("REPORT — %s | DAMAGE %d%% | CARGO %d" % [report["status"], report["total_damage"], pending_expedition["cargo_capacity"]])
    for i in range(report.get("loots", []).size()):
        var loot: Dictionary = report["loots"][i]
        var check := CheckButton.new()
        check.text = "%s x%d | weight %d" % [loot["name"], loot["count"], loot["weight"]]
        check.button_pressed = selected_loot.has(i)
        check.disabled = loot_claimed
        check.toggled.connect(_loot_toggled.bind(i))
        content.add_child(check)
    if not report.get("loots", []).is_empty():
        var weight := Label.new()
        weight.text = "SELECTED WEIGHT %d / %d" % [_cargo_weight(), pending_expedition["cargo_capacity"]]
        content.add_child(weight)
        var claim := Button.new()
        claim.text = "CONFIRM CARGO"
        claim.disabled = loot_claimed
        claim.pressed.connect(_claim_cargo)
        content.add_child(claim)

func _loot_toggled(enabled: bool, index: int) -> void:
    if enabled and not selected_loot.has(index):
        selected_loot.append(index)
        if _cargo_weight() > int(pending_expedition["cargo_capacity"]):
            selected_loot.erase(index)
            _notice("CARGO CAPACITY EXCEEDED")
    elif not enabled:
        selected_loot.erase(index)
    _refresh()

func _cargo_weight() -> int:
    var total := 0
    if pending_expedition.is_empty():
        return total
    var loots: Array = pending_expedition["report"].get("loots", [])
    for i in selected_loot:
        total += int(loots[int(i)]["weight"])
    return total

func _claim_cargo() -> void:
    var chosen: Array = []
    var loots: Array = pending_expedition["report"].get("loots", [])
    for i in selected_loot:
        chosen.append(loots[int(i)])
    loot_claimed = true
    GameState.add_loot(chosen)
    _notice("CARGO STORED")

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
