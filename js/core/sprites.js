// Original blocky pixel art, drawn from character maps, plus procedural block textures.

import { makeRng } from './util.js';
import { activeSkinColors } from './state.js';

// Each sprite: rows of characters; '.' is transparent; palette maps chars to colours.
// Hero palette keys T/U/P/B are replaced by the active skin.
const SPRITES = {
  hero: {
    rows: [
      'HHHHHHHH',
      'HHHHHHHH',
      'HSSSSSSH',
      'SWESSEWS',
      'SSSSSSSS',
      'SSSMMSSS',
      'SSSSSSSS',
      'TTTTTTTT',
      'TTTUUTTT',
      'TTTTTTTT',
      'SSTTTTSS',
      '..PPPP..',
      '..PPPP..',
      '..PDDP..',
      '..BBBB..',
      '..BBBB..',
    ],
    palette: { H: '#4a2f1b', S: '#e0a77a', W: '#ffffff', E: '#3b3b9a', M: '#9c5a3c', D: '#00000033' },
    skin: true,
  },
  heroHead: {
    rows: ['HHHHHHHH', 'HHHHHHHH', 'HSSSSSSH', 'SWESSEWS', 'SSSSSSSS', 'SSSMMSSS', 'SSSSSSSS', 'SSSSSSSS'],
    palette: { H: '#4a2f1b', S: '#e0a77a', W: '#ffffff', E: '#3b3b9a', M: '#9c5a3c' },
  },
  friend: {
    rows: [
      'KKKKKKKK',
      'KKKKKKKK',
      'KSSSSSSK',
      'SWESSEWS',
      'SSSSSSSS',
      'SSSMMSSS',
      'SSSSSSSS',
      'GGGGGGGG',
      'GGGggGGG',
      'GGGGGGGG',
      'SSGGGGSS',
      '..PPPP..',
      '..PPPP..',
      '..PPPP..',
      '..BBBB..',
      '..BBBB..',
    ],
    palette: { K: '#e8c547', S: '#c98b5e', W: '#ffffff', E: '#2b6b2b', M: '#7a4030', G: '#3f9e4d', g: '#2d7a39', P: '#5a4632', B: '#2e2e2e' },
  },
  minecart: {
    rows: [
      'DDDDDDDDDDDD',
      'DLLLLLLLLLLD',
      'DLGGGGGGGGLD',
      'DLLLLLLLLLLD',
      'DDDDDDDDDDDD',
      '.KK......KK.',
      '.KK......KK.',
    ],
    palette: { D: '#3c3c3c', L: '#9a9a9a', G: '#6b6b6b', K: '#1e1e1e' },
  },
  boat: {
    rows: ['..WW..', '.WLLW.', 'WLLLLW', 'WLHHLW', 'WLHHLW', 'WLLLLW', 'WLLLLW', 'WLLLLW', '.WWWW.'],
    palette: { W: '#5a3a1e', L: '#a8743f', H: '#4a2f1b' },
  },
  swimmer: {
    rows: ['S.HH.S', '.SHHS.', '..HH..'],
    palette: { S: '#e0a77a', H: '#4a2f1b' },
  },
  turtle: {
    rows: ['...GGGG...', '..GgGgGG..', '.GGGGGGGSS', '.GGGGGGGSE', '..L..L..L.'],
    palette: { G: '#2f6e25', g: '#6bb34a', S: '#8bc34a', E: '#111111', L: '#8bc34a' },
  },
  chicken: {
    rows: ['.....WW.', '.....WEO', 'W...WWWR', 'WWWWWWW.', 'WWWWWWW.', '.WWWWW..', '..Y.Y...', '..Y.Y...'],
    palette: { W: '#f4f4f4', E: '#111111', O: '#f2a33a', R: '#d33a2a', Y: '#e8b33a' },
  },
  horse: {
    rows: [
      '..........MBB',
      '.........MBBB',
      '.........BBEB',
      '..........BBB',
      '.MBBBBBBBBBB.',
      'MBBBBBBBBBBB.',
      'M.BBBBBBBBB..',
      '..B.B...B.B..',
      '..B.B...B.B..',
      '..K.K...K.K..',
    ],
    palette: { B: '#9a6a3a', M: '#4a2f1b', E: '#111111', K: '#3a2a1a' },
  },
  bee: {
    rows: ['.WW....', '.WW....', 'YKYKYKY', 'YKYKYKE', 'YKYKYKY'],
    palette: { W: '#dff2ff', Y: '#f2c230', K: '#2a2a2a', E: '#000000' },
  },
  emerald: {
    rows: ['..DDD..', '.DLLLD.', 'DLLWLLD', 'DLLLLLD', 'DLLLLLD', '.DLLLD.', '..DDD..'],
    palette: { D: '#0a7a33', L: '#17dd62', W: '#c8ffd8' },
  },
  diamond: {
    rows: ['..DDD..', '.DLLLD.', 'DLLWLLD', 'DLLLLLD', '.DLLLD.', '..DLD..', '...D...'],
    palette: { D: '#1a8f86', L: '#4aedd9', W: '#e0fffb' },
  },
  torch: {
    rows: ['.YY.', 'YOOY', 'YOOY', '.OO.', '.WW.', '.WW.', '.WW.', '.WW.', '.WW.'],
    palette: { Y: '#ffe066', O: '#ff8a00', W: '#7a5230' },
  },
  torchOff: {
    rows: ['....', '.GG.', '.GG.', '.GG.', '.WW.', '.WW.', '.WW.', '.WW.', '.WW.'],
    palette: { G: '#555555', W: '#7a5230' },
  },
  ice: {
    rows: ['DDDDDDD', 'DLLLWLD', 'DLWLLLD', 'DLLLLWD', 'DWLLLLD', 'DLLWLLD', 'DDDDDDD'],
    palette: { D: '#5c8ed6', L: '#9cc4ff', W: '#e6f2ff' },
  },
  flag: {
    rows: ['PRRRR.', 'PRRRRR', 'PRRRR.', 'P.....', 'P.....', 'P.....', 'P.....', 'P.....', 'P.....', 'P.....'],
    palette: { P: '#dddddd', R: '#e03030' },
  },
  xporb: {
    rows: ['.GYG.', 'GYWYG', 'YWWWY', 'GYWYG', '.GYG.'],
    palette: { G: '#3fa21e', Y: '#b8ff3a', W: '#f0ffc0' },
  },
  chest: {
    rows: ['DDDDDDDDDD', 'DBBBBBBBBD', 'DBBBBBBBBD', 'DDDDLLDDDD', 'DBBBLLBBBD', 'DBBBBBBBBD', 'DBBBBBBBBD', 'DDDDDDDDDD'],
    palette: { D: '#4a2c12', B: '#a8702f', L: '#d9d9d9' },
  },
  chestOpen: {
    rows: ['.DDDDDDDD.', 'DBBBBBBBBD', 'DDDDDDDDDD', 'DYEYYEYYED', 'DBBBLLBBBD', 'DBBBBBBBBD', 'DBBBBBBBBD', 'DDDDDDDDDD'],
    palette: { D: '#4a2c12', B: '#a8702f', L: '#d9d9d9', Y: '#ffe066', E: '#17dd62' },
  },
  potion: {
    rows: ['..CCC..', '...G...', '..GGG..', '.GPPPG.', 'GPPWPPG', 'GPPPPPG', 'GPPPPPG', '.GPPPG.', '..GGG..'],
    palette: { C: '#8b5a2b', G: '#cfe8ff', P: '#ff5ad6', W: '#ffd6f5' },
  },
  lock: {
    rows: ['..GGG..', '.G...G.', '.G...G.', 'YYYYYYY', 'YYYKYYY', 'YYYKYYY', 'YYYYYYY'],
    palette: { G: '#bdbdbd', Y: '#d9a514', K: '#3a2a00' },
  },
  heart: {
    rows: ['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
    palette: { R: '#e02424', W: '#ffb3b3' },
  },
  star: {
    rows: ['...Y...', '...Y...', '..YYY..', 'YYYWYYY', '.YYYYY.', '.YY.YY.', 'Y.....Y'],
    palette: { Y: '#fcd34d', W: '#fff7cc' },
  },
  pickaxe: {
    rows: ['.DDDDD..', 'D.....D.', '...WD...', '..W..D..', '.W......', 'W.......'],
    palette: { D: '#4aedd9', W: '#7a5230' },
  },
  book: {
    rows: ['RRRRRRR.', 'RWWWWWWR', 'RWKKKKWR', 'RWWWWWWR', 'RWKKKWWR', 'RWWWWWWR', 'RRRRRRRR'],
    palette: { R: '#8a3b1e', W: '#f0e6d0', K: '#666666' },
  },
};

const cache = new Map();

function spriteCanvas(name, skinColors) {
  const def = SPRITES[name];
  if (!def) throw new Error(`Unknown sprite ${name}`);
  const pal = { ...def.palette, ...(def.skin ? skinColors || activeSkinColors() : {}) };
  const key = `${name}|${def.skin ? JSON.stringify(pal) : ''}`;
  if (cache.has(key)) return cache.get(key);
  const w = def.rows[0].length;
  const hgt = def.rows.length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = hgt;
  const g = c.getContext('2d');
  def.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.' || !pal[ch]) return;
      g.fillStyle = pal[ch];
      g.fillRect(x, y, 1, 1);
    });
  });
  cache.set(key, c);
  return c;
}

