extends Node2D
## «تجنّب الوحوش»: حرّك سبير بإصبعك (أو بالأسهم) وتجنّب الوحوش اللي تعبر الشاشة،
## وجمّع السمك للنقاط الإضافية. النجوم حسب النقاط، والصعوبة تزيد ويّا الوقت.
## الفكرة من «Dodge the Creeps» (مشاريع Godot الرسمية، MIT) — الكود والرسوم مكتوبة لسبير.

const LIVES := {"easy": 3, "medium": 2, "hard": 1}
const SPEED := {"easy": Vector2(110, 180), "medium": Vector2(150, 240), "hard": Vector2(190, 300)}
const SPAWN := {"easy": 1.1, "medium": 0.75, "hard": 0.55}
const GOALS := {"easy": [15, 35, 60], "medium": [20, 45, 80], "hard": [25, 55, 100]}
const PLAYER_SPEED := 460.0
const PLAYER_R := 30.0
const MOB_TEX := ["mob1", "mob3", "mob5", "mob7", "mob9"]

var level := "easy"
var lives := 3
var bonus := 0
var elapsed := 0.0
var running := false
var invuln := 0.0
var spawn_t := 0.0
var fish_t := 3.0
var face_t := 0.0
var hud_t := 0.0
var target = null # Vector2 أو null
var game_id := 0

var tex := {}
var font: FontFile
var bg: Sprite2D
var player: Sprite2D
var mobs: Array = [] # [{node, vel, r, phase}]
var fishes: Array = [] # [{node, life, base_y}]

var hud: CanvasLayer
var score_label: Label
var msg_label: Label
var hearts: HBoxContainer


func _ready() -> void:
	randomize()
	for n in ["spir", "spir_happy", "spir_scared", "fish", "heart", "heart_off", "bg"] + MOB_TEX:
		tex[n] = load("res://art/%s.png" % n)
	font = load("res://fonts/baloo-ar.woff2")
	font.fallbacks = [load("res://fonts/baloo-latin.woff2")]

	bg = Sprite2D.new()
	bg.texture = tex.bg
	bg.centered = false
	add_child(bg)

	player = Sprite2D.new()
	player.texture = tex.spir
	player.scale = Vector2.ONE * 0.34
	player.z_index = 10
	add_child(player)

	_make_hud()
	get_viewport().size_changed.connect(_fit)
	_fit()
	player.position = _size() * Vector2(0.5, 0.62)
	_show_msg("تجنّب الوحوش!")
	Spir.start.connect(_on_start)
	Spir.pause_changed.connect(func(p: bool): get_tree().paused = p)


func _size() -> Vector2:
	return get_viewport_rect().size


func _fit() -> void:
	var s := _size()
	var k: float = max(s.x / bg.texture.get_width(), s.y / bg.texture.get_height())
	bg.scale = Vector2(k, k)
	bg.position = (s - bg.texture.get_size() * k) / 2.0


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
	hud = CanvasLayer.new()
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


func _score() -> int:
	return int(elapsed) + bonus


func _stars() -> int:
	var s := 0
	for g in GOALS[level]:
		if _score() >= g:
			s += 1
	return s


func _next_goal() -> String:
	for g in GOALS[level]:
		if _score() < g:
			return "النجمة الجاية: %d" % g
	return "★★★ عفية!"


func _on_start(settings: Dictionary) -> void:
	game_id += 1
	var id := game_id
	get_tree().paused = false
	level = str(settings.get("level", "easy"))
	if not LIVES.has(level):
		level = "easy"
	for m in mobs:
		m.node.queue_free()
	for f in fishes:
		f.node.queue_free()
	mobs.clear()
	fishes.clear()
	lives = LIVES[level]
	bonus = 0
	elapsed = 0.0
	invuln = 0.0
	spawn_t = 1.0
	fish_t = 3.0
	target = null
	running = false
	player.texture = tex.spir
	player.modulate = Color.WHITE
	player.position = _size() * Vector2(0.5, 0.62)
	_update_hearts()
	score_label.text = "0"
	for t in ["3", "2", "1"]:
		_show_msg(t)
		Spir.sfx("tap")
		await get_tree().create_timer(0.55).timeout
		if id != game_id:
			return
	_show_msg("يلا!", 0.6)
	Spir.sfx("whoosh")
	running = true


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch or event is InputEventMouseButton:
		target = event.position if event.pressed else null
	elif event is InputEventScreenDrag or (event is InputEventMouseMotion and target != null):
		target = event.position


