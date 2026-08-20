extends SceneTree

const Catalog = preload("res://domain/game_catalog.gd")
const Fabrication = preload("res://domain/fabrication.gd")
const BlueprintLibrary = preload("res://domain/blueprint_library.gd")
const ExpeditionPresenter = preload("res://presentation/expedition_presenter.gd")
const D2Vectors = preload("res://tests/live_loop_d2_vectors.gd")
const LiveLoop = preload("res://domain/expedition_live_loop.gd")
const LiveLoopStore = preload("res://state/expedition_live_loop_store.gd")
const LiveLoopCommandPort = preload("res://state/expedition_live_loop_command_port.gd")
const LiveLoopPresenter = preload("res://presentation/expedition_live_loop_presenter.gd")
const LiveLoopControls = preload("res://ui/expedition_live_loop_controls.gd")

var failures: Array[String] = []
var checks := 0

func _init() -> void:
    _test_fabrication()
    _test_damage_consistency()
    _test_blueprint_behavioral_metrics()
    _test_presentation_determinism()
    _test_live_loop_d2_vectors()
    _test_live_loop_d2_migration_vectors()
    _test_live_loop_step_evaluator()
    _test_live_loop_duplicate_continue_is_exactly_once()
    _test_live_loop_return_is_exactly_once()
    _test_live_loop_transaction_validation_fails_closed()
    _test_live_loop_recovery_after_intent_crash()
    _test_live_loop_atomic_replacement_crashes()
    _test_live_loop_invalid_runtime_fails_closed()
    _test_live_loop_d2_migrations_execute()
    _test_live_loop_claim_and_telemetry_boundaries()
    _test_live_loop_claim_crash_retries()
    _test_live_loop_ui_mutation_guard()
    _test_live_loop_command_port_and_binding()
    _test_live_loop_d3_6_end_to_end_vectors()
    _test_live_loop_d3_6_persisted_full_cycle()
    _test_live_loop_d3_6_no_dual_runtime_entry()
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

func _test_presentation_determinism() -> void:
    var golem := Catalog.make_golem("stone", "wind", "defense", "golem-fixed", 123, false)
    golem["durability"] = 73
    var snapshot := {
        "day": 4,
        "actions_left": 2,
        "inventory": Catalog.DEFAULT_INVENTORY.duplicate(true),
        "golems": [golem],
        "active_golem_id": "golem-fixed",
        "expedition_runtime": {
            "golem_id": "golem-fixed",
            "region_id": "region_quarry",
            "cargo_capacity": 10,
            "selected_loot_indexes": [0],
            "loot_claimed": false,
            "report": {
                "region_id": "region_quarry",
                "status": "SUCCESS",
                "total_damage": 27,
                "loots": [{"category": "body", "id": "stone", "name": "石材", "count": 2, "weight": 6}],
                "logs": ["THIS PREFORMATTED TEXT MUST BE IGNORED"],
                "events": [
                    {"step": 1, "type": "entry", "damage": 0, "has_resist_key": true},
                    {"step": 2, "type": "hazard", "damage": 0},
                    {"step": 3, "type": "encounter", "damage": 27},
                    {"step": 4, "type": "loot", "item_count": 1},
                    {"step": 5, "type": "result", "status": "SUCCESS", "total_damage": 27},
                ],
            },
        },
    }
    var before := snapshot.duplicate(true)
    var first := ExpeditionPresenter.build(snapshot)
    var second := ExpeditionPresenter.build(snapshot)
    _check(first == second, "E1-DATA-06 Variant output must be deterministic")
    _check(JSON.stringify(first) == JSON.stringify(second), "E1-DATA-06 serialized output must be deterministic")
    _check(snapshot == before, "E1-DATA-04 presenter must not mutate source snapshot")
    _check(first["stability"]["basis"] == "DURABILITY_PROXY" and int(first["stability"]["index"]) == 73, "E1-DATA-07 stability proxy basis")
    _check(first["damage"]["joint_load"] == null and first["route"]["depth"] == null and first["signal"]["strength"] == null, "E1-DATA-07 unavailable concepts must remain null")
    _check(int(first["cargo"]["selected_weight"]) == 6, "E1-DATA-01 cargo must derive from snapshot")
    var rendered_log := JSON.stringify(first["log"])
    _check(not rendered_log.contains("THIS PREFORMATTED TEXT MUST BE IGNORED"), "E1-DATA-05 presenter must ignore preformatted log text")
    for event in snapshot["expedition_runtime"]["report"]["events"]:
        _check(not event.has("title") and not event.has("message"), "E1-DATA-05 structured event contains presentation text")

func _test_live_loop_d2_vectors() -> void:
    var file := FileAccess.open("res://tests/fixtures/live_loop_d2_damage_vectors.tsv", FileAccess.READ)
    _check(file != null, "D2-VECTOR golden file must exist")
    if file == null:
        return
    var raw_lines := file.get_as_text().split("\n", false)
    file.close()
    var expected := D2Vectors.build_all()
    _check(raw_lines.size() == 5121, "D2-VECTOR expected one header plus 5120 golden rows, got %d" % raw_lines.size())
    _check(expected.size() == 5120, "D2-VECTOR generator expected 5120 rows, got %d" % expected.size())
    var expected_lines := D2Vectors.to_tsv(expected).split("\n", false)
    _check(raw_lines[0] == expected_lines[0], "D2-VECTOR header mismatch")
    var seen := {}
    for i in range(mini(raw_lines.size() - 1, expected.size())):
        _check(raw_lines[i + 1] == expected_lines[i + 1], "D2-VECTOR mismatch at row %d / %s" % [i, expected[i].get("vector_id", "unknown")])
        seen[String(expected[i]["vector_id"])] = true
    _check(seen.size() == 5120, "D2-VECTOR IDs must be unique")
    var first_serialized := D2Vectors.to_tsv(expected)
    var second_serialized := D2Vectors.to_tsv(D2Vectors.build_all())
    _check(first_serialized == second_serialized, "D2-VECTOR generation must be byte deterministic")