export function spriteSize(name) {
  const def = SPRITES[name];
  return { w: def.rows[0].length, h: def.rows.length };
}

// Draw a sprite with its bottom-centre at (x, y), scaled by `scale` canvas pixels per art pixel.
export function drawSprite(ctx, name, x, y, scale = 3, { flip = false, skin, anchor = 'bottom' } = {}) {
  const c = spriteCanvas(name, skin);
  const w = c.width * scale;
  const hh = c.height * scale;
  const left = Math.round(x - w / 2);
  const top = Math.round(anchor === 'center' ? y - hh / 2 : y - hh);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(left + w, top);
    ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0, w, hh);
  } else {
    ctx.drawImage(c, left, top, w, hh);
  }
  ctx.restore();
}

export function spriteURL(name, scale = 4, skin) {
  const c = spriteCanvas(name, skin);
  const out = document.createElement('canvas');
  out.width = c.width * scale;
  out.height = c.height * scale;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, out.width, out.height);
  return out.toDataURL();
}

export function spriteImg(name, { scale = 4, cls = 'sprite', alt = '', skin } = {}) {
  const img = document.createElement('img');
  img.src = spriteURL(name, scale, skin);
  img.className = cls;
  img.alt = alt;
  img.draggable = false;
  return img;
}

// ---------- Procedural block textures (16×16) ----------
function noiseFill(g, rng, colors, size = 16) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      g.fillStyle = colors[Math.floor(rng.next() * colors.length)];
      g.fillRect(x, y, 1, 1);
    }
  }
}

