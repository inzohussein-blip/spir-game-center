/**
 * «قفزة سبير» — لعبة منصات بمحرك Phaser 3 (أول لعبة بمحرك ثاني بالمنصة).
 * سبير يركض ويقفز، يجمع السمك والنجوم، يدعس على المخلوقات، ويوصل للعلم.
 * نفس رسوم المنصة (spir-art) ونفس الصوت (spir-engine/audio) ونفس الجسر (spir-kit/sdk).
 */
import Phaser from 'phaser';
import { catFull, cloud, creature, fish, goalFlag, groundTile, heart, mushroom, padButton, plankTile, sky, sparkle, starIcon, THEMES } from '../../packages/spir-art/index.ts';
import { Audio } from '../../packages/spir-engine/audio.ts';
import { FONT_BODY, FONT_DISPLAY, loadFonts } from '../../packages/spir-engine/fonts.ts';
import { listen, send, type Settings } from '../../packages/spir-kit/sdk.ts';
import { BOSS_HP, ENEMY_SPEED, groundHeights, LIVES, makeLevel, ROWS, skyOf, starsFor, worldOf } from './logic.ts';

const TILE = 48;
const RUN = 230;
const JUMP = 700;
const BOUNCE = 1060;
const GRAVITY = 1500;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

type Art = { svg: string; w: number; h: number };

/** SVG → canvas بدقة الشاشة (Phaser يستعمله كـ texture) */
function raster(a: Art, k: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(a.w * k));
      c.height = Math.max(1, Math.round(a.h * k));
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      resolve(c);
    };
    img.onerror = () => resolve(document.createElement('canvas'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg);
  });
}

const audio = new Audio();
let settings: Settings = { level: 'easy', stage: 1, sound: true, players: 1 };

