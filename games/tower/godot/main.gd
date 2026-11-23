extends Node2D
## «برج سبير»: الرافعة تتمرجح فوق، واضغط حتى تنزّل القطعة (صندوق، خشبة، أو بزون نايم).
## ابنِ أعلى برج تكدر — كل قطعة تستقر بالبرج نقطة، وكل قطعة توگع من البرج تاكل قلب.
## الفيزياء كلها من Godot (RigidBody2D): القطع تتراكم وتميل وتوگع بشكل حقيقي.

const LIVES := {"easy": 3, "medium": 2, "hard": 1}
const SWING := {"easy": 1.4, "medium": 1.9, "hard": 2.4}
const BASE_W := {"easy": 336.0, "medium": 280.0, "hard": 230.0}
const GOALS := {"easy": [6, 12, 20], "medium": [8, 15, 25], "hard": [10, 18, 30]}
## القطع وأوزان ظهورها حسب الصعوبة (البزازين تتدحرج — أصعب)
const KINDS := {
	"crate": {"size": Vector2(58, 58), "weights": {"easy": 3, "medium": 3, "hard": 2}},
	"wood2": {"size": Vector2(118, 54), "weights": {"easy": 4, "medium": 3, "hard": 2}},
	"wood3": {"size": Vector2(182, 54), "weights": {"easy": 3, "medium": 2, "hard": 1}},
	"cat": {"r": 34.0, "weights": {"easy": 1, "medium": 2, "hard": 3}},
}
const CATS := ["cat_orange", "cat_pink", "cat_gray"]
const CRANE_GAP := 330.0 # المسافة بين الخطّاف وأعلى البرج

var level := "easy"
var lives := 3
var score := 0
var running := false
var game_id := 0
var swing_t := 0.0
var hurt_cd := 0.0
var spawn_wait := -1.0
var hook_y := 0.0

var tex := {}
var font: FontFile
var base: StaticBody2D
var base_y := 0.0
var cam: Camera2D
var hook: Sprite2D
var rope: Line2D
var held: RigidBody2D = null
var dropped: RigidBody2D = null
var blocks: Array[RigidBody2D] = []

var bg: Sprite2D
var score_label: Label
var msg_label: Label
var hearts: HBoxContainer


func _ready() -> void:
	randomize()
	for n in ["bg", "cloud", "base", "hook", "crate", "wood2", "wood3", "cat_scared", "heart", "heart_off", "star"] + CATS:
		tex[n] = load("res://art/%s.png" % n)
	font = load("res://fonts/baloo-ar.woff2")
	font.fallbacks = [load("res://fonts/baloo-latin.woff2")]

	var back := CanvasLayer.new()
	back.layer = -1
	add_child(back)
	bg = Sprite2D.new()
	bg.texture = tex.bg
	bg.centered = false
	back.add_child(bg)

	cam = Camera2D.new()
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 3.0
	add_child(cam)
	cam.make_current()

	rope = Line2D.new()
	rope.width = 4
	rope.default_color = Color("#2A2350")
	rope.z_index = 5
	add_child(rope)
	hook = Sprite2D.new()
	hook.texture = tex.hook
	hook.scale = Vector2.ONE * 0.6
	hook.z_index = 6
	add_child(hook)

	_make_hud()
	get_viewport().size_changed.connect(_fit)
	_fit()
	_build_world()
	_show_msg("برج سبير")
	Spir.start.connect(_on_start)
	Spir.pause_changed.connect(func(p: bool): get_tree().paused = p)


func _size() -> Vector2:
	return get_viewport_rect().size


func _fit() -> void:
	var s := _size()
	var k: float = max(s.x / bg.texture.get_width(), s.y / bg.texture.get_height())
	bg.scale = Vector2(k, k)
	bg.position = (s - bg.texture.get_size() * k) / 2.0


func _build_world() -> void:
	var s := _size()
	base_y = s.y - 110.0
	cam.position = s / 2.0
	cam.reset_smoothing()
	# غيوم على ارتفاعات مختلفة: لما البرج يعلى تبين إنك صاعد
	for i in 14:
		var c := Sprite2D.new()
		c.texture = tex.cloud
		c.scale = Vector2.ONE * randf_range(0.35, 0.6)
		c.modulate.a = 0.9
		c.position = Vector2(randf() * s.x, base_y - 380.0 - i * 420.0 + randf_range(-80, 80))
		c.z_index = -1
		add_child(c)


func _make_base() -> void:
	if base:
		base.queue_free()
	var w: float = BASE_W[level]
	base = StaticBody2D.new()
	base.position = Vector2(_size().x / 2.0, base_y + 24.0)
	var cs := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(w, 48)
	cs.shape = shape
	base.add_child(cs)
	var spr := Sprite2D.new()
	spr.texture = tex.base
	spr.scale = Vector2(w / 336.0, 1.0) * 0.5
	base.add_child(spr)
	# عمود تحت الأرضية حتى ما تبين طايرة
	var pole := ColorRect.new()
	pole.color = Color("#B56F38")
	pole.size = Vector2(w * 0.5, 600)
	pole.position = Vector2(-w * 0.25, 22)
	pole.z_index = -1
	base.add_child(pole)
	add_child(base)


