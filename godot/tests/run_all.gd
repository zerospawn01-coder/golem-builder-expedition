extends SceneTree

const Catalog = preload("res://domain/game_catalog.gd")
const Fabrication = preload("res://domain/fabrication.gd")
const BlueprintLibrary = preload("res://domain/blueprint_library.gd")
const ExpeditionPresenter = preload("res://presentation/expedition_presenter.gd")
const D2Vectors = preload("res://tests/live_loop_d2_vectors.gd")
const LiveLoop = preload("res://domain/expedition_live_loop.gd")

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