func _test_live_loop_d2_migration_vectors() -> void:
    var file := FileAccess.open("res://tests/fixtures/live_loop_d2_migration_vectors.json", FileAccess.READ)
    _check(file != null, "D2-MIGRATION fixture must exist")
    if file == null:
        return
    var parsed: Variant = JSON.parse_string(file.get_as_text())
    file.close()
    _check(typeof(parsed) == TYPE_DICTIONARY, "D2-MIGRATION fixture must parse")
    if typeof(parsed) != TYPE_DICTIONARY:
        return
    var fixture: Dictionary = parsed
    _check(String(fixture.get("schema", "")) == "live-loop-d2-migration-vector-v1", "D2-MIGRATION schema")
    _check(int(fixture.get("target_save_version", -1)) == 3, "D2-MIGRATION target save version")
    var cases: Array = fixture.get("cases", [])
    _check(cases.size() == 5, "D2-MIGRATION expected five boundary cases")
    var ids := {}
    for raw_case in cases:
        var migration_case: Dictionary = raw_case
        ids[String(migration_case.get("case_id", ""))] = true
    for required in ["legacy-v2-ready", "v3-decision-resume", "v3-in-progress-recover", "v3-returned-pending-cargo", "v3-destroyed-no-cargo"]:
        _check(ids.has(required), "D2-MIGRATION missing %s" % required)

func _test_live_loop_step_evaluator() -> void:
    var vectors := D2Vectors.build_all()
    for vector in vectors:
        var input: Dictionary = vector["input"]
        var golem := Catalog.make_golem(String(input["frame_id"]), String(input["reactor_id"]), String(input["control_sigil_id"]), "d3-unit", 0, false)
        golem["durability"] = int(input["starting_durability"])
        var evaluation := Catalog.evaluate_expedition_damage(String(input["region_id"]), golem)
        if not bool(vector["legacy"]["has_access_key"]):
            _check(LiveLoop.build_damage_plan(evaluation, int(input["starting_durability"])).get("error", "") == "ACCESS_BLOCKED", "D3-STEP blocked vector %s" % vector["vector_id"])
            continue
        var plan := LiveLoop.build_damage_plan(evaluation, int(input["starting_durability"]))
        _check(plan.get("ok", false), "D3-STEP plan %s" % vector["vector_id"])
        _check(plan.get("components", []) == vector["legacy"]["components"] and plan.get("prefixes", []) == vector["legacy"]["prefixes"], "D3-STEP component/prefix %s" % vector["vector_id"])
        var expected_steps: Array = vector["steps"]
        for i in range(expected_steps.size()):
            var projection := LiveLoop.project_step(plan, i)
            var expected: Dictionary = expected_steps[i]
            if bool(expected["reachable"]):
                _check(projection.get("ok", false) and String(projection["step_id"]) == String(expected["step_id"]) and int(projection["step_damage"]) == int(expected["step_damage"]) and int(projection["prefix_before"]) == int(expected["prefix_before"]) and int(projection["prefix_after"]) == int(expected["prefix_after"]) and int(projection["durability_before"]) == int(expected["durability_before"]) and int(projection["durability_after"]) == int(expected["durability_after"]) and bool(projection["destroys"]) == bool(expected["destroys"]), "D3-STEP projection %s/%s" % [vector["vector_id"], expected["step_id"]])
            else:
                _check(projection.get("error", "") == "STEP_UNREACHABLE", "D3-STEP unreachable %s/%s" % [vector["vector_id"], expected["step_id"]])

func _test_live_loop_duplicate_continue_is_exactly_once() -> void:
    var coverage := {"DECISION": false, "ENTRY_DESTROYED": false, "HAZARD_DESTROYED": false, "ENCOUNTER_DESTROYED": false, "RETURNED": false}
    for vector in D2Vectors.build_all():
        if not bool(vector["legacy"]["has_access_key"]):
            continue
        var input: Dictionary = vector["input"]
        var golem := Catalog.make_golem(String(input["frame_id"]), String(input["reactor_id"]), String(input["control_sigil_id"]), "d3-unit", 0, false)
        golem["durability"] = int(input["starting_durability"])
        var plan := LiveLoop.build_damage_plan(Catalog.evaluate_expedition_damage(String(input["region_id"]), golem), int(input["starting_durability"]))
        for step_index in range(plan["steps"].size()):
            var projection := LiveLoop.project_step(plan, step_index)
            if not projection.get("ok", false):
                continue
            var case_id := "%s/%s" % [vector["vector_id"], projection["step_id"]]
            projection["cargo_delta"] = [{"item_id": "cargo-%s" % case_id, "kind": "crystal", "count": 1}]
            var state := {
                "unit": {"id": "unit-1", "durability": projection["durability_before"]},
                "runtime": {"phase": "DECISION", "expedition_id": "expedition-1", "decision_id": "decision-1", "unit_id": "unit-1", "next_step_index": step_index, "durability": projection["durability_before"], "pending_cargo": [], "step_results": [], "command_results": {}},
                "inventory": {"crystal": 7},
                "events": [],
                "telemetry": [],
            }
            var command := {"type": "CONTINUE", "expedition_id": "expedition-1", "decision_id": "decision-1", "command_id": "command-%s" % case_id, "next_decision_id": "decision-2"}
            var first := LiveLoop.apply_continue(state, command, projection)
            _check(first.get("ok", false) and not first.get("duplicate", true), "D3.2-IDEM first applies %s" % case_id)
            var committed: Dictionary = first.get("state", {})
            var before_duplicate := committed.duplicate(true)
            var second := LiveLoop.apply_continue(committed, command, projection)
            _check(second.get("ok", false) and second.get("duplicate", false), "D3.2-IDEM duplicate recognized %s" % case_id)
            _check(second.get("result", {}) == first.get("result", {}), "D3.2-IDEM recorded result %s" % case_id)
            _check(second.get("state", {}) == before_duplicate, "D3.2-IDEM complete state unchanged %s" % case_id)
            _check(int(second["state"]["unit"]["durability"]) == int(projection["durability_after"]), "D3.2-IDEM durability once %s" % case_id)
            var expected_cargo_count := 0 if bool(projection["destroys"]) else 1
            _check(second["state"]["runtime"]["pending_cargo"].size() == expected_cargo_count and second["state"]["inventory"] == state["inventory"], "D3.2-IDEM cargo boundary %s" % case_id)
            _check(second["state"]["events"].size() == 2 and second["state"]["telemetry"].is_empty(), "D3.2-IDEM events/telemetry once %s" % case_id)
            var expected_phase := String(projection["terminal_status"])
            _check(String(second["state"]["runtime"]["phase"]) == expected_phase and (expected_phase != "DECISION" or int(second["state"]["runtime"]["next_step_index"]) == step_index + 1), "D3.2-IDEM transition %s" % case_id)
            var terminal := String(projection["terminal_status"])
            if terminal == "DESTROYED":
                coverage["%s_DESTROYED" % projection["step_id"]] = true
            else:
                coverage[terminal] = true
    for required in coverage:
        _check(bool(coverage[required]), "D3.2-IDEM coverage %s" % required)

