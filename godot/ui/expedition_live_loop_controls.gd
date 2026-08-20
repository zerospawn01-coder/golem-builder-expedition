class_name ExpeditionLiveLoopControls
extends VBoxContainer

signal command_completed(result: Dictionary)

var _command_port: RefCounted
var _model: Dictionary

func bind(command_port: RefCounted, model: Dictionary) -> void:
    _command_port = command_port
    _model = model.duplicate(true)
    _render()

func _render() -> void:
    for child in get_children():
        child.queue_free()
    var status := Label.new()
    status.text = "EXPEDITION %s | NEXT %s | DURABILITY %d%%" % [_model.get("phase", "READY"), _model.get("next_step_id", "—"), int(_model.get("durability", 0))]
    add_child(status)
    if bool(_model.get("can_continue", false)):
        var continue_button := Button.new()
        continue_button.text = "CONTINUE"
        continue_button.pressed.connect(_continue_pressed)
        add_child(continue_button)
    if bool(_model.get("can_return", false)):
        var return_button := Button.new()
        return_button.text = "RETURN"
        return_button.pressed.connect(_return_pressed)
        add_child(return_button)
    if bool(_model.get("can_claim", false)):
        var claim_button := Button.new()
        claim_button.text = "CLAIM SELECTED CARGO"
        claim_button.pressed.connect(_claim_pressed)
        add_child(claim_button)

func _continue_pressed() -> void:
    command_completed.emit(_command_port.continue_current())

func _return_pressed() -> void:
    command_completed.emit(_command_port.return_current())

func _claim_pressed() -> void:
    var selection: Array = []
    for cargo in _model.get("pending_cargo", []):
        selection.append({"item_id": cargo.get("item_id", ""), "quantity": int(cargo.get("quantity", 0))})
    command_completed.emit(_command_port.claim(selection))
