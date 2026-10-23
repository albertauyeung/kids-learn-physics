// Walk Pip along a number line; live distance vs displacement.
// params: { tasks: [{ distance, displacement }] }  (empty → free play)

import { makeStage, loop, sky, ground, ruler, arrow, tag, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt, fmtSigned } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function walker(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  const W = 480, H = 200, MIN = -10, MAX = 10;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const xOf = (m) => 30 + ((m - MIN) / (MAX - MIN)) * (W - 60);

  let pos = 0, shown = 0, dist = 0, facing = 1, trail = [];
  const ro = readout();

  const step = (d) => {
    if (pos + d < MIN || pos + d > MAX) return;
    pos += d;
    dist += 1;
    facing = d;
    trail.push(pos);
    sfx.click();
    update();
  };
  const reset = () => {
    pos = 0; dist = 0; trail = [];
    update();
  };

  el.append(
    controls(button('◀ Left', () => step(-1)), button('Right ▶', () => step(1)), button('Reset', reset)),
    ro.el,
  );

  function update() {
    ro.set([
      ['Distance walked', `${fmt(dist)} m`],
      ['Displacement (from start)', `${fmtSigned(pos)} m`],
    ]);
    if (!tasks.length) {
      banner.set('Free walk: watch how distance and displacement change.');
      return;
    }
    if (taskIdx >= tasks.length) return;
    const t = tasks[taskIdx];
    const goal = `Task ${taskIdx + 1}/${tasks.length}: make <b>distance = ${t.distance} m</b> and <b>displacement = ${fmtSigned(t.displacement)} m</b>`;
    if (dist === t.distance && pos === t.displacement) {
      sfx.correct();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set('All tasks complete! 🎉', true);
        api.done();
      } else {
        banner.set(`Nice! ${goal.replace(/^Task.*?:/, 'Done:')} — next task coming...`, true);
        setTimeout(() => { reset(); }, 1200);
      }
    } else {
      banner.set(goal + (dist > t.distance ? ' <span class="bad-text">(too far — press Reset)</span>' : ''));
    }
  }

  window.addEventListener('keydown', onKey);
  function onKey(e) {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  }

  const stop = loop((dt, t) => {
    shown += (pos - shown) * Math.min(1, dt * 12);
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 140, W, 20, 60);
    ruler(ctx, xOf, 150, MIN, MAX, 1, 5);
    // start marker
    drawSprite(ctx, 'flag', xOf(0) + 8, 140, 2);
    // displacement arrow
    if (Math.abs(pos) > 0.01) {
      arrow(ctx, xOf(0), 52, xOf(pos), 52, '#fcee4b', 5);
      tag(ctx, `displacement ${fmtSigned(pos)} m`, (xOf(0) + xOf(pos)) / 2, 44, { color: '#fcee4b' });
    }
    // trail dots for distance
    trail.forEach((p, i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(xOf(p) - 2, 128 - (i % 3) * 3, 4, 2);
    });
    const bob = Math.abs(pos - shown) > 0.02 ? Math.sin(t * 20) * 1.5 : 0;
    drawSprite(ctx, 'hero', xOf(shown), 140 + bob, 3, { flip: facing < 0 });
    tag(ctx, `distance ${fmt(dist)} m`, W - 70, 20);
  });

  update();
  return () => {
    stop();
    window.removeEventListener('keydown', onKey);
  };
}
