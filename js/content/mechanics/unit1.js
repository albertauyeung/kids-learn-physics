// Unit 1 — Describing Motion
import './unit1-templates.js';
import { graphSVG } from '../../engine/graph-svg.js';

const g = (pts) => graphSVG({ points: pts, tMax: 10, yMax: 10, small: true, w: 140, h: 100, tStep: 2, yStep: 2 });

export default {
  id: 'mech.u1',
  number: 1,
  title: 'Describing Motion',
  subtitle: 'Units, distance, displacement, speed and graphs',
  power: 'Maths power-up: unit conversion & rearranging d = s × t',
  sessions: [
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.l1', type: 'lesson', title: 'Measuring the World', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Welcome, explorer!',
          html: `<p>Hi, I'm <b>Pip</b>! Physics is the science of <b>how things move</b> — minecarts, arrows, falling sand, even planets.</p>
                 <p>To describe motion we need to <b>measure</b> things. Scientists everywhere use the same units (called <b>SI units</b>):</p>
                 <ul><li>length → <b>metre (m)</b></li><li>time → <b>second (s)</b></li><li>mass → <b>kilogram (kg)</b></li></ul>
                 <p>In our blocky world, <b>1 block = 1 metre</b>. Handy!</p>`,
        },
        {
          type: 'predict', prompt: 'How tall do you think Pip is, in metres?',
          choices: ['0.18 m', '1.8 m', '18 m', '180 m'], answer: 1, keepOrder: true,
          explain: 'Pip is a bit shorter than 2 blocks — about 1.8 m, like a tall adult. 18 m would be as tall as a 6-storey building!',
        },
        {
          type: 'info', title: 'Prefixes: kilo, centi, milli',
          html: `<p>A <b>prefix</b> in front of a unit makes it bigger or smaller:</p>
                 <table class="mini-table">
                   <tr><td><b>kilo</b>metre (km)</td><td>1 km = 1000 m</td></tr>
                   <tr><td><b>centi</b>metre (cm)</td><td>1 m = 100 cm</td></tr>
                   <tr><td><b>milli</b>metre (mm)</td><td>1 m = 1000 mm, 1 cm = 10 mm</td></tr>
                   <tr><td><b>milli</b>second (ms)</td><td>1 s = 1000 ms</td></tr>
                 </table>
                 <p>Time works differently: <b>1 min = 60 s</b> and <b>1 h = 60 min = 3600 s</b>.</p>
                 <p class="tip">To go to a <b>smaller</b> unit, multiply. To go to a <b>bigger</b> unit, divide.</p>`,
        },
        {
          type: 'sim', widget: 'sorter', goal: true, title: 'Size Sorter',
          html: 'Tap these lengths from <b>shortest</b> to <b>longest</b>. Convert them in your head first!',
          params: {
            items: [
              { label: '350 mm', value: 0.35 },
              { label: '45 cm', value: 0.45 },
              { label: '2 m', value: 2 },
              { label: '1200 cm', value: 12 },
              { label: '0.5 km', value: 500 },
            ],
            success: '350 mm = 0.35 m, 45 cm = 0.45 m, 1200 cm = 12 m, 0.5 km = 500 m.',
          },
        },
        { type: 'q', t: 'u1.km-to-m' },
        { type: 'q', t: 'u1.cm-to-m' },
        { type: 'q', t: 'u1.min-to-s' },
        { type: 'q', t: 'u1.unit-choice' },
        { type: 'q', t: 'u1.mm-to-cm' },
        { type: 'q', t: 'u1.s-to-ms' },
        { type: 'q', t: 'u1.h-to-min' },
        { type: 'q', t: 'u1.cm-to-m' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.l2', type: 'lesson', title: 'Distance vs Displacement', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Two ways to say "how far"',
          html: `<p><b>Distance</b> = the total ground you covered. Every step counts, whichever way you go.</p>
                 <p><b>Displacement</b> = how far you ended up from where you <b>started</b>, in a straight line, <b>and in which direction</b>.</p>
                 <p>On a number line we use <b>+ for right</b> and <b>− for left</b>.</p>`,
        },
        {
          type: 'predict', prompt: 'Pip walks 5 blocks right, then 5 blocks back left. What are his distance and displacement?',
          choices: ['distance 10 m, displacement 10 m', 'distance 10 m, displacement 0 m', 'distance 0 m, displacement 10 m', 'distance 5 m, displacement 5 m'],
          answer: 1, keepOrder: true,
          explain: 'He walked 10 m in total (distance), but he ended up exactly where he started, so his displacement is 0 m.',
        },
        {
          type: 'sim', widget: 'walker', goal: true, title: 'Walk the Line',
          html: 'Use the buttons (or ← → keys) to walk one block at a time. Complete each task!',
          params: { tasks: [{ distance: 6, displacement: 6 }, { distance: 8, displacement: 0 }, { distance: 10, displacement: -4 }] },
        },
        {
          type: 'info', title: 'Displacement is never longer',
          html: `<p>Notice: the size of your displacement can <b>never</b> be bigger than your distance. A straight line is always the shortest way between two points!</p>
                 <p>Later we'll see that walking <b>3 blocks east and 4 blocks north</b> gives a distance of 7 m but a displacement of only <b>5 m</b>. (Spoiler: it's a famous triangle!)</p>`,
        },
        { type: 'q', t: 'u1.dist-backforth' },
        { type: 'q', t: 'u1.disp-backforth' },
        { type: 'q', t: 'u1.lap' },
        { type: 'q', t: 'u1.disp-bigger' },
        { type: 'q', t: 'u1.disp-backforth' },
        { type: 'q', t: 'u1.dist-backforth' },
        { type: 'q', t: 'u1.disp-backforth' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.l3', type: 'lesson', title: 'Speed', icon: 'grass',
      steps: [
        {
          type: 'predict', prompt: 'Race time! The <b>minecart</b> (8 m/s) races <b>40 m</b>. Pip sprints (5 m/s) but only needs to run <b>20 m</b>. Who finishes first?',
          choices: ['The minecart', 'Pip', 'It is a tie'], answer: 1, keepOrder: true,
          explain: 'The minecart needs 40 ÷ 8 = 5 s. Pip needs 20 ÷ 5 = 4 s. Faster doesn\'t always mean first!',
        },
        {
          type: 'sim', widget: 'race', goal: true, title: 'Race Track',
          html: 'Press <b>Start race</b> to test your prediction.',
          params: { lanes: [{ racer: 'minecart', name: 'Minecart', speed: 8, distance: 40 }, { racer: 'hero', name: 'Pip', speed: 5, distance: 20 }] },
        },
        {
          type: 'info', title: 'What is speed?',
          html: `<p><b>Speed tells you how much distance you cover every second.</b></p>
                 <p class="eq">speed = distance ÷ time</p>
                 <p>If a horse runs 30 m in 5 s, it covers 30 ÷ 5 = <b>6 m every second</b>: its speed is <b>6 m/s</b> ("metres per second").</p>
                 <p>For long trips we use <b>km/h</b> (kilometres per hour).</p>`,
        },
        {
          type: 'sim', widget: 'race', goal: true, title: 'Animal Race',
          html: 'Race the animals at two different distances. The table works out <b>distance ÷ time</b> for each racer — what do you notice?',
          params: {
            races: 2,
            hideSpeeds: true,
            lanes: [
              { racer: 'turtle', name: 'Turtle', speed: 0.5, distance: 20 },
              { racer: 'chicken', name: 'Chicken', speed: 2, distance: 20 },
              { racer: 'hero', name: 'Pip', speed: 4, distance: 20 },
              { racer: 'horse', name: 'Horse', speed: 10, distance: 20 },
            ],
            editDistance: { min: 10, max: 60, step: 10 },
          },
        },
        { type: 'q', t: 'u1.eq-distance' },
        { type: 'q', t: 'u1.eq-time' },
        { type: 'q', t: 'u1.speed-basic' },
        { type: 'q', t: 'u1.speed-distance' },
        { type: 'q', t: 'u1.speed-time' },
        { type: 'q', t: 'u1.speed-unit-mcq' },
        { type: 'q', t: 'u1.speed-kmh' },
        { type: 'q', t: 'u1.speed-basic' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.l4', type: 'lesson', title: 'Average Speed', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Real journeys change speed',
          html: `<p>On a real trip you speed up, slow down and stop. The <b>average speed</b> is the steady speed that would cover the same distance in the same time:</p>
                 <p class="eq">average speed = total distance ÷ total time</p>`,
        },
        {
          type: 'predict', prompt: 'Pip walks 3 km at 6 km/h, then another 3 km at 2 km/h. What is his average speed?',
          choices: ['4 km/h', '3 km/h', '8 km/h', '2 km/h'], answer: 1, keepOrder: true,
          explain: 'First part: 3 ÷ 6 = 0.5 h. Second part: 3 ÷ 2 = 1.5 h. Total: 6 km in 2 h = 3 km/h — not 4!',
        },
        {
          type: 'sim', widget: 'journey', goal: true, title: 'Journey Planner',
          html: 'Press <b>Go!</b> and compare the real average with "the average of the two speeds". Then try changing the sliders.',
          params: { d1: 3, s1: 6, d2: 3, s2: 2 },
        },
        {
          type: 'info', title: 'Why the trap works',
          html: `<p>Pip spent <b>1.5 hours</b> walking slowly but only <b>0.5 hours</b> walking fast. The slow part lasted longer, so it "counts more".</p>
                 <p class="tip">Only when you spend <b>equal times</b> at each speed is the average exactly halfway.</p>`,
        },
        {
          type: 'info', title: 'Power-up: km/h ↔ m/s',
          html: `<p>1 km/h means 1000 m in 3600 s. Since 3600 ÷ 1000 = 3.6:</p>
                 <p class="eq">m/s = km/h ÷ 3.6 &nbsp;&nbsp;|&nbsp;&nbsp; km/h = m/s × 3.6</p>
                 <p>Example: 36 km/h ÷ 3.6 = <b>10 m/s</b>.</p>`,
        },
        { type: 'q', t: 'u1.avg-times' },
        { type: 'q', t: 'u1.kmh-to-ms' },
        { type: 'q', t: 'u1.avg-speeds' },
        { type: 'q', t: 'u1.ms-to-kmh' },
        { type: 'q', t: 'u1.avg-trap-mcq' },
        { type: 'q', t: 'u1.avg-times' },
        { type: 'q', t: 'u1.kmh-to-ms' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.l5', type: 'lesson', title: 'Distance–Time Graphs', icon: 'grass',
      steps: [
        {
          type: 'info', title: 'Pictures of motion',
          html: `<p>A <b>distance–time graph</b> tells a story: time goes along the bottom, distance goes up the side.</p>
                 <ul><li><b>Steeper</b> line → faster</li><li><b>Flat</b> line → standing still</li><li><b>Straight</b> line → steady speed</li></ul>`,
        },
        {
          type: 'predict', grid: true, prompt: 'Which graph shows Pip <b>running fastest</b>?',
          choices: [g([[0, 0], [10, 3]]), g([[0, 0], [10, 6]]), g([[0, 0], [4, 10]]), g([[0, 4], [10, 4]])], answer: 2,
          explain: 'The steepest line covers the most distance in the least time.',
        },
        {
          type: 'sim', widget: 'motion-mapper', goal: true, title: 'Motion Mapper',
          html: 'Press <b>Record</b>, then move Pip using the slider (or drag him on the track). Try: walk slowly, stop, then run!',
          params: { duration: 10, track: [0, 20], label: 'distance' },
        },
        {
          type: 'sim', widget: 'motion-mapper', goal: true, title: 'Match the Graph',
          html: 'Can you move Pip so your line matches the dashed one?',
          params: { duration: 10, track: [0, 20], label: 'distance', target: [[0, 0], [4, 8], [7, 8], [10, 18]], tolerance: 1.6 },
        },
        {
          type: 'info', title: 'Speed from a graph',
          html: `<p>Pick a straight piece of the line. Read how much the distance changed and how much time passed:</p>
                 <p class="eq">speed = change in distance ÷ change in time</p>
                 <p>In the target graph above, Pip went 8 m in the first 4 s: <b>2 m/s</b>. Then he stopped for 3 s. Then 10 m in 3 s ≈ 3.3 m/s.</p>`,
        },
        { type: 'q', t: 'u1.graph-still-mcq' },
        { type: 'q', t: 'u1.graph-faster-mcq' },
        { type: 'q', t: 'u1.graph-speed' },
        { type: 'q', t: 'u1.graph-stop' },
        { type: 'q', t: 'u1.graph-speed' },
        { type: 'q', t: 'u1.graph-stop' },
        { type: 'q', t: 'u1.speed-distance' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u1.psA', type: 'problems', title: 'Calculation Drills', icon: 'crafting',
      steps: [
        { type: 'q', t: 'u1.km-to-m' },
        { type: 'q', t: 'u1.h-to-min' },
        { type: 'q', t: 'u1.speed-basic' },
        { type: 'q', t: 'u1.speed-distance' },
        { type: 'q', t: 'u1.speed-time' },
        { type: 'q', t: 'u1.kmh-to-ms' },
        { type: 'q', t: 'u1.disp-backforth' },
        { type: 'q', t: 'u1.avg-times' },
      ],
    },
    {
      id: 'mech.u1.psB', type: 'problems', title: 'Word Problems', icon: 'bookshelf',
      steps: [
        { type: 'q', t: 'u1.speed-kmh' },
        { type: 'q', t: 'u1.wp-school' },
        { type: 'q', t: 'u1.wp-thunder' },
        { type: 'q', t: 'u1.wp-bus' },
        { type: 'q', t: 'u1.wp-cheetah' },
        { type: 'q', t: 'u1.wp-avg-trap' },
        { type: 'q', t: 'u1.puzzle-snail' },
        { type: 'q', t: 'u1.puzzle-impossible' },
      ],
    },
    {
      id: 'mech.u1.boss', type: 'boss', title: 'Boss: Railway Delivery', icon: 'portal',
      steps: [
        {
          type: 'info', title: 'BOSS MISSION: Railway Delivery', speaker: 'minecart',
          html: `<p>The villagers need supplies delivered <b>exactly on time</b>! The minecart must reach every station at the scheduled second.</p>
                 <p>For each leg, work out the time it has (arrival − previous arrival), then set the speed:</p>
                 <p class="eq">speed = distance ÷ time</p>
                 <p>Complete <b>3 deliveries</b> to win.</p>`,
        },
        { type: 'sim', widget: 'rail-delivery', goal: true, title: 'Railway Delivery', params: { rounds: 3 } },
        { type: 'q', t: 'u1.avg-speeds' },
        { type: 'q', t: 'u1.wp-avg-trap' },
        { type: 'q', t: 'u1.graph-stop' },
        { type: 'q', t: 'u1.wp-school' },
        { type: 'q', t: 'u1.speed-time' },
        { type: 'q', t: 'u1.wp-thunder' },
      ],
    },
  ],
};
