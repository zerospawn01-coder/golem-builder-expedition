extends SceneTree

const Vectors = preload("res://tests/live_loop_d2_vectors.gd")
const OUTPUT := "res://tests/fixtures/live_loop_d2_damage_vectors.tsv"

func _init() -> void:
    var vectors := Vectors.build_all()
    if vectors.size() != 5120:
        push_error("D2 generator expected 5120 vectors, got %d" % vectors.size())
        quit(1)
        return
    var file := FileAccess.open(OUTPUT, FileAccess.WRITE)
    if file == null:
        push_error("D2 generator cannot open %s" % OUTPUT)
        quit(1)
        return
    file.store_string(Vectors.to_tsv(vectors))
    file.close()
    print("LIVE-LOOP-D2: WROTE %d vectors" % vectors.size())
    quit(0)
