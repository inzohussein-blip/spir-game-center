/** «الطيارة الطايرة»: اضغط حتى تصعد، وعدّي من فتحات الأبراج */
import { clear, COLORS, createGame, rng, rrect, sdk, text, type Level } from '../../packages/spir-kit/index.ts';
import { fly, hits, newTower, STARS, starsFor, TOWER_W, TUNING, type Plane, type Tower } from './logic.ts';

createGame((g) => {
  let level: Level = 'easy';
  let plane: Plane = { y: 300, vy: 0 };
  let towers: Tower[] = [];
  let passed = 0;
  let started = false;
  let over = false;
  let rand = rng(1).next;
  let clouds: { x: number; y: number; s: number }[] = [];
  const PX = 100;
  const R = 15;
  const ground = () => g.h - 40;

  const hud = () => sdk.hud(`الهدف ${STARS[level][2]}`, `عبرت ${passed}`);

  const crash = async () => {
    over = true;
    g.sound('lose');
    sdk.vibrate();
    await g.wait(800);
    const stars = starsFor(level, passed);
    if (stars > 0) sdk.complete({ stars, score: passed, title: 'رحلة حلوة!', subtitle: `عبرت ${passed} برج` });
    else sdk.over({ score: passed, title: 'اصطدمت!', subtitle: `عبرت ${passed} — اضغط ضغطات خفيفة` });
  };

  const flap = () => {
    if (over) return;
    started = true;
    plane = { ...plane, vy: -TUNING[level].lift };
    g.sound('tap');
  };

  return {
    start(s) {
      level = s.level;
      rand = rng(Date.now() % 100003).next;
      plane = { y: g.h * 0.42, vy: 0 };
      const t = TUNING[level];
      towers = [newTower(g.w + 60, ground(), t.gap, rand), newTower(g.w + 60 + t.spacing, ground(), t.gap, rand)];
      clouds = Array.from({ length: 6 }, () => ({ x: rand() * g.w, y: 40 + rand() * (g.h * 0.6), s: 0.6 + rand() * 0.8 }));
      passed = 0;
      started = false;
      over = false;
      hud();
    },
    update(dt) {
      const s = dt / 1000;
      const t = TUNING[level];
      for (const cl of clouds) {
        cl.x -= t.speed * 0.25 * cl.s * s;
        if (cl.x < -80) cl.x = g.w + 40;
      }
      if (!started) {
        plane = { y: g.h * 0.42 + Math.sin(g.now / 300) * 8, vy: 0 };
        return;
      }
      if (over) {
        if (plane.y < ground() - R) plane = fly(plane, s, t);
        return;
      }
      plane = fly(plane, s, t);
      for (const tw of towers) {
        tw.x -= t.speed * s;
        if (!tw.passed && tw.x + TOWER_W < PX - R) {
          tw.passed = true;
          passed++;
          g.sound('ok');
          hud();
        }
      }
      if (towers[0].x < -TOWER_W) {
        towers.shift();
        const last = towers[towers.length - 1];
        towers.push(newTower(last.x + t.spacing, ground(), t.gap, rand));
      }
      if (plane.y + R > ground() || plane.y - R < 0 || towers.some((tw) => hits(PX, plane, R - 3, tw, t.gap))) void crash();
    },
    down: flap,
    draw(c) {
      clear(c, g.w, g.h, '#BFE3FF');
      // غيوم
      for (const cl of clouds) {
        c.fillStyle = 'rgba(255,255,255,0.9)';
        for (const [dx, dy, r] of [[0, 0, 18], [18, -8, 22], [40, 0, 18]]) {
          c.beginPath();
          c.arc(cl.x + dx * cl.s, cl.y + dy * cl.s, r * cl.s, 0, Math.PI * 2);
          c.fill();
        }
      }
      const t = TUNING[level];
      // الأبراج: أزرق ملكي بشبابيك صفراء
      for (const tw of towers) {
        const topH = tw.gapY - t.gap / 2;
        const botY = tw.gapY + t.gap / 2;
        for (const [y, h] of [[-10, topH + 10], [botY, ground() - botY]] as [number, number][]) {
          rrect(c, tw.x, y, TOWER_W, h, 8);
          c.fillStyle = COLORS.royal;
          c.fill();
          c.fillStyle = 'rgba(255,214,10,0.8)';
          for (let wy = y + 12; wy < y + h - 14; wy += 22) for (const wx of [12, 34]) c.fillRect(tw.x + wx, wy, 10, 10);
        }
        rrect(c, tw.x - 5, topH - 14, TOWER_W + 10, 14, 5);
        c.fillStyle = COLORS.navy;
        c.fill();
        rrect(c, tw.x - 5, botY, TOWER_W + 10, 14, 5);
        c.fill();
      }
      // الأرض
      c.fillStyle = COLORS.green;
      c.fillRect(0, ground(), g.w, g.h - ground());
      // الطيارة: جسم أصفر، جناح كحلي، ذيل
      c.save();
      c.translate(PX, plane.y);
      c.rotate(Math.max(-0.5, Math.min(0.8, plane.vy / 600)));
      rrect(c, -20, -9, 40, 18, 9);
      c.fillStyle = COLORS.yellow;
      c.fill();
      c.strokeStyle = COLORS.navy;
      c.lineWidth = 2.5;
      c.stroke();
      c.beginPath();
      c.moveTo(-4, 0);
      c.lineTo(6, 16);
      c.lineTo(12, 16);
      c.lineTo(6, 0);
      c.closePath();
      c.fillStyle = COLORS.navy;
      c.fill();
      c.beginPath();
      c.moveTo(-18, -4);
      c.lineTo(-26, -16);
      c.lineTo(-20, -16);
      c.lineTo(-12, -6);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(10, -2, 4, 0, Math.PI * 2);
      c.fillStyle = '#BFE3FF';
      c.fill();
      c.restore();
      if (!started) text(c, 'اضغط بأي مكان حتى تطير', g.w / 2, g.h * 0.25, { size: 17, color: COLORS.navy });
      text(c, String(passed), g.w / 2, 60, { size: 40, color: COLORS.navy });
    },
  };
});
