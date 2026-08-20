class_name GolemFabrication
extends RefCounted

const ACTION_COST := 1
const Catalog = preload("res://domain/game_catalog.gd")

static func evaluate(state: Dictionary, request: Dictionary) -> Dictionary:
    var inventory: Dictionary = state.get("inventory", {})
    var body_stock: Dictionary = inventory.get("body", {})
    var core_stock: Dictionary = inventory.get("core", {})
    var rune_stock: Dictionary = inventory.get("rune", {})
    var body_id := String(request.get("body", ""))
    var core_id := String(request.get("core", ""))
    var rune_id := String(request.get("rune", ""))
    var body := int(body_stock.get(body_id, 0))
    var core := int(core_stock.get(core_id, 0))
    var rune := int(rune_stock.get(rune_id, 0))
    var units: Array = state.get("units", [])
    var used := units.size()
    var max_units := int(state.get("max_units", 3))
    var actions_left := int(state.get("actions_left", 0))
    var blocker := ""
    if used >= max_units:
        blocker = "NO_FREE_UNIT_SLOT"
    elif actions_left < ACTION_COST:
        blocker = "NO_ACTION"
    elif body < 1:
        blocker = "MISSING_FRAME"
    elif core < 1:
        blocker = "MISSING_REACTOR"
    elif rune < 1:
        blocker = "MISSING_SIGIL"
    return {
        "can_fabricate": blocker.is_empty(),
        "action_cost": ACTION_COST,
        "slots": {"used": used, "max": max_units, "after": used if not blocker.is_empty() else used + 1},
        "stock_changes": [
            {"category": "FRAME", "id": body_id, "before": body, "required": 1, "after": max(0, body - 1)},
            {"category": "REACTOR", "id": core_id, "before": core, "required": 1, "after": max(0, core - 1)},
            {"category": "CONTROL_SIGIL", "id": rune_id, "before": rune, "required": 1, "after": max(0, rune - 1)},
        ],
        "blocker": blocker,
    }

static func fabricate(state: Dictionary, request: Dictionary, now_msec: int) -> Dictionary:
    var evaluation := evaluate(state, request)
    if not evaluation["can_fabricate"]:
        return {"ok": false, "state": state, "reason": evaluation["blocker"], "evaluation": evaluation}
    var next_state := state.duplicate(true)
    var body_id := String(request["body"])
    var core_id := String(request["core"])
    var rune_id := String(request["rune"])
    var golem := Catalog.make_golem(body_id, core_id, rune_id, "golem_%d" % now_msec, now_msec, false)
    next_state["actions_left"] = int(next_state["actions_left"]) - ACTION_COST
    next_state["inventory"]["body"][body_id] = int(next_state["inventory"]["body"][body_id]) - 1
    next_state["inventory"]["core"][core_id] = int(next_state["inventory"]["core"][core_id]) - 1
    next_state["inventory"]["rune"][rune_id] = int(next_state["inventory"]["rune"][rune_id]) - 1
    var units: Array = next_state["units"]
    units.push_front(golem)
    next_state["units"] = units
    return {"ok": true, "state": next_state, "golem": golem, "evaluation": evaluation}
