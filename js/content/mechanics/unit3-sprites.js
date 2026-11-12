// Unit 3 sprites (names start with "u3" so they never clash with other units).
import { registerSprites } from '../../core/sprites.js';

registerSprites({
  // A small red car seen from the side, facing right (headlight on the right).
  u3car: {
    rows: [
      '....DDDDDDD.....',
      '...DWWDWWWWD....',
      '..DRWWDWWWWRD...',
      'RRRRRRRRRRRRRRRR',
      'RRRRRRRRRRRRRRRY',
      'DDRRRRRRRRRRRRDD',
      '..KKK......KKK..',
      '..KGK......KGK..',
      '...K........K...',
    ],
    palette: { R: '#d33a2a', D: '#8f2318', W: '#9cd4ff', Y: '#ffe066', K: '#1e1e1e', G: '#9a9a9a' },
  },
});