func _test_live_loop_return_is_exactly_once() -> void:
    var step_coverage := {"ENTRY": false, "HAZARD": false, "ENCOUNTER": false, "RECOVERY": false}
    var decision_count := 0
    for vector in D2Vectors.build_all():
        if not bool(vector["legacy"]["has_access_key"]):
            continue
        var input: Dictionary = vector["input"]
        var golem := Catalog.make_golem(String(input["frame_id"]), String(input["reactor_id"]), String(input["control_sigil_id"]), "d3-unit", 0, false)
        golem["durability"] = int(input["starting_durability"])
        var plan := LiveLoop.build_damage_plan(Catalog.evaluate_expedition_damage(String(input["region_id"]), golem), int(input["starting_durability"]))
        for step_index in range(plan["steps"].size()):
            var projection := LiveLoop.project_step(plan, step_index)
            if not projection.get("ok", false):
                continue
            decision_count += 1
            step_coverage[String(projection["step_id"])] = true
            var case_id := "%s/%s" % [vector["vector_id"], projection["step_id"]]
            var state := {
                "unit": {"id": "unit-1", "durability": projection["durability_before"]},
                "runtime": {"phase": "DECISION", "expedition_id": "expedition-1", "decision_id": "decision-1", "unit_id": "unit-1", "next_step_index": step_index, "durability": projection["durability_before"], "pending_cargo": [{"item_id": "existing-%s" % case_id, "count": 1}], "step_results": [], "command_results": {}},
                "inventory": {"crystal": 7},
                "events": [],
                "telemetry": [],
            }
            var command := {"type": "RETURN", "expedition_id": "expedition-1", "decision_id": "decision-1", "command_id": "return-%s" % case_id}
            var first := LiveLoop.apply_return(state, command)
            _check(first.get("ok", false) and not first.get("duplicate", true), "D3.2-RETURN first applies %s" % case_id)
            var committed: Dictionary = first.get("state", {})
            var before_duplicate := committed.duplicate(true)
            var second := LiveLoop.apply_return(committed, command)
            _check(second.get("ok", false) and second.get("duplicate", false), "D3.2-RETURN duplicate recognized %s" % case_id)
            _check(second.get("result", {}) == first.get("result", {}), "D3.2-RETURN recorded result %s" % case_id)
            _check(second.get("state", {}) == before_duplicate, "D3.2-RETURN complete state unchanged %s" % case_id)
            _check(String(second["state"]["runtime"]["phase"]) == "RETURNED" and String(second["state"]["runtime"]["return_reason"]) == "PLAYER_RETURN" and int(second["state"]["runtime"]["deepest_completed_step"]) == step_index - 1, "D3.2-RETURN transition %s" % case_id)
            _check(int(second["state"]["unit"]["durability"]) == int(state["unit"]["durability"]) and second["state"]["runtime"]["pending_cargo"] == state["runtime"]["pending_cargo"], "D3.2-RETURN durability/cargo unchanged %s" % case_id)
            _check(second["state"]["events"].size() == 2 and second["state"]["telemetry"].is_empty() and second["state"]["inventory"] == state["inventory"], "D3.2-RETURN side effects once %s" % case_id)
    _check(decision_count == 10368, "D3.2-RETURN all reachable D2 decisions")
    for required in step_coverage:
        _check(bool(step_coverage[required]), "D3.2-RETURN coverage %s" % required)

func _test_live_loop_transaction_validation_fails_closed() -> void:
    var state := {"unit": {"id": "unit-1", "durability": 100}, "runtime": {"phase": "DECISION", "expedition_id": "expedition-1", "decision_id": "decision-1", "unit_id": "unit-1", "next_step_index": 0, "pending_cargo": [], "command_results": {}}, "inventory": {}, "events": [], "telemetry": []}
    var projection := {"ok": true, "step_index": 0, "step_id": "ENTRY", "durability_after": 90, "destroys": false, "terminal_status": "DECISION", "cargo_delta": []}
    var valid := {"expedition_id": "expedition-1", "decision_id": "decision-1", "command_id": "command-1", "next_decision_id": "decision-2"}
    var cases := [
        ["COMMAND_ID_REQUIRED", {"expedition_id": "expedition-1", "decision_id": "decision-1"}],
        ["EXPEDITION_ID_MISMATCH", {"expedition_id": "other", "decision_id": "decision-1", "command_id": "command-1"}],
        ["DECISION_ID_MISMATCH", {"expedition_id": "expedition-1", "decision_id": "stale", "command_id": "command-1"}],
    ]
    for item in cases:
        var continue_result := LiveLoop.apply_continue(state, item[1], projection)
        _check(continue_result.get("error", "") == item[0] and continue_result.get("state", {}) == state, "D3.2-VALIDATE CONTINUE %s" % item[0])
        var return_result := LiveLoop.apply_return(state, item[1])
        _check(return_result.get("error", "") == item[0] and return_result.get("state", {}) == state, "D3.2-VALIDATE RETURN %s" % item[0])
    var wrong_phase := state.duplicate(true)
    wrong_phase["runtime"]["phase"] = "RETURNED"
    _check(LiveLoop.apply_continue(wrong_phase, valid, projection).get("error", "") == "PHASE_INVALID", "D3.2-VALIDATE CONTINUE phase")
    _check(LiveLoop.apply_return(wrong_phase, valid).get("error", "") == "PHASE_INVALID", "D3.2-VALIDATE RETURN phase")
    var wrong_unit := state.duplicate(true)
    wrong_unit["unit"]["id"] = "other"
    _check(LiveLoop.apply_continue(wrong_unit, valid, projection).get("error", "") == "UNIT_LOCK_MISMATCH", "D3.2-VALIDATE CONTINUE unit lock")
    _check(LiveLoop.apply_return(wrong_unit, valid).get("error", "") == "UNIT_LOCK_MISMATCH", "D3.2-VALIDATE RETURN unit lock")
    var wrong_step := projection.duplicate(true)
    wrong_step["step_index"] = 1
    _check(LiveLoop.apply_continue(state, valid, wrong_step).get("error", "") == "STEP_PROJECTION_INVALID", "D3.2-VALIDATE CONTINUE step identity")

