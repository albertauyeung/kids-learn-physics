// Unit 3 — Acceleration & Motion Graphs
import './unit3-templates.js';
import './unit3-sprites.js';
import { C, vtGraph } from './unit3-templates.js';

const RECT = 'rgba(74,237,217,0.35)';
const TRI = 'rgba(252,238,75,0.35)';

export default {
  id: 'mech.u3',
  number: 3,
  title: 'Acceleration & Motion Graphs',
  subtitle: 'v = u + at, stopping distances, quadratics',
  power: 'Maths power-up: more square roots, area under a graph, quadratics by factorisation',
  conceptNames: {
    [C.acc]: 'Acceleration',
    [C.dec]: 'Slowing down (deceleration)',
    [C.vt]: 'Velocity–time graphs',
    [C.suvat]: 'v = u + at and s = ½(u + v)t',
    [C.power]: 's = ut + ½at² and v² = u² + 2as',
    [C.stop]: 'Stopping distances',
    [C.quad]: 'Quadratics in motion',
  },
  sessions: [
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.l1', type: 'lesson', title: 'What Is Acceleration?', icon: 'grass',
      notes: {
        eq: ['a = (v − u) ÷ t', 'speed gained = a × t'],
        tips: [
          'u = starting velocity, v = final velocity, t = time.',
          'm/s² = "metres per second, every second": the speed gained each second.',
          'Example: 0 → 30 m/s in 6 s → a = 30 ÷ 6 = 5 m/s².',
          'A big final speed doesn\'t mean a big acceleration — divide by the time!',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'Pip\'s car starts from rest. Its speed goes up by <b>2 m/s every second</b>. How fast is it going after <b>5 seconds</b>?',
          choices: ['2 m/s', '5 m/s', '7 m/s', '10 m/s'], answer: 3, keepOrder: true, revealAfterSim: true,
          explain: '0, 2, 4, 6, 8, 10: after 5 s it is doing 5 × 2 = 10 m/s.',
        },
        {
          type: 'sim', widget: 'u3-dashboard', goal: true, title: 'Car Dashboard',
          html: 'Press <b>Drive</b> as it is to test your prediction. Then work out each task before you drive.',
          params: {
            u: 0, a: 2, t: 5,
            tasks: [
              { text: 'Start from rest with a = 2 m/s² for 5 s. Watch the speed each second.', check: (p) => p.u === 0 && p.a === 2 && p.t === 5, test: true },
              { text: 'Starting from rest, reach exactly <b>20 m/s</b> in exactly <b>5 s</b>.', check: (p) => p.u === 0 && p.t === 5 && p.v === 20 },
              { text: 'Start at <b>6 m/s</b> and reach exactly <b>18 m/s</b> in <b>4 s</b>.', check: (p) => p.u === 6 && p.t === 4 && p.v === 18 },
            ],
          },
        },
        {
          type: 'info', title: 'Acceleration',
          html: `<p><b>Acceleration</b> is how much the velocity changes <b>every second</b>.</p>
                 <p class="eq">a = (v − u) ÷ t</p>
                 <p><b>u</b> = starting velocity, <b>v</b> = final velocity, <b>t</b> = time taken.</p>
                 <p>Example: a car goes from 0 to 30 m/s in 6 s. a = (30 − 0) ÷ 6 = <b>5 m/s²</b>.</p>
                 <p>The unit <b>m/s²</b> is read "metres per second, every second": the car gains 5 m/s each second (0, 5, 10, 15...).</p>
                 <p class="tip">Speed gained = a × t. So after t seconds, the speed is u + a × t. And the time to gain some speed = speed to gain ÷ a.</p>`,
        },
        { type: 'q', t: 'u3.acc-meaning-mcq' },
        { type: 'q', t: 'u3.acc-basic' },
        { type: 'q', t: 'u3.acc-table' },
        { type: 'q', t: 'u3.acc-compare-mcq' },
        { type: 'q', t: 'u3.acc-final' },
        { type: 'q', t: 'u3.eq-t' },
        { type: 'q', t: 'u3.acc-time' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.l2', type: 'lesson', title: 'Slowing Down', icon: 'grass',
      notes: {
        eq: ['a = (v − u) ÷ t &nbsp;(negative when slowing down)', 'time to stop = speed ÷ deceleration'],
        tips: [
          'Forward is +. Braking makes the acceleration negative: it points backwards.',
          'Deceleration is the size: a = −4 m/s² is a deceleration of 4 m/s².',
          'Example: 20 → 0 m/s in 5 s → a = (0 − 20) ÷ 5 = −4 m/s².',
          'A minus velocity means "moving backwards"; a minus acceleration here means "slowing down".',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A car moving at <b>20 m/s</b> brakes. Its speed drops by <b>4 m/s every second</b>. How long does it take to stop?',
          choices: ['4 s', '5 s', '16 s', '80 s'], answer: 1, keepOrder: true, revealAfterSim: true,
          explain: '20, 16, 12, 8, 4, 0: five drops of 4 m/s. Time = 20 ÷ 4 = 5 s.',
        },
        {
          type: 'sim', widget: 'u3-brakes', goal: true, title: 'Brake Test Track',
          html: 'Press <b>Brake!</b> as it is to test your prediction. Think before each later brake!',
          params: {
            u: 20, b: 4,
            tasks: [
              { text: 'Brake from 20 m/s with a deceleration of 4 m/s². Count the seconds!', check: (p) => p.u === 20 && p.b === 4, test: true },
              { text: 'Stop from <b>24 m/s</b> in exactly <b>4 s</b>.', check: (p) => p.u === 24 && Math.abs(p.time - 4) < 1e-9 },
              { text: 'With the brakes set to <b>5 m/s²</b>, choose a speed that stops in exactly <b>3 s</b>.', check: (p) => p.b === 5 && Math.abs(p.time - 3) < 1e-9 },
            ],
          },
        },
        {
          type: 'info', title: 'Negative acceleration',
          html: `<p>Remember Unit 2: forward is <b>+</b>. When a car moving forward slows down, v is smaller than u, so v − u is negative:</p>
                 <p class="eq">a = (0 − 20) ÷ 5 = −4 m/s²</p>
                 <p>The minus sign means the acceleration points <b>backwards</b>, against the motion, so the car slows down.</p>
                 <p class="tip">A minus <b>velocity</b> means moving backwards. A minus <b>acceleration</b> on a car moving forward means slowing down.</p>`,
        },
        { type: 'q', t: 'u3.dec-sign-mcq' },
        { type: 'q', t: 'u3.dec-signed' },
        {
          type: 'info', title: 'Deceleration',
          html: `<p>Often we give just the size and call it a <b>deceleration</b>: "a deceleration of 4 m/s²" means a = −4 m/s².</p>
                 <p>Speed lost = deceleration × time. From 20 m/s at 4 m/s² for 2 s: 20 − 4 × 2 = <b>12 m/s</b>.</p>
                 <p>Time to stop = speed ÷ deceleration = 20 ÷ 4 = <b>5 s</b>.</p>
                 <p class="tip">Read each question: does it want the acceleration (with its sign) or the deceleration (a positive size)?</p>`,
        },
        { type: 'q', t: 'u3.dec-size' },
        { type: 'q', t: 'u3.dec-stop-time' },
        { type: 'q', t: 'u3.dec-meaning-mcq' },
        { type: 'q', t: 'u3.dec-speed-after' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.l3', type: 'lesson', title: 'Velocity–Time Graphs', icon: 'grass',
      notes: {
        eq: ['slope = acceleration', 'area under the line = distance'],
        tips: [
          'Uphill → speeding up. Flat → steady speed. Downhill → slowing down. Flat on 0 → stopped.',
          'Rectangle = base × height. Triangle = ½ × base × height.',
          'Example: 0 → 10 m/s in 4 s, then 10 m/s for 4 s: ½ × 4 × 10 + 4 × 10 = 20 + 40 = 60 m.',
          'Always check the axis: on a distance–time graph, flat means stopped!',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: `A <b>velocity–time</b> graph, flat at 8 m/s. What is the car doing?${vtGraph({ points: [[0, 8], [10, 8]], tMax: 10, yMax: 12, h: 100, yStep: 4 })}`,
          choices: ['Standing still', 'Moving at a steady 8 m/s', 'Speeding up'], answer: 1, keepOrder: true,
          explain: 'The graph shows velocity. It stays at 8 m/s, so the car keeps moving at a steady 8 m/s. Flat means stopped only on a distance–time graph.',
        },
        {
          type: 'info', title: 'Velocity–time graphs',
          html: `<p>A <b>velocity–time</b> graph shows how fast something goes at each moment.</p>
                 <ul><li>Uphill → speeding up</li><li>Flat → steady speed</li><li>Downhill → slowing down</li><li>Flat on 0 → stopped</li></ul>
                 <p>The <b>slope</b> is the acceleration (like in Unit 2, where the slope of a position graph was the velocity):</p>
                 <p class="eq">slope = change in velocity ÷ change in time = acceleration</p>`,
        },
        {
          type: 'sim', widget: 'u3-vt-builder', goal: true, title: 'Graph Builder',
          html: 'Pick a piece, set its end speed and time, then press <b>Drive</b>.',
          params: {
            mode: 'multi', pieces: [{ v: 10, dt: 4 }, { v: 10, dt: 4 }, { v: 0, dt: 2 }],
            tasks: [
              { text: 'Run the trip as it is (piece 1: 0 → 10 m/s in 4 s, piece 2: 10 m/s for 4 s, piece 3: 10 → 0 m/s in 2 s) and watch the shaded area fill in.', check: (p) => p.total === 70 },
              { text: 'Change <b>piece 1</b> so the car speeds up at exactly <b>2 m/s²</b>.', check: (p) => p.pieces[0].v1 === 2 * p.pieces[0].dt },
              { text: 'Plan a trip exactly <b>120 m</b> long that ends at rest (0 m/s). Work out the areas first — the sim only says "too long" or "too short" until you get it!', check: (p) => p.total === 120 && p.v === 0, plan: { value: (p) => p.total, target: 120, more: 'too short', less: 'too long', other: 'right length, but the trip must end at rest (0 m/s)', hint: 'Add up the areas: triangles ½ × base × height, rectangles base × height.' } },
            ],
          },
        },
        {
          type: 'info', title: 'Area = distance',
          html: `<p>At a steady speed, distance = speed × time: the <b>area of a rectangle</b> under the line. It works for any v–t graph:</p>
                 <p class="eq">area under the line = distance travelled</p>
                 <p>${vtGraph({ points: [[0, 0], [4, 10], [8, 10]], tMax: 8, yMax: 10, yStep: 2, h: 150, shade: [{ pts: [[0, 0], [4, 10], [4, 0]], color: TRI }, { pts: [[4, 0], [4, 10], [8, 10], [8, 0]], color: RECT }] })}</p>
                 <p>Triangle ½ × 4 × 10 = <b>20 m</b> + rectangle 4 × 10 = <b>40 m</b> = <b>60 m</b>.</p>
                 <p class="tip">Triangle = ½ × base × height. Rectangle = base × height.</p>`,
        },
        { type: 'q', t: 'u3.vt-shape-mcq' },
        { type: 'q', t: 'u3.vt-slope' },
        { type: 'q', t: 'u3.vt-area-tri' },
        { type: 'q', t: 'u3.vt-meaning-mcq' },
        { type: 'q', t: 'u3.vt-area-trap' },
        { type: 'q', t: 'u3.vt-slope' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.l4', type: 'lesson', title: 'Equations from Graphs', icon: 'grass',
      notes: {
        eq: ['v = u + at', 's = ½(u + v)t', 's = ut + ½at²'],
        tips: [
          'v = u + at: start speed + speed gained.',
          's = ½(u + v)t: average speed × time (the trapezium area).',
          'Example: 4 → 12 m/s in 4 s → s = ½ × (4 + 12) × 4 = 32 m.',
          's = ut + ½at²: rectangle ut + triangle ½at². Square the time first!',
          'Only for steady (constant) acceleration!',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A car speeds up <b>steadily</b> from <b>4 m/s</b> to <b>12 m/s</b> in <b>4 s</b>. What is its average speed?',
          choices: ['4 m/s', '8 m/s', '12 m/s', '16 m/s'], answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'Halfway: ½(4 + 12) = 8 m/s, so 8 × 4 = 32 m — the area under the graph.',
        },
        {
          type: 'sim', widget: 'u3-vt-builder', goal: true, title: 'Trapezium Lab',
          html: 'The area under the graph is a <b>trapezium</b>: rectangle (blue) + triangle (yellow). Every trip lasts 4 s.',
          params: {
            mode: 'single', u: 2, v: 10, fixT: 4,
            tasks: [
              { text: 'Make the car speed up from <b>4 m/s</b> to <b>12 m/s</b> in <b>4 s</b>. How far does it go?', check: (p) => p.u === 4 && p.v === 12 && p.t === 4, test: true },
              { text: 'Start at <b>6 m/s</b>. In <b>4 s</b>, speed up steadily and cover exactly <b>48 m</b>. Work out the end speed first!', check: (p) => p.u === 6 && p.t === 4 && p.total === 48, plan: { value: (p) => p.total, target: 48, more: 'too short', less: 'too long', other: 'right distance, but it must start at 6 m/s and take 4 s', hint: 'Average speed = 48 ÷ 4. It is halfway between 6 and v.' } },
              { text: 'Accelerate at exactly <b>3 m/s²</b> for <b>4 s</b> and cover exactly <b>36 m</b>.', check: (p) => p.t === 4 && p.v - p.u === 12 && p.total === 36, plan: { value: (p) => p.total, target: 36, more: 'too short', less: 'too long', other: 'right distance, but it must speed up at exactly 3 m/s² for 4 s', hint: 'In 4 s at 3 m/s² it gains 12 m/s, so v = u + 12. The average speed must be 36 ÷ 4.' } },
            ],
          },
        },
        {
          type: 'info', title: 'From the slope: v = u + at',
          html: `<p>The slope of a v–t graph is the acceleration: a = (v − u) ÷ t. Multiply by t and add u:</p>
                 <p class="eq">v = u + at</p>
                 <p>Start speed + speed gained. Example: 4 m/s, then 2 m/s² for 4 s → v = 4 + 2 × 4 = <b>12 m/s</b>.</p>`,
        },
        { type: 'q', t: 'u3.eq-v' },
        {
          type: 'info', title: 'From the area: s = ½(u + v)t',
          html: `<p>The area under the line is a <b>trapezium</b>: a rectangle plus a triangle.</p>
                 <p>${vtGraph({ points: [[0, 4], [4, 12]], tMax: 4, yMax: 12, yStep: 4, h: 150, shade: [{ pts: [[0, 0], [0, 4], [4, 4], [4, 0]], color: RECT }, { pts: [[0, 4], [4, 12], [4, 4]], color: TRI }] })}</p>
                 <p class="eq">s = ½(u + v)t</p>
                 <p>½(u + v) is the <b>average speed</b>. 4 → 12 m/s in 4 s: ½ × 16 × 4 = <b>32 m</b> (rectangle 16 + triangle 16 ✔).</p>
                 <details class="why"><summary>Why does this work?</summary>
                 <p>Rectangle u × t, triangle ½ × t × (v − u). Add them: ut + ½vt − ½ut = ½ut + ½vt = ½(u + v)t.</p></details>`,
        },
        { type: 'q', t: 'u3.eq-s' },
        { type: 'q', t: 'u3.suvat-avg' },
        { type: 'q', t: 'u3.avg-vel-mcq' },
        {
          type: 'info', title: 'Power equation 1: s = ut + ½at²',
          html: `<p>Know the <b>acceleration</b> instead of v? The rectangle is <b>u × t</b> and the triangle on top is <b>½ × t × at</b>:</p>
                 <p class="eq">s = ut + ½at²</p>
                 <p>${vtGraph({ points: [[0, 5], [3, 11]], tMax: 3, yMax: 12, yStep: 1, labelEvery: 2, h: 160, shade: [{ pts: [[0, 0], [0, 5], [3, 5], [3, 0]], color: RECT }, { pts: [[0, 5], [3, 11], [3, 5]], color: TRI }] })}</p>
                 <p>u = 5 m/s, a = 2 m/s², t = 3 s → s = 15 + ½ × 2 × 3² = 15 + 9 = <b>24 m</b>.</p>
                 <p class="tip">Square the time first: ½at² means ½ × a × t × t.</p>`,
        },
        { type: 'q', t: 'u3.suvat-s' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.l5', type: 'lesson', title: 'v² = u² + 2as & Stopping Distances', icon: 'grass',
      notes: {
        eq: ['v² = u² + 2as', 'braking distance = u² ÷ (2 × deceleration)', 'stopping distance = thinking distance + braking distance'],
        tips: [
          'No time in the question? Use v² = u² + 2as.',
          'Example: from rest, a = 2 m/s², s = 25 m → v² = 0 + 2 × 2 × 25 = 100 → v = 10 m/s.',
          'Braking from 20 m/s at 5 m/s² → 400 ÷ 10 = 40 m. Double the speed → 4 × as far (160 m)!',
          'Thinking distance = speed × reaction time. 20 m/s, 1 s, 5 m/s² → 20 + 40 = 60 m.',
          'Squares: 14² = 196, 16² = 256, 18² = 324, 20² = 400, 24² = 576, 25² = 625, 30² = 900.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A car braking from <b>10 m/s</b> stops in <b>10 m</b>. With the same brakes, how far does it need to stop from <b>20 m/s</b>?',
          choices: ['10 m', '20 m', '40 m', '80 m'], answer: 2, keepOrder: true, revealAfterSim: true,
          explain: '40 m: twice the speed needs 2 × 2 = 4 times the distance.',
        },
        {
          type: 'sim', widget: 'u3-brakes', goal: true, title: 'Brake Test: Double the Speed',
          html: 'Test your prediction: two stops with the same brakes.',
          params: {
            u: 10, b: 5,
            tasks: [
              { text: 'Brake from <b>10 m/s</b> at <b>5 m/s²</b>. Note the braking distance.', check: (p) => p.u === 10 && p.b === 5 },
              { text: 'Keep the brakes at 5 m/s² and <b>double the speed</b> to 20 m/s. How much further?', check: (p) => p.u === 20 && p.b === 5, test: true },
            ],
          },
        },
        {
          type: 'info', title: 'Power equation 2: v² = u² + 2as',
          html: `<p>What if a question gives <b>no time</b>? This equation has no t in it:</p>
                 <p class="eq">v² = u² + 2as</p>
                 <p>Example: a car starts from rest and accelerates at 2 m/s² for 25 m. v² = 0 + 2 × 2 × 25 = 100, so v = √100 = <b>10 m/s</b>.</p>
                 <details class="why"><summary>Why does this work?</summary>
                 <p>From v = u + at, the time is t = (v − u) ÷ a. Put it into s = ½(u + v)t: s = (v + u)(v − u) ÷ 2a.</p>
                 <p>(v + u)(v − u) = v² − u². Check: v = 5, u = 3 → 8 × 2 = 16 = 25 − 9 ✔</p>
                 <p>So s = (v² − u²) ÷ 2a, which rearranges to v² = u² + 2as.</p></details>
                 <table class="mini-table squares">
                   <tr><td>12² = 144</td><td>14² = 196</td><td>15² = 225</td><td>16² = 256</td></tr>
                   <tr><td>18² = 324</td><td>20² = 400</td><td>24² = 576</td><td>25² = 625</td></tr>
                 </table>`,
        },
        { type: 'q', t: 'u3.eq-v2' },
        { type: 'q', t: 'u3.v2-final' },
        {
          type: 'info', title: 'Braking distance & stopping distance',
          html: `<p>Braking to a stop: v = 0 and a = −(deceleration), so v² = u² + 2as gives</p>
                 <p class="eq">braking distance = u² ÷ (2 × deceleration)</p>
                 <p>A driver needs a <b>reaction time</b> first, still at full speed: the <b>thinking distance</b>.</p>
                 <p class="eq">stopping distance = speed × reaction time + braking distance</p>
                 <p>20 m/s, 1 s to react, 5 m/s² brakes → 20 + 400 ÷ 10 = 20 + 40 = <b>60 m</b>.</p>`,
        },
        {
          type: 'sim', widget: 'u3-brakes', goal: true, title: 'Stop at the Flag',
          html: 'Plan the stop with the braking distance, then press <b>Brake!</b>',
          params: {
            u: 24, b: 4,
            tasks: [
              { text: 'From <b>24 m/s</b>, choose the brakes so the car stops exactly at the flag, <b>36 m</b> away.', target: 36, check: (p) => p.u === 24 && Math.abs(p.dist - 36) < 1e-9, plan: { value: (p) => p.dist, target: 36, more: 'it stopped before the flag', less: 'it went past the flag', other: 'it stopped on the flag, but it must start at 24 m/s', hint: '36 = 24² ÷ (2 × deceleration). What must the deceleration be?' } },
            ],
          },
        },
        { type: 'q', t: 'u3.stop-mcq' },
        { type: 'q', t: 'u3.stop-dist' },
        { type: 'q', t: 'u3.stop-scale' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.lq', type: 'lesson', title: 'Quadratics in Motion', icon: 'grass',
      notes: {
        eq: ['t² + bt − c = 0 → (t + □)(t − □) = 0', 'two numbers: multiply to −c, add to b'],
        tips: [
          'Example: 21 = 4t + t² → t² + 4t − 21 = 0 → (t + 7)(t − 3) = 0 → t = 3 s.',
          'A product is 0 when one bracket is 0, so there are two answers.',
          'Throw away the negative time: it would be before the start.',
          'Got 2t²? Divide every term by 2 first: 20 = 6t + 2t² → t² + 3t − 10 = 0.',
          'Braking? a is negative: at 10 m/s with a = −2, s = 10t − t².',
          'Sometimes both answers make sense — always check the story.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A car moving at <b>4 m/s</b> accelerates at <b>2 m/s²</b>. When has it gone <b>21 m</b>?',
          choices: ['2 s', '3 s', '5.25 s', '10.5 s'], answer: 1, keepOrder: true,
          explain: 'After 3 s: 4 × 3 + ½ × 2 × 3² = 12 + 9 = 21 m ✔. (5.25 s ignores the speeding up; 10.5 s ignores the starting speed.) Next: how to find it without guessing.',
        },
        {
          type: 'info', title: 'The 21-metre puzzle',
          html: `<p>s = ut + ½at² with u = 4 and a = 2 (½ × 2 = 1) gives <b>21 = 4t + t²</b>. t is in two places, so move everything to one side:</p>
                 <p class="eq">t² + 4t − 21 = 0</p>
                 <p><b>Factorise</b>: two numbers that <b>multiply to −21</b> and <b>add to +4</b>: 7 and −3.</p>
                 <p class="eq">(t + 7)(t − 3) = 0</p>`,
        },
        {
          type: 'info', title: 'Two answers — keep the one that makes sense',
          html: `<p>Two brackets multiply to 0, so one of them is 0: <b>t = −7</b> or <b>t = 3</b>.</p>
                 <p>t = −7 s would be 7 seconds <b>before</b> the car started, so we throw it away: <b>t = 3 s</b>. Check: 4 × 3 + 3² = 12 + 9 = 21 m ✔</p>
                 <p class="tip">Always check the story: sometimes <b>both</b> answers make sense (a ball thrown up passes a window on the way up AND on the way down).</p>`,
        },
        {
          type: 'sim', widget: 'u3-factor', goal: true, title: 'Factor Finder',
          html: 'Find the two numbers, check the brackets, then pick the time that makes sense.',
          params: { problems: [{ u: 2, s: 15 }, { u: 6, s: 16 }] },
        },
        { type: 'q', t: 'u3.quad-factor-mcq' },
        { type: 'q', t: 'u3.quad-solve' },
        { type: 'q', t: 'u3.quad-root-mcq' },
        {
          type: 'info', title: 'Two more tricks',
          html: `<p><b>A 2t²?</b> Divide every term by 2 first. At 6 m/s with a = 4 m/s², when has it gone 20 m?<br>
                 20 = 6t + 2t² → t² + 3t − 10 = 0 → (t + 5)(t − 2) = 0 → <b>t = 2 s</b>.</p>
                 <p><b>Slowing down?</b> Then a is negative. At 10 m/s with a = −2 m/s² for 3 s: s = 30 + ½ × (−2) × 3² = 30 − 9 = <b>21 m</b>.</p>`,
        },
        { type: 'q', t: 'u3.quad-time4' },
        { type: 'q', t: 'u3.quad-time' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u3.psA', type: 'problems', title: 'Calculation Drills', icon: 'crafting',
      steps: [
        { type: 'q', t: 'u3.acc-time' },
        { type: 'q', t: 'u3.acc-final' },
        { type: 'q', t: 'u3.dec-signed' },
        { type: 'q', t: 'u3.dec-stop-time' },
        { type: 'q', t: 'u3.vt-slope' },
        { type: 'q', t: 'u3.vt-area-trap' },
        { type: 'q', t: 'u3.suvat-avg-v' },
        { type: 'q', t: 'u3.suvat-s' },
        { type: 'q', t: 'u3.v2-final' },
        { type: 'q', t: 'u3.power-choose-mcq' },
      ],
    },
    {
      id: 'mech.u3.psB', type: 'problems', title: 'Word Problems', icon: 'bookshelf',
      steps: [
        { type: 'q', t: 'u3.wp-sprinter' },
        { type: 'q', t: 'u3.wp-takeoff' },
        { type: 'q', t: 'u3.wp-elytra' },
        { type: 'q', t: 'u3.wp-two-stage' },
        { type: 'q', t: 'u3.wp-stopping' },
        { type: 'q', t: 'u3.wp-train' },
        { type: 'q', t: 'u3.puzzle-catchup' },
        { type: 'q', t: 'u3.puzzle-stopping' },
      ],
    },
    {
      id: 'mech.u3.review', type: 'problems', title: 'Unit 3 Review', icon: 'diamondore',
      steps: [
        {
          type: 'info', title: 'Unit 3 Review', speaker: 'friend',
          html: '<p>One question on each big idea — plus two from Units 1 and 2 to keep them fresh. Get <b>8 out of 10</b> right first time to <b>master</b> Unit 3!</p>',
        },
        { type: 'q', t: 'u3.acc-basic' },
        { type: 'q', t: 'u3.dec-signed' },
        { type: 'q', t: 'u3.vt-slope' },
        { type: 'q', t: 'u3.vt-area-trap' },
        { type: 'q', t: 'u3.suvat-avg' },
        { type: 'q', t: 'u3.suvat-s' },
        { type: 'q', t: 'u3.stop-scale' },
        { type: 'q', t: 'u3.quad-time' },
        { type: 'q', t: 'u2.rel-chase' },
        { type: 'q', t: 'u1.kmh-to-ms' },
      ],
    },
    {
      id: 'mech.u3.boss', type: 'boss', title: 'Boss: Traffic Light Challenge', icon: 'portal',
      steps: [
        {
          type: 'info', title: 'BOSS MISSION: Traffic Light Challenge', speaker: 'hero',
          html: `<p>You're driving through Block City, and the traffic lights are tricky! Each round is different:</p>
                 <ul><li><b>Red light:</b> choose how hard to brake so you stop exactly on the line.</li>
                 <li><b>Brake point:</b> your brakes are fixed — choose where to start braking.</li>
                 <li><b>Green wave:</b> start from rest and arrive just as the light turns green.</li></ul>
                 <p class="eq">braking distance = u² ÷ (2 × deceleration) &nbsp;&nbsp; s = ½at²</p>
                 <p>Work it out <b>before</b> you press Go. Win <b>3 rounds</b>!</p>`,
        },
        { type: 'sim', widget: 'u3-traffic', goal: true, title: 'Traffic Light Challenge', params: { rounds: 3 } },
        { type: 'q', t: 'u3.brake-decel' },
        { type: 'q', t: 'u3.stop-dist' },
        { type: 'q', t: 'u3.vt-area-trap' },
        { type: 'q', t: 'u3.suvat-s' },
        { type: 'q', t: 'u3.wp-stopping' },
        { type: 'q', t: 'u3.quad-time' },
      ],
    },
  ],
};