const TEX = {
  dirt: (g, r) => noiseFill(g, r, ['#866043', '#79553a', '#96704f', '#6c4b32', '#8b6a4c']),
  darkdirt: (g, r) => noiseFill(g, r, ['#4a3423', '#3f2c1e', '#56402c', '#36261a']),
  stone: (g, r) => noiseFill(g, r, ['#7f7f7f', '#747474', '#8a8a8a', '#6d6d6d', '#878787']),
  deepslate: (g, r) => noiseFill(g, r, ['#3b3b40', '#34343a', '#444449', '#2e2e33']),
  bedrock: (g, r) => noiseFill(g, r, ['#575757', '#3a3a3a', '#6b6b6b', '#2a2a2a', '#4a4a4a']),
  obsidian: (g, r) => noiseFill(g, r, ['#14121d', '#1b1527', '#251c36', '#0f0d16', '#3b2a5a']),
  sand: (g, r) => noiseFill(g, r, ['#dbd3a0', '#d2c98f', '#e3dcae', '#c9bf86']),
  water: (g, r) => noiseFill(g, r, ['#3f76e4', '#3a6fd8', '#4a80ea', '#3568cc']),
  leaves: (g, r) => noiseFill(g, r, ['#4c8a2a', '#3d7322', '#5a9a32', '#2f5e1a']),
  planks: (g, r) => {
    noiseFill(g, r, ['#a2834f', '#9c7c4a', '#ad8d57', '#987646']);
    g.fillStyle = '#6b5434';
    for (const y of [3, 7, 11, 15]) g.fillRect(0, y, 16, 1);
    for (const [x, y] of [[5, 0], [12, 4], [3, 8], [9, 12]]) g.fillRect(x, y, 1, 3);
  },
  grass: (g, r) => {
    TEX.dirt(g, r);
    const greens = ['#5b8731', '#6a9a3a', '#4f7a2a', '#7cbd3b'];
    for (let x = 0; x < 16; x++) {
      const depth = 3 + Math.floor(r.next() * 3);
      for (let y = 0; y < depth; y++) {
        g.fillStyle = greens[Math.floor(r.next() * greens.length)];
        g.fillRect(x, y, 1, 1);
      }
    }
  },
  grasstop: (g, r) => noiseFill(g, r, ['#5b8731', '#6a9a3a', '#4f7a2a', '#7cbd3b', '#5f9234']),
  crafting: (g, r) => {
    TEX.planks(g, r);
    g.fillStyle = '#6b4a2a';
    g.fillRect(0, 0, 16, 5);
    g.fillStyle = '#c9a26b';
    for (const x of [2, 7, 12]) g.fillRect(x, 1, 3, 3);
    g.fillStyle = '#8a8a8a';
    g.fillRect(3, 8, 2, 6);
    g.fillRect(2, 8, 4, 2);
    g.fillStyle = '#7a5230';
    g.fillRect(11, 8, 1, 6);
    g.fillStyle = '#bdbdbd';
    g.fillRect(9, 7, 5, 2);
  },
  bookshelf: (g, r) => {
    TEX.planks(g, r);
    const colors = ['#a33', '#36a', '#3a5', '#c93', '#639', '#2aa'];
    for (const y0 of [2, 9]) {
      for (let x = 1; x < 15; x++) {
        if (r.next() < 0.15) continue;
        g.fillStyle = colors[Math.floor(r.next() * colors.length)];
        g.fillRect(x, y0, 1, 5);
      }
    }
  },
  portal: (g, r) => {
    TEX.obsidian(g, r);
    const p = ['#7b2fbe', '#9a4ae0', '#5a1f94', '#c27cff'];
    for (let y = 3; y < 13; y++) {
      for (let x = 3; x < 13; x++) {
        g.fillStyle = p[Math.floor(r.next() * p.length)];
        g.fillRect(x, y, 1, 1);
      }
    }
  },
  rail: (g, r) => {
    noiseFill(g, r, ['#00000000']);
    g.clearRect(0, 0, 16, 16);
    g.fillStyle = '#6b4a2a';
    for (const x of [1, 6, 11]) g.fillRect(x, 4, 3, 10);
    g.fillStyle = '#9a9a9a';
    g.fillRect(0, 5, 16, 2);
    g.fillRect(0, 11, 16, 2);
  },
};

