// Encrypts the bundled deck with a password (PBKDF2-SHA256 600k -> AES-256-GCM)
// and writes a small branded unlock page that decrypts it in the browser.
// Usage: node tools/encrypt.mjs dist/deck.html deploy/index.html '<password>'
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
const [src, out, pass] = process.argv.slice(2);
const body = readFileSync(src, 'utf8');
const doc = /^\s*<!doctype/i.test(body) ? body : `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n${body}</html>`;
const title = (/<title>([^<]*)<\/title>/i.exec(body) || [, 'Presentation'])[1];
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(doc)));
const b64 = (u) => Buffer.from(u).toString('base64');
const logo = /url\("(data:image\/png;base64,[^"]+)"\)/.exec(body)[1];
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&display=swap" rel="stylesheet">
<style>
  :root { --forest: #3E5B31; --butter: #F6F0A4; --sage: #C9D27A; --cream: #FDFBF7; --accent: #F28C38; --ink: #202020; }
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body { background: var(--forest); color: var(--cream); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; display: grid; place-items: center; padding: 24px; }
  main { width: min(440px, 100%); display: grid; gap: 22px; justify-items: center; text-align: center; }
  .logo { width: 110px; height: 58px; background: var(--sage); -webkit-mask: url("${logo}") center / contain no-repeat; mask: url("${logo}") center / contain no-repeat; }
  h1 { font: 400 clamp(40px, 9vw, 60px)/1.05 "Hedvig Letters Serif", Georgia, serif; color: var(--butter); text-wrap: balance; }
  p { color: rgba(253, 251, 247, .72); font-size: 17px; }
  form { width: 100%; display: grid; gap: 12px; margin-top: 6px; }
  label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  input { width: 100%; padding: 16px 22px; border-radius: 999px; border: 2px solid transparent; background: rgba(253, 251, 247, .12); color: var(--cream); font: 500 18px system-ui, sans-serif; text-align: center; }
  input::placeholder { color: rgba(253, 251, 247, .5); }
  input:focus { outline: none; border-color: var(--accent); }
  button { padding: 16px 22px; border-radius: 999px; border: 0; background: var(--cream); color: var(--ink); font: 700 18px system-ui, sans-serif; cursor: pointer; }
  button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
  button:disabled { opacity: .6; cursor: progress; }
  .err { min-height: 22px; color: var(--accent); font-weight: 600; font-size: 16px; }
  .shake { animation: shake .4s; }
  @keyframes shake { 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
  @media (prefers-reduced-motion: reduce) { .shake { animation: none; } }
</style>
</head>
<body>
<main>
  <div class="logo" role="img" aria-label="aha"></div>
  <h1>${title}</h1>
  <p>Enter the password to open the presentation.</p>
  <form id="gate">
    <label for="pw">Password</label>
    <input id="pw" type="password" autocomplete="current-password" placeholder="Password" autofocus required>
    <button id="go" type="submit">Open</button>
    <div class="err" id="err" role="alert"></div>
  </form>
</main>
<script>
const SALT = "${b64(salt)}", IV = "${b64(iv)}", DATA = "${b64(ct)}";
const u8 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function unlock(pass) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: u8(SALT), iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8(IV) }, key, u8(DATA)));
}
function show(html) { document.open(); document.write(html); document.close(); }
const form = document.getElementById('gate'), pw = document.getElementById('pw'), go = document.getElementById('go'), err = document.getElementById('err');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  go.disabled = true; go.textContent = 'Opening…'; err.textContent = '';
  try {
    const html = await unlock(pw.value);
    try { sessionStorage.setItem('btm-pass', pw.value); } catch (_) {}
    show(html);
  } catch (_) {
    err.textContent = 'That password is not right. Try again.';
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    go.disabled = false; go.textContent = 'Open'; pw.select();
  }
});
(async () => { let saved = null; try { saved = sessionStorage.getItem('btm-pass'); } catch (_) {} if (saved) { try { show(await unlock(saved)); } catch (_) {} } })();
</script>
</body>
</html>`;
writeFileSync(out, page);
console.log('wrote', out, page.length);
