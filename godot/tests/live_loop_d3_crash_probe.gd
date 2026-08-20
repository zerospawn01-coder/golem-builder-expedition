extends SceneTree

const LiveLoop = preload("res://domain/expedition_live_loop.gd")
const Store = preload("res://state/expedition_live_loop_store.gd")

func _init() -> void:
    var args := OS.get_cmdline_user_args()
    if args.size() != 2:
        quit(2)
        return
    var plan := LiveLoop.build_damage_plan({"ok": true, "status": "SUCCESS", "failure_stage": "", "resist_damage": 12, "mobility_damage": 8, "encounter_damage": 5, "total_damage": 25}, 100)
    var state := {
        "unit": {"id": "unit-crash", "durability": 100},
        "runtime": {"phase": "DECISION", "expedition_id": "expedition-crash", "decision_id": "decision-1", "unit_id": "unit-crash", "next_step_index": 0, "durability": 100, "pending_cargo": [], "step_results": [], "command_results": {}, "damage_plan": plan},
        "inventory": {"crystal": 7}, "events": [], "telemetry": [],
    }
    var command := {"type": "CONTINUE", "expedition_id": "expedition-crash", "decision_id": "decision-1", "command_id": "command-crash", "next_decision_id": "decision-2"}
    var persisted := Store.persist_continue_intent(args[0], state, command)
    if not persisted.get("ok", false):
        quit(3)
        return
    OS.kill(OS.get_process_id())
    var survived := FileAccess.open(args[1], FileAccess.WRITE)
    if survived != null:
        survived.store_string("kill returned")
        survived.flush()
    quit(4)