func _test_live_loop_recovery_after_intent_crash() -> void:
    var path := "user://live-loop-d3-intent-crash-test.json"
    var absolute := ProjectSettings.globalize_path(path)
    var survived_path := "%s.survived" % path
    var survived_absolute := ProjectSettings.globalize_path(survived_path)
    for suffix in ["", ".bak", ".tmp"]:
        if FileAccess.file_exists("%s%s" % [absolute, suffix]):
            DirAccess.remove_absolute("%s%s" % [absolute, suffix])
    if FileAccess.file_exists(survived_absolute):
        DirAccess.remove_absolute(survived_absolute)
    var args := PackedStringArray(["--headless", "--path", ProjectSettings.globalize_path("res://"), "--script", "res://tests/live_loop_d3_crash_probe.gd", "--", "intent", path, survived_path])
    var output: Array = []
    var exit_code := OS.execute(OS.get_executable_path(), args, output, true)
    _check(exit_code != 4 and not FileAccess.file_exists(survived_absolute), "D3.3-CRASH child cannot execute after forced termination")
    var raw := LiveLoopStore._read_valid(path)
    _check(raw.get("ok", false) and String(raw["state"]["runtime"]["phase"]) == "IN_PROGRESS", "D3.3-CRASH persisted step-2 intent survives")
    var recovered := LiveLoopStore.load_and_recover(path)
    _check(recovered.get("ok", false) and recovered.get("recovered", false), "D3.3-CRASH reload recovers pending command")
    var state: Dictionary = recovered.get("state", {})
    _check(String(state["runtime"]["phase"]) == "DECISION" and String(state["runtime"]["decision_id"]) == "decision-2" and int(state["runtime"]["next_step_index"]) == 1, "D3.3-CRASH recovery commits exact next decision")
    _check(int(state["unit"]["durability"]) == 88 and state["runtime"]["step_results"].size() == 1 and state["events"].size() == 2, "D3.3-CRASH damage and events apply once")
    var reloaded := LiveLoopStore.load_and_recover(path)
    var normalized_state: Variant = JSON.parse_string(JSON.stringify(state))
    _check(reloaded.get("ok", false) and not reloaded.get("recovered", true) and reloaded.get("state", {}) == normalized_state, "D3.3-CRASH committed reload does not reapply")
    for suffix in ["", ".bak", ".tmp"]:
        if FileAccess.file_exists("%s%s" % [absolute, suffix]):
            DirAccess.remove_absolute("%s%s" % [absolute, suffix])
    if FileAccess.file_exists(survived_absolute):
        DirAccess.remove_absolute(survived_absolute)

func _test_live_loop_atomic_replacement_crashes() -> void:
    for stage in ["AFTER_TEMP_FLUSH", "AFTER_BACKUP_RENAME", "AFTER_COMMIT_RENAME"]:
        var path := "user://live-loop-d3-replace-%s.json" % String(stage).to_lower()
        var absolute := ProjectSettings.globalize_path(path)
        var survived_path := "%s.survived" % path
        var survived_absolute := ProjectSettings.globalize_path(survived_path)
        for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute, survived_absolute]:
            if FileAccess.file_exists(target):
                DirAccess.remove_absolute(target)
        var args := PackedStringArray(["--headless", "--path", ProjectSettings.globalize_path("res://"), "--script", "res://tests/live_loop_d3_crash_probe.gd", "--", "replace", path, survived_path, stage])
        var output: Array = []
        var exit_code := OS.execute(OS.get_executable_path(), args, output, true)
        _check(exit_code != 4 and not FileAccess.file_exists(survived_absolute), "D3.3-REPLACE forced stop %s" % stage)
        var loaded := LiveLoopStore._read_valid(path)
        _check(loaded.get("ok", false), "D3.3-REPLACE valid checkpoint survives %s" % stage)
        var expedition_id := String(loaded.get("state", {}).get("runtime", {}).get("expedition_id", ""))
        var expected := "replacement" if stage == "AFTER_COMMIT_RENAME" else "baseline"
        _check(expedition_id == expected, "D3.3-REPLACE correct durable generation %s" % stage)
        if stage != "AFTER_TEMP_FLUSH":
            _check(FileAccess.file_exists("%s.bak" % absolute), "D3.3-REPLACE prior checkpoint retained %s" % stage)
        for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute, survived_absolute]:
            if FileAccess.file_exists(target):
                DirAccess.remove_absolute(target)

