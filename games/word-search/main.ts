/** «البحث عن الكلمات»: اسحب على الحروف حتى تحدد الكلمة */
import { clear, COLORS, createGame, frame, rrect, sdk, text, type Level, type Point } from '../../packages/spir-kit/index.ts';
import { lineCells, makePuzzle, match, starsFor, type Placed, type Puzzle } from './logic.ts';

const MARKS = [COLORS.yellow, '#FFB3D1', '#B7F0C8', '#C9CEF5', '#FFD3B0', '#B9EDE7', '#E2D4FF', '#FFE58A'];

createGame((g) => {
  let level: Level = 'easy';
  let stage = 1;
  let puzzle: Puzzle = makePuzzle('easy', 1);
  let found = new Set<string>();
  let foundOrder: Placed[] = [];
  let sel: { a: number; b: number } | null = null;
  let mistakes = 0;
  let over = false;

  let cs = 40;
  let ox = 20;
  let oy = 120;
  const layout = () => {
    const board = Math.min(g.w - 28, g.h - 270);
    cs = board / puzzle.size;
    ox = (g.w - board) / 2;
    oy = Math.max(90, (g.h - board - 150) / 2 + 10);
  };
  const cellAt = (p: Point) => {
    const x = Math.floor((p.x - ox) / cs);
    const y = Math.floor((p.y - oy) / cs);
    return x >= 0 && y >= 0 && x < puzzle.size && y < puzzle.size ? y * puzzle.size + x : -1;
  };
  const center = (i: number) => ({ x: ox + (i % puzzle.size + 0.5) * cs, y: oy + (Math.floor(i / puzzle.size) + 0.5) * cs });
  const hud = () => sdk.hud(puzzle.title, `${found.size}/${puzzle.words.length}`);

  const capsule = (c: CanvasRenderingContext2D, a: number, b: number, color: string, alpha: number) => {
    const pa = center(a);
    const pb = center(b);
    c.save();
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineCap = 'round';
    c.lineWidth = cs * 0.78;
    c.beginPath();
    c.moveTo(pa.x, pa.y);
    c.lineTo(pb.x + 0.01, pb.y);
    c.stroke();
    c.restore();
  };

  return {
    start(s) {
      level = s.level;
      stage = s.stage;
      puzzle = makePuzzle(level, stage);
      found = new Set();
      foundOrder = [];
      sel = null;
      mistakes = 0;
      over = false;
      layout();
      hud();
    },
    down(p) {
      if (over) return;
      const i = cellAt(p);
      if (i >= 0) sel = { a: i, b: i };
    },
    move(p) {
      if (!sel) return;
      const i = cellAt(p);
      if (i >= 0 && lineCells(puzzle.size, sel.a, i)) sel.b = i;
    },
    async up() {
      if (!sel) return;
      const cells = lineCells(puzzle.size, sel.a, sel.b);
      sel = null;
      if (!cells || cells.length < 2) return;
      const w = match(puzzle, cells, found);
      if (w) {
        found.add(w.word);
        foundOrder.push(w);
        g.sound('ok');
        sdk.vibrate();
        hud();
        if (found.size === puzzle.words.length) {
          over = true;
          g.sound('win');
          await g.wait(600);
          sdk.complete({ stars: starsFor(mistakes), score: found.size, title: 'لگيت كل الكلمات!', subtitle: `موضوع: ${puzzle.title}` });
        }
      } else {
        mistakes++;
        g.sound('bad');
      }
    },
    draw(c) {
      layout();
      clear(c, g.w, g.h);
      text(c, `الموضوع: ${puzzle.title}`, g.w / 2, oy - 30, { size: 16, color: COLORS.royal });
      frame(c, ox - 6, oy - 6, cs * puzzle.size + 12, cs * puzzle.size + 12, 14, COLORS.card);
      foundOrder.forEach((w, k) => {
        const len = [...w.word].length - 1;
        capsule(c, w.y * puzzle.size + w.x, (w.y + w.dy * len) * puzzle.size + w.x + w.dx * len, MARKS[k % MARKS.length], 0.85);
      });
      if (sel) capsule(c, sel.a, sel.b, COLORS.royal, 0.25);
      for (let i = 0; i < puzzle.grid.length; i++) {
        const p = center(i);
        text(c, puzzle.grid[i], p.x, p.y + 1, { size: cs * 0.52, color: COLORS.navy, weight: 700 });
      }
      // قائمة الكلمات تحت
      const listY = oy + cs * puzzle.size + 26;
      const cols = 4;
      const colW = (g.w - 24) / cols;
      puzzle.words.forEach((w, k) => {
        const x = g.w - 12 - (k % cols + 0.5) * colW;
        const y = listY + Math.floor(k / cols) * 34;
        const done = found.has(w.word);
        rrect(c, x - colW / 2 + 3, y - 13, colW - 6, 26, 8);
        c.fillStyle = done ? COLORS.yellow : COLORS.card;
        c.fill();
        text(c, w.word, x, y + 1, { size: 13, color: done ? COLORS.navy : COLORS.muted, weight: done ? 700 : 600 });
      });
    },
  };
});