class Play extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  planks!: Phaser.Physics.Arcade.StaticGroup;
  enemies!: Phaser.Physics.Arcade.Group;
  fishes!: Phaser.Physics.Arcade.StaticGroup;
  stars!: Phaser.Physics.Arcade.StaticGroup;
  bouncers!: Phaser.Physics.Arcade.StaticGroup;
  goal!: Phaser.Physics.Arcade.Image;
  lives = 3;
  fishCount = 0;
  starCount = 0;
  start = { x: 0, y: 0 };
  safe = { x: 0, y: 0 };
  hurtUntil = 0;
  over = false;
  worldW = 0;
  input2 = { left: false, right: false, jump: false };
  jumpHeld = false;
  wasOnFloor = false;
  baseScale = { x: 1, y: 1 };
  heights: number[] = [];
  movers!: Phaser.Physics.Arcade.Group;
  boss: Phaser.Physics.Arcade.Sprite | null = null;
  bossHp = 0;
  bossHitUntil = 0;

  constructor() {
    super('play');
  }

  hud() {
    const text = this.boss?.active ? `الزعيم: ${'♥'.repeat(this.bossHp)}` : `المرحلة ${settings.stage}`;
    send({ type: 'hud', text, score: `${this.fishCount} سمكة · ${this.starCount}/3 ★` });
    this.game.events.emit('hud', { lives: this.lives, fish: this.fishCount, stars: this.starCount });
  }

  create() {
    const stage = settings.stage;
    const snow = worldOf(stage) === 2;
    const { grid, width } = makeLevel(stage);
    this.heights = groundHeights(grid);
    this.worldW = width * TILE;
    const worldH = ROWS * TILE;
    this.lives = LIVES[settings.level];
    this.fishCount = 0;
    this.starCount = 0;
    this.over = false;
    this.hurtUntil = 0;
    this.physics.world.setBounds(0, -TILE * 4, this.worldW, worldH + TILE * 8);
    this.physics.world.gravity.y = GRAVITY;

    // الخلفية: سماء ثابتة + غيوم بطيئة (parallax)
    const cam = this.cameras.main;
    const zoom = Math.min(this.scale.height / (worldH + TILE * 0.5), this.scale.width / (TILE * 8.5));
    cam.setZoom(zoom);
    this.game.events.emit('theme', `sky${skyOf(stage)}`);

    this.solids = this.physics.add.staticGroup();
    this.planks = this.physics.add.staticGroup();
    this.fishes = this.physics.add.staticGroup();
    this.stars = this.physics.add.staticGroup();
    this.bouncers = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ allowGravity: true });
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.boss = null;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < width; x++) {
        const ch = grid[y][x];
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        if (ch === '#') {
          const isTop = y === 0 || grid[y - 1][x] !== '#';
          this.solids.create(cx, cy, snow ? (isTop ? 'snowTop' : 'rock') : isTop ? 'grassTop' : 'dirt').setDisplaySize(TILE, TILE).refreshBody();
        } else if (ch === '=') {
          const p = this.planks.create(cx, y * TILE + TILE / 4, 'plank') as Phaser.Physics.Arcade.Image;
          p.setDisplaySize(TILE, TILE / 2).refreshBody();
          // منصة باتجاه واحد: تنزل عليها من فوق بس
          const b = p.body as Phaser.Physics.Arcade.StaticBody;
          b.checkCollision.down = false;
          b.checkCollision.left = false;
          b.checkCollision.right = false;
        } else if (ch === 'f') {
          const f = this.fishes.create(cx, cy, 'fish') as Phaser.Physics.Arcade.Image;
          f.setDisplaySize(30, 21).refreshBody();
          this.tweens.add({ targets: f, y: cy - 5, yoyo: true, repeat: -1, duration: 700 + (x % 5) * 60, ease: 'Sine.inOut' });
        } else if (ch === '*') {
          const s = this.stars.create(cx, cy, 'star') as Phaser.Physics.Arcade.Image;
          s.setDisplaySize(40, 40).refreshBody();
          this.tweens.add({ targets: s, angle: 12, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.inOut' });
        } else if (ch === 'b') {
          this.bouncers.create(cx, cy + 2, 'mushroom').setDisplaySize(TILE, TILE).refreshBody();
        } else if (ch === 'e') {
          const kind = ['cr1', 'cr2', 'cr5'][(x + y) % 3];
          const e = this.enemies.create(cx, cy - 4, kind) as Phaser.Physics.Arcade.Sprite;
          e.setDisplaySize(44, 44);
          e.body?.setSize(e.width * 0.6, e.height * 0.55).setOffset(e.width * 0.2, e.height * 0.35);
          e.setVelocityX(-ENEMY_SPEED[settings.level]);
          e.setData('speed', ENEMY_SPEED[settings.level]);
        } else if (ch === 'm') {
          // منصة تتحرك فوق الفراغ: من أول عمود فارغ لآخر عمود فارغ
          let end = x;
          while (end + 1 < width && this.heights[end + 1] === 0) end++;
          const m = this.movers.create(x * TILE + TILE, y * TILE + TILE / 4, 'plank') as Phaser.Physics.Arcade.Image;
          m.setDisplaySize(TILE * 2, TILE / 2);
          const mb = m.body as Phaser.Physics.Arcade.Body;
          mb.checkCollision.down = false;
          mb.checkCollision.left = false;
          mb.checkCollision.right = false;
          m.setData('min', x * TILE + TILE).setData('max', end * TILE);
          m.setVelocityX(settings.level === 'hard' ? 85 : 60);
        } else if (ch === 'B') {
          const b = this.physics.add.sprite(cx, cy - 40, 'boss');
          b.setDisplaySize(118, 118);
          b.body?.setSize(b.width * 0.62, b.height * 0.55).setOffset(b.width * 0.19, b.height * 0.38);
          b.setData('min', cx - TILE * 5).setData('max', cx + TILE * 5);
          b.setVelocityX(-ENEMY_SPEED[settings.level]);
          b.setDepth(5);
          this.boss = b;
          this.bossHp = BOSS_HP;
        } else if (ch === 'P') {
          this.start = { x: cx, y: cy };
        } else if (ch === 'G') {
          this.goal = this.physics.add.staticImage(cx, y * TILE + TILE - 70, 'flag').setDisplaySize(60, 105).refreshBody() as unknown as Phaser.Physics.Arcade.Image;
        }
      }
    }
    this.safe = { ...this.start };
    // تراب تحت حدود المرحلة حتى الأرض ما تبين طايرة
    this.heights.forEach((h, x) => {
      if (!h) return;
      for (let y = ROWS; y < ROWS + 6; y++) this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, snow ? 'rock' : 'dirt').setDisplaySize(TILE + 1, TILE + 1);
    });

    // سبير
    this.player = this.physics.add.sprite(this.start.x, this.start.y, 'spir');
    this.player.setDisplaySize(52, 76);
    this.baseScale = { x: this.player.scaleX, y: this.player.scaleY };
    this.player.body?.setSize(this.player.width * 0.55, this.player.height * 0.82).setOffset(this.player.width * 0.22, this.player.height * 0.16);
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.planks);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.enemies, this.planks);
    this.physics.add.overlap(this.player, this.fishes, (_p, f) => this.eatFish(f as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.stars, (_p, s) => this.getStar(s as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.bouncers, (_p, b) => this.bounce(b as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.touchEnemy(e as Phaser.Physics.Arcade.Sprite));
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.collider(this.enemies, this.movers);
    this.physics.add.overlap(this.player, this.goal, () => this.win());
    if (this.boss) {
      this.physics.add.collider(this.boss, this.solids);
      this.physics.add.overlap(this.player, this.boss, () => this.touchBoss());
      // العلم يطلع بس بعد ما ينغلب الزعيم
      this.goal.setVisible(false);
    }

    cam.setBounds(0, -TILE * 0.5, this.worldW, worldH + TILE);
    cam.startFollow(this.player, true, 0.12, 0.12, 0, 40);

    // لوحة المفاتيح (للويب)
    const keys = this.input.keyboard?.createCursorKeys();
    this.events.on('update', () => {
      if (!keys) return;
      this.input2.left = keys.left.isDown || this.registry.get('left');
      this.input2.right = keys.right.isDown || this.registry.get('right');
      this.input2.jump = keys.up.isDown || keys.space.isDown || this.registry.get('jump');
    });
    this.hud();
    // طبقة الأزرار تنفتح بعد هالمشهد — نعيد التحديث حتى العدّاد يبين من أول لحظة
    this.time.delayedCall(60, () => this.hud());
    audio.music([64, 60, 67, 57][skyOf(stage)]);
  }

  eatFish(f: Phaser.Physics.Arcade.Image) {
    this.fishCount++;
    audio.play('coin');
    this.burst(f.x, f.y, 'sparkW', 5);
    f.destroy();
    this.hud();
  }

  getStar(s: Phaser.Physics.Arcade.Image) {
    this.starCount++;
    audio.play('star');
    send({ type: 'vibrate' });
    this.burst(s.x, s.y, 'spark', 14);
    s.destroy();
    this.hud();
  }

  bounce(b: Phaser.Physics.Arcade.Image) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y < 0) return;
    body.setVelocityY(-BOUNCE);
    audio.play('pop');
    this.tweens.add({ targets: b, scaleY: b.scaleY * 0.6, yoyo: true, duration: 110 });
  }

  touchEnemy(e: Phaser.Physics.Arcade.Sprite) {
    if (!e.active || this.over) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    // دعسة من فوق: المخلوق يطير ويختفي
    if (body.velocity.y > 50 && this.player.y < e.y - 14) {
      body.setVelocityY(-JUMP * 0.75);
      audio.play('merge');
      this.burst(e.x, e.y, 'spark', 10);
      e.disableBody(true, false);
      this.tweens.add({ targets: e, scaleY: 0.1, alpha: 0, y: e.y + 10, duration: 220, onComplete: () => e.destroy() });
      this.fishCount += 2;
      this.hud();
      return;
    }
    this.hurt(e.x < this.player.x ? 1 : -1);
  }

  touchBoss() {
    const b = this.boss;
    if (!b?.active || this.over) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.y > 50 && this.player.y < b.y - 30) {
      body.setVelocityY(-JUMP * 0.95);
      if (this.time.now < this.bossHitUntil) return;
      this.bossHitUntil = this.time.now + 700;
      this.bossHp--;
      audio.play('merge');
      send({ type: 'vibrate' });
      this.cameras.main.shake(200, 0.01);
      this.burst(b.x, b.y - 30, 'spark', 14);
      this.tweens.add({ targets: b, alpha: 0.4, yoyo: true, repeat: 3, duration: 90 });
      // كل ضربة يصير أسرع
      const sp = (ENEMY_SPEED[settings.level] * (1 + (BOSS_HP - this.bossHp) * 0.45)) | 0;
      b.setVelocityX(Math.sign((b.body as Phaser.Physics.Arcade.Body).velocity.x || 1) * sp);
      if (this.bossHp <= 0) {
        b.disableBody(true, false);
        audio.play('unlock');
        for (let i = 0; i < 5; i++) this.time.delayedCall(i * 120, () => this.burst(b.x + (Math.random() - 0.5) * 80, b.y - 40, 'spark', 10));
        this.tweens.add({ targets: b, scaleX: 0.01, scaleY: 0.01, angle: 360, duration: 600, onComplete: () => b.destroy() });
        this.goal.setVisible(true).setScale(this.goal.scaleX * 0.2, this.goal.scaleY * 0.2);
        this.tweens.add({ targets: this.goal, scaleX: this.goal.scaleX * 5, scaleY: this.goal.scaleY * 5, duration: 500, ease: 'Back.out' });
        this.fishCount += 10;
      }
      this.hud();
      return;
    }
    this.hurt(b.x < this.player.x ? 1 : -1);
  }

  hurt(dir: number, free = false) {
    if (this.time.now < this.hurtUntil || this.over) return;
    if (!free) this.lives--;
    this.hurtUntil = this.time.now + 1400;
    audio.play('bump');
    send({ type: 'vibrate' });
    this.cameras.main.shake(180, 0.006);
    this.player.setTexture('spirScared');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(dir * 260, -380);
    this.tweens.add({ targets: this.player, alpha: 0.3, yoyo: true, repeat: 5, duration: 110, onComplete: () => this.player.setAlpha(1).setScale(this.baseScale.x, this.baseScale.y) });
    this.hud();
    if (this.lives <= 0) void this.lose();
  }

  async lose() {
    this.over = true;
    audio.play('lose');
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, -500);
    this.player.setTexture('spirScared');
    await new Promise((r) => this.time.delayedCall(1300, r));
    send({ type: 'over', score: this.fishCount, title: 'خلصت القلوب', subtitle: `جمعت ${this.fishCount} سمكة — جرّب مرة ثانية` });
  }

  async win() {
    if (this.over || this.boss?.active) return;
    this.over = true;
    audio.play('win');
    send({ type: 'vibrate' });
    this.player.setTexture('spirHappy');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -JUMP);
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 180, () => this.burst(this.goal.x + (Math.random() - 0.5) * 120, this.goal.y - 60, 'spark', 12));
    await new Promise((r) => this.time.delayedCall(1500, r));
    send({ type: 'complete', stars: starsFor(this.starCount), score: this.fishCount, title: this.starCount === 3 ? 'كل النجوم!' : 'وصلت للعلم!', subtitle: `المرحلة ${settings.stage}: ${this.fishCount} سمكة و ${this.starCount} من 3 نجوم` });
  }

  burst(x: number, y: number, key: string, n: number) {
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, key).setDisplaySize(14, 14).setDepth(20);
      const a = Math.random() * Math.PI * 2;
      const d = 30 + Math.random() * 50;
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 20, alpha: 0, angle: 180, duration: 500 + Math.random() * 300, onComplete: () => p.destroy() });
    }
  }

  update(_t: number, dt: number) {
    if (!this.player?.body) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down || body.touching.down;
    // الأعداء: يمشون ويرجعون عند الحيطان والحافات
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      const eb = e.body as Phaser.Physics.Arcade.Body | null;
      if (!eb || !e.active) return;
      const sp = e.getData('speed') as number;
      const ahead = e.x + Math.sign(eb.velocity.x || -1) * 24;
      const below = this.solids.getChildren().some((g) => {
        const s = g as Phaser.Physics.Arcade.Image;
        return Math.abs(s.x - ahead) < TILE / 2 && s.y > e.y && s.y - e.y < TILE * 1.2;
      }) || this.planks.getChildren().some((g) => {
        const s = g as Phaser.Physics.Arcade.Image;
        return Math.abs(s.x - ahead) < TILE / 2 && s.y > e.y && s.y - e.y < TILE;
      });
      if (eb.blocked.left || (eb.velocity.x < 0 && !below)) eb.setVelocityX(sp);
      else if (eb.blocked.right || (eb.velocity.x > 0 && !below)) eb.setVelocityX(-sp);
      e.setFlipX(eb.velocity.x > 0);
      e.setScale(e.scaleX, e.scaleX * (1 + Math.sin(this.time.now / 120 + e.x) * 0.04));
    });
    // المنصات المتحركة: رايح جاي بين حدودها
    this.movers.getChildren().forEach((obj) => {
      const m = obj as Phaser.Physics.Arcade.Image;
      const mb = m.body as Phaser.Physics.Arcade.Body;
      if (m.x <= m.getData('min')) mb.setVelocityX(Math.abs(mb.velocity.x));
      else if (m.x >= m.getData('max')) mb.setVelocityX(-Math.abs(mb.velocity.x));
    });
    // الزعيم: يمشي بساحته ويقفز أحياناً
    const b = this.boss;
    if (b?.active) {
      const bb = b.body as Phaser.Physics.Arcade.Body;
      if (b.x <= b.getData('min')) bb.setVelocityX(Math.abs(bb.velocity.x));
      else if (b.x >= b.getData('max')) bb.setVelocityX(-Math.abs(bb.velocity.x));
      b.setFlipX(bb.velocity.x > 0);
      if (bb.blocked.down && Math.random() < 0.006) bb.setVelocityY(-560);
    }
    if (this.over) return;

    const { left, right, jump } = this.input2;
    if (left === right) body.setVelocityX(body.velocity.x * 0.75);
    else body.setVelocityX(left ? -RUN : RUN);
    if (left !== right) this.player.setFlipX(left);
    // قفز (القفزة أطول إذا ضاغط)
    if (jump && onFloor && !this.jumpHeld) {
      body.setVelocityY(-JUMP);
      audio.play('tap');
    }
    if (!jump && body.velocity.y < -250) body.setVelocityY(body.velocity.y * 0.85);
    this.jumpHeld = jump;
    // شكل سبير: يميل بالركض، وينضغط لما ينزل
    if (onFloor && !this.wasOnFloor) {
      this.tweens.killTweensOf(this.player);
      this.player.setScale(this.baseScale.x * 1.12, this.baseScale.y * 0.85).setAlpha(1);
      this.tweens.add({ targets: this.player, scaleX: this.baseScale.x, scaleY: this.baseScale.y, duration: 140, ease: 'Back.out' });
      audio.play('bump');
    }
    this.wasOnFloor = onFloor;
    this.player.setAngle(onFloor ? Math.sin(this.time.now / 70) * (Math.abs(body.velocity.x) > 20 ? 5 : 0) : body.velocity.x * 0.02);
    if (this.time.now > this.hurtUntil) this.player.setTexture(onFloor ? 'spir' : 'spirHappy');
    if (onFloor) this.safe = { x: this.player.x, y: this.player.y - 10 };
    // وگع بفراغ: يخسر قلب ويرجع لآخر مكان آمن
    if (this.player.y > ROWS * TILE + TILE * 2) {
      // بالسهل الوگعة ما تاكل قلب (للصغار) — بس ترجّعه
      this.hurt(0, settings.level === 'easy');
      if (!this.over) {
        // نرجع لأقرب عمود فيه أرض قبل الفراغ، فوق سطحه بالضبط
        let col = Math.max(0, Math.floor(this.safe.x / TILE) - 1);
        while (col > 0 && !this.heights[col]) col--;
        const topY = (ROWS - this.heights[col]) * TILE;
        this.player.setPosition(col * TILE + TILE / 2, topY - 60);
        body.setVelocity(0, 0);
      }
    }
    void dt;
  }
}