func _test_live_loop_invalid_runtime_fails_closed() -> void:
    var path := "user://live-loop-d3-invalid.json"
    var absolute := ProjectSettings.globalize_path(path)
    var invalid_states := [
        {"unit": {}, "runtime": {"phase": "UNKNOWN"}},
        {"unit": {"id": "unit-1"}, "runtime": {"phase": "DECISION", "expedition_id": "exp-1", "unit_id": "unit-1"}},
        {"unit": {"id": "unit-other"}, "runtime": {"phase": "RETURNED", "expedition_id": "exp-1", "unit_id": "unit-1"}},
        {"unit": {"id": "unit-1", "durability": 0}, "runtime": {"phase": "IN_PROGRESS", "expedition_id": "exp-1", "unit_id": "unit-1"}},
        {"unit": {"id": "unit-1", "durability": 1}, "runtime": {"phase": "DESTROYED", "expedition_id": "exp-1", "unit_id": "unit-1", "pending_cargo": []}},
        {"unit": {"id": "unit-1", "durability": 0}, "runtime": {"phase": "DESTROYED", "expedition_id": "exp-1", "unit_id": "unit-1", "pending_cargo": [{"item_id": "forbidden"}]}},
    ]
    for i in range(invalid_states.size()):
        var file := FileAccess.open(path, FileAccess.WRITE)
        file.store_string(JSON.stringify({"schema": LiveLoopStore.SCHEMA, "state": invalid_states[i]}))
        file.flush()
        file = null
        var loaded := LiveLoopStore.load_and_recover(path)
        _check(not loaded.get("ok", true), "D3.3-INVALID state %d fails closed" % i)
    var malformed := FileAccess.open(path, FileAccess.WRITE)
    malformed.store_string("{not-json")
    malformed.flush()
    malformed = null
    _check(LiveLoopStore.load_and_recover(path).get("error", "") == "NO_VALID_RUNTIME", "D3.3-INVALID malformed JSON fails closed")
    if FileAccess.file_exists(absolute):
        DirAccess.remove_absolute(absolute)

func _test_live_loop_d2_migrations_execute() -> void:
    var file := FileAccess.open("res://tests/fixtures/live_loop_d2_migration_vectors.json", FileAccess.READ)
    var fixture: Dictionary = JSON.parse_string(file.get_as_text())
    for migration_case in fixture["cases"]:
        var result := LiveLoopStore.migrate_save(migration_case["input"])
        _check(result.get("ok", false), "D3.3-MIGRATION applies %s" % migration_case["case_id"])
        for key in migration_case["expected"]:
            _check(result.get(key, null) == migration_case["expected"][key], "D3.3-MIGRATION %s/%s" % [migration_case["case_id"], key])
    _check(LiveLoopStore.migrate_save({"save_version": 1}).get("error", "") == "SAVE_VERSION_UNSUPPORTED", "D3.3-MIGRATION unsupported version fails closed")

func _test_live_loop_claim_and_telemetry_boundaries() -> void:
    var catalog := {"crystal": {"weight": 1}, "ore": {"weight": 2}}
    var state := {
        "unit": {"id": "unit-claim", "durability": 80},
        "runtime": {"phase": "RETURNED", "expedition_id": "expedition-claim", "unit_id": "unit-claim", "pending_cargo": [{"item_id": "cargo-crystal", "catalog_id": "crystal", "quantity": 4}, {"item_id": "cargo-ore", "catalog_id": "ore", "quantity": 2}], "claim_state": "OPEN", "claim_results": {}},
        "inventory": {"crystal": 5, "ore": 1},
        "events": [{"event_id": "expedition-claim:return:return_selected", "type": "return_selected"}, {"event_id": "expedition-claim:return:expedition_returned", "type": "expedition_returned"}],
        "durable_telemetry": [],
    }
    _check(state["inventory"] == {"crystal": 5, "ore": 1}, "D3.4-G1 RETURNED inventory unchanged")
    var command := {"expedition_id": "expedition-claim", "command_id": "claim-1"}
    var selection := [{"item_id": "cargo-crystal", "quantity": 1}, {"item_id": "cargo-crystal", "quantity": 2}, {"item_id": "cargo-ore", "quantity": 1}]
    var first := LiveLoop.apply_claim(state, command, selection, catalog, 5)
    _check(first.get("ok", false) and not first.get("duplicate", true), "D3.4-G2 valid claim commits")
    var committed: Dictionary = first["state"]
    _check(committed["inventory"] == {"crystal": 8, "ore": 2} and committed["runtime"]["pending_cargo"].is_empty(), "D3.4-G2 selected cargo transfers once")
    _check(committed["runtime"]["discarded_cargo"] == [{"item_id": "cargo-crystal", "catalog_id": "crystal", "quantity": 1}, {"item_id": "cargo-ore", "catalog_id": "ore", "quantity": 1}], "D3.4-G2 unselected cargo closes outside inventory")
    var duplicate := LiveLoop.apply_claim(committed, command, selection, catalog, 5)
    _check(duplicate.get("ok", false) and duplicate.get("duplicate", false) and duplicate["result"] == first["result"] and duplicate["state"] == committed, "D3.4-G4 duplicate claim is exact no-op")
    var invalid_cases := [
        [[{"item_id": "missing", "quantity": 1}], catalog, 5, "CLAIM_ITEM_NOT_PENDING"],
        [[{"item_id": "cargo-crystal", "quantity": 5}], catalog, 5, "CLAIM_QUANTITY_EXCEEDED"],
        [[{"item_id": "cargo-ore", "quantity": 2}], catalog, 3, "CLAIM_CAPACITY_EXCEEDED"],
        [[{"item_id": "cargo-crystal", "quantity": 0}], catalog, 5, "CLAIM_SELECTION_INVALID"],
        [[{"item_id": "cargo-crystal", "quantity": 1.5}], catalog, 5, "CLAIM_SELECTION_INVALID"],
        [[{"item_id": "cargo-crystal", "quantity": 1}], {"ore": {"weight": 2}}, 5, "CLAIM_ITEM_NOT_CATALOGED"],
    ]
    for invalid in invalid_cases:
        var result := LiveLoop.apply_claim(state, {"expedition_id": "expedition-claim", "command_id": "invalid-%s" % invalid[3]}, invalid[0], invalid[1], invalid[2])
        _check(result.get("error", "") == invalid[3] and result.get("state", {}) == state, "D3.4-G3 fail closed %s" % invalid[3])
    _check(committed["durable_telemetry"].size() == 3, "D3.4-G7 domain events reach durable telemetry")
    _check(LiveLoop.commit_telemetry(committed) == committed, "D3.4-G8 telemetry identities do not duplicate")
    var failed_export := LiveLoop.export_telemetry(committed, func(_events: Array) -> bool: return false)
    _check(not failed_export.get("ok", true) and failed_export["state"] == committed, "D3.4-G9 telemetry sink failure preserves canonical state")

