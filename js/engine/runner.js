// Session runner: plays a lesson / problem set / boss as a queue of steps.
// Step types: info, sim, predict, q (template), numeric, mcq, equation.
// Wrong answers are re-queued (with fresh numbers when templated), Duolingo-style.

import { h, randomSeed } from '../core/util.js';
import { sfx } from '../core/sound.js';
import { recordAnswer, recordPrediction } from '../core/state.js';
import { spriteImg } from '../core/sprites.js';
import { renderQuestion } from './questions.js';
import { instantiate } from './templates.js';
import { mountWidget } from '../widgets/index.js';

const QUESTION_TYPES = new Set(['q', 'numeric', 'mcq', 'equation']);
const MAX_RETRIES = 2;
const SKIP_AFTER_MS = () => window.__KLP_SKIP_MS ?? 45000; // overridable for automated tests

export function runSession(root, { session, review = [], onFinish, onQuit }) {
  const steps = [...review.map((t) => ({ type: 'q', t, review: true })), ...session.steps];
  const queue = steps.map((step, i) => ({ step, key: `${session.id}#${i - review.length}`, attempt: 0 }));
  let idx = 0;
  let destroyWidget = null;
  let currentQ = null; // the question on screen (its number pad listens for key presses)
  let skipTimer = null;
  let combo = 0;
  let pendingReveal = null; // a prediction whose answer is shown once the next sim is done
  const stats = {
    firstTotal: 0, firstCorrect: 0, mistakes: 0, comboBonus: 0, predictBonus: 0,
    puzzleBonus: 0, puzzleSolved: false, achievements: [], bestCombo: 0, skipped: 0,
  };

  // ---------- layout ----------
  const bar = h('div', { class: 'xpbar' }, h('div', { class: 'xpbar-fill' }));
  const comboEl = h('div', { class: 'combo' });
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Quit', onClick: confirmQuit }, '✕');
  const top = h('div', { class: 'runner-top' }, h('div', { class: 'bar-inner' }, closeBtn, bar, comboEl));
  const stage = h('div', { class: 'runner-stage' });
  const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
  const mainBtn = h('button', { class: 'mc-btn big green', type: 'button' }, 'Check');
  const skipBtn = h('button', { class: 'link-btn', type: 'button', hidden: true }, 'Skip this challenge');
  const foot = h('div', { class: 'runner-foot' }, feedback, h('div', { class: 'foot-row' }, skipBtn, mainBtn));
  const wrap = h('div', { class: `runner type-${session.type}` }, top, stage, foot);
  root.append(wrap);

  let onMain = () => {};
  let switchedAt = 0;
  // A double tap must not also press the *next* button (skipping feedback or a card).
  const press = () => {
    if (modal) return; // the quit dialog is open
    if (performance.now() - switchedAt < (window.__KLP_TAP_GUARD_MS ?? 450)) return; // overridable for automated tests
    onMain();
  };
  mainBtn.addEventListener('click', press);
  // Enter = press the main button. Skip it when focus is on another button, whose own
  // Enter-click would otherwise fire as well (choices and unit chips are safe to repeat).
  const keyHandler = (e) => {
    if (e.key !== 'Enter' || e.repeat || mainBtn.disabled || modal) return;
    const a = document.activeElement;
    if (a?.tagName === 'BUTTON' && !a.matches('.choice.on, .unit-chip.on')) return;
    e.preventDefault();
    press();
  };
  window.addEventListener('keydown', keyHandler);

  function setMain(label, enabled, fn, cls = 'green') {
    mainBtn.textContent = label;
    mainBtn.disabled = !enabled;
    mainBtn.className = `mc-btn big ${cls}`;
    if (onMain !== fn) switchedAt = performance.now();
    onMain = fn;
  }

  function progress() {
    const pct = Math.round((idx / queue.length) * 100);
    bar.firstChild.style.width = `${pct}%`;
    comboEl.textContent = combo >= 3 ? `🔥 ${combo} combo` : '';
    comboEl.classList.toggle('hot', combo >= 5);
  }

  function cleanup() {
    destroyWidget?.();
    destroyWidget = null;
    currentQ?.destroy?.();
    currentQ = null;
    clearTimeout(skipTimer);
    skipBtn.hidden = true;
  }

  function show() {
    switchedAt = performance.now(); // new step: ignore a tap left over from the previous one
    cleanup();
    progress();
    stage.innerHTML = '';
    feedback.className = 'feedback';
    feedback.innerHTML = '';
    if (idx >= queue.length) return finish();
    const item = queue[idx];
    const { step } = item;
    stage.scrollTop = 0;
    window.scrollTo({ top: 0 });
    if (step.type === 'info') return showInfo(step);
    if (step.type === 'sim') return showSim(step);
    if (step.type === 'predict') return showPredict(step, item);
    if (QUESTION_TYPES.has(step.type)) return showQuestion(item);
    throw new Error(`Unknown step type ${step.type}`);
  }

  function next() {
    sfx.click();
    idx++;
    show();
  }

  // ---------- info ----------
  function showInfo(step) {
    const card = h('div', { class: 'card info-card' });
    if (step.title) card.append(h('h2', {}, step.title));
    const body = h('div', { class: 'info-body' });
    if (step.speaker !== false) {
      body.append(h('div', { class: 'speaker' }, spriteImg(step.speaker || 'hero', { scale: 4, cls: 'speaker-img' })));
    }
    body.append(h('div', { class: 'bubble', html: step.html }));
    card.append(body);
    stage.append(card);
    if (step.widget) {
      const box = h('div', { class: 'sim-box' });
      stage.append(box);
      destroyWidget = mountWidget(step.widget, box, step.params, { done() {} });
    }
    setMain('Continue', true, next);
  }

  // ---------- sim ----------
  function showSim(step) {
    const card = h('div', { class: 'card sim-card' });
    if (step.title) card.append(h('h2', {}, step.title));
    if (step.html) card.append(h('div', { class: 'sim-intro', html: step.html }));
    const box = h('div', { class: 'sim-box' });
    card.append(box);
    stage.append(card);
    let done = !step.goal;
    setMain(step.goal ? 'Complete the challenge' : 'Continue', done, next, step.goal ? 'gray' : 'green');
    destroyWidget = mountWidget(step.widget, box, step.params, {
      // The experiment behind a prediction has run: reveal the answer now, before the rest of the challenge.
      tested() {
        revealPrediction();
      },
      done() {
        if (done) return;
        done = true;
        setMain('Continue', true, next);
        skipBtn.hidden = true;
        revealPrediction();
      },
    });
    if (step.goal) {
      skipTimer = setTimeout(() => {
        if (done) return;
        skipBtn.hidden = false;
        skipBtn.onclick = () => {
          stats.skipped++;
          if (!pendingReveal) return next();
          // Show the prediction's answer here rather than at some later challenge.
          done = true;
          skipBtn.hidden = true;
          revealPrediction();
          setMain('Continue', true, next);
        };
      }, SKIP_AFTER_MS());
    }
  }

  function revealPrediction() {
    if (!pendingReveal) return;
    const p = pendingReveal;
    pendingReveal = null;
    feedback.className = `feedback show ${p.correct ? 'good' : 'predict-miss'}`;
    feedback.innerHTML = `<b>${p.correct ? 'Your prediction was right! +1 XP' : `Surprise! The answer was: ${p.answer}`}</b>${p.explain ? `<div class="sol">${p.explain}</div>` : ''}`;
    if (p.correct) sfx.correct();
  }

  // ---------- predict ----------
  function showPredict(step, item) {
    const card = h('div', { class: 'card q-card predict' });
    card.append(h('div', { class: 'predict-tag' }, '🔮 Predict first!'));
    stage.append(card);
    const q = { ...step, type: 'mcq', seed: hashKey(item.key) };
    if (window.__KLP_TEST) window.__KLP_TEST.q = q;
    const r = renderQuestion(card, q, { setReady: (v) => setMain('Lock in', v, check) });
    setMain('Lock in', false, check);
    function check() {
      const res = r.evaluate();
      if (step.revealAfterSim) r.lockNeutral();
      else r.lock();
      recordPrediction(item.key, res.correct, step.prompt.replace(/<[^>]+>/g, ''));
      if (step.revealAfterSim) {
        // Don't give the answer away: the experiment that follows reveals it.
        if (res.correct) stats.predictBonus += 1;
        pendingReveal = { correct: res.correct, answer: step.choices[step.answer], explain: step.explain };
        sfx.select();
        feedback.className = 'feedback show predict-miss';
        feedback.innerHTML = '<b>Prediction locked in!</b> Now test it in the next challenge.';
        setMain('Continue', true, next);
        return;
      }
      if (res.correct) {
        stats.predictBonus += 1;
        sfx.correct();
        feedback.className = 'feedback show good';
        feedback.innerHTML = `<b>Great prediction! +1 XP</b>${step.explain ? `<div class="sol">${step.explain}</div>` : ''}`;
      } else {
        sfx.select();
        feedback.className = 'feedback show predict-miss';
        feedback.innerHTML = `<b>Interesting guess! Scientists test their predictions.</b> The answer: ${step.choices[step.answer]}${step.explain ? `<div class="sol">${step.explain}</div>` : ''}`;
      }
      setMain('Continue', true, next);
    }
  }

  // ---------- questions ----------
  function showQuestion(item) {
    const { step } = item;
    let q;
    try {
      q = step.type === 'q'
        ? { ...instantiate(step.t, item.seed ?? hashKey(item.key) + item.attempt * 7919), review: step.review }
        : { ...step, seed: hashKey(item.key) + item.attempt };
    } catch (err) {
      console.warn('Skipping a question that could not be built:', err);
      idx++;
      return show();
    }
    if (window.__KLP_TEST) window.__KLP_TEST.q = q; // automated tests read the current question
    const card = h('div', { class: 'card q-card' });
    stage.append(card);
    const r = renderQuestion(card, q, { setReady: (v) => setMain('Check', v, check) });
    currentQ = r;
    setMain('Check', false, check);

    function check() {
      const res = r.evaluate();
      r.lock();
      const first = item.attempt === 0;
      if (first) {
        stats.firstTotal++;
        if (res.correct) stats.firstCorrect++;
      }
      if (res.correct) {
        combo++;
        stats.bestCombo = Math.max(stats.bestCombo, combo);
        if (combo >= 5) stats.comboBonus++;
        if (q.puzzle && first && !q.review) {
          stats.puzzleSolved = true;
          stats.puzzleBonus += 5;
        }
        if (q.achievement) stats.achievements.push(q.achievement);
        sfx.correct();
        feedback.className = 'feedback show good';
        const praise = ['Correct!', 'Awesome!', 'Nailed it!', 'Brilliant!', 'Great job!'][combo % 5];
        feedback.innerHTML = `<b>${praise}${combo >= 5 ? ' Combo bonus +1 XP' : ''}</b>${q.puzzle && first && !q.review ? ' <b>+5 emeralds!</b>' : ''}${res.html ? `<div>${res.html}</div>` : ''}`;
      } else {
        combo = 0;
        stats.mistakes++;
        sfx.wrong();
        feedback.className = 'feedback show bad';
        feedback.innerHTML = `<b>Not quite.</b> <div>${res.html}</div>${item.attempt < MAX_RETRIES ? '<div class="retry-note">You will get another try at the end.</div>' : ''}`;
        if (item.attempt < MAX_RETRIES) {
          queue.push({ step, key: item.key, attempt: item.attempt + 1, seed: step.type === 'q' ? randomSeed() : undefined });
        }
      }
      recordAnswer({
        correct: res.correct, concepts: q.concepts || step.concepts || [], templateId: q.templateId,
        combo, calc: !!r.calc, usedHint: r.usedHint, retry: item.attempt > 0,
      });
      progress();
      setMain('Continue', true, next, res.correct ? 'green' : 'red');
    }
  }

  // ---------- finish / quit ----------
  function finish() {
    cleanup();
    window.removeEventListener('keydown', keyHandler);
    const accuracy = stats.firstTotal ? stats.firstCorrect / stats.firstTotal : 1;
    onFinish({ ...stats, accuracy, perfect: stats.mistakes === 0 && stats.skipped === 0 });
  }

  let modal = null;
  let closeModal = null;
  function confirmQuit() {
    if (modal) return;
    // Escape closes the dialog wherever focus is; the page behind can't be reached meanwhile.
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    const close = () => { modal?.remove(); modal = null; wrap.inert = false; window.removeEventListener('keydown', onEsc); closeModal = null; };
    closeModal = close;
    const keepBtn = h('button', { class: 'mc-btn', type: 'button', onClick: close }, 'Keep going');
    modal = h('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal card' },
        h('h2', {}, 'Leave this session?'),
        h('p', {}, 'Your progress in this session will be lost.'),
        h('div', { class: 'foot-row' },
          keepBtn,
          h('button', { class: 'mc-btn red', type: 'button', onClick: () => { close(); destroy(); onQuit(); } }, 'Quit'),
        ),
      ),
    );
    document.body.append(modal);
    wrap.inert = true;
    window.addEventListener('keydown', onEsc);
    keepBtn.focus();
  }

  function destroy() {
    closeModal?.();
    cleanup();
    window.removeEventListener('keydown', keyHandler);
  }

  show();
  return destroy;
}

function hashKey(s) {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(x) + Math.floor(Math.random() * 100000);
}
