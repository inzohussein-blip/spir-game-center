extends Node
## الجسر بين لعبة Godot والتطبيق — نفس رسائل packages/spir-kit/sdk.ts.
## الصفحة (shell.ts) تعرّف window.spirSend و window.spirSfx وتنادي window.spirGodotReceive.
## الصوت كله من الصفحة (spir-engine/audio)، وصوت Godot نفسه مطفي (Dummy) حتى ما يحتاج worklets.

signal start(settings: Dictionary)
signal pause_changed(paused: bool)

var settings := {"level": "easy", "stage": 1, "sound": true, "players": 1}
var sound_on := true
var _cb: JavaScriptObject # لازم نحتفظ بيه حتى ما ينمسح
var _win: JavaScriptObject # بدون eval: سياسة الأمان تمنعه، فنستدعي الدوال مباشرة


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if OS.has_feature("web"):
		_cb = JavaScriptBridge.create_callback(_on_host)
		_win = JavaScriptBridge.get_interface("window")
		_win.spirGodotReceive = _cb
		# بعد ما المشهد الرئيسي يربط الإشارات
		_announce.call_deferred()
	else:
		# تشغيل من المحرّر: نبدي مباشرة
		start.emit.call_deferred(settings)


func _announce() -> void:
	_win.spirGodotReady()


func _on_host(args: Array) -> void:
	var msg = JSON.parse_string(str(args[0]))
	if typeof(msg) != TYPE_DICTIONARY:
		return
	match str(msg.get("type", "")):
		"start":
			var s = msg.get("settings", {})
			if typeof(s) == TYPE_DICTIONARY:
				settings.merge(s, true)
			sound_on = bool(settings.get("sound", true))
			start.emit(settings)
		"pause":
			pause_changed.emit(true)
		"resume":
			pause_changed.emit(false)
		"sound":
			sound_on = bool(msg.get("on", true))


func send(msg: Dictionary) -> void:
	if OS.has_feature("web"):
		_win.spirSend(JSON.stringify(msg))
	else:
		print("spir → ", msg)


func sfx(sound_name: String) -> void:
	if sound_on and _win:
		_win.spirSfx(sound_name)


func vibrate() -> void:
	send({"type": "vibrate"})
