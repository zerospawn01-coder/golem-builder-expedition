class_name ExpeditionLiveLoopCommandPort
extends RefCounted

const LiveLoop = preload("res://domain/expedition_live_loop.gd")
const Store = preload("res://state/expedition_live_loop_store.gd")

var _path: String
var _state: Dictionary
var _catalog: Dictionary
var _capacity: int
var _identity_provider: Callable

func _init(path: String, initial_state: Dictionary, catalog: Dictionary, capacity: int, identity_provider: Callable) -> void:
    _path = path
    _state = initial_state.duplicate(true)
    _catalog = catalog.duplicate(true)
    _capacity = capacity
    _identity_provider = identity_provider

func snapshot() -> Dictionary:
    return _state.duplicate(true)

func continue_current() -> Dictionary:
    var runtime: Dictionary = _state.get("runtime", {})
    var command := {"type": "CONTINUE", "expedition_id": runtime.get("expedition_id", ""), "decision_id": runtime.get("decision_id", ""), "command_id": _identity_provider.call("continue-command"), "next_decision_id": _identity_provider.call("decision")}
    var intent := Store.persist_continue_intent(_path, _state, command)
    if not intent.get("ok", false):
        return intent
    var projection := LiveLoop.project_step(runtime.get("damage_plan", {}), int(runtime.get("next_step_index", -1)))
    var applied := LiveLoop.apply_continue(_state, command, projection)
    return _commit(applied)

func return_current() -> Dictionary:
    var runtime: Dictionary = _state.get("runtime", {})
    var command := {"type": "RETURN", "expedition_id": runtime.get("expedition_id", ""), "decision_id": runtime.get("decision_id", ""), "command_id": _identity_provider.call("return-command")}
    return _commit(LiveLoop.apply_return(_state, command))

func claim(selection: Array) -> Dictionary:
    var runtime: Dictionary = _state.get("runtime", {})
    var command := {"type": "CLAIM", "expedition_id": runtime.get("expedition_id", ""), "command_id": _identity_provider.call("claim-command")}
    var committed := Store.commit_claim(_path, _state, command, selection, _catalog, _capacity)
    if committed.get("ok", false):
        _state = committed["state"].duplicate(true)
    return committed

func _commit(result: Dictionary) -> Dictionary:
    if not result.get("ok", false):
        return result
    var committed: Dictionary = LiveLoop.commit_telemetry(result["state"])
    var written := Store.persist_state(_path, committed)
    if not written.get("ok", false):
        return {"ok": false, "error": written.get("error", "COMMIT_FAILED")}
    result["state"] = committed
    _state = committed.duplicate(true)
    return result
