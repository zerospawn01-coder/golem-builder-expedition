extends SceneTree

func _init() -> void:
    call_deferred("_capture")

func _capture() -> void:
    var scene: Node = load("res://ui/main.tscn").instantiate()
    root.add_child(scene)
    await process_frame
    scene.tab = "expedition"
    scene._refresh()
    await process_frame
    await process_frame
    var image := root.get_viewport().get_texture().get_image()
    var result := image.save_png("res://tests/e2-pc-capture.png")
    if result != OK:
        push_error("E2 capture failed: %s" % error_string(result))
        quit(1)
        return
    print("E2-CAPTURE: PASS — %dx%d" % [image.get_width(), image.get_height()])
    quit(0)
