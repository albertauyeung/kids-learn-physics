// Unit 5 — Gravity & Free Fall: extra pixel-art sprites (all names start with "u5").
import { registerSprites } from '../../core/sprites.js';

registerSprites({
  u5egg: {
    rows: ['..WW..', '.WWWW.', 'WWWWWS', 'WWWWWS', 'WWWWWS', 'WWWWSS', '.WSSS.', '..SS..'],
    palette: { W: '#f7efdc', S: '#d6c39c' },
  },
  u5pod: {
    rows: [
      '..KKKKKK..',
      '.KGGGGGGK.',
      'KGGWWWWGGK',
      'KGWWWWWWGK',
      'KGWWWWWSGK',
      'KGGWWSSGGK',
      '.KGGGGGGK.',
      '..KKKKKK..',
      '.K......K.',
    ],
    palette: { K: '#2e2e2e', G: '#e0a030', W: '#f7efdc', S: '#d6c39c' },
  },
  u5chute: {
    rows: [
      '.....RRRRRR.....',
      '...RRWWRRWWRR...',
      '..RWWRRWWRRWWR..',
      '.RRRRRRRRRRRRRR.',
      '.L............L.',
      '..L..........L..',
      '...L........L...',
      '....L......L....',
      '.....L....L.....',
      '......LLLL......',
    ],
    palette: { R: '#e8402a', W: '#ffffff', L: '#dddddd' },
  },
  u5feather: {
    rows: ['...W', '..WW', '.WWG', '.WGW', 'WWGW', 'WGW.', 'WGW.', 'GW..', 'G...', 'G...'],
    palette: { W: '#ffffff', G: '#a8a8a8' },
  },
  u5hammer: {
    rows: ['GGGGGGGG', 'GLLLLLLG', 'GGGGGGGG', '...WW...', '...WW...', '...WW...', '...WW...', '...WW...', '...WW...', '...WW...'],
    palette: { G: '#5a5a5a', L: '#9a9a9a', W: '#8a5a2b' },
  },
  u5anvil: {
    rows: ['DDDDDDDDDDDD', '.DLLLLLLLLDD', '...DDDDDD...', '....DDDD....', '....DDDD....', '..DDDDDDDD..', '.DDDDDDDDDD.', '.DDDDDDDDDD.'],
    palette: { D: '#3a3a3a', L: '#6a6a6a' },
  },
  u5stone: {
    rows: ['.GGGG.', 'GLGGGG', 'GGGGDG', 'GGDGGG', '.GGGG.'],
    palette: { G: '#8a8a8a', L: '#b0b0b0', D: '#666666' },
  },
  u5paper: {
    rows: ['WWWWWWWW', 'WKKKKKKW', 'WWWWWWWW', 'WKKKKKWW', 'WWWWWWWW'],
    palette: { W: '#ffffff', K: '#b8c8e8' },
  },
  u5ball: {
    rows: ['.RRRR.', 'RWRRRR', 'RRRRRR', 'RRRRDR', 'RRRDDR', '.RRRR.'],
    palette: { R: '#e8402a', W: '#ffb0a0', D: '#a82a1a' },
  },
  u5diver: {
    rows: [
      'S....HH....S',
      '.S...SS...S.',
      '..TTTTTTTT..',
      '....TTTT....',
      '....TTTT....',
      '....PPPP....',
      '...PP..PP...',
      '..BB....BB..',
    ],
    palette: { H: '#4a2f1b', S: '#e0a77a', T: '#e8402a', P: '#2a4ae8', B: '#222222' },
  },
});
