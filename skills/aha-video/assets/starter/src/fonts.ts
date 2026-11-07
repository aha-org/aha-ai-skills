import { continueRender, delayRender } from "remotion";

// Aha's free fonts, loaded from their official hosts (needs internet while previewing and rendering):
// Hedvig Letters Serif + Schoolbell from Google Fonts, Satoshi from Fontshare.
const SHEETS = [
  "https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&family=Schoolbell&display=block",
  "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=block",
];
const FACES = ['400 40px "Hedvig Letters Serif"', '400 40px "Schoolbell"', '500 40px "Satoshi"', '900 40px "Satoshi"'];

let started = false;
export const loadFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading Aha fonts");
  const links = SHEETS.map((href) => new Promise<void>((res) => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = () => res();
    l.onerror = () => res();
    document.head.appendChild(l);
  }));
  Promise.all(links)
    .then(() => Promise.all(FACES.map((f) => document.fonts.load(f))))
    .catch((e) => console.error(e))
    .finally(() => continueRender(handle));
};
