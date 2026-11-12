// Unit 4 — Forces & Newton's Laws
import './unit4-sprites.js';
import { fbdSVG } from './unit4-templates.js';

export default {
  id: 'mech.u4',
  number: 4,
  title: "Forces & Newton's Laws",
  subtitle: 'F = ma, friction, action and reaction',
  power: 'Maths power-up: adding force arrows with signs, the resultant force',
  conceptNames: {
    'mech.force': 'Forces & resultant force',
    'mech.newton1': "Newton's 1st law & inertia",
    'mech.newton2': "Newton's 2nd law (F = ma)",
    'mech.friction': 'Friction',
    'mech.newton3': "Newton's 3rd law",
  },
  sessions: [
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.l1', type: 'lesson', title: 'Pushes, Pulls & Newtons', icon: 'grass',
      notes: {
        eq: ['force unit: newton (N)', 'same direction: resultant = add', 'opposite directions: resultant = bigger − smaller (+ right, − left)'],
        tips: [
          'A force is a push or a pull. Draw it as an arrow: longer arrow = bigger force.',
          'A strong push from you ≈ 100–200 N. Holding up an apple ≈ 1 N.',
          'Tug-of-war: 310 N right and 360 N left → (+310) + (−360) = −50 N, so 50 N to the left.',
          'Balanced forces: resultant = 0. Check left = right AND up = down.',
        ],
      },
      steps: [
        {
          type: 'info', title: 'Forces are pushes and pulls',
          html: `<p>A <b>force</b> is a push or a pull. Forces can start things moving, stop them, speed them up, slow them down or turn them.</p>
                 <p>We measure forces in <b>newtons (N)</b>, named after Isaac Newton. Holding up an apple takes about <b>1 N</b>; a strong push from you is about <b>100–200 N</b>.</p>
                 <p>We draw a force as an <b>arrow</b>: it points the way the force acts, and a <b>longer</b> arrow means a <b>bigger</b> force.</p>`,
        },
        {
          type: 'predict', prompt: 'Tug-of-war! The left team pulls with <b>360 N</b> altogether. The right team pulls with <b>310 N</b>. What happens to the rope?',
          choices: ['It moves left, with a resultant force of 50 N', 'It moves right, with a resultant force of 50 N', 'It moves left, with a resultant force of 670 N', 'It doesn\'t move: both teams are pulling'],
          answer: 0, keepOrder: true, revealAfterSim: true,
          explain: 'With Pip pulling 150 N, the right team makes 160 + 150 = 310 N. The pulls point opposite ways, so they partly cancel: 360 − 310 = 50 N, towards the stronger team on the left.',
        },
        {
          type: 'sim', widget: 'u4-tug', goal: true, title: 'Tug-of-War',
          html: 'Each puller\'s force is shown above them. Set <b>Pip\'s pull</b>, then press <b>Pull!</b> Work out each answer before you test it.',
          params: {
            left: [{ sprite: 'u4zombie', name: 'Zombie', f: 120 }, { sprite: 'u4zombie', name: 'Zombie', f: 90 }, { sprite: 'u4golem', name: 'Golem', f: 150 }],
            right: [{ sprite: 'friend', name: 'Alex', f: 160 }],
            pip: 150,
            tasks: [
              { text: 'Test your prediction: press <b>Pull!</b> with Pip pulling <b>150 N</b>.', check: (res, pip) => pip === 150, tested: true },
              { text: 'Make the forces <b>balanced</b>, so the rope doesn\'t move at all.', check: (res) => res === 0 },
              { text: 'Make the resultant force <b>40 N to the right</b>.', check: (res) => res === 40 },
            ],
          },
        },
        {
          type: 'info', title: 'Maths power-up: the resultant force',
          html: `<p>When several forces act on one thing, combine them into one <b>resultant force</b>: the force that really decides what happens.</p>
                 <p>Use signs, just like velocities in Unit 2: <b>+</b> for right, <b>−</b> for left.</p>
                 <ul><li>Same direction → <b>add</b>: 80 N + 50 N = 130 N</li>
                 <li>Opposite directions → they partly cancel: (+310) + (−360) = <b>−50 N</b>, 50 N to the left</li>
                 <li>Equal and opposite → resultant <b>0</b>: <b>balanced</b></li></ul>`,
        },
        {
          type: 'info', title: 'Free-body diagrams',
          html: `<p>A <b>free-body diagram</b> shows one object as a box, with an arrow for every force on it:</p>
                 ${fbdSVG({ right: [{ value: 120, label: 'Pip pushes' }], left: [{ value: 80, label: 'Alex pulls' }], up: { value: 300, label: 'floor' }, down: { value: 300, label: 'gravity' } })}
                 <p class="tip">Up and down cancel (300 N each). Along the floor: 120 − 80 = <b>40 N to the right</b>.</p>`,
        },
        { type: 'q', t: 'u4.estimate-mcq' },
        { type: 'q', t: 'u4.resultant-same' },
        { type: 'q', t: 'u4.resultant-opp' },
        { type: 'q', t: 'u4.fbd-balanced-mcq' },
        { type: 'q', t: 'u4.missing-force' },
        { type: 'q', t: 'u4.fbd-resultant' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.l2', type: 'lesson', title: "Newton's 1st Law", icon: 'grass',
      notes: {
        eq: ['balanced forces (resultant 0) → no change in motion'],
        tips: [
          'No resultant force: still things stay still, moving things keep moving at a steady speed in a straight line.',
          'Things don\'t need a force to KEEP moving. On Earth, friction and air resistance slow them down.',
          'Steady speed → balanced: a car cruising with an 800 N engine force has 800 N of air resistance + friction.',
          'Inertia: things keep doing what they are doing. That\'s why you lurch forwards when a bus brakes.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'Pip glides through deep space at <b>3 m/s</b>. His jetpack is off, and there is no air out there. What happens next?',
          choices: ['He slowly slows down and stops', 'He keeps gliding at 3 m/s', 'He speeds up', 'He stops straight away'],
          answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'With the jetpack off, nothing pushes or pulls on Pip, so nothing changes his motion: he kept gliding at 3 m/s in a straight line.',
        },
        {
          type: 'sim', widget: 'u4-space', goal: true, title: 'Space Skater',
          html: 'Pip and his space suit have a mass of <b>60 kg</b>. Each jetpack <b>blast</b> pushes with <b>60 N</b> for 1 second, which changes his speed by exactly <b>1 m/s</b>. The dots show where he was every half second.',
          params: {
            v0: 3,
            tasks: [
              { text: 'Press <b>Start</b> and watch Pip for 4 seconds with the jetpack <b>off</b>. Does he slow down?', check: (s) => s.blasts === 0 && s.coast >= 4, tested: true },
              { text: 'Use blasts to make Pip <b>stop completely</b>. Then let him float for 2 seconds.', check: (s) => s.v === 0 && s.coast >= 2 },
              { text: 'Make Pip glide <b>left at 2 m/s</b> for 2 seconds.', check: (s) => s.v === -2 && s.coast >= 2 },
            ],
          },
        },
        {
          type: 'info', title: "Newton's First Law",
          html: `<p class="eq">no resultant force → no change in motion</p>
                 <p>If the forces on something are <b>balanced</b> (or there are none), it does <b>not</b> speed up, slow down or turn:</p>
                 <ul><li>If it is still, it <b>stays still</b>.</li>
                 <li>If it is moving, it <b>keeps moving at the same speed in a straight line</b>.</li></ul>`,
        },
        {
          type: 'info', title: 'So why do things stop?',
          html: `<p>Things don't need a force to <b>keep</b> moving. A football on grass stops because <b>friction and air resistance</b> push against it. In space there's nothing to stop Pip.</p>
                 <p class="tip">A car cruising at a steady 25 m/s has <b>balanced</b> forces: the engine's push exactly matches air resistance + friction.</p>`,
        },
        {
          type: 'info', title: 'Inertia',
          html: `<p>Everything keeps doing what it is doing until a force changes it. This is called <b>inertia</b>. The more mass something has, the more inertia it has: a heavy minecart is harder to start <b>and</b> to stop.</p>
                 <p>When a bus brakes suddenly, the bus slows down — but nothing has slowed <b>you</b> yet, so you lurch forwards. A <b>seatbelt</b> gives the force that stops you.</p>`,
        },
        { type: 'q', t: 'u4.n1-glide-mcq' },
        { type: 'q', t: 'u4.balanced-which-mcq' },
        { type: 'q', t: 'u4.n1-state-mcq' },
        { type: 'q', t: 'u4.n1-steady-force' },
        { type: 'q', t: 'u4.inertia-mcq' },
        { type: 'q', t: 'u4.n1-space-speed' },
        { type: 'q', t: 'u4.n1-steady-two' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.l3', type: 'lesson', title: "Newton's 2nd Law: F = ma", icon: 'grass',
      notes: {
        eq: ['F = m × a', 'a = F ÷ m', 'm = F ÷ a'],
        tips: [
          'F is the RESULTANT force in N, m the mass in kg, a the acceleration in m/s².',
          '1 N makes 1 kg accelerate at 1 m/s².',
          'Same force, double the mass → half the acceleration.',
          'Example: 1200 kg car, resultant 3600 N → a = 3600 ÷ 1200 = 3 m/s².',
          'Things moving together (Pip in a minecart): add their masses.',
          'Rearranged: a = F ÷ m and m = F ÷ a.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'A <b>60 N</b> push gives a <b>20 kg</b> cart an acceleration of <b>3 m/s²</b>. What acceleration does the same 60 N push give a <b>40 kg</b> cart?',
          choices: ['6 m/s²', '3 m/s²', '1.5 m/s²', '0 m/s² — it is too heavy to move'],
          answer: 2, keepOrder: true, revealAfterSim: true,
          explain: 'Your second push (60 N on 40 kg) shows it: double the mass with the same force gives half the acceleration, 3 ÷ 2 = 1.5 m/s².',
        },
        {
          type: 'sim', widget: 'u4-carts', goal: true, title: 'Cart Pusher',
          html: 'The track is super-smooth (no friction). Choose the push and the mass, then press <b>Push!</b> The push lasts 2 seconds.',
          params: {
            force: 60, mass: 20,
            tasks: [
              { text: 'Push the <b>20 kg</b> cart with <b>60 N</b>. What is its acceleration?', check: (F, m) => F === 60 && m === 20 },
              { text: 'Now push a <b>40 kg</b> cart with the same <b>60 N</b>. Was your prediction right?', check: (F, m) => F === 60 && m === 40, tested: true },
              { text: 'Make the <b>40 kg</b> cart accelerate at <b>3 m/s²</b>, like the first cart.', check: (F, m) => m === 40 && F === 120 },
              { text: 'Use an <b>80 N</b> push. Choose the mass that gives exactly <b>4 m/s²</b>.', check: (F, m) => F === 80 && m === 20 },
            ],
          },
        },
        {
          type: 'info', title: "Newton's Second Law",
          html: `<p>A resultant force makes things <b>accelerate</b>. Newton found the rule:</p>
                 <p class="eq">F = m × a</p>
                 <p><b>F</b> = resultant force (N), <b>m</b> = mass (kg), <b>a</b> = acceleration (m/s²). <b>1 N</b> makes <b>1 kg</b> accelerate at <b>1 m/s²</b>.</p>
                 <p class="tip">Remember the space skater? 60 N on 60 kg changed his speed by 1 m/s every second: a = 60 ÷ 60 = 1 m/s².</p>`,
        },
        {
          type: 'info', title: 'Using F = ma',
          html: `<ul><li>Bigger force → bigger acceleration.</li><li>Bigger mass → smaller acceleration (double the mass → half the acceleration).</li></ul>
                 <p>Example: a 1200 kg car with a resultant force of 3600 N: a = 3600 ÷ 1200 = <b>3 m/s²</b>.</p>
                 <p class="tip">Always use the <b>resultant</b> force. If things move together (Pip in a minecart), <b>add their masses</b>.</p>`,
        },
        {
          type: 'equation', prompt: 'Rearrange F = m × a to find the <b>acceleration</b>.',
          lhs: 'a', tiles: ['F', 'm', '÷', '×', 'a'], answers: [['F', '÷', 'm']],
          explain: 'Divide both sides of F = m × a by m: a = F ÷ m.',
        },
        { type: 'q', t: 'u4.fma-a' },
        { type: 'q', t: 'u4.fma-F' },
        { type: 'q', t: 'u4.fma-change-mcq' },
        { type: 'q', t: 'u4.fma-m' },
        { type: 'q', t: 'u4.fma-resultant' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.l4', type: 'lesson', title: 'Friction', icon: 'grass',
      notes: {
        eq: ['resultant = push − friction', 'a = (push − friction) ÷ m', 'sliding with no push: deceleration = friction ÷ m'],
        tips: [
          'Friction always acts AGAINST sliding.',
          'Ice: very little friction. Wood: some. Carpet: lots.',
          'If something stays still, friction exactly balances the push (up to its maximum).',
          'Example: 10 kg box, 50 N push, 30 N friction → (50 − 30) ÷ 10 = 2 m/s².',
          'Grip (friction) is what lets shoes, tyres and brakes work.',
          'Time to stop = speed ÷ deceleration; sliding distance = u² ÷ (2 × deceleration) (Unit 3).',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'Pip pushes a heavy crate on a carpet with <b>60 N</b>, but it <b>doesn\'t budge</b>. How big is the friction force on the crate?',
          choices: ['0 N — nothing is moving', '60 N — exactly as big as the push', 'More than 60 N', 'It depends on how heavy Pip is'],
          answer: 1, keepOrder: true, revealAfterSim: true,
          explain: 'Your carpet test showed it: the crate stayed still, so the forces were balanced and friction pushed back with exactly 60 N. Friction only pushes as hard as it needs to — up to a maximum.',
        },
        {
          type: 'sim', widget: 'u4-friction', goal: true, title: 'Ice vs Carpet',
          html: 'Pick a surface and a push. Pip pushes the <b>20 kg</b> crate for 2 seconds, then lets go. Work out each push before you test it!',
          params: {
            mass: 20, surface: 'carpet', push: 60,
            tasks: [
              { text: 'Test your prediction: on <b>carpet</b>, push with <b>60 N</b>.', check: (s) => s.surface === 'carpet' && s.push === 60, tested: true },
              { text: 'On <b>wood</b>, make the crate speed up at exactly <b>2 m/s²</b> while Pip pushes.', check: (s) => s.surface === 'wood' && s.a === 2 },
              { text: 'On <b>ice</b>, make it speed up at exactly <b>3 m/s²</b>. Then watch how far it slides!', check: (s) => s.surface === 'ice' && s.a === 3 },
            ],
          },
        },
        {
          type: 'info', title: 'Friction',
          html: `<p><b>Friction</b> is a force between two surfaces that acts <b>against sliding</b>. Rough surfaces (carpet, rubber) give lots; smooth ones (ice) give very little.</p>
                 <p>Push gently and friction pushes back <b>just as hard</b>, so nothing moves — up to its maximum.</p>
                 <p class="tip">Friction is also <b>grip</b>! Shoes, tyres and brakes all need it. Try walking on ice!</p>`,
        },
        {
          type: 'info', title: 'Sliding and stopping',
          html: `<p>Once it slides: <b>resultant = push − friction</b>.</p>
                 <p>Example: push a 10 kg box with 50 N against 30 N of friction: (50 − 30) ÷ 10 = <b>2 m/s²</b>.</p>
                 <p>Let go, and friction is the only force left: it <b>slows</b> the crate, deceleration = friction ÷ mass.</p>
                 <p class="tip">In our sims, once something slides, friction stays at its maximum (in real life it drops a little).</p>`,
        },
        { type: 'q', t: 'u4.fric-dir-mcq' },
        { type: 'q', t: 'u4.fric-resultant' },
        { type: 'q', t: 'u4.fric-concept-mcq' },
        { type: 'q', t: 'u4.fric-accel' },
        { type: 'q', t: 'u4.fric-stuck' },
        { type: 'q', t: 'u4.fric-decel' },
        { type: 'q', t: 'u4.fric-stop-time' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.l5', type: 'lesson', title: "Newton's 3rd Law", icon: 'grass',
      notes: {
        eq: ['A pushes B ⇒ B pushes A: same size, opposite direction'],
        tips: [
          'Action–reaction forces act on DIFFERENT objects, so they never cancel each other.',
          'Rocket pushes gas down → gas pushes rocket up. Swimmer pushes water back → water pushes swimmer forwards.',
          'Walking: your foot pushes the ground backwards, the ground pushes you forwards.',
          'Two skaters push apart: same force, but a = F ÷ m, so the lighter one speeds up more.',
        ],
      },
      steps: [
        {
          type: 'predict', prompt: 'Pip (<b>40 kg</b>) and Steve (<b>80 kg</b>) stand still on ice skates, then push each other apart. Who gets pushed with the <b>bigger force</b>?',
          choices: ['Pip, because he is lighter', 'Steve, because he is heavier', 'They get exactly the same force', 'Only the one who does the pushing'],
          answer: 2, keepOrder: true, revealAfterSim: true,
          explain: 'Your first push showed two equal arrows: 120 N on Pip and 120 N on Steve. Pip moved off faster only because the same force gives a lighter skater a bigger acceleration (a = F ÷ m).',
        },
        {
          type: 'sim', widget: 'u4-push-apart', goal: true, title: 'Skater Push-Off',
          html: 'Set the two skaters\' masses and the push, then press <b>Push apart!</b> The push lasts 1 second; after that they glide on the ice.',
          params: {
            mA: 40, mB: 80, F: 120,
            tasks: [
              { text: 'Push with these settings (Pip 40 kg, Steve 80 kg, 120 N). Compare the two force arrows!', check: (s) => s.mA === 40 && s.mB === 80 && s.F === 120, tested: true },
              { text: 'Make Pip glide away exactly <b>3 times as fast</b> as Steve.', check: (s) => Math.abs(s.vA - 3 * s.vB) < 1e-9 },
              { text: 'Make <b>Steve</b> glide away at exactly <b>2 m/s</b>.', check: (s) => Math.abs(s.vB - 2) < 1e-9 },
            ],
          },
        },
        {
          type: 'info', title: "Newton's Third Law",
          html: `<p>Forces always come in <b>pairs</b>. If A pushes on B, then B pushes back on A:</p>
                 <p class="eq">same size · opposite direction · on the OTHER object</p>
                 <p class="tip">The two forces act on <b>different</b> objects, so they never cancel. Same force, different masses: a = F ÷ m, so the lighter skater flies off faster.</p>`,
        },
        {
          type: 'info', title: 'Pairs everywhere',
          html: `<ul><li>🚀 A rocket pushes hot gas <b>down</b> → the gas pushes the rocket <b>up</b>.</li>
                 <li>🏊 A swimmer pushes water <b>backwards</b> → the water pushes the swimmer <b>forwards</b>.</li>
                 <li>🚶 Your foot pushes the ground <b>backwards</b> → the ground pushes you <b>forwards</b>. On ice your foot slips, so you can hardly push — that's why walking on ice is really hard!</li></ul>`,
        },
        { type: 'q', t: 'u4.n3-pair-mcq' },
        { type: 'q', t: 'u4.n3-force' },
        { type: 'q', t: 'u4.n3-cancel-mcq' },
        { type: 'q', t: 'u4.n3-which-mcq' },
        { type: 'q', t: 'u4.n3-skaters' },
        { type: 'q', t: 'u4.n3-vs-balanced-mcq' },
      ],
    },
    // ------------------------------------------------------------------
    {
      id: 'mech.u4.psA', type: 'problems', title: 'Calculation Drills', icon: 'crafting',
      steps: [
        { type: 'q', t: 'u4.resultant-many' },
        { type: 'q', t: 'u4.fma-a' },
        { type: 'q', t: 'u4.fma-F' },
        { type: 'q', t: 'u4.fma-m' },
        { type: 'q', t: 'u4.fma-resultant' },
        { type: 'q', t: 'u4.fric-accel' },
        { type: 'q', t: 'u4.fric-decel' },
        { type: 'q', t: 'u4.fric-push' },
        { type: 'q', t: 'u4.n3-skaters' },
        { type: 'q', t: 'u4.fma-loaded' },
        { type: 'q', t: 'u4.fma-ratio' },
      ],
    },
    {
      id: 'mech.u4.psB', type: 'problems', title: 'Word Problems', icon: 'bookshelf',
      steps: [
        { type: 'q', t: 'u4.wp-car' },
        { type: 'q', t: 'u4.wp-rocket' },
        { type: 'q', t: 'u4.wp-sled-dogs' },
        { type: 'q', t: 'u4.wp-stop-dist' },
        { type: 'q', t: 'u4.n3-speed-ratio' },
        { type: 'q', t: 'u3.quad-time' },
        { type: 'q', t: 'u4.puzzle-blocks' },
        { type: 'q', t: 'u4.puzzle-two-pushes' },
      ],
    },
    {
      id: 'mech.u4.review', type: 'problems', title: 'Unit 4 Review', icon: 'diamondore',
      steps: [
        {
          type: 'info', title: 'Unit 4 Review', speaker: 'friend',
          html: `<p>One question on each big idea — plus two from Unit 3 to keep them fresh. Get <b>8 out of 10</b> right first time to <b>master</b> Unit 4!</p>`,
        },
        { type: 'q', t: 'u4.fbd-resultant' },
        { type: 'q', t: 'u4.n1-state-mcq' },
        { type: 'q', t: 'u4.n1-steady-two' },
        { type: 'q', t: 'u4.fma-m' },
        { type: 'q', t: 'u4.fric-accel' },
        { type: 'q', t: 'u4.fric-push' },
        { type: 'q', t: 'u4.n3-cancel-mcq' },
        { type: 'q', t: 'u4.n3-skaters' },
        { type: 'q', t: 'u3.vt-area-trap' },
        { type: 'q', t: 'u3.suvat-s' },
      ],
    },
    {
      id: 'mech.u4.boss', type: 'boss', title: 'Boss: Ice Hockey Physics', icon: 'portal',
      steps: [
        {
          type: 'info', title: 'BOSS MISSION: Ice Hockey Physics',
          html: `<p>Pip is training on the ice rink! Each shot must <b>stop right in the target zone</b>. Friction is the only force slowing the puck:</p>
                 <p class="eq">deceleration = friction ÷ mass</p>
                 <p>The puck ends at rest, so turn Unit 3's braking distance round:</p>
                 <p class="eq">(launch speed)² = 2 × deceleration × distance</p>
                 <p>You get <b>3 tries</b> per shot. Land <b>3 shots</b> to win!</p>`,
        },
        {
          type: 'info', title: 'Stick shots',
          html: `<p>Some shots ask for the <b>stick's push</b> instead of the speed. The stick touches the puck for just <b>0.1 s</b> — too short for friction to matter.</p>
                 <p>In that 0.1 s the push speeds the puck up at push ÷ mass, so:</p>
                 <p class="eq">speed = (push ÷ mass) × 0.1</p>
                 <p class="tip">Work out the speed you need first, then the push that gives it.</p>`,
        },
        { type: 'sim', widget: 'u4-hockey', goal: true, title: 'Ice Hockey Physics', params: { rounds: 3 } },
        { type: 'q', t: 'u4.hockey-speed' },
        { type: 'q', t: 'u4.fric-decel' },
        { type: 'q', t: 'u4.wp-stop-dist' },
        { type: 'q', t: 'u4.n3-skaters' },
        { type: 'q', t: 'u3.brake-decel' },
      ],
    },
  ],
};
