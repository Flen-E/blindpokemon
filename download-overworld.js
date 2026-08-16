// Dev-only: downloads overworld art from torresflo/Pokemon-Obsidian
// (node download-overworld.js). The game itself only reads local assets/.
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const DIRS = ['assets/overworld', 'assets/battle'];
for (const d of DIRS) fs.mkdirSync(path.join(ROOT, d), { recursive: true });

const BASE = 'https://raw.githubusercontent.com/torresflo/Pokemon-Obsidian/master/Obsidian/Graphics/';

// [destination, repo path under Graphics/]
const FILES = [
  // tilesets / buildings
  ['assets/overworld/outdoor.png',  'Tilesets/basic.png'],
  ['assets/overworld/center.png',   'Autotiles/z_centre.png'],
  ['assets/overworld/mart.png',     'Autotiles/z_shop.png'],
  ['assets/overworld/house.png',    'Autotiles/z_maison.png'],
  ['assets/overworld/ground.png',   'Autotiles/autotile1.png'],
  ['assets/overworld/flowers.png',  'Autotiles/divers.png'],
  // battle background
  ['assets/battle/back_grass.png',  'Battlebacks/back_grass.png'],
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function isPng(buf) {
  return buf && buf.length > 100 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

(async () => {
  let fails = 0;
  for (const [dest, repoPath] of FILES) {
    const out = path.join(ROOT, dest);
    if (fs.existsSync(out) && isPng(fs.readFileSync(out))) {
      console.log(`skip   ${dest}`);
      continue;
    }
    const url = BASE + repoPath.split('/').map(encodeURIComponent).join('/');
    try {
      const buf = await get(url);
      if (!isPng(buf)) throw new Error('not a PNG');
      fs.writeFileSync(out, buf);
      console.log(`ok     ${dest}  (${buf.length} bytes)`);
    } catch (e) {
      console.log(`FAIL   ${dest}: ${e.message}`);
      fails++;
    }
  }
  console.log(fails ? `${fails} DOWNLOADS FAILED` : 'ALL OVERWORLD ASSETS DOWNLOADED');
  process.exit(fails ? 1 : 0);
})();