/** الخلفية: سماء تملي الشاشة وغيوم تتحرك ببطء (ورا اللعب) */
class Bg extends Phaser.Scene {
  constructor() {
    super('bg');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const img = this.add.image(w / 2, h / 2, 'sky0').setDisplaySize(w, h);
    const clouds = [0, 1, 2, 3].map((i) => this.add.image((i * w) / 3, h * (0.08 + (i % 3) * 0.1), 'cloud').setScale(0.6 + (i % 2) * 0.25).setAlpha(0.95));
    this.game.events.on('theme', (key: string) => img.setTexture(key).setDisplaySize(w, h));
    this.events.on('update', (_t: number, dt: number) => {
      for (const c of clouds) {
        c.x -= dt * 0.012;
        if (c.x < -c.displayWidth) c.x = w + c.displayWidth / 2;
      }
    });
  }
}

/** طبقة الأزرار والقلوب (ثابتة فوق اللعبة) */
class Hud extends Phaser.Scene {
  hearts: Phaser.GameObjects.Image[] = [];
  starText!: Phaser.GameObjects.Text;
  fishText!: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const s = DPR;
    const mk = (key: string, x: number, y: number, flag: 'left' | 'right' | 'jump') => {
      const b = this.add.image(x, y, key).setDisplaySize(84 * s, 84 * s).setAlpha(0.9).setInteractive();
      const set = (on: boolean) => {
        this.registry.set(flag, on);
        b.setAlpha(on ? 1 : 0.8);
      };
      b.on('pointerdown', () => {
        audio.unlock();
        set(true);
      });
      b.on('pointerup', () => set(false));
      b.on('pointerout', () => set(false));
      return b;
    };
    mk('btnLeft', 70 * s, h - 70 * s, 'left');
    mk('btnRight', 170 * s, h - 70 * s, 'right');
    mk('btnJump', w - 76 * s, h - 76 * s, 'jump');
    this.hearts = [];
    for (let i = 0; i < LIVES[settings.level]; i++) this.hearts.push(this.add.image(24 * s + i * 30 * s, 26 * s, 'heart').setDisplaySize(26 * s, 26 * s));
    const style = { fontFamily: `'${FONT_BODY}', Tahoma, sans-serif`, fontSize: `${18 * s}px`, color: '#2A2350', fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 5 * s };
    this.starText = this.add.text(w - 16 * s, 14 * s, '', style).setOrigin(1, 0);
    this.fishText = this.add.text(w - 16 * s, 40 * s, '', style).setOrigin(1, 0);
    const play = this.scene.get('play');
    const onHud = (d: { lives: number; fish: number; stars: number }) => {
      this.hearts.forEach((hh, i) => hh.setTexture(i < d.lives ? 'heart' : 'heartOff'));
      this.starText.setText(`★ ${d.stars}/3`);
      this.fishText.setText(`سمك ${d.fish}`);
    };
    this.game.events.on('hud', onHud);
    this.events.once('shutdown', () => this.game.events.off('hud', onHud));
    void play;
  }
}

