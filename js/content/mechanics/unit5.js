// Unit 5 — Gravity & Free Fall (g)
import './unit5-templates.js';
import './unit5-sprites.js';

const sameHammerFeather = (s) => [s.left, s.right].sort().join() === 'feather,hammer';

export default {
  id: 'mech.u5',
  number: 5,
  title: 'Gravity & Free Fall',
  subtitle: 'Weight, falling, throwing up and terminal velocity',
  power: 'Maths power-up: quadratics in real life',
  conceptNames: {
    'mech.weight': 'Mass & weight (W = mg)',
    'mech.equal-fall': 'Everything falls the same',
    'mech.free-fall': 'Falling equations',
    'mech.vertical-throw': 'Throwing upward',
    'mech.quadratics': 'Quadratics in real life',
    'mech.air-resistance': 'Air resistance & terminal velocity',
  },
  sessions: [
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.l1', type: 'lesson', title: 'Mass vs Weight', icon: 'grass',
      notes: {
        eq: ['W = m × g', 'g on Earth ≈ 10 N/kg (really 9.8)'],
        tips: [
          'Mass (kg) = amount of stuff: the same everywhere. Weight (N) = gravity\'s pull: changes from world to world.',
          'g: Earth 10, Moon 1.6, Mars 3.7, Jupiter 25 N/kg.',
          'Example: a 30 kg child on the Moon weighs 30 × 1.6 = 48 N.',
          'Going backwards: m = W ÷ g.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'Pip has a mass of <b>40 kg</b> on Earth. He flies to the Moon, where gravity is much weaker. What is his <b>mass</b> on the Moon?',
          choices: ['40 kg — the same', 'about 6 kg', '0 kg — he floats', '64 kg'], answer: 0, keepOrder: true, revealAfterSim: true,
          explain: 'Pip is made of exactly the same stuff on the Moon, so his mass is still 40 kg. What changes is his <b>weight</b> — how hard gravity pulls him.',
        },
        {
          type: 'sim', widget: 'u5-planet-scale', goal: true, title: 'Weigh Yourself on Other Worlds',
          html: 'Pick a world, set the mass on the scale, and press <b>Weigh</b>. The scale measures the pull of gravity — in newtons.',
          params: {
            mass: 40, testedAfter: 1,
            tasks: [
              { text: 'Weigh Pip (<b>40 kg</b>) on <b>Earth</b>.', check: (w, m) => w === 'earth' && m === 40 },
              { text: 'Fly to the <b>Moon</b> and weigh Pip again (still 40 kg). Did his mass change?', check: (w, m) => w === 'moon' && m === 40 },
              { text: 'Make the scale read exactly <b>185 N</b>. Which world? Which mass? (Think: 185 ÷ g must be a whole number.)', check: (w, m, W) => Math.abs(W - 185) < 1e-9 },
              { text: 'Make the scale read exactly <b>1000 N</b> — there are two ways!', check: (w, m, W) => Math.abs(W - 1000) < 1e-9 },
            ],
          },
        },
        {
          type: 'info', title: 'Mass and weight',
          html: `<p><b>Mass</b> = the amount of stuff in something, in <b>kilograms (kg)</b>. It is the same everywhere.</p>
                 <p><b>Weight</b> = the pull of gravity on it. It is a force, so it is in <b>newtons (N)</b>:</p>
                 <p class="eq">W = m × g</p>
                 <p>On Earth g ≈ <b>10 N/kg</b>: every kilogram is pulled with 10 N. (Really 9.8 — we use 10 for friendly numbers.)</p>`,
        },
        {
          type: 'info', title: 'Gravity on other worlds',
          html: `<table class="mini-table"><tr><td>Earth 10</td><td>Moon 1.6</td><td>Mars 3.7</td><td>Jupiter 25</td></tr></table>
                 <p>Example: a 30 kg child on the Moon weighs 30 × 1.6 = <b>48 N</b> (on Earth: 300 N).</p>
                 <p>Going backwards: <b>m = W ÷ g</b>. A rover that weighs 74 N on Mars has a mass of 74 ÷ 3.7 = 20 kg — still 20 kg on Earth.</p>
                 <details class="why"><summary>Why do bathroom scales say kg?</summary><p>They measure the push of your feet (a force) and divide by Earth's g. On the Moon they would get your mass wrong!</p></details>`,
        },
        {
          type: 'equation', prompt: 'Build the formula for weight.',
          lhs: 'W', tiles: ['m', 'g', '×', '÷', '+'], answers: [['m', '×', 'g'], ['g', '×', 'm']],
          explain: 'Each kilogram is pulled with g newtons, so W = m × g.',
        },
        { type: 'q', t: 'u5.units-mcq' },
        { type: 'q', t: 'u5.weight-earth' },
        { type: 'q', t: 'u5.weight-planet' },
        { type: 'q', t: 'u5.mass-weight-mcq' },
        { type: 'q', t: 'u5.mass-from-weight' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.l2', type: 'lesson', title: 'Everything Falls the Same', icon: 'grass',
      notes: {
        eq: ['a = W ÷ m = g'],
        tips: [
          'With no air, heavy and light things fall together (Galileo; the Apollo 15 hammer and feather).',
          'Double the mass → double the weight, but also double the mass to speed up: a stays 10 m/s².',
          'On Earth, air resistance holds back light, spread-out things like feathers and paper.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'On the Moon there is no air. An astronaut drops a heavy <b>hammer</b> and a light <b>feather</b> at the same moment. Which lands first?',
          choices: ['The hammer', 'The feather', 'They land together'], answer: 2, keepOrder: true, revealAfterSim: true,
          explain: 'With no air to hold the feather back, they land together. Astronaut Dave Scott really did this on the Moon in 1971 (Apollo 15)!',
        },
        {
          type: 'sim', widget: 'u5-vacuum-drop', goal: true, title: 'Vacuum Chamber',
          html: 'Drop two objects from 5 m. The pump can take all the air out of the chamber. Tap an object button to swap objects.',
          params: {
            testedAfter: 1,
            tasks: [
              { text: 'Air <b>ON</b>: drop the <b>hammer</b> and the <b>feather</b>.', check: (s) => s.air && sameHammerFeather(s) },
              { text: 'Pump the air <b>out</b> and drop the hammer and the feather again.', check: (s) => !s.air && sameHammerFeather(s) },
              { text: 'Air back <b>ON</b>: find two <b>different</b> objects that land within <b>0.05 s</b> of each other. Which things does air hardly slow down?', check: (s) => s.air && s.left !== s.right && s.gap < 0.05 },
            ],
          },
        },
        {
          type: 'info', title: 'Galileo and the feather',
          html: `<p>About 400 years ago <b>Galileo</b> said that, without air, heavy and light things fall together.</p>
                 <p>In 1971 astronaut Dave Scott dropped a hammer and a falcon feather on the Moon, where there is no air. They hit the ground at the same moment!</p>
                 <p class="tip">On Earth, <b>air resistance</b> holds back light, spread-out things like feathers. Take the air away and they fall like hammers.</p>`,
        },
        {
          type: 'info', title: 'Why: F = ma',
          html: `<p>The force that makes something fall is its weight, W = m × g. Newton's 2nd law (Unit 4) gives its acceleration:</p>
                 <p class="eq">a = W ÷ m = g</p>
                 <p>A 2 kg ball: 20 N ÷ 2 kg = <b>10 m/s²</b>. Double the mass gives double the pull — but also double the stuff to get moving.</p>
                 <details class="why"><summary>Why does it always come out as g?</summary><p>a = W ÷ m = (m × g) ÷ m. The m on top and the m underneath cancel, leaving g. So g is an acceleration too: 10 m/s².</p></details>`,
        },
        {
          type: 'equation', prompt: 'Build the formula for the acceleration of a falling object (no air).',
          lhs: 'a', tiles: ['W', 'm', '÷', '×', 'g'], answers: [['W', '÷', 'm'], ['g']],
          explain: 'Newton\'s 2nd law: a = force ÷ mass = W ÷ m. Since W = m × g, this always comes out as g.',
        },
        { type: 'q', t: 'u5.fall-same-mcq' },
        { type: 'q', t: 'u5.accel-calc' },
        { type: 'q', t: 'u5.why-same-mcq' },
        { type: 'q', t: 'u5.heavy-light-time' },
        { type: 'q', t: 'u5.feather-air-mcq' },
        { type: 'q', t: 'u4.fma-change-mcq' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.l3', type: 'lesson', title: 'Falling Equations', icon: 'grass',
      notes: {
        eq: ['v = g × t', 'h = ½ × g × t² = 5t²', 'v² = 2gh'],
        tips: [
          'Dropped = starts from rest (u = 0), and a = g = 10 m/s².',
          'Each second it falls 5, 15, 25, 35 m… (5 × the odd numbers). Totals 5, 20, 45, 80 m = 5 × 1, 4, 9, 16.',
          'Example: a stone hits the water after 3 s → h = 5 × 9 = 45 m, v = 30 m/s.',
          'Speed and distance are different: after 3 s it goes 30 m/s but has fallen 45 m.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A dropped stone falls <b>5 m</b> in its first second. How far has it fallen after <b>2 seconds</b>?',
          choices: ['10 m', '20 m', '15 m', '5 m'], answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'It keeps speeding up, so in the 2nd second it falls 15 m. Altogether 5 + 15 = 20 m — four times as far, not twice.',
        },
        {
          type: 'sim', widget: 'u5-well-drop', goal: true, title: 'Drop a Stone into a Well',
          html: 'Drop the stone and watch the strobe: a mark every second. The table shows how far it falls <b>during</b> each second.',
          params: {
            depth: 20, testedAfter: 0,
            tasks: [
              { text: 'Drop the stone into this <b>20 m</b> well. Where was it after 1 s, and when did it splash?', check: (d) => d === 20 },
              { text: 'Set the depth so the splash comes after exactly <b>3 s</b>.', check: (d) => d === 45 },
              { text: 'Make the stone hit the water at <b>40 m/s</b>. (How long must it fall first?)', check: (d) => d === 80 },
            ],
          },
        },
        {
          type: 'info', title: 'The falling equations',
          html: `<p>A dropped object starts from rest and speeds up by g = 10 m/s every second:</p>
                 <p class="eq">v = g × t</p>
                 <p class="eq">h = ½ × g × t² = 5t²</p>
                 <p>Example: a stone hits the water after 3 s. h = 5 × 3² = <b>45 m</b>, and it is going 10 × 3 = <b>30 m/s</b>.</p>
                 <details class="why"><summary>Where does h = ½gt² come from?</summary><p>Unit 3: s = ut + ½at², with u = 0 (dropped) and a = g. Or: its average speed is half its final speed, gt ÷ 2, so h = (gt ÷ 2) × t.</p></details>`,
        },
        {
          type: 'info', title: 'The odd-number pattern',
          html: `<p>Distance fallen in each second: <b>5, 15, 25, 35…</b> — 5 × the odd numbers! (It gains 10 m/s every second.)</p>
                 <p>Add them up: 5, 20, 45, 80 m = 5 × 1, 4, 9, 16 — the square numbers, just like h = 5t².</p>
                 <details class="why"><summary>Why do odd numbers add up to squares?</summary><p>1 = 1, 1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16. Each odd number adds an L-shaped border of blocks that turns one square into the next bigger square.</p></details>`,
        },
        {
          type: 'equation', prompt: 'Build the formula for the height fallen in time t.',
          lhs: 'h', tiles: ['½', 'g', 't²', '×', '×', 't', '2'], answers: [['½', '×', 'g', '×', 't²'], ['½', '×', 't²', '×', 'g'], ['g', '×', '½', '×', 't²'], ['g', '×', 't²', '×', '½'], ['t²', '×', '½', '×', 'g'], ['t²', '×', 'g', '×', '½']],
          explain: 'From s = ut + ½at² with u = 0 and a = g: h = ½ × g × t². With g = 10, that is 5t².',
        },
        {
          type: 'info', title: 'Going backwards',
          html: `<p><b>How long to fall h?</b> t² = h ÷ 5, then take the square root. 45 m: t² = 9, so t = 3 s.</p>
                 <p>Decimals work the same way — ask "which number times itself?": √2.25 = 1.5 (1.5 × 1.5 = 2.25), √6.25 = 2.5, √0.25 = 0.5.</p>
                 <p class="tip">No time given? Unit 3's v² = u² + 2as with u = 0 gives <b>v² = 2gh</b>. 45 m: v² = 900, so v = 30 m/s.</p>`,
        },
        { type: 'q', t: 'u5.fall-speed' },
        { type: 'q', t: 'u5.fall-height' },
        { type: 'q', t: 'u5.odd-pattern-mcq' },
        { type: 'q', t: 'u5.fall-time' },
        { type: 'q', t: 'u5.fall-ratio-mcq' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.l4', type: 'lesson', title: 'Up and Down', icon: 'grass',
      notes: {
        eq: ['time to top = u ÷ g', 'max height h = u² ÷ 2g', 'time in the air = 2u ÷ g'],
        tips: [
          'Going up, it slows by 10 m/s every second. At the top, speed = 0 — but gravity still pulls!',
          'Symmetry: it comes back down to its start at the same speed it was fired.',
          'h = u² ÷ 2g is Unit 3\'s braking distance u² ÷ (2 × deceleration) with deceleration = g.',
          'Example: 20 m/s up → top after 2 s, 400 ÷ 20 = 20 m high, back after 4 s at 20 m/s.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A dispenser fires a ball straight up at <b>20 m/s</b>. It falls back to the same height. How fast is it going then? (no air)',
          choices: ['20 m/s', 'less than 20 m/s', 'more than 20 m/s', '0 m/s'], answer: 0, keepOrder: true, revealAfterSim: true,
          explain: 'It loses 10 m/s every second on the way up and gains 10 m/s every second on the way down, for the same time — so it comes back down at 20 m/s.',
        },
        {
          type: 'sim', widget: 'u5-throw-up', goal: true, title: 'Throw It Up',
          html: 'Press <b>Fire!</b> The dispenser shoots the ball straight up. The strobe shows the ball every second with its speed (↑ up, ↓ down). The graph draws its height.',
          params: {
            mode: 'basic', u: 20, testedAfter: 0,
            doneText: 'All launch tasks done — up, stop, down, and back at the same speed! 🎉',
            tasks: [
              { text: 'Fire at <b>20 m/s</b> (as set). Read the speed at each strobe mark.', check: (u) => u === 20 },
              { text: 'Make the ball reach exactly <b>45 m</b> high.', check: (u) => u === 30 },
              { text: 'Make the ball stay in the air for exactly <b>2 s</b>.', check: (u) => u === 10 },
            ],
          },
        },
        {
          type: 'info', title: 'Up, stop, down',
          html: `<p>Gravity pulls down all the time, so a ball fired straight up <b>slows down by 10 m/s every second</b>. At the top its speed is 0 for an instant:</p>
                 <p class="eq">time to top = u ÷ g</p>
                 <p><b>Symmetry:</b> the way down is the way up played backwards. It falls for as long as it rose, and comes back at the same speed.</p>`,
        },
        {
          type: 'info', title: 'How high?',
          html: `<p class="eq">max height h = u² ÷ 2g</p>
                 <p>Example: fired at 20 m/s → top after 2 s, height 400 ÷ 20 = <b>20 m</b>. Back at the start after 4 s, moving down at 20 m/s.</p>
                 <details class="why"><summary>Where does u² ÷ 2g come from?</summary><p>On the way up its average speed is u ÷ 2, for u ÷ g seconds: h = (u ÷ 2) × (u ÷ g) = u² ÷ 2g. It is Unit 3's braking distance u² ÷ (2 × deceleration), with deceleration = g.</p></details>`,
        },
        { type: 'q', t: 'u5.time-to-top' },
        { type: 'q', t: 'u5.speed-back-mcq' },
        { type: 'q', t: 'u5.after-t-mcq' },
        { type: 'q', t: 'u5.max-height' },
        { type: 'q', t: 'u5.top-mcq' },
        { type: 'q', t: 'u5.flight-time' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.lq', type: 'lesson', title: 'Two Answers: Quadratics', icon: 'grass',
      notes: {
        eq: ['thrown up: height = ut − 5t²', 'thrown down: distance = ut + 5t²'],
        tips: [
          'Move everything to one side, divide by 5, factorise.',
          'Example: 10 = 15t − 5t² → t² − 3t + 2 = 0 → (t − 1)(t − 2) = 0 → 1 s (up) and 2 s (down).',
          'Two positive answers = two real moments: going up and coming down.',
          'A negative time is before the throw: reject it.',
          'Up is + for a throw upwards (a = −10); down is + for a throw downwards (gravity adds +5t²).',
          'Numbers multiply to c and add to b (signs included): t² − 3t + 2 → −1 and −2.',
          'Move everything to the side where t² is positive before factorising.',
        ],
      },
      steps: [
        {
          type: 'info', title: 'Quadratics in real life',
          html: `<p>A ball is thrown up at 15 m/s. Gravity slows it on the way up, so a = −10 (<b>up is +</b>):</p>
                 <p class="eq">height = 15t − 5t²</p>
                 <p>When is it <b>10 m</b> high? Move everything to the side where t² is positive, then ÷ 5:</p>
                 <p class="eq">5t² − 15t + 10 = 0 → t² − 3t + 2 = 0</p>
                 <p>Two numbers that multiply to <b>+2</b> and add to <b>−3</b>: <b>−1 and −2</b>.</p>
                 <p class="eq">(t − 1)(t − 2) = 0 → t = 1 s or 2 s</p>
                 <details class="why"><summary>Why can I split it like that?</summary><p>If two numbers multiply to make 0, one of them must be 0. So t − 1 = 0 or t − 2 = 0. (And height = ut − 5t² is Unit 3's s = ut + ½at² with a = −10.)</p></details>`,
        },
        {
          type: 'predict', prompt: 'So the maths gives two answers, 1 s and 2 s. How many times is the ball <b>really</b> 10 m high?',
          choices: ['Once — one answer must be wrong', 'Twice — once going up, once coming down', 'Never'], answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'Both answers are real moments: it passes 10 m going up at 1 s and coming back down at 2 s.',
        },
        {
          type: 'sim', widget: 'u5-throw-up', goal: true, title: 'Window Watch',
          html: 'Set the launch speed and the window height, then fire. Tip: the top of the flight is exactly halfway between the two times.',
          params: {
            mode: 'window', u: 15, hw: 10, testedAfter: 0,
            doneText: 'You found every window moment — two answers going up and down, and one just at the top! 🎉',
            tasks: [
              { text: 'Fire at <b>15 m/s</b> with the window at <b>10 m</b> (as set). When does the ball pass it?', check: (u, hw) => u === 15 && hw === 10 },
              { text: 'Make the ball pass the window at exactly <b>1 s and 3 s</b>. (When is the top? How fast must it be fired? Then how high is it at 1 s?)', check: (u, hw) => u === 20 && hw === 15 },
              { text: 'Make the ball <b>just touch</b> the window once, at the very top of its flight.', check: (u, hw) => Math.abs(u * u - 20 * hw) < 1e-9 },
            ],
          },
        },
        {
          type: 'info', title: 'When an answer must be rejected',
          html: `<p>Pip throws a stone <b>down</b> at 10 m/s from a 40 m tower. Now gravity speeds it up (<b>down is + this time</b>: pick + as the direction of the throw):</p>
                 <p class="eq">40 = 10t + 5t² → t² + 2t − 8 = 0 → (t + 4)(t − 2) = 0</p>
                 <p>t = −4 or t = 2. But −4 s is before Pip threw it! Reject it: the stone lands after <b>2 s</b>.</p>
                 <p class="tip">Two positive times = two real moments (up and down). A negative time = reject.</p>`,
        },
        { type: 'q', t: 'u5.quad-factor' },
        { type: 'q', t: 'u5.quad-up-mcq' },
        { type: 'q', t: 'u5.window-times' },
        { type: 'q', t: 'u5.sign-root-mcq' },
        { type: 'q', t: 'u5.throw-down' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.l5', type: 'lesson', title: 'Air Resistance', icon: 'grass',
      notes: {
        eq: ['resultant = weight − drag', 'a = resultant ÷ m', 'terminal velocity: drag = weight'],
        tips: [
          'Drag grows with speed. Faster → more drag → less resultant → less acceleration.',
          'Terminal velocity: drag = weight, resultant = 0, steady speed. Skydiver ≈ 50 m/s; with a parachute ≈ 5 m/s.',
          'Bigger parachute → drag = weight at a lower speed → lower terminal speed.',
          'In our sim: drag = size × speed². 80 kg (800 N) at 5 m/s → 800 ÷ 25 = 32 m².',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A skydiver jumps out of a plane (parachute still closed). What happens to her speed as she falls?',
          choices: ['It keeps increasing as long as she falls', 'It increases, then levels off at a top speed', 'It stays the same the whole way', 'It increases, then decreases to 0'],
          answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'The faster she falls, the bigger the air resistance. When it equals her weight, she stops speeding up: that top speed is her terminal velocity.',
        },
        {
          type: 'sim', widget: 'u5-parachute', goal: true, title: 'Skydive!',
          html: 'Jump and watch the two force arrows: <b>weight</b> (down) and <b>drag</b> (up). Watch the speed–time graph too.',
          params: {
            mass: 80, area: 0, testedAfter: 0,
            tasks: [{ text: 'Jump with <b>no parachute</b> (as set). What happens to the drag arrow as she speeds up?', check: (m, a) => m === 80 && a === 0 }],
            doneText: 'She stopped speeding up: drag grew until it matched her weight. That steady top speed has a name — read on! 🎉',
          },
        },
        {
          type: 'info', title: 'Air resistance',
          html: `<p>Air pushes back on anything moving through it: <b>drag</b>. The faster you go, the bigger it gets.</p>
                 <p class="eq">resultant = weight − drag</p>
                 <p>Just after the jump, drag is tiny: she speeds up at almost 10 m/s². As she gets faster, drag grows, the resultant shrinks, and she speeds up less and less (a = resultant ÷ m).</p>`,
        },
        {
          type: 'info', title: 'Terminal velocity',
          html: `<p>When <b>drag = weight</b>, the resultant is zero: no more speeding up. She falls at a steady top speed — her <b>terminal velocity</b>, about <b>50 m/s</b> for a skydiver.</p>
                 <p>A parachute makes much more drag, so drag = weight at a much lower speed: about <b>5 m/s</b>.</p>
                 <p class="tip">In our sim, <b>drag = size × speed²</b>. A 60 kg skydiver (600 N) at 5 m/s: size × 25 = 600, so size = 24 m².</p>`,
        },
        {
          type: 'sim', widget: 'u5-parachute', goal: true, title: 'Parachute Designer',
          html: 'Design parachutes! Terminal speed is reached when <b>drag = weight</b>, and here drag = size × speed².',
          params: {
            mass: 80, area: 0,
            doneText: 'All parachute designs work! 🎉',
            tasks: [
              { text: 'An <b>80 kg</b> skydiver wants a terminal speed of exactly <b>5 m/s</b>. Choose the parachute size.', check: (m, a) => m === 80 && a === 32 },
              { text: 'Now a <b>50 kg</b> skydiver: which size gives exactly <b>5 m/s</b>?', check: (m, a) => m === 50 && a === 20 },
              { text: 'Back to <b>80 kg</b>: pick the size that lands at <b>10 m/s</b>. Is the parachute bigger or smaller?', check: (m, a) => m === 80 && a === 8 },
            ],
          },
        },
        { type: 'q', t: 'u5.terminal-drag' },
        { type: 'q', t: 'u5.terminal-mcq' },
        { type: 'q', t: 'u5.resultant-air' },
        { type: 'q', t: 'u5.parachute-mcq' },
        { type: 'q', t: 'u5.bigger-chute-mcq' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u5.psA', type: 'problems', title: 'Calculation Drills', icon: 'crafting',
      steps: [
        { type: 'q', t: 'u5.weight-planet' },
        { type: 'q', t: 'u5.mass-from-weight' },
        { type: 'q', t: 'u5.find-g' },
        { type: 'q', t: 'u5.fall-speed-from-height' },
        { type: 'q', t: 'u5.second-by-second' },
        { type: 'q', t: 'u5.fall-time' },
        { type: 'q', t: 'u5.throw-for-height' },
        { type: 'q', t: 'u5.quad-factor' },
        { type: 'q', t: 'u5.resultant-air' },
        { type: 'q', t: 'u5.terminal-speed' },
      ],
    },
    {
      id: 'mech.u5.psB', type: 'problems', title: 'Word Problems', icon: 'bookshelf',
      steps: [
        { type: 'q', t: 'u5.wp-ledge' },
        { type: 'q', t: 'u5.weight-transfer' },
        { type: 'q', t: 'u5.wp-arrow' },
        { type: 'q', t: 'u5.wp-two-stones' },
        { type: 'q', t: 'u4.wp-rocket' },
        { type: 'q', t: 'u3.wp-takeoff' },
        { type: 'q', t: 'u5.puzzle-window' },
        { type: 'q', t: 'u5.puzzle-splash' },
      ],
    },
    {
      id: 'mech.u5.review', type: 'problems', title: 'Unit 5 Review', icon: 'diamondore',
      steps: [
        {
          type: 'info', title: 'Unit 5 Review', speaker: 'friend',
          html: '<p>One question on each big idea — plus two from Units 2 and 4 to keep them fresh. Get <b>8 out of 10</b> right first time to <b>master</b> Unit 5!</p>',
        },
        { type: 'q', t: 'u5.weight-planet' },
        { type: 'q', t: 'u5.fall-same-mcq' },
        { type: 'q', t: 'u5.fall-height' },
        { type: 'q', t: 'u5.second-by-second' },
        { type: 'q', t: 'u5.max-height' },
        { type: 'q', t: 'u5.window-times' },
        { type: 'q', t: 'u5.terminal-mcq' },
        { type: 'q', t: 'u5.resultant-air' },
        { type: 'q', t: 'u4.n3-cancel-mcq' },
        { type: 'q', t: 'u2.pyth-hyp' },
      ],
    },
    {
      id: 'mech.u5.boss', type: 'boss', title: 'Boss: Egg Drop Lab', icon: 'portal',
      steps: [
        {
          type: 'info', title: 'BOSS MISSION: Egg Drop Lab', speaker: 'u5pod',
          html: `<p>An egg rides in the <b>Egg Lander</b> pod (mass 10 kg, weight 100 N). Drop it from the tower without cracking it!</p>
                 <p><b>No parachute:</b> the pod is heavy and compact, so ignore air: <b>v² = 2gh</b> and <b>h = ½gt²</b>.</p>
                 <p>Win <b>3 rounds</b>. You get 3 tries per round, and the lab only says "too fast", "too early"… so work it out first!</p>`,
        },
        {
          type: 'info', title: 'Parachutes in the lab', speaker: 'u5pod',
          html: `<p>With a parachute, drag = D × v². The pod falls steadily once <b>drag = weight</b>:</p>
                 <p class="eq">D × v² = 100 &nbsp;→&nbsp; time ≈ height ÷ speed</p>
                 <p class="tip">To keep the maths simple, the lab pretends the pod speeds up at the full 10 m/s² and then suddenly levels off at that speed. (In Lesson 5 you saw it level off gradually.)</p>`,
        },
        { type: 'sim', widget: 'u5-egg-drop', goal: true, title: 'Egg Drop Lab', params: { rounds: 3 } },
        { type: 'q', t: 'u5.fall-speed-from-height' },
        { type: 'q', t: 'u5.terminal-speed' },
        { type: 'q', t: 'u5.flight-time' },
        { type: 'q', t: 'u5.wp-moon-jump' },
        { type: 'q', t: 'u5.throw-down' },
        { type: 'q', t: 'u5.resultant-air' },
      ],
    },
  ],
};
