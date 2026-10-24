// Unit 2 — Velocity & Relative Motion
import './unit2-templates.js';
import { graphSVG, triangleSVG } from '../../engine/graph-svg.js';

const g = (pts) => graphSVG({ points: pts, tMax: 10, yMax: 10, small: true, w: 140, h: 100, tStep: 2, yStep: 2 });

export default {
  id: 'mech.u2',
  number: 2,
  title: 'Velocity & Relative Motion',
  subtitle: 'Direction, arrows, closing speeds and river crossings',
  power: 'Maths power-up: negative numbers, square roots & Pythagoras',
  sessions: [
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.l1', type: 'lesson', title: 'Speed vs Velocity', icon: 'grass',
      steps: [
        {
          type: 'predict', prompt: 'Two minecarts both have a speed of 4 m/s. Do they have the same velocity?',
          choices: ['Yes, always', 'Only if they move in the same direction', 'No, never'], answer: 1, keepOrder: true,
          explain: 'Velocity includes direction. Same speed + same direction = same velocity.',
        },
        {
          type: 'info', title: 'Speed + direction = velocity',
          html: `<p><b>Speed</b> only tells you how fast. <b>Velocity</b> tells you how fast <b>and which way</b>.</p>
                 <p>On a line we use signs: <b>+3 m/s</b> means 3 m/s to the right; <b>−3 m/s</b> means 3 m/s to the left.</p>
                 <p class="tip">Both have a <b>speed</b> of 3 m/s, but their <b>velocities</b> are different! A minus sign means "left", not "slowing down".</p>`,
        },
        {
          type: 'sim', widget: 'velocity-line', goal: true, title: 'Velocity Line',
          html: 'Set the velocity with the slider, then press <b>Play</b> to watch the cart move for 4 seconds.',
          params: {
            tasks: [
              { text: 'Make the cart move <b>left at 3 m/s</b>', check: (v) => v === -3 },
              { text: 'Make the cart move <b>right at 5 m/s</b>', check: (v) => v === 5 },
              { text: 'Make the cart end up at <b>−8 m</b> after 4 s', check: (v) => v === -2 },
            ],
          },
        },
        {
          type: 'info', title: 'Average velocity',
          html: `<p>Average <b>speed</b> uses total <b>distance</b>. Average <b>velocity</b> uses <b>displacement</b> (from Unit 1!):</p>
                 <p class="eq">velocity = displacement ÷ time</p>
                 <p>Example: walk 12 m right, then 4 m left, in 4 s.<br>
                 Speed = 16 ÷ 4 = <b>4 m/s</b>. Velocity = (+12 − 4) ÷ 4 = <b>+2 m/s</b>.</p>`,
        },
        { type: 'q', t: 'u2.vel-sign-mcq' },
        { type: 'q', t: 'u2.speed-avg' },
        { type: 'q', t: 'u2.vel-avg' },
        { type: 'q', t: 'u1.disp-three' },
        { type: 'q', t: 'u2.vel-avg' },
        { type: 'q', t: 'u2.vel-avg-unknown' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.l2', type: 'lesson', title: 'Adding Velocities', icon: 'grass',
      steps: [
        {
          type: 'predict', prompt: 'Pip walks at 1.5 m/s on a moving walkway that goes 1 m/s in the same direction. How fast is he going compared with the ground?',
          choices: ['0.5 m/s', '1.5 m/s', '2.5 m/s', '1 m/s'], answer: 2, keepOrder: true, revealAfterSim: true,
          explain: 'Both arrows point the same way, so they add: 1.5 + 1 = 2.5 m/s.',
        },
        {
          type: 'sim', widget: 'travelator', goal: true, title: 'Moving Walkway',
          html: 'Test your prediction (walkway +1, Pip +1.5), then complete each task. Hold it for a moment to score!',
          params: {
            tasks: [
              { text: 'Make Pip move at <b>+4 m/s</b> compared with the ground.', check: (w, k) => w + k === 4 },
              { text: 'Make Pip <b>stand still</b> compared with the ground while the walkway is moving.', check: (w, k) => w !== 0 && w + k === 0 },
              { text: 'Make the walkway go <b>right</b>, but Pip go <b>left</b> overall.', check: (w, k) => w > 0 && w + k < 0 },
            ],
          },
        },
        {
          type: 'info', title: 'Velocities are arrows',
          html: `<p>We draw velocity as an <b>arrow</b>: its <b>length</b> is the speed and it <b>points</b> in the direction of motion. (Scientists call arrows like this <b>vectors</b>.)</p>
                 <p>To combine two motions, put the arrows <b>tip-to-tail</b>. The arrow from the very start to the very end is the total:</p>
                 <p class="eq">ground velocity = walkway velocity + walking velocity</p>
                 <p>Remember the signs! Walking left at 3 m/s on a walkway going right at 1 m/s:<br>
                 (+1) + (−3) = <b>−2 m/s</b> — Pip goes left at 2 m/s.</p>`,
        },
        { type: 'q', t: 'u2.add-same' },
        { type: 'q', t: 'u2.add-opposite' },
        { type: 'q', t: 'u2.boat-line' },
        { type: 'q', t: 'u2.add-cancel-mcq' },
        { type: 'q', t: 'u2.add-opposite' },
        { type: 'q', t: 'u1.kmh-to-ms' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.l3', type: 'lesson', title: 'Relative Motion', icon: 'grass',
      steps: [
        {
          type: 'predict', prompt: 'You sit in a minecart rolling at 6 m/s. Your friend runs beside you at 6 m/s, the same way. How fast does your friend seem to move, to you?',
          choices: ['0 m/s', '6 m/s', '12 m/s'], answer: 0, keepOrder: true,
          explain: 'You both move the same way at the same speed, so to you your friend looks still!',
        },
        {
          type: 'info', title: 'It depends who is watching',
          html: `<p>Motion is always measured <b>relative to something</b>. To someone on the ground, your friend moves at 6 m/s. To you, they're still — and the trees seem to slide <b>backwards</b> past you!</p>
                 <p>When two things move <b>towards each other</b>, the gap shrinks at the <b>sum</b> of their speeds — the <b>closing speed</b>.</p>
                 <p>When one <b>chases</b> another, the gap shrinks at the <b>difference</b> of their speeds.</p>
                 <p class="eq">time to meet = gap ÷ closing speed</p>`,
        },
        {
          type: 'sim', widget: 'two-carts', goal: true, title: 'Head-on Meeting',
          html: 'Choose speeds so the carts meet exactly at the flag. Think: A must cover 40 of the 60 metres. What fraction of the gap is that?',
          params: { mode: 'meet', distance: 60, flag: 40, v1: 3, v2: 3 },
        },
        {
          type: 'sim', widget: 'two-carts', goal: true, title: 'The Chase',
          html: 'Cart B starts 20 m ahead. Choose speeds so A catches B exactly at the flag (60 m).',
          params: { mode: 'chase', gap: 20, flag: 60, v1: 4, v2: 2, length: 80 },
        },
        {
          type: 'equation', prompt: 'Build the formula for the time until two carts meet.',
          lhs: 'time', tiles: ['gap', 'closing speed', '÷', '×', 'time'], answers: [['gap', '÷', 'closing speed']],
          explain: 'The gap shrinks by "closing speed" metres every second, so time = gap ÷ closing speed.',
        },
        { type: 'q', t: 'u2.rel-same-mcq' },
        { type: 'q', t: 'u2.frame-mcq' },
        { type: 'q', t: 'u2.rel-meet' },
        { type: 'q', t: 'u2.rel-chase' },
        { type: 'q', t: 'u2.meet-unknown' },
        { type: 'q', t: 'u2.chase-delay' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.lp', type: 'lesson', title: 'Pythagoras & Square Roots', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Square roots',
          html: `<p>A <b>square number</b> is a number times itself: 5² = 5 × 5 = 25.</p>
                 <p>A <b>square root</b>, written <b>√</b>, goes backwards. It asks: <i>which number times itself gives this?</i></p>
                 <p class="eq">√25 = 5 because 5 × 5 = 25</p>
                 <table class="mini-table squares">
                   <tr><td>1² = 1</td><td>2² = 4</td><td>3² = 9</td><td>4² = 16</td><td>5² = 25</td><td>6² = 36</td><td>7² = 49</td></tr>
                   <tr><td>8² = 64</td><td>9² = 81</td><td>10² = 100</td><td>11² = 121</td><td>12² = 144</td><td>13² = 169</td><td>15² = 225</td></tr>
                   <tr><td>16² = 256</td><td>17² = 289</td><td>20² = 400</td><td>24² = 576</td><td>25² = 625</td><td></td><td></td></tr>
                 </table>`,
        },
        {
          type: 'sim', widget: 'sorter', goal: true, title: 'Squares Sprint',
          html: 'Work out each value, then tap them from <b>smallest</b> to <b>largest</b>.',
          params: {
            items: [
              { label: '√16', value: 4 },
              { label: '√36', value: 6 },
              { label: '3²', value: 9 },
              { label: '√100', value: 10 },
              { label: '4²', value: 16 },
            ],
            prompt: 'Tap the values in order, smallest first. Tap a placed one to take it back.',
            success: '√16 = 4, √36 = 6, 3² = 9, √100 = 10, 4² = 16.',
          },
        },
        {
          type: 'predict', prompt: 'Pip walks 3 blocks east, then 4 blocks north. How far is he from his start in a straight line?',
          choices: ['7 m', '5 m', '1 m', '12 m'], answer: 1, keepOrder: true,
          explain: 'He walked 7 m, but the straight line back is shorter: it is the long side of a right-angled triangle — 5 m.',
        },
        {
          type: 'info', title: 'Pythagoras',
          html: `<p>In a <b>right-angled triangle</b>, the squares of the two short sides add up to the square of the long side (the <b>hypotenuse</b>):</p>
                 <p class="eq">a² + b² = c²</p>
                 ${triangleSVG({ a: 4, b: 3, aLabel: '4', bLabel: '3', cLabel: '5' })}
                 <p>Check: 3² + 4² = 9 + 16 = 25 = 5², so c = √25 = 5. This "3-4-5 triangle" is famous — builders have used it for thousands of years to make perfect corners!</p>
                 <p class="tip">The long side is always <b>shorter</b> than the two short sides added up (5 &lt; 3 + 4).</p>`,
        },
        { type: 'q', t: 'u2.pyth-hyp' },
        { type: 'q', t: 'u2.pyth-walk' },
        {
          type: 'info', title: 'Worked example: finding a short side',
          html: `<p>The hypotenuse is <b>13 m</b> and one short side is <b>5 m</b>. How long is the other short side?</p>
                 <p>Start from a² + b² = c² and move the known side over:</p>
                 <p class="eq">a² = c² − b² = 13² − 5² = 169 − 25 = 144</p>
                 <p class="eq">a = √144 = 12 m</p>
                 <p class="tip">Subtract the <b>squares</b>, not the sides: 13 − 5 = 8 is wrong!</p>`,
        },
        { type: 'q', t: 'u2.pyth-leg' },
        { type: 'q', t: 'u2.pyth-hyp' },
        { type: 'q', t: 'u2.pyth-walk' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.l4', type: 'lesson', title: 'Crossing the River', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Why Pythagoras works for velocity',
          html: `<p>A boat points straight across a river at <b>4 m/s</b> while the current pushes it downstream at <b>3 m/s</b>.</p>
                 <p>In <b>one second</b> it moves 4 m across <b>and</b> 3 m downstream — two sides of a right-angled triangle.</p>
                 ${triangleSVG({ a: 3, b: 4, aLabel: '3 m downstream', bLabel: '4 m across', cLabel: '5 m' })}
                 <p>So in one second it really travels √(4² + 3²) = <b>5 m</b>: its actual speed is <b>5 m/s</b>.</p>`,
        },
        {
          type: 'predict', prompt: 'The current gets <b>twice as fast</b>. What happens to the time the boat takes to cross the river?',
          choices: ['It stays the same', 'It doubles', 'It halves', 'It gets a bit longer'], answer: 0, keepOrder: true, revealAfterSim: true,
          explain: 'The across-motion and the downstream-motion are independent. Only the boat\'s across-speed gets it to the other side, so the crossing time stays the same — the boat just lands further downstream.',
        },
        {
          type: 'sim', widget: 'river', goal: true, title: 'River Lab',
          html: 'Launch once with these settings and note the crossing time. Then follow the tasks — the next one tests your prediction!',
          params: {
            mode: 'free', width: 20, boat: 4, current: 3,
            tasks: [
              { text: 'Launch with these settings and note the crossing time.', check: (p) => p.width === 20 && p.boat === 4 && p.current === 3 },
              { text: 'Keep the river 20 m wide and the boat at 4 m/s, but <b>double the current to 6 m/s</b>. Did the crossing time change?', check: (p) => p.current === 6 && p.width === 20 && p.boat === 4 },
              { text: 'Make the crossing take exactly <b>4 s</b>.', check: (p) => p.width / p.boat === 4 },
              { text: 'Make the boat drift exactly <b>12 m</b> downstream.', check: (p, drift) => Math.abs(drift - 12) < 1e-9 },
              { text: 'Make the boat\'s actual speed exactly <b>10 m/s</b>.', check: (p) => Math.abs(Math.hypot(p.boat, p.current) - 10) < 1e-9 },
            ],
          },
        },
        {
          type: 'info', title: 'Two separate motions',
          html: `<p>The current <b>doesn't slow down your crossing</b>. The "across" motion and the "sideways" motion happen independently:</p>
                 <p class="eq">time to cross = width ÷ boat speed</p>
                 <p class="eq">drift = current speed × time</p>
                 <p>You'll meet this idea again with cannonballs in Unit 6!</p>`,
        },
        { type: 'q', t: 'u2.river-speed' },
        { type: 'q', t: 'u2.river-time' },
        { type: 'q', t: 'u2.river-current-mcq' },
        { type: 'q', t: 'u2.river-drift' },
        { type: 'q', t: 'u2.river-speed' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.l5', type: 'lesson', title: 'Slope = Velocity', icon: 'grass',
      steps: [
        {
          type: 'predict', grid: true, prompt: 'This graph shows <b>position</b>, which can go up or down. Which one shows Pip walking <b>back towards the start</b> (moving left)?',
          choices: [g([[0, 1], [10, 9]]), g([[0, 6], [10, 6]]), g([[0, 9], [10, 2]]), g([[0, 0], [5, 10]])], answer: 2,
          explain: 'His position number is getting smaller, so he is moving in the − direction.',
        },
        {
          type: 'info', title: 'Position–time graphs',
          html: `<p>A <b>position–time</b> graph can go up <b>or down</b>. The <b>slope</b> (steepness) of the line is the velocity:</p>
                 <p class="eq">velocity = rise ÷ run = change in position ÷ change in time</p>
                 <ul><li>Uphill → <b>+</b> velocity (moving right)</li><li>Flat → 0 (stopped)</li><li>Downhill → <b>−</b> velocity (moving left)</li></ul>
                 <p class="tip">Where two lines <b>cross</b>, the two things are at the <b>same place</b> — not going at the same speed.</p>`,
        },
        {
          type: 'sim', widget: 'slope-reader', goal: true, title: 'Slope Reader',
          html: 'Drag the <b>time</b> slider through every piece of the graph. Read the rise and the run for each one.',
          params: { points: [[0, 0], [4, 12], [6, 12], [10, 4]], track: [0, 20] },
        },
        {
          type: 'sim', widget: 'motion-mapper', goal: true, title: 'There and Back',
          html: 'Match this graph: walk out, wait, then walk back!',
          params: { duration: 10, track: [0, 20], target: [[0, 2], [4, 14], [6, 14], [10, 4]], tolerance: 1.6 },
        },
        { type: 'q', t: 'u2.slope-read' },
        { type: 'q', t: 'u2.cross-mcq' },
        { type: 'q', t: 'u2.slope-segment' },
        { type: 'q', t: 'u2.vel-sign-mcq' },
        { type: 'q', t: 'u2.slope-read' },
        { type: 'q', t: 'u2.slope-segment' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u2.psA', type: 'problems', title: 'Calculation Drills', icon: 'crafting',
      steps: [
        { type: 'q', t: 'u2.vel-avg' },
        { type: 'q', t: 'u2.add-same' },
        { type: 'q', t: 'u2.add-opposite' },
        { type: 'q', t: 'u2.rel-meet' },
        { type: 'q', t: 'u2.rel-chase' },
        { type: 'q', t: 'u2.pyth-leg' },
        { type: 'q', t: 'u2.slope-read' },
        { type: 'q', t: 'u2.slope-left-mcq' },
        { type: 'q', t: 'u1.kmh-to-ms' },
        { type: 'q', t: 'u1.avg-times' },
      ],
    },
    {
      id: 'mech.u2.psB', type: 'problems', title: 'Word Problems', icon: 'bookshelf',
      steps: [
        { type: 'q', t: 'u2.wp-cars' },
        { type: 'q', t: 'u2.wp-plane' },
        { type: 'q', t: 'u2.river-drift' },
        { type: 'q', t: 'u2.rel-meetpos' },
        { type: 'q', t: 'u2.wp-escalator' },
        { type: 'q', t: 'u1.wp-avg-trap' },
        { type: 'q', t: 'u2.puzzle-fly' },
        { type: 'q', t: 'u2.puzzle-current' },
      ],
    },
    {
      id: 'mech.u2.review', type: 'problems', title: 'Unit 2 Review', icon: 'diamondore',
      steps: [
        {
          type: 'info', title: 'Unit 2 Review', speaker: 'friend',
          html: `<p>One question on each big idea — plus two from Unit 1 to keep them fresh. Get <b>8 out of 10</b> right first time to <b>master</b> Unit 2!</p>`,
        },
        { type: 'q', t: 'u2.vel-avg' },
        { type: 'q', t: 'u2.add-opposite' },
        { type: 'q', t: 'u2.frame-mcq' },
        { type: 'q', t: 'u2.rel-chase' },
        { type: 'q', t: 'u2.pyth-walk' },
        { type: 'q', t: 'u2.river-current-mcq' },
        { type: 'q', t: 'u2.cross-mcq' },
        { type: 'q', t: 'u2.slope-segment' },
        { type: 'q', t: 'u1.avg-speeds' },
        { type: 'q', t: 'u1.graph-height-mcq' },
      ],
    },
    {
      id: 'mech.u2.boss', type: 'boss', title: 'Boss: River Rescue', icon: 'portal',
      steps: [
        {
          type: 'info', title: 'BOSS MISSION: River Rescue', speaker: 'boat',
          html: `<p>Swimmers are stuck in a fast river, close to the far bank! Your boat always points <b>straight across</b>, so the current will carry you downstream.</p>
                 <p>Choose your <b>launch point</b> so you land right next to each swimmer:</p>
                 <p class="eq">time = width ÷ boat speed &nbsp;→&nbsp; drift = current × time</p>
                 <p>Launch point = swimmer position − drift. Rescue <b>3 swimmers</b> to win!</p>`,
        },
        { type: 'sim', widget: 'river', goal: true, title: 'River Rescue', params: { mode: 'rescue', rounds: 3 } },
        { type: 'q', t: 'u2.river-speed' },
        { type: 'q', t: 'u2.wp-escalator' },
        { type: 'q', t: 'u2.slope-segment' },
        { type: 'q', t: 'u2.wp-plane' },
        { type: 'q', t: 'u2.meet-unknown' },
        { type: 'q', t: 'u2.pyth-leg' },
      ],
    },
  ],
};