function ore(speck) {
  return (g, r) => {
    TEX.stone(g, r);
    const spots = [[3, 3], [9, 2], [6, 7], [11, 9], [3, 11], [9, 13]];
    for (const [x, y] of spots) {
      g.fillStyle = speck;
      g.fillRect(x, y, 2, 2);
      g.fillStyle = '#ffffff55';
      g.fillRect(x, y, 1, 1);
    }
  };
}
TEX.iron = ore('#d8af93');
TEX.gold = ore('#fcee4b');
TEX.diamondore = ore('#4aedd9');
TEX.emeraldore = ore('#17dd62');

const texCache = new Map();

export function texture(name, seed = 7) {
  const key = `${name}|${seed}`;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d');
  TEX[name](g, makeRng(`${name}-${seed}`));
  texCache.set(key, c);
  return c;
}

export function textureURL(name, scale = 4, seed) {
  const c = texture(name, seed);
  const out = document.createElement('canvas');
  out.width = 16 * scale;
  out.height = 16 * scale;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, out.width, out.height);
  return out.toDataURL();
}

export function drawTexture(ctx, name, x, y, size, seed) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(texture(name, seed), Math.round(x), Math.round(y), Math.ceil(size), Math.ceil(size));
  ctx.restore();
}

export function blockImg(name, cls = 'block-icon') {
  const img = document.createElement('img');
  img.src = textureURL(name, 4);
  img.className = cls;
  img.alt = '';
  img.draggable = false;
  return img;
}
