// Course structure: Course → Track → Unit → Session → Step.
// To add a new topic, create a track (or a unit) module and list it here.

import unit1 from './mechanics/unit1.js';
import unit2 from './mechanics/unit2.js';
import unit3 from './mechanics/unit3.js';
import unit4 from './mechanics/unit4.js';
import unit5 from './mechanics/unit5.js';

const soon = (number, title, subtitle) => ({ id: `mech.u${number}`, number, title, subtitle, comingSoon: true, sessions: [] });

export const course = {
  id: 'physics',
  title: 'Physics',
  tracks: [
    {
      id: 'mech',
      title: 'Mechanics',
      units: [
        unit1,
        unit2,
        unit3,
        unit4,
        unit5,
        soon(6, 'Projectile Motion', 'Cannons, cliffs and the perfect throw'),
        soon(7, 'Circular Motion', 'Loops, bends and centripetal force'),
        soon(8, 'Momentum & Collisions', 'Bumper carts, recoil and airbags'),
        soon(9, 'Work, Energy & Machines', 'Roller coasters, power, levers and pulleys'),
        soon(10, 'Gravitation & Orbits', "Newton's cannon and satellites"),
      ],
    },
  ],
};

export function playableUnits(track = course.tracks[0]) {
  return track.units.filter((u) => !u.comingSoon);
}

export function findSession(id) {
  for (const track of course.tracks) {
    for (const unit of track.units) {
      const session = unit.sessions.find((s) => s.id === id);
      if (session) return { track, unit, session };
    }
  }
  return null;
}

export function sessionTemplates(session) {
  return session.steps.filter((s) => s.type === 'q').map((s) => s.t);
}
