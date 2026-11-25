import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_DIR = path.join(ROOT, 'demo');
const OUT_MP4 = path.join(OUT_DIR, 'InnovaTech_Full_Prototype_Demo.mp4');
const PROFILE_DIR = path.join(ROOT, '.chrome-full-demo-profile');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

function startStaticServer(dir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanUrl = (req.url || '/').split('?')[0];
      let filePath = path.join(dir, cleanUrl === '/' ? 'index.html' : cleanUrl);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(dir, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function findBrowserExecutable() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome/Edge executable found.');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });

  const { server, port } = await startStaticServer(DIST_DIR);
  // Start with fresh signup + logo boot sync + record=1 (prevents native print dialog)
  const url = `http://127.0.0.1:${port}/?record=1&waitboot=1&auth=signup`;
  console.log(`Static server running at ${url}`);

  const browser = await puppeteer.launch({
    executablePath: findBrowserExecutable(),
    userDataDir: PROFILE_DIR,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // 540 x 960 logical @ 2x DPR = crisp 1080 x 1920 Full HD 9:16 portrait video
  await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });

  const FPS = 20;
  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(FPS),
      '-i',
      '-',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'fast',
      '-crf',
      '18',
      '-movflags',
      '+faststart',
      OUT_MP4,
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] }
  );

  let ffmpegErr = '';
  ffmpeg.stderr.on('data', (chunk) => {
    ffmpegErr += chunk.toString();
  });

  let frameCount = 0;
  const writeFrame = async () => {
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    const ok = ffmpeg.stdin.write(buf);
    if (!ok) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    frameCount++;
  };

  // Capture `frames` exact video frames (deterministic video duration regardless of screenshot latency!)
  const recordFrames = async (count) => {
    for (let i = 0; i < count; i++) {
      await writeFrame();
    }
  };

  const recordSeconds = async (sec) => {
    await recordFrames(Math.max(1, Math.round(sec * FPS)));
  };

  const injectOverlays = async () => {
    await page.evaluate(() => {
      if (!document.getElementById('demo-touch-cursor')) {
        const dot = document.createElement('div');
        dot.id = 'demo-touch-cursor';
        dot.style.cssText = `
          position: fixed;
          top: -60px;
          left: -60px;
          width: 26px;
          height: 26px;
          margin-left: -13px;
          margin-top: -13px;
          border-radius: 9999px;
          background: rgba(13, 148, 136, 0.34);
          border: 2px solid rgba(13, 148, 136, 0.95);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
          pointer-events: none;
          z-index: 9999;
          transition: top 0.22s ease, left 0.22s ease, transform 0.12s ease, opacity 0.2s ease;
          opacity: 0;
        `;
        document.body.appendChild(dot);
      }
      if (!document.getElementById('demo-chapter-pill')) {
        const pill = document.createElement('div');
        pill.id = 'demo-chapter-pill';
        pill.style.cssText = `
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.88);
          color: #FFFFFF;
          font-family: Inter, -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 5px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 6px 18px rgba(15,23,42,0.22);
          pointer-events: none;
          z-index: 9998;
          white-space: nowrap;
        `;
        document.body.appendChild(pill);
      }
    });
  };

  const setChapter = async (label) => {
    await page.evaluate((txt) => {
      const el = document.getElementById('demo-chapter-pill');
      if (el) el.textContent = txt;
    }, label);
  };

  const hideCursor = async () => {
    await page.evaluate(() => {
      const dot = document.getElementById('demo-touch-cursor');
      if (dot) dot.style.opacity = '0';
    });
  };

  const smoothScrollPhone = async (targetScrollTop, durationSec = 0.5) => {
    const frames = Math.max(1, Math.round(durationSec * FPS));
    const startTop = await page.evaluate(() => {
      const sc = document.getElementById('iphone-viewport-scroll');
      return sc ? sc.scrollTop : 0;
    });
    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      await page.evaluate((val) => {
        const sc = document.getElementById('iphone-viewport-scroll');
        if (sc) sc.scrollTop = val;
      }, startTop + (targetScrollTop - startTop) * eased);
      await writeFrame();
    }
  };

  const tapElement = async ({ selector, textIncludes, holdSec = 0.75 }) => {
    const found = await page.evaluate(
      ({ sel, txt }) => {
        let el = null;
        if (sel) {
          el = document.querySelector(sel);
        } else if (txt) {
          const nodes = Array.from(document.querySelectorAll('button, label, a, [role="tab"]'));
          el = nodes.find(
            (n) =>
              n.offsetParent !== null &&
              !n.disabled &&
              (n.textContent || '').replace(/\s+/g, ' ').trim().includes(txt)
          );
        }
        if (!el) return null;
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.5;
        const dot = document.getElementById('demo-touch-cursor');
        if (dot) {
          dot.style.opacity = '1';
          dot.style.left = `${cx}px`;
          dot.style.top = `${cy}px`;
        }
        return { x: cx, y: cy };
      },
      { sel: selector || null, txt: textIncludes || null }
    );

    if (!found) {
      console.warn('Element not found:', selector || textIncludes);
      return;
    }

    await recordFrames(4);
    await page.evaluate(
      ({ sel, txt }) => {
        const dot = document.getElementById('demo-touch-cursor');
        if (dot) dot.style.transform = 'scale(0.75)';
        let el = null;
        if (sel) {
          el = document.querySelector(sel);
        } else if (txt) {
          const nodes = Array.from(document.querySelectorAll('button, label, a, [role="tab"]'));
          el = nodes.find(
            (n) =>
              n.offsetParent !== null &&
              !n.disabled &&
              (n.textContent || '').replace(/\s+/g, ' ').trim().includes(txt)
          );
        }
        if (el) el.click();
      },
      { sel: selector || null, txt: textIncludes || null }
    );
    await recordFrames(3);
    await page.evaluate(() => {
      const dot = document.getElementById('demo-touch-cursor');
      if (dot) dot.style.transform = 'scale(1)';
    });
    await recordSeconds(holdSec);
  };

  const fillInput = async (selector, value) => {
    await page.focus(selector);
    await page.type(selector, value, { delay: 12 });
    await recordFrames(3);
  };

  const sweepSlider = async (fromVal, toVal, durationSec = 0.55) => {
    const steps = Math.max(1, Math.round(durationSec * FPS));
    for (let i = 1; i <= steps; i++) {
      const val = Math.round(fromVal + ((toVal - fromVal) * i) / steps);
      await page.evaluate((v) => {
        const slider = document.getElementById('heatmap-opacity-slider');
        if (!slider) return;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        setter.call(slider, String(v));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }, val);
      await writeFrame();
    }
  };

  // Helper to showcase a disease cleanly from the 8-Condition Case Simulator Drawer
  const showcaseDisease = async ({ index, filterTab, cardMatch, displayLabel }) => {
    await setChapter(`DISEASE ${index}/8 · ${displayLabel}`);
    await tapElement({ textIncludes: 'Cases (8)', holdSec: 0.55 });
    if (filterTab) {
      await tapElement({ textIncludes: filterTab, holdSec: 0.45 });
    }
    await tapElement({ textIncludes: cardMatch, holdSec: 0.95 }); // Shows Stage 1 Softmax Bars
    await smoothScrollPhone(290, 0.35);
    await tapElement({ textIncludes: 'Stage 2 & Explainability', holdSec: 0.7 });
    await smoothScrollPhone(250, 0.4); // Focus directly on photorealistic Fitzpatrick IV lesion + JET Grad-CAM
    await recordSeconds(1.1);
  };

  // ==========================================================================
  // START RECORDING FULL PROTOTYPE DEMO
  // ==========================================================================
  await page.goto(url, { waitUntil: 'networkidle0' });
  await injectOverlays();

  // 1. LOGO LOADING SCREEN
  console.log('1/8: InnovaTech Logo Loading Screen...');
  await setChapter('INNOVATECH · CLINICAL MOBILE BOOT');
  await recordFrames(8);
  await page.evaluate(() => {
    if (window.__startInnovaBoot) window.__startInnovaBoot();
  });
  await recordSeconds(1.9);

  // 2. DOCTOR SIGN UP & PRC MEDICAL LICENSE VERIFICATION (4 STEPS)
  console.log('2/8: Doctor Sign-Up & PRC License Verification...');
  await setChapter('DOCTOR SIGN-UP · STEP 1 IDENTITY');
  await recordSeconds(0.6);
  await fillInput('#doc-first', 'Jose');
  await fillInput('#doc-middle', 'Cruz');
  await fillInput('#doc-last', 'Dela Cruz');
  await fillInput('#doc-email', 'jose.delacruz@rhu-cebu.gov.ph');
  await fillInput('#doc-mobile', '9178824410');
  await fillInput('#doc-pw', 'Clinical#2026');
  await fillInput('#doc-pw-confirm', 'Clinical#2026');
  await smoothScrollPhone(320, 0.4);
  await recordSeconds(0.6);
  await tapElement({ textIncludes: 'Continue to Step 2', holdSec: 0.6 });

  await setChapter('DOCTOR SIGN-UP · STEP 2 PRACTICE');
  await fillInput('#doc-fac', 'Cebu City Health Center 2');
  await fillInput('#doc-city', 'Cebu City');
  await smoothScrollPhone(200, 0.35);
  await tapElement({ textIncludes: 'Continue to Step 3', holdSec: 0.6 });

  await setChapter('DOCTOR SIGN-UP · STEP 3 PRC VERIFICATION');
  // Test Expired ID rejection first
  await tapElement({ textIncludes: '! Expired ID', holdSec: 0.45 });
  await smoothScrollPhone(360, 0.35);
  await tapElement({ textIncludes: 'Verify PRC License Now', holdSec: 1.1 });
  // Then test Valid ID 6-point pass
  await smoothScrollPhone(0, 0.35);
  await tapElement({ textIncludes: '✓ Valid ID', holdSec: 0.45 });
  await smoothScrollPhone(420, 0.4);
  await tapElement({ textIncludes: 'Verify PRC License Now', holdSec: 1.5 });
  await smoothScrollPhone(560, 0.35);
  await tapElement({ textIncludes: 'Continue to Step 4', holdSec: 0.6 });

  await setChapter('DOCTOR SIGN-UP · STEP 4 OTP & PRIVACY');
  await tapElement({ textIncludes: 'Auto-Fill', holdSec: 0.55 });
  await smoothScrollPhone(260, 0.35);
  await tapElement({ selector: '#privacy-attest-box', holdSec: 0.45 });
  await tapElement({ textIncludes: 'Complete Verified Setup', holdSec: 0.9 });

  // 3. STEP 1 SPLASH, PROFILE SHEET & SCOPE GUARDRAIL
  console.log('3/8: Verified Physician Profile & Step 1 Guardrail...');
  await setChapter('STEP 1 · VERIFIED PHYSICIAN & SCOPE');
  await tapElement({ textIncludes: 'Profile', holdSec: 1.1 });
  await tapElement({ selector: '[aria-label="Close Clinician Profile"]', holdSec: 0.45 });
  await smoothScrollPhone(260, 0.4);
  await tapElement({ selector: '#scope-ack-checkbox', holdSec: 0.5 });
  await tapElement({ textIncludes: 'Start Mobile Screening', holdSec: 0.8 });

  // 4. STEP 2 CAPTURE, UPLOAD DROPZONE & ALL 3 DUAL-GATEKEEPER REJECTIONS
  console.log('4/8: Step 2 Capture & Dual-Gatekeeper Rejections...');
  await setChapter('STEP 2 · DUAL-GATEKEEPER VALIDATION');
  await smoothScrollPhone(320, 0.45);
  await tapElement({ textIncludes: 'Simulate Invalid: Non-Skin Object', holdSec: 0.85 });
  await tapElement({ textIncludes: 'Simulate Invalid: Full Face', holdSec: 0.85 });
  await tapElement({ textIncludes: 'Simulate Invalid: Blurry Image', holdSec: 0.9 });
  await tapElement({ textIncludes: 'Reset Valid Sample', holdSec: 0.8 });
  await smoothScrollPhone(780, 0.5);
  await recordSeconds(0.5);
  await tapElement({ textIncludes: 'Run Triage', holdSec: 0.9 });

  // 5. STEP 3 STAGE 1 TRIAGE, <65% ABSTENTION & 8-CONDITION TAXONOMY
  console.log('5/8: Step 3 Stage 1, Abstention Safeguard & Taxonomy...');
  await setChapter('STEP 3 · STAGE 1 & <65% SAFEGUARD');
  await recordSeconds(0.75);
  await tapElement({ textIncludes: 'Safeguard: <65% (52%)', holdSec: 1.1 });
  // Open Taxonomy Modal showing 2 Categories • 8 Core Conditions
  await setChapter('TAXONOMY · 2 CATEGORIES • 8 CONDITIONS');
  await tapElement({ textIncludes: 'Taxonomy', holdSec: 1.5 });
  // Click Pigmented BCC right inside Taxonomy modal to launch Disease #1!
  await tapElement({ textIncludes: 'Basal Cell Carcinoma (BCC)', holdSec: 0.9 });

  // 6. DISEASE 1/8 DEEP DIVE: PIGMENTED BCC + 3-MODE GRAD-CAM + LLM REASONING TRACE
  console.log('6/8: Disease 1/8 (BCC) + Grad-CAM + How the LLM Works...');
  await setChapter('DISEASE 1/8 · PIGMENTED BCC (84%)');
  await smoothScrollPhone(290, 0.35);
  await tapElement({ textIncludes: 'Stage 2 & Explainability', holdSec: 0.8 });
  await smoothScrollPhone(260, 0.4);
  await sweepSlider(45, 86, 0.5);
  await sweepSlider(86, 48, 0.45);
  await tapElement({ textIncludes: 'Original Clinical Image', holdSec: 0.65 });
  await tapElement({ textIncludes: 'Side-by-Side Comparison', holdSec: 0.85 });
  await tapElement({ textIncludes: 'Grad-CAM Overlay (Conv_1)', holdSec: 0.5 });

  await setChapter('STEP 4 · LLM SUMMARY & GROUNDED TRACE');
  await smoothScrollPhone(840, 0.6);
  await recordSeconds(0.8);
  await smoothScrollPhone(1340, 0.6);
  await recordSeconds(1.2); // Shows "How the LLM Works" JSON payload + 4 steps

  // 7. SHOWCASE ALL REMAINING 7 CORE DISEASES (2/8 THROUGH 8/8)
  console.log('7/8: Showcasing All Remaining 7 Core Diseases (SCC, MEL, ECZ, PSO, CD, SD, Scabies)...');
  await showcaseDisease({
    index: 2,
    filterTab: 'Cutaneous Malignancies (3)',
    cardMatch: 'Squamous Cell Carcinoma (SCC)',
    displayLabel: 'SQUAMOUS CELL CARCINOMA (86%)',
  });

  await showcaseDisease({
    index: 3,
    filterTab: 'Cutaneous Malignancies (3)',
    cardMatch: 'Malignant Melanoma (MEL)',
    displayLabel: 'MALIGNANT MELANOMA (89%)',
  });

  await showcaseDisease({
    index: 4,
    filterTab: 'Common Non-Malignant (5)',
    cardMatch: 'Atopic Dermatitis / Eczema',
    displayLabel: 'ATOPIC DERMATITIS / ECZEMA (93%)',
  });

  await showcaseDisease({
    index: 5,
    filterTab: 'Common Non-Malignant (5)',
    cardMatch: 'Plaque Psoriasis',
    displayLabel: 'PLAQUE PSORIASIS (93%)',
  });

  await showcaseDisease({
    index: 6,
    filterTab: 'Common Non-Malignant (5)',
    cardMatch: 'Contact Dermatitis',
    displayLabel: 'CONTACT DERMATITIS (91%)',
  });

  await showcaseDisease({
    index: 7,
    filterTab: 'Common Non-Malignant (5)',
    cardMatch: 'Seborrheic Dermatitis',
    displayLabel: 'SEBORRHEIC DERMATITIS (93%)',
  });

  await showcaseDisease({
    index: 8,
    filterTab: 'Common Non-Malignant (5)',
    cardMatch: 'Scabies (Sarcoptes scabiei',
    displayLabel: 'SCABIES INFESTATION (91%)',
  });

  // 8. STEP 5 PRINTABLE REFERRAL REPORT & PDF EXPORT TOAST
  console.log('8/8: Step 5 Printable Referral PDF Report & Export...');
  await setChapter('STEP 5 · PRINTABLE REFERRAL PDF');
  await smoothScrollPhone(1550, 0.45);
  await tapElement({ textIncludes: 'Generate Referral Report', holdSec: 0.9 });
  await smoothScrollPhone(360, 0.55);
  await recordSeconds(0.65);
  await smoothScrollPhone(820, 0.6);
  await recordSeconds(0.75); // Shows Attending PRC Verified Physician block + Disclaimer
  await tapElement({ textIncludes: 'Export / Print Referral PDF', holdSec: 1.5 });

  await hideCursor();
  await recordSeconds(0.6);

  console.log(
    `Captured ${frameCount} frames (${(frameCount / FPS).toFixed(1)}s). Page errors: ${pageErrors.length}`
  );
  if (pageErrors.length) console.error('Page errors:', pageErrors);

  ffmpeg.stdin.end();
  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegErr}`));
    });
  });

  await browser.close();
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  server.close();
  console.log(`Saved complete prototype demo video to: ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
