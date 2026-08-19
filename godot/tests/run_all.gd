extends SceneTree

const Catalog = preload("res://domain/game_catalog.gd")
const Fabrication = preload("res://domain/fabrication.gd")
const BlueprintLibrary = preload("res://domain/blueprint_library.gd")

var failures: Array[String] = []
var checks := 0

func _init() -> void:
    _test_fabrication()
    _test_damage_consistency()
    _test_blueprint_behavioral_metrics()
    if failures.is_empty():
        print("GODOT-PORT: PASS — %d checks" % checks)
        quit(0)
    else:
        print("GODOT-PORT: FAIL — %d failures / %d checks" % [failures.size(), checks])
        for failure in failures:
            push_error(failure)
        quit(1)

func _check(condition: bool, message: String) -> void:
    checks += 1
    if not condition:
        failures.append(message)

func _fabrication_state() -> Dictionary:
    return {"inventory": Catalog.DEFAULT_INVENTORY.duplicate(true), "actions_left": 3, "units": [Catalog.make_golem("stone", "wind", "defense", "golem_starter", 1, true)], "max_units": 3}

func _test_fabrication() -> void:
    var success := Fabrication.fabricate(_fabrication_state(), {"body": "stone", "core": "fire", "rune": "attack"}, 100)
    _check(success.get("ok", false), "FAB-01 expected success")
    _check(int(success["state"]["actions_left"]) == 2, "FAB-01 action cost mismatch")
    _check(int(success["state"]["inventory"]["body"]["stone"]) == 2, "FAB-01 frame stock mismatch")
    var no_action := _fabrication_state()
    no_action["actions_left"] = 0
    _check(Fabrication.fabricate(no_action, {"body": "stone", "core": "fire", "rune": "attack"}, 101).get("reason", "") == "NO_ACTION", "FAB-02 no-action blocker")
    var full := _fabrication_state()
    full["units"] = [full["units"][0], {}, {}]
    _check(Fabrication.fabricate(full, {"body": "stone", "core": "fire", "rune": "attack"}, 102).get("reason", "") == "NO_FREE_UNIT_SLOT", "FAB-03 slot blocker")
    var missing := _fabrication_state()
    missing["inventory"]["body"]["stone"] = 0
    _check(Fabrication.fabricate(missing, {"body": "stone", "core": "fire", "rune": "attack"}, 103).get("reason", "") == "MISSING_FRAME", "FAB-04 frame blocker")
    var missing_core := _fabrication_state()
    missing_core["inventory"]["core"]["fire"] = 0
    _check(Fabrication.fabricate(missing_core, {"body": "stone", "core": "fire", "rune": "attack"}, 104).get("reason", "") == "MISSING_REACTOR", "FAB-05 reactor blocker")
    var missing_sigil := _fabrication_state()
    missing_sigil["inventory"]["rune"]["attack"] = 0
    _check(Fabrication.fabricate(missing_sigil, {"body": "stone", "core": "fire", "rune": "attack"}, 105).get("reason", "") == "MISSING_SIGIL", "FAB-06 sigil blocker")

func _test_damage_consistency() -> void:
    var durability_values: Array = []
    for value in range(5, 101, 5):
        durability_values.append(value)
    var cases := 0
    for body in Catalog.BODY_ORDER:
        for core in Catalog.CORE_ORDER:
            for rune in Catalog.RUNE_ORDER:
                for region in Catalog.REGION_ORDER:
                    for durability in durability_values:
                        var golem := Catalog.make_golem(body, core, rune, "audit", 1, false)
                        golem["durability"] = durability
                        var evaluation := Catalog.evaluate_expedition_damage(region, golem)
                        var prediction := Catalog.predict_expedition(region, golem)
                        var rng := RandomNumberGenerator.new()
                        rng.seed = cases + 1
                        var report := Catalog.run_expedition_simulation(region, golem, rng)
                        var expected_report_status := "FAILED" if ["BLOCKED", "FAILED"].has(String(evaluation.get("status", ""))) else String(evaluation.get("status", ""))
                        _check(evaluation.get("ok", false) and prediction.get("ok", false) and int(evaluation.get("total_damage", -1)) == int(prediction.get("total_damage", -2)) and String(evaluation.get("status", "")) == String(prediction.get("status", "?")), "DAMAGE prediction mismatch %s/%s/%s/%s/%d" % [body, core, rune, region, durability])
                        _check(report.get("ok", false) and int(report.get("total_damage", -3)) == int(evaluation.get("total_damage", -1)) and String(report.get("status", "?")) == expected_report_status, "DAMAGE resolution mismatch %s/%s/%s/%s/%d" % [body, core, rune, region, durability])
                        cases += 1
    _check(cases == 5120, "DAMAGE audit expected 5120 cases, got %d" % cases)

func _append(events: Array, event: Dictionary) -> Array:
    var result := BlueprintLibrary.append_event(events, event)
    _check(result.get("ok", false), "telemetry append failed: %s" % result.get("error", ""))
    return result.get("events", events)