func _test_live_loop_claim_crash_retries() -> void:
    for stage in ["BEFORE_CANONICAL_COMMIT", "AFTER_CANONICAL_COMMIT_BEFORE_ACK"]:
        var path := "user://live-loop-d3-claim-%s.json" % String(stage).to_lower()
        var absolute := ProjectSettings.globalize_path(path)
        var survived_path := "%s.survived" % path
        var survived_absolute := ProjectSettings.globalize_path(survived_path)
        for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute, survived_absolute]:
            if FileAccess.file_exists(target):
                DirAccess.remove_absolute(target)
        var args := PackedStringArray(["--headless", "--path", ProjectSettings.globalize_path("res://"), "--script", "res://tests/live_loop_d3_crash_probe.gd", "--", "claim", path, survived_path, stage])
        var output: Array = []
        var exit_code := OS.execute(OS.get_executable_path(), args, output, true)
        _check(exit_code != 4 and not FileAccess.file_exists(survived_absolute), "D3.4-CRASH forced stop %s" % stage)
        var loaded := LiveLoopStore.load_and_recover(path)
        _check(loaded.get("ok", false), "D3.4-CRASH canonical generation readable %s" % stage)
        var state: Dictionary = loaded.get("state", {})
        var command := {"expedition_id": "expedition-claim", "command_id": "claim-command-1"}
        var retry := LiveLoopStore.commit_claim(path, state, command, [{"item_id": "cargo-1", "quantity": 2}], {"crystal": {"weight": 1}}, 4)
        _check(retry.get("ok", false), "D3.4-CRASH retry succeeds %s" % stage)
        _check(int(retry["state"]["inventory"]["crystal"]) == 7 and retry["state"]["runtime"]["pending_cargo"].is_empty(), "D3.4-G5/G6 cargo credited exactly once %s" % stage)
        var expected_duplicate: bool = stage == "AFTER_CANONICAL_COMMIT_BEFORE_ACK"
        _check(bool(retry.get("duplicate", false)) == expected_duplicate, "D3.4-CRASH retry disposition %s" % stage)
        var final_reload := LiveLoopStore.load_and_recover(path)
        _check(final_reload.get("ok", false) and int(final_reload["state"]["inventory"]["crystal"]) == 7 and final_reload["state"]["runtime"]["pending_cargo"].is_empty(), "D3.4-G6 reload cannot restore claimable cargo %s" % stage)
        for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute, survived_absolute]:
            if FileAccess.file_exists(target):
                DirAccess.remove_absolute(target)

func _test_live_loop_ui_mutation_guard() -> void:
    var assignment_guard := RegEx.new()
    assignment_guard.compile("GameState\\.[A-Za-z_][A-Za-z0-9_]*(?:\\[[^\\n]+\\])?\\s*=(?!=)")
    for path in ["res://ui/main.gd", "res://ui/main_e1.gd", "res://ui/expedition_live_loop_controls.gd"]:
        var file := FileAccess.open(path, FileAccess.READ)
        var source := file.get_as_text()
        _check(assignment_guard.search(source) == null, "D3.5-GUARD no direct GameState field mutation %s" % path)
    var controls_file := FileAccess.open("res://ui/expedition_live_loop_controls.gd", FileAccess.READ)
    var controls_source := controls_file.get_as_text()
    _check(not controls_source.contains("res://domain/") and not controls_source.contains("res://state/"), "D3.5-GUARD UI imports no domain/state implementation")
    _check(controls_source.contains("_command_port.continue_current()") and controls_source.contains("_command_port.return_current()") and controls_source.contains("_command_port.claim(selection)"), "D3.5-GUARD all actions use frozen command port")
    _check(not controls_source.contains("pending_cargo\"] =") and not controls_source.contains("inventory\"] =") and not controls_source.contains("durability\"] ="), "D3.5-GUARD UI owns no canonical mutation")

func _test_live_loop_command_port_and_binding() -> void:
    var plan := LiveLoop.build_damage_plan({"ok": true, "status": "SUCCESS", "failure_stage": "", "resist_damage": 12, "mobility_damage": 8, "encounter_damage": 5, "total_damage": 25}, 100)
    var base_state := {"unit": {"id": "unit-ui", "durability": 100}, "runtime": {"phase": "DECISION", "expedition_id": "expedition-ui", "decision_id": "decision-1", "unit_id": "unit-ui", "next_step_index": 0, "durability": 100, "pending_cargo": [{"item_id": "cargo-ui", "catalog_id": "crystal", "quantity": 1}], "step_results": [], "command_results": {}, "claim_results": {}, "claim_state": "OPEN", "damage_plan": plan}, "inventory": {"crystal": 0}, "events": [], "durable_telemetry": []}
    var ids := [0]
    var identity_provider := func(prefix: String) -> String:
        ids[0] = int(ids[0]) + 1
        return "%s-%d" % [prefix, ids[0]]
    var continue_path := "user://live-loop-d3-ui-continue.json"
    var continue_port := LiveLoopCommandPort.new(continue_path, base_state, {"crystal": {"weight": 1}}, 2, identity_provider)
    var continued := continue_port.continue_current()
    _check(continued.get("ok", false) and int(continue_port.snapshot()["unit"]["durability"]) == 88 and int(continue_port.snapshot()["runtime"]["next_step_index"]) == 1 and continue_port.snapshot()["durable_telemetry"].size() == 2, "D3.5-BIND CONTINUE uses command port transaction")
    var return_path := "user://live-loop-d3-ui-return.json"
    var return_port := LiveLoopCommandPort.new(return_path, base_state, {"crystal": {"weight": 1}}, 2, identity_provider)
    var returned := return_port.return_current()
    _check(returned.get("ok", false) and String(return_port.snapshot()["runtime"]["phase"]) == "RETURNED" and int(return_port.snapshot()["inventory"]["crystal"]) == 0 and return_port.snapshot()["durable_telemetry"].size() == 2, "D3.5-BIND RETURN exposes pending cargo without transfer")
    var model := LiveLoopPresenter.build(return_port.snapshot())
    _check(model["can_claim"] and not model["can_continue"] and not model["can_return"], "D3.5-BIND presenter derives command availability")
    var controls := LiveLoopControls.new()
    controls.bind(return_port, model)
    _check(controls.get_child_count() == 2 and String(controls.get_child(1).text) == "CLAIM SELECTED CARGO", "D3.5-BIND UI renders presenter model only")
    controls._claim_pressed()
    _check(int(return_port.snapshot()["inventory"]["crystal"]) == 1 and String(return_port.snapshot()["runtime"]["claim_state"]) == "CLAIMED", "D3.5-BIND claim invokes D3.4 command port")
    controls.free()
    for path in [continue_path, return_path]:
        var absolute := ProjectSettings.globalize_path(path)
        for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute]:
            if FileAccess.file_exists(target):
                DirAccess.remove_absolute(target)