class Boot extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  async create() {
    // الرسوم بدقة الكاميرا (مرة وحدة)
    const zoom = Math.min(this.scale.height / (ROWS * TILE + TILE * 0.5), this.scale.width / (TILE * 8.5));
    const k = zoom * 1.05;
    const defs: Record<string, [Art, number]> = {
      sky0: [sky(THEMES[0], 390, 900), (this.scale.height / 900) * 1.02],
      sky1: [sky(THEMES[1], 390, 900), (this.scale.height / 900) * 1.02],
      sky2: [sky(THEMES[2], 390, 900), (this.scale.height / 900) * 1.02],
      sky3: [sky(THEMES[3], 390, 900), (this.scale.height / 900) * 1.02],
      snowTop: [groundTile(TILE, true, '#F4FAFF', '#7F95C9'), k],
      rock: [groundTile(TILE, false, '#F4FAFF', '#7F95C9'), k],
      boss: [creature(9, 128), k],
      cloud: [cloud(1), DPR],
      grassTop: [groundTile(TILE, true), k],
      dirt: [groundTile(TILE, false), k],
      plank: [plankTile(TILE), k],
      fish: [fish(36), k],
      star: [starIcon(48), k],
      mushroom: [mushroom(TILE), k],
      flag: [goalFlag(140), k],
      cr1: [creature(1, 64), k],
      cr2: [creature(2, 64), k],
      cr5: [creature(5, 64), k],
      spir: [catFull('orange', 'open', 'smile', true), k * 0.45],
      spirHappy: [catFull('orange', 'happy', 'open', true), k * 0.45],
      spirScared: [catFull('orange', 'scared', 'o', true), k * 0.45],
      spark: [sparkle(), k],
      sparkW: [sparkle('#FFFFFF'), k],
      heart: [heart(32, true), DPR],
      heartOff: [heart(32, false), DPR],
      btnLeft: [padButton(84, 'left'), DPR],
      btnRight: [padButton(84, 'right'), DPR],
      btnJump: [padButton(84, 'jump'), DPR],
    };
    const canvases = await Promise.all(Object.entries(defs).map(async ([key, [a, kk]]) => [key, await raster(a, kk)] as const));
    for (const [key, c] of canvases) {
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addCanvas(key, c);
    }
    started = true;
    this.scene.launch('bg');
    this.scene.start('play');
    this.scene.launch('hud');
  }
}

