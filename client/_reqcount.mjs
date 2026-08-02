import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'shell', args: ['--no-sandbox'] });
const API = 'http://localhost:5000/api', BASE = 'http://localhost:5173';
const tok = async (e) => (await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, password: 'Password123!' }) })).json()).data.token;

async function count(label, path, token) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  if (token) await page.evaluateOnNewDocument((t) => localStorage.setItem('mountainable_token', t), token);
  const tally = {};
  page.on('request', (req) => {
    if (req.method() === 'OPTIONS') return;
    const u = req.url();
    if (u.includes('/api/') && !u.includes('/auth/me')) {
      const key = u.replace('http://localhost:5000', '');
      tally[key] = (tally[key] || 0) + 1;
    }
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 25000 });
  await new Promise((r) => setTimeout(r, 2500));
  const dupes = Object.entries(tally).filter(([, n]) => n > 1);
  console.log(`\n=== ${label} (${path}) ===`);
  console.log(`  unique API URLs: ${Object.keys(tally).length}, total requests: ${Object.values(tally).reduce((a, b) => a + b, 0)}`);
  if (dupes.length) dupes.forEach(([k, n]) => console.log(`  ⚠️  ${n}×  ${k}`));
  else console.log('  ✅ no URL requested more than once');
  await page.close();
  return dupes.length === 0;
}

let allClean = true;
const T = await tok('sara@example.com');
allClean &= await count('Home', '/', null);
allClean &= await count('Villages listing', '/villages', null);
allClean &= await count('Village detail', '/villages/scanno', null);
allClean &= await count('My space (overview)', '/my', T);
allClean &= await count('My reviews', '/my/reviews', T);
allClean &= await count('My routes', '/my/routes', T);
console.log(`\n${allClean ? 'ALL PAGES CLEAN — no duplicate requests' : 'DUPLICATES REMAIN'}`);
await browser.close();
process.exit(allClean ? 0 : 1);