func _test_live_loop_d3_6_end_to_end_vectors() -> void:
    var completed := 0
    var destroyed := 0
    var blocked := 0
    var early_returns := 0
    for vector in D2Vectors.build_all():
        var input: Dictionary = vector["input"]
        var golem := Catalog.make_golem(String(input["frame_id"]), String(input["reactor_id"]), String(input["control_sigil_id"]), "unit-e2e", 0, false)
        golem["durability"] = int(input["starting_durability"])
        var evaluation := Catalog.evaluate_expedition_damage(String(input["region_id"]), golem)
        var plan := LiveLoop.build_damage_plan(evaluation, int(input["starting_durability"]))
        var initial := {"actions_left": 3, "unit": {"id": "unit-e2e", "durability": int(input["starting_durability"])}, "runtime": {}, "inventory": {"crystal": 0}, "blueprints": {"frozen": true}, "events": [], "durable_telemetry": []}
        var deploy_command := {"command_id": "deploy-%s" % vector["vector_id"], "expedition_id": "expedition-%s" % vector["vector_id"], "decision_id": "decision-0", "unit_id": "unit-e2e"}
        var deployed := LiveLoop.apply_deploy(initial, deploy_command, plan, [{"item_id": "reward-1", "catalog_id": "crystal", "quantity": 1}])
        if not bool(vector["legacy"]["has_access_key"]):
            blocked += 1
            _check(not deployed.get("ok", true) and deployed.get("state", {}) == initial, "D3.6 blocked DEPLOY is fail-closed %s" % vector["vector_id"])
            continue
        _check(deployed.get("ok", false) and int(deployed["state"]["actions_left"]) == 2 and int(deployed["state"]["unit"]["durability"]) == int(input["starting_durability"]), "D3.6 DEPLOY opens without damage %s" % vector["vector_id"])
        var duplicate_deploy := LiveLoop.apply_deploy(deployed["state"], deploy_command, plan, [{"item_id": "reward-1", "catalog_id": "crystal", "quantity": 1}])
        _check(duplicate_deploy.get("ok", false) and duplicate_deploy.get("duplicate", false) and duplicate_deploy.get("state", {}) == deployed["state"], "D3.6 DEPLOY exactly-once %s" % vector["vector_id"])
        var state: Dictionary = deployed["state"]
        var command_sequence := 0
        while String(state["runtime"]["phase"]) == "DECISION":
            var projection := LiveLoop.project_runtime_step(state["runtime"])
            command_sequence += 1
            var command := {"expedition_id": state["runtime"]["expedition_id"], "decision_id": state["runtime"]["decision_id"], "command_id": "continue-%d" % command_sequence, "next_decision_id": "decision-%d" % command_sequence}
            var advanced := LiveLoop.apply_continue(state, command, projection)
            _check(advanced.get("ok", false), "D3.6 CONTINUE full loop %s/%d" % [vector["vector_id"], command_sequence])
            state = LiveLoop.commit_telemetry(advanced["state"])
        var expected_durability := maxi(0, int(input["starting_durability"]) - int(vector["legacy"]["total_damage"]))
        _check(int(state["unit"]["durability"]) == expected_durability and state["blueprints"] == initial["blueprints"], "D3.6 terminal equals legacy oracle %s" % vector["vector_id"])
        if String(state["runtime"]["phase"]) == "DESTROYED":
            destroyed += 1
            _check(state["runtime"]["pending_cargo"].is_empty() and state["inventory"] == initial["inventory"], "D3.6 DESTROYED invades no ownership %s" % vector["vector_id"])
        else:
            completed += 1
            var claimed := LiveLoop.apply_claim(state, {"expedition_id": state["runtime"]["expedition_id"], "command_id": "claim-final"}, [{"item_id": "reward-1", "quantity": 1}], {"crystal": {"weight": 1}}, 1)
            var closed := LiveLoop.close_claimed(claimed.get("state", {}))
            _check(claimed.get("ok", false) and int(claimed["state"]["inventory"]["crystal"]) == 1 and closed.get("ok", false) and String(closed["state"]["runtime"]["phase"]) == "READY", "D3.6 RETURNED CLAIM READY %s" % vector["vector_id"])
        for decision_step in range(vector["steps"].size()):
            if not bool(vector["steps"][decision_step]["reachable"]):
                continue
            early_returns += 1
            var early: Dictionary = LiveLoop.apply_deploy(initial, deploy_command, plan, [])["state"]
            for resolved_step in range(decision_step):
                var projection := LiveLoop.project_runtime_step(early["runtime"])
                var advanced := LiveLoop.apply_continue(early, {"expedition_id": early["runtime"]["expedition_id"], "decision_id": early["runtime"]["decision_id"], "command_id": "early-%d" % resolved_step, "next_decision_id": "early-decision-%d" % resolved_step}, projection)
                early = advanced["state"]
            var returned := LiveLoop.apply_return(early, {"expedition_id": early["runtime"]["expedition_id"], "decision_id": early["runtime"]["decision_id"], "command_id": "return-%d" % decision_step})
            var expected_prefix := int(vector["legacy"]["prefixes"][decision_step])
            _check(returned.get("ok", false) and int(returned["state"]["unit"]["durability"]) == maxi(0, int(input["starting_durability"]) - expected_prefix) and returned["state"]["runtime"]["pending_cargo"].is_empty(), "D3.6 early RETURN prefix %s/%d" % [vector["vector_id"], decision_step])
    _check(completed > 0 and destroyed > 0 and blocked > 0 and early_returns == 10368, "D3.6 vector coverage complete")