func _test_blueprint_behavioral_metrics() -> void:
    var state := BlueprintLibrary.empty_state()
    var blueprint := {"blueprint_id": "bp-1", "part_ids": {"frame_id": "stone", "reactor_id": "fire", "control_sigil_id": "attack"}, "purpose_tag_ids": ["GENERAL"], "expedition_record_refs": []}
    var save := BlueprintLibrary.save_blueprint(state, blueprint, "CREATE")
    _check(save.get("ok", false), "R2-GATE legal save")
    var roundtrip := BlueprintLibrary.deserialize_library(BlueprintLibrary.serialize_library(save["state"]))
    _check(roundtrip.get("ok", false) and roundtrip["state"] == save["state"], "R2-GATE round trip")
    var invalid := blueprint.duplicate(true)
    invalid["part_ids"]["frame_id"] = "unknown"
    _check(not BlueprintLibrary.save_blueprint(state, invalid, "CREATE").get("ok", true), "R2-GATE invalid ref must fail closed")
    var bad_parts := blueprint.duplicate(true)
    bad_parts["part_ids"]["extra_state"] = "forbidden"
    _check(not BlueprintLibrary.deserialize_library(JSON.stringify({"version": 1, "blueprints": [bad_parts]})).get("ok", true), "R2-GATE extra part state must fail closed")
    var bad_tag := blueprint.duplicate(true)
    bad_tag["purpose_tag_ids"] = [7]
    _check(not BlueprintLibrary.deserialize_library(JSON.stringify({"version": 1, "blueprints": [bad_tag]})).get("ok", true), "R2-GATE non-string tag must fail closed")

    var events: Array = []
    for i in range(10):
        events = _append(events, {"type": "blueprint_save_opportunity", "opportunity_id": "save-%d" % i})
        if i < 3:
            events = _append(events, {"type": "blueprint_saved", "blueprint_id": "saved-%d" % i, "opportunity_id": "save-%d" % i})
    var metrics := BlueprintLibrary.calculate_metrics(events)
    _check(metrics.get("ok", false) and abs(float(metrics["metrics"]["save_rate"]) - 0.3) < 0.0001, "R2-BEH-01 save rate")

    var reuse_events: Array = []
    reuse_events = _append(reuse_events, {"type": "blueprint_save_opportunity", "opportunity_id": "s"})
    for i in range(40):
        reuse_events = _append(reuse_events, {"type": "redeploy_decision", "opportunity_id": "pre-%d" % i, "blueprint_available": true})
    reuse_events = _append(reuse_events, {"type": "blueprint_saved", "blueprint_id": "bp", "opportunity_id": "s"})
    for i in range(2):
        reuse_events = _append(reuse_events, {"type": "redeploy_decision", "opportunity_id": "post-%d" % i, "blueprint_available": true})
    reuse_events = _append(reuse_events, {"type": "blueprint_applied", "blueprint_id": "bp", "opportunity_index": 42})
    var reuse_metrics := BlueprintLibrary.calculate_metrics(reuse_events)
    _check(reuse_metrics.get("ok", false) and float(reuse_metrics["metrics"]["median_time_to_first_reuse"]) == 2.0, "R2-BEH-02 relative first reuse")

    var redeploy_events: Array = []
    for i in range(10):
        redeploy_events = _append(redeploy_events, {"type": "redeploy_decision", "opportunity_id": "r-%d" % i, "blueprint_available": true})
        redeploy_events = _append(redeploy_events, {"type": "expedition_started", "opportunity_id": "r-%d" % i, "source": "BLUEPRINT_DIRECT" if i < 5 else "MANUAL_NEW", "blueprint_id": "bp" if i < 5 else ""})
    var redeploy_metrics := BlueprintLibrary.calculate_metrics(redeploy_events)
    _check(redeploy_metrics.get("ok", false) and abs(float(redeploy_metrics["metrics"]["blueprint_redeploy_rate"]) - 0.5) < 0.0001, "R2-BEH-03 redeploy join")

    var duplicate_events: Array = []
    duplicate_events = _append(duplicate_events, {"type": "redeploy_decision", "opportunity_id": "dup", "blueprint_available": true})
    duplicate_events = _append(duplicate_events, {"type": "redeploy_decision", "opportunity_id": "dup", "blueprint_available": true})
    duplicate_events = _append(duplicate_events, {"type": "expedition_started", "opportunity_id": "dup", "source": "BLUEPRINT_DIRECT", "blueprint_id": "bp"})
    duplicate_events = _append(duplicate_events, {"type": "expedition_started", "opportunity_id": "dup", "source": "MANUAL_NEW", "blueprint_id": ""})
    var duplicate_metrics := BlueprintLibrary.calculate_metrics(duplicate_events)
    _check(duplicate_metrics.get("ok", false) and float(duplicate_metrics["metrics"]["blueprint_redeploy_rate"]) == 0.0, "R2-BEH-04 final decision wins")

    var invalid_metrics: Array = [{"type": "blueprint_modified", "blueprint_id": "bp"}, {"type": "blueprint_resaved", "blueprint_id": "bp"}, {"type": "blueprint_resaved", "blueprint_id": "bp"}]
    _check(not BlueprintLibrary.calculate_metrics(invalid_metrics).get("ok", true), "R2-BEH-05 metric invariant")