func _label(size: int, color: Color) -> Label:
	var l := Label.new()
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color("#2A2350"))
	l.add_theme_constant_override("outline_size", int(size / 4.0))
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.text_direction = Control.TEXT_DIRECTION_RTL
	return l


func _make_hud() -> void:
	var hud := CanvasLayer.new()
	add_child(hud)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(root)
	score_label = _label(56, Color.WHITE)
	score_label.set_anchors_preset(Control.PRESET_TOP_WIDE)
	score_label.offset_top = 8
	root.add_child(score_label)
	msg_label = _label(50, Color.WHITE)
	msg_label.set_anchors_preset(Control.PRESET_CENTER)
	msg_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	msg_label.grow_vertical = Control.GROW_DIRECTION_BOTH
	root.add_child(msg_label)
	hearts = HBoxContainer.new()
	hearts.position = Vector2(12, 14)
	hearts.add_theme_constant_override("separation", 4)
	root.add_child(hearts)


func _show_msg(t: String, secs := 0.0) -> void:
	msg_label.text = t
	msg_label.visible = true
	msg_label.pivot_offset = msg_label.size / 2.0
	msg_label.scale = Vector2.ONE * 0.6
	create_tween().tween_property(msg_label, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if secs > 0.0:
		var id := game_id
		await get_tree().create_timer(secs).timeout
		if id == game_id and msg_label.text == t:
			msg_label.visible = false


func _update_hearts() -> void:
	for c in hearts.get_children():
		c.queue_free()
	for i in LIVES[level]:
		var r := TextureRect.new()
		r.texture = tex.heart if i < lives else tex.heart_off
		r.custom_minimum_size = Vector2(34, 34)
		r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		hearts.add_child(r)


func _stars() -> int:
	var n := 0
	for g in GOALS[level]:
		if score >= g:
			n += 1
	return n


func _next_goal() -> String:
	for g in GOALS[level]:
		if score < g:
			return "النجمة الجاية: %d قطعة" % g
	return "★★★ برج عملاق!"


func _hud() -> void:
	score_label.text = str(score)
	Spir.send({"type": "hud", "text": _next_goal(), "score": "%d قطعة" % score})


func _on_start(settings: Dictionary) -> void:
	game_id += 1
	var id := game_id
	get_tree().paused = false
	level = str(settings.get("level", "easy"))
	if not LIVES.has(level):
		level = "easy"
	for b in blocks:
		b.queue_free()
	blocks.clear()
	if held:
		held.queue_free()
	held = null
	dropped = null
	lives = LIVES[level]
	score = 0
	swing_t = 0.0
	hurt_cd = 0.0
	spawn_wait = -1.0
	running = false
	_make_base()
	cam.position = _size() / 2.0
	cam.reset_smoothing()
	_update_hearts()
	_hud()
	_show_msg("اضغط حتى تنزّل القطعة")
	await get_tree().create_timer(1.3).timeout
	if id != game_id:
		return
	_show_msg("يلا!", 0.6)
	Spir.sfx("whoosh")
	running = true
	_spawn()


func _pick_kind() -> String:
	var total := 0
	for k in KINDS:
		total += KINDS[k].weights[level]
	var r := randi() % total
	for k in KINDS:
		r -= KINDS[k].weights[level]
		if r < 0:
			return k
	return "crate"


func _spawn() -> void:
	var kind := _pick_kind()
	var b := RigidBody2D.new()
	var mat := PhysicsMaterial.new()
	mat.friction = 0.95
	mat.bounce = 0.0
	b.physics_material_override = mat
	b.mass = 1.0
	b.freeze_mode = RigidBody2D.FREEZE_MODE_KINEMATIC
	b.freeze = true
	b.collision_layer = 0
	b.collision_mask = 0
	b.contact_monitor = true
	b.max_contacts_reported = 4
	b.continuous_cd = RigidBody2D.CCD_MODE_CAST_SHAPE
	b.can_sleep = true
	var cs := CollisionShape2D.new()
	var spr := Sprite2D.new()
	spr.name = "Art"
	if kind == "cat":
		var shape := CircleShape2D.new()
		shape.radius = KINDS.cat.r
		cs.shape = shape
		spr.texture = tex[CATS[randi() % CATS.size()]]
		spr.scale = Vector2.ONE * 0.3
		spr.position = Vector2(0, -6)
		b.angular_damp = 3.0
	else:
		var shape := RectangleShape2D.new()
		shape.size = KINDS[kind].size
		cs.shape = shape
		spr.texture = tex[kind]
		spr.scale = Vector2.ONE * 0.5
	b.set_meta("kind", kind)
	b.set_meta("counted", false)
	b.add_child(cs)
	b.add_child(spr)
	b.body_entered.connect(_on_block_hit.bind(b))
	add_child(b)
	b.global_position = hook.global_position + Vector2(0, 60)
	held = b
	# تطلع بنطّة (نكبّر الرسمة بس — الجسم الفيزيائي ما ينصغّر)
	spr.scale *= 0.3
	create_tween().tween_property(spr, "scale", spr.scale / 0.3, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _drop() -> void:
	if not held or not running:
		return
	var b := held
	held = null
	b.collision_layer = 1
	b.collision_mask = 1
	b.freeze = false
	# القطعة تاخذ شوية من حركة الرافعة
	var vx := cos(swing_t * _swing_speed()) * _swing_speed() * _swing_range() * 0.25
	b.linear_velocity = Vector2(vx, 60)
	blocks.append(b)
	dropped = b
	spawn_wait = 2.4
	Spir.sfx("drop")


func _on_block_hit(_other: Node, b: RigidBody2D) -> void:
	if not is_instance_valid(b) or b.get_meta("counted"):
		return
	b.set_meta("counted", true)
	score += 1
	Spir.sfx("bump")
	var art := b.get_node("Art") as Sprite2D
	var s0 := art.scale
	var tw := create_tween()
	tw.tween_property(art, "scale", Vector2(s0.x * 1.12, s0.y * 0.85), 0.07)
	tw.tween_property(art, "scale", s0, 0.15).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if score in GOALS[level]:
		Spir.sfx("star")
		Spir.vibrate()
		_show_msg("نجمة جديدة!", 0.9)
	_hud()
	if b == dropped:
		spawn_wait = min(spawn_wait, 0.55)


func _unhandled_input(event: InputEvent) -> void:
	var pressed := false
	if event is InputEventScreenTouch or event is InputEventMouseButton:
		pressed = event.pressed
	elif event.is_action_pressed("ui_accept"):
		pressed = true
	if pressed:
		_drop()


func _swing_speed() -> float:
	return SWING[level] * min(1.0 + score * 0.025, 1.6)


func _swing_range() -> float:
	return _size().x * 0.5 - 100.0


func _tower_top() -> float:
	var top := base_y
	for b in blocks:
		if b.get_meta("counted") and b != dropped and b.linear_velocity.length() < 40.0:
			top = min(top, b.global_position.y - 60.0)
	return top


func _process(delta: float) -> void:
	var s := _size()
	hurt_cd = max(0.0, hurt_cd - delta)
	# الكاميرا تصعد ويّا البرج
	var top := _tower_top()
	var want_y: float = min(s.y / 2.0, top - CRANE_GAP + s.y * 0.5 - 150.0)
	cam.position = Vector2(s.x / 2.0, want_y)
	var view_top := cam.get_screen_center_position().y - s.y / 2.0
	# الرافعة
	if running:
		swing_t += delta
	var hx := s.x / 2.0 + sin(swing_t * _swing_speed()) * _swing_range()
	# الخطّاف على مسافة ثابتة فوق البرج (ينزل وياه إذا البرج قصير)
	var want_hook: float = max(view_top + 150.0, top - CRANE_GAP)
	hook_y = want_hook if hook_y == 0.0 else lerp(hook_y, want_hook, min(1.0, delta * 4.0))
	hook.global_position = Vector2(hx, hook_y)
	rope.points = PackedVector2Array([Vector2(hx, view_top - 10.0), hook.global_position + Vector2(0, -8)])
	if held:
		held.global_position = hook.global_position + Vector2(0, 58)
	# السماء تغمق شوية كل ما نعلى
	var h01: float = clamp((base_y - top) / 3000.0, 0.0, 1.0)
	bg.modulate = Color(1, 1, 1).lerp(Color(0.55, 0.6, 0.95), h01)

	if not running:
		return
	# القطعة الجاية
	if spawn_wait > 0.0:
		spawn_wait -= delta
		if spawn_wait <= 0.0 and not held:
			dropped = null
			_spawn()
	# القطع اللي وگعت
	for b in blocks.duplicate():
		if b.global_position.y > base_y + 260.0:
			blocks.erase(b)
			var was_counted: bool = b.get_meta("counted")
			b.queue_free()
			if was_counted:
				score = max(0, score - 1)
			if b == dropped:
				dropped = null
				spawn_wait = min(spawn_wait, 0.3)
			_lose_heart()
			_hud()
			if not running:
				return


func _lose_heart() -> void:
	# قطع كثيرة ممكن توگع سوا — قلب واحد بالمرة
	if hurt_cd > 0.0:
		return
	hurt_cd = 1.2
	lives -= 1
	_update_hearts()
	Spir.vibrate()
	Spir.sfx("bump")
	if lives > 0:
		_show_msg("وگعت!", 0.7)
		return
	running = false
	if held:
		held.queue_free()
		held = null
	var id := game_id
	Spir.sfx("lose")
	_show_msg("انهدم البرج!")
	await get_tree().create_timer(1.2).timeout
	if id != game_id:
		return
	var stars := _stars()
	var best := score
	if stars > 0:
		Spir.send({"type": "complete", "stars": stars, "score": best, "title": "برج يجنن!", "subtitle": "بنيت %d قطعة" % best})
	else:
		Spir.send({"type": "over", "score": best, "title": "انهدم البرج!", "subtitle": "تحتاج %d قطعة للنجمة الأولى" % GOALS[level][0]})