func _test_live_loop_d3_6_persisted_full_cycle() -> void:
    var path := "user://live-loop-d3-full-cycle.json"
    var absolute := ProjectSettings.globalize_path(path)
    for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute]:
        if FileAccess.file_exists(target):
            DirAccess.remove_absolute(target)
    var plan := LiveLoop.build_damage_plan({"ok": true, "status": "SUCCESS", "failure_stage": "", "resist_damage": 4, "mobility_damage": 3, "encounter_damage": 2, "total_damage": 9}, 100)
    var initial := {"actions_left": 3, "unit": {"id": "unit-persisted", "durability": 100}, "runtime": {}, "inventory": {"crystal": 0}, "events": [], "durable_telemetry": []}
    var deployed := LiveLoop.apply_deploy(initial, {"command_id": "deploy-1", "expedition_id": "expedition-persisted", "decision_id": "decision-0", "unit_id": "unit-persisted"}, plan, [{"item_id": "reward-persisted", "catalog_id": "crystal", "quantity": 2}])
    var state: Dictionary = LiveLoop.commit_telemetry(deployed["state"])
    _check(LiveLoopStore.persist_state(path, state).get("ok", false), "D3.6 persisted DEPLOY")
    for step in range(4):
        state = LiveLoopStore.load_and_recover(path)["state"]
        var projection := LiveLoop.project_runtime_step(state["runtime"])
        var command := {"expedition_id": state["runtime"]["expedition_id"], "decision_id": state["runtime"]["decision_id"], "command_id": "continue-persisted-%d" % step, "next_decision_id": "decision-%d" % (step + 1)}
        _check(LiveLoopStore.persist_continue_intent(path, state, command).get("ok", false), "D3.6 persisted intent %d" % step)
        var recovered := LiveLoopStore.load_and_recover(path)
        _check(recovered.get("ok", false) and recovered.get("recovered", false), "D3.6 recovered combined step %d" % step)
        state = recovered["state"]
    var claimed := LiveLoopStore.commit_claim(path, state, {"expedition_id": "expedition-persisted", "command_id": "claim-persisted"}, [{"item_id": "reward-persisted", "quantity": 2}], {"crystal": {"weight": 1}}, 2)
    var closed := LiveLoop.close_claimed(claimed["state"])
    _check(LiveLoopStore.persist_state(path, closed["state"]).get("ok", false), "D3.6 persisted READY close")
    var final := LiveLoopStore.load_and_recover(path)
    _check(final.get("ok", false) and String(final["state"]["runtime"]["phase"]) == "READY" and int(final["state"]["unit"]["durability"]) == 91 and int(final["state"]["inventory"]["crystal"]) == 2 and int(final["state"]["actions_left"]) == 2, "D3.6 persisted full-cycle canonical outcome")
    var return_cycle: Dictionary = deployed["state"]
    for step in range(2):
        var projection := LiveLoop.project_runtime_step(return_cycle["runtime"])
        return_cycle = LiveLoop.apply_continue(return_cycle, {"expedition_id": return_cycle["runtime"]["expedition_id"], "decision_id": return_cycle["runtime"]["decision_id"], "command_id": "return-cycle-%d" % step, "next_decision_id": "return-cycle-decision-%d" % step}, projection)["state"]
    return_cycle = LiveLoop.apply_return(return_cycle, {"expedition_id": return_cycle["runtime"]["expedition_id"], "decision_id": return_cycle["runtime"]["decision_id"], "command_id": "return-cycle-command"})["state"]
    var empty_claim := LiveLoop.apply_claim(return_cycle, {"expedition_id": return_cycle["runtime"]["expedition_id"], "command_id": "return-cycle-claim"}, [], {"crystal": {"weight": 1}}, 2)
    var return_closed := LiveLoop.close_claimed(empty_claim["state"])
    _check(empty_claim.get("ok", false) and empty_claim["state"]["inventory"] == initial["inventory"] and return_closed.get("ok", false) and String(return_closed["state"]["runtime"]["phase"]) == "READY", "D3.6 explicit RETURN empty CLAIM READY loop")
    for target in [absolute, "%s.bak" % absolute, "%s.tmp" % absolute]:
        if FileAccess.file_exists(target):
            DirAccess.remove_absolute(target)

func _test_live_loop_d3_6_no_dual_runtime_entry() -> void:
    var forbidden := ["use_live_loop", "instant_resolution_mode", "runtime_mode", "expedition_mode_switch"]
    for path in ["res://ui/main.gd", "res://ui/main_e1.gd", "res://ui/expedition_live_loop_controls.gd", "res://state/game_state.gd", "res://state/expedition_live_loop_command_port.gd"]:
        var source := FileAccess.open(path, FileAccess.READ).get_as_text().to_lower()
        for token in forbidden:
            _check(not source.contains(token), "D3.6 no runtime selector %s/%s" % [path, token])
    var ui_source := FileAccess.open("res://ui/main.gd", FileAccess.READ).get_as_text()
    var live_controls_source := FileAccess.open("res://ui/expedition_live_loop_controls.gd", FileAccess.READ).get_as_text()
    _check(ui_source.count("GameState.start_expedition(") == 1 and not ui_source.contains("apply_deploy(") and not live_controls_source.contains("apply_deploy("), "D3.6 no second player-facing DEPLOY entry")
