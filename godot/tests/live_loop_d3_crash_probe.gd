extends SceneTree

const LiveLoop = preload("res://domain/expedition_live_loop.gd")
const Store = preload("res://state/expedition_live_loop_store.gd")

func _init() -> void:
    var args := OS.get_cmdline_user_args()
    if args.size() < 3:
        quit(2)
        return
    if args[0] == "replace":
        var baseline := {"schema": Store.SCHEMA, "state": {"unit": {"id": "unit-baseline", "durability": 90}, "runtime": {"phase": "DECISION", "expedition_id": "baseline", "decision_id": "decision-baseline", "unit_id": "unit-baseline"}}}
        var replacement := {"schema": Store.SCHEMA, "state": {"unit": {"id": "unit-replacement", "durability": 80}, "runtime": {"phase": "DECISION", "expedition_id": "replacement", "decision_id": "decision-replacement", "unit_id": "unit-replacement"}}}
        if not Store._write_atomic(args[1], baseline).get("ok", false):
            quit(3)
            return
        Store._write_atomic_test_crash(args[1], replacement, args[3])
        var replace_survived := FileAccess.open(args[2], FileAccess.WRITE)
        if replace_survived != null:
            replace_survived.store_string("replacement did not terminate")
        quit(4)
        return
    if args[0] == "claim":
        var claim_state := {"unit": {"id": "unit-claim", "durability": 80}, "runtime": {"phase": "RETURNED", "expedition_id": "expedition-claim", "unit_id": "unit-claim", "pending_cargo": [{"item_id": "cargo-1", "catalog_id": "crystal", "quantity": 2}], "claim_state": "OPEN", "claim_results": {}}, "inventory": {"crystal": 5}, "events": [], "durable_telemetry": []}
        if not Store.persist_state(args[1], claim_state).get("ok", false):
            quit(3)
            return
        var claim_command := {"expedition_id": "expedition-claim", "command_id": "claim-command-1"}
        Store.commit_claim_test_crash(args[1], claim_state, claim_command, [{"item_id": "cargo-1", "quantity": 2}], {"crystal": {"weight": 1}}, 4, args[3])
        var claim_survived := FileAccess.open(args[2], FileAccess.WRITE)
        if claim_survived != null:
            claim_survived.store_string("claim did not terminate")
        quit(4)
        return
    var plan := LiveLoop.build_damage_plan({"ok": true, "status": "SUCCESS", "failure_stage": "", "resist_damage": 12, "mobility_damage": 8, "encounter_damage": 5, "total_damage": 25}, 100)
    var state := {
        "unit": {"id": "unit-crash", "durability": 100},
        "runtime": {"phase": "DECISION", "expedition_id": "expedition-crash", "decision_id": "decision-1", "unit_id": "unit-crash", "next_step_index": 0, "durability": 100, "pending_cargo": [], "step_results": [], "command_results": {}, "damage_plan": plan},
        "inventory": {"crystal": 7}, "events": [], "telemetry": [],
    }
    var command := {"type": "CONTINUE", "expedition_id": "expedition-crash", "decision_id": "decision-1", "command_id": "command-crash", "next_decision_id": "decision-2"}
    var persisted := Store.persist_continue_intent(args[1], state, command)
    if not persisted.get("ok", false):
        quit(3)
        return
    OS.kill(OS.get_process_id())
    var survived := FileAccess.open(args[2], FileAccess.WRITE)
    if survived != null:
        survived.store_string("kill returned")
        survived.flush()
    quit(4)