func _process(delta: float) -> void:
	var s := _size()
	_move_player(delta, s)
	_animate(delta)
	if not running:
		return
	elapsed += delta
	invuln = max(0.0, invuln - delta)
	player.modulate.a = 0.35 if invuln > 0.0 and fmod(invuln, 0.2) < 0.1 else 1.0
	face_t = max(0.0, face_t - delta)
	if face_t == 0.0:
		player.texture = tex.spir

	# الوحوش: كل ما يطوّل الوقت تجي أسرع وأكثر
	var ramp: float = 1.0 + min(elapsed / 60.0, 1.0) * 0.6
	spawn_t -= delta
	if spawn_t <= 0.0:
		spawn_t = SPAWN[level] / ramp
		_spawn_mob(s, ramp)
	fish_t -= delta
	if fish_t <= 0.0:
		fish_t = randf_range(3.0, 5.0)
		_spawn_fish(s)

	for m in mobs.duplicate():
		m.node.position += m.vel * delta
		if not Rect2(Vector2(-160, -160), s + Vector2(320, 320)).has_point(m.node.position):
			m.node.queue_free()
			mobs.erase(m)
		elif invuln == 0.0 and m.node.position.distance_to(player.position) < m.r + PLAYER_R:
			_hit()
			if not running:
				return

	for f in fishes.duplicate():
		f.life -= delta
		if f.node.position.distance_to(player.position) < 44.0:
			bonus += 3
			Spir.sfx("coin")
			player.texture = tex.spir_happy
			face_t = 0.6
			_popup("+3", f.node.position)
			f.node.queue_free()
			fishes.erase(f)
		elif f.life <= 0.0:
			f.node.queue_free()
			fishes.erase(f)

	var before := score_label.text
	score_label.text = str(_score())
	if before != score_label.text:
		hud_t -= delta
	if hud_t <= 0.0:
		hud_t = 1.0
		Spir.send({"type": "hud", "text": _next_goal(), "score": str(_score())})


func _move_player(delta: float, s: Vector2) -> void:
	var dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	var vel := Vector2.ZERO
	if dir != Vector2.ZERO:
		vel = dir * PLAYER_SPEED
	elif target != null:
		# الإصبع فوق سبير شوية حتى يبين
		var goal: Vector2 = target + Vector2(0, -60)
		var d := goal - player.position
		if d.length() > 4.0:
			vel = d.normalized() * min(PLAYER_SPEED, d.length() / delta)
	if running or vel != Vector2.ZERO:
		player.position += vel * delta
	player.position = player.position.clamp(Vector2(PLAYER_R, PLAYER_R + 90), s - Vector2(PLAYER_R, PLAYER_R))
	player.rotation = lerp(player.rotation, clamp(vel.x / PLAYER_SPEED, -1.0, 1.0) * 0.25, min(1.0, delta * 10.0))


func _animate(_delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	for m in mobs:
		m.node.rotation = sin(t * 5.0 + m.phase) * 0.18
		var k: float = m.k * (1.0 + sin(t * 7.0 + m.phase) * 0.05)
		m.node.scale = Vector2(k, k)
	for f in fishes:
		f.node.position.y = f.base_y + sin(t * 4.0 + f.base_y) * 6.0
		f.node.modulate.a = clamp(f.life, 0.0, 1.0)


func _spawn_mob(s: Vector2, ramp: float) -> void:
	# نقطة على حافة الشاشة، والاتجاه لنقطة عشوائية بالنص
	var edge := randi() % 4
	var p := Vector2.ZERO
	match edge:
		0: p = Vector2(randf() * s.x, -60)
		1: p = Vector2(s.x + 60, randf() * s.y)
		2: p = Vector2(randf() * s.x, s.y + 60)
		_: p = Vector2(-60, randf() * s.y)
	var aim := Vector2(randf_range(0.2, 0.8) * s.x, randf_range(0.25, 0.85) * s.y)
	var sp: Vector2 = SPEED[level]
	var vel := (aim - p).normalized() * randf_range(sp.x, sp.y) * ramp
	var tier := randi() % MOB_TEX.size()
	var node := Sprite2D.new()
	node.texture = tex[MOB_TEX[tier]]
	var k := 0.36 + tier * 0.04
	node.scale = Vector2(k, k)
	node.position = p
	node.flip_h = vel.x < 0
	add_child(node)
	# نصف قطر التصادم أصغر من الرسمة شوية (أرحم للصغار)
	mobs.append({"node": node, "vel": vel, "r": node.texture.get_width() * k * 0.3, "phase": randf() * TAU, "k": k})


func _spawn_fish(s: Vector2) -> void:
	var node := Sprite2D.new()
	node.texture = tex.fish
	node.scale = Vector2.ONE * 0.55
	var p := Vector2(randf_range(0.12, 0.88) * s.x, randf_range(0.25, 0.85) * s.y)
	node.position = p
	add_child(node)
	fishes.append({"node": node, "life": 6.0, "base_y": p.y})


func _popup(t: String, at: Vector2) -> void:
	var l := _label(30, Color("#FFE27A"))
	l.text = t
	l.position = at - Vector2(40, 30)
	l.size = Vector2(80, 40)
	hud.add_child(l)
	var tw := create_tween()
	tw.tween_property(l, "position:y", l.position.y - 50, 0.6)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.6)
	tw.tween_callback(l.queue_free)


func _hit() -> void:
	lives -= 1
	_update_hearts()
	Spir.vibrate()
	Spir.sfx("bump")
	player.texture = tex.spir_scared
	face_t = 0.9
	if lives > 0:
		invuln = 1.6
		return
	# خلصت القلوب
	running = false
	var id := game_id
	Spir.sfx("lose")
	_show_msg("لزمتك الوحوش!")
	await get_tree().create_timer(1.1).timeout
	if id != game_id:
		return
	var stars := _stars()
	var sc := _score()
	if stars > 0:
		Spir.send({"type": "complete", "stars": stars, "score": sc, "title": "عاشت إيدك!", "subtitle": "جمعت %d نقطة" % sc})
	else:
		Spir.send({"type": "over", "score": sc, "title": "لزمتك الوحوش!", "subtitle": "تحتاج %d نقطة للنجمة الأولى" % GOALS[level][0]})