let started = false;
let game: Phaser.Game | null = null;

function restart() {
  if (!game || !started) return;
  audio.setOn(settings.sound);
  game.scene.stop('hud');
  game.scene.stop('play');
  game.scene.start('play');
  game.scene.start('hud');
}

async function boot() {
  document.documentElement.style.cssText = 'margin:0;height:100%;background:#62C6FF';
  document.body.style.cssText = 'margin:0;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none';
  await loadFonts();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: document.body,
    width: window.innerWidth * DPR,
    height: window.innerHeight * DPR,
    backgroundColor: '#62C6FF',
    banner: false,
    audio: { noAudio: true },
    input: { activePointers: 3 },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug: false } },
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR },
    render: { antialias: true, pixelArt: false },
    scene: [Boot, Bg, Play, Hud],
  });
  game.canvas.addEventListener('pointerdown', () => audio.unlock());
  // للاختبارات الآلية بس (#test بالرابط)
  if (location.hash === '#test') (window as unknown as { __game: Phaser.Game }).__game = game;
  listen((m) => {
    if (m.type === 'start') {
      settings = m.settings;
      restart();
    } else if (m.type === 'pause') {
      game?.scene.pause('play');
    } else if (m.type === 'resume') {
      game?.scene.resume('play');
    } else if (m.type === 'sound') audio.setOn(m.on);
  });
  send({ type: 'ready' });
}

void boot();
