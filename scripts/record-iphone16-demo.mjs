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
const OUT_MP4 = path.join(OUT_DIR, 'InnovaTech_iPhone16_Demo.mp4');

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
      const addr = server.address();
      resolve({ server, port: addr.port });
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
  throw new Error('No Chrome/Edge executable found on system.');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, port } = await startStaticServer(DIST_DIR);
  const url = `http://127.0.0.1:${port}/?record=1&waitboot=1`;
  console.log(`Static server running at ${url}`);

  const executablePath = findBrowserExecutable();
  const profileDir = path.join(ROOT, '.chrome-record-profile');
  fs.rmSync(profileDir, { recursive: true, force: true });
  const browser = await puppeteer.launch({
    executablePath,
    userDataDir: profileDir,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();
  // 540 x 960 logical viewport @ 2x DPR = crisp 1080 x 1920 Full HD 9:16 portrait video!
  await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });

  // Spawn FFmpeg expecting 24fps MJPEG stream on stdin -> H.264 MP4
  const FPS = 24;
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
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    const ok = ffmpeg.stdin.write(buf);
    if (!ok) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }
    frameCount++;
  };

  // Capture frames for `ms` duration while letting live page animations tick smoothly
  const recordFor = async (ms) => {
    const frames = Math.max(1, Math.round((ms / 1000) * FPS));
    const stepMs = ms / frames;
    for (let i = 0; i < frames; i++) {
      const t0 = Date.now();
      await writeFrame();
      const spent = Date.now() - t0;
      if (spent < stepMs) {
        await new Promise((r) => setTimeout(r, stepMs - spent));
      }
    }
  };

  // Inject mobile touch-indicator dot + tap ripple overlay for presentation clarity
  const injectTouchIndicator = async () => {
    await page.evaluate(() => {
      if (document.getElementById('demo-touch-cursor')) return;
      const dot = document.createElement('div');
      dot.id = 'demo-touch-cursor';
      dot.style.cssText = `
        position: fixed;
        top: -60px;
        left: -60px;
        width: 28px;
        height: 28px;
        margin-left: -14px;
        margin-top: -14px;
        border-radius: 9999px;
        background: rgba(13, 148, 136, 0.34);
        border: 2px solid rgba(13, 148, 136, 0.92);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
        pointer-events: none;
        z-index: 9999;
        transition: top 0.28s cubic-bezier(0.22,1,0.36,1), left 0.28s cubic-bezier(0.22,1,0.36,1), transform 0.14s ease, opacity 0.2s ease;
        opacity: 0;
      `;
      document.body.appendChild(dot);
    });
  };

  // Helper: Find element by text or selector, move touch indicator, tap it, and record
  const tapElement = async ({ selector, textIncludes, holdAfterMs = 900 }) => {
    const coords = await page.evaluate(
      ({ sel, txt }) => {
        let el = null;
        if (sel) {
          el = document.querySelector(sel);
        } else if (txt) {
          const candidates = Array.from(
            document.querySelectorAll('button, label, a, [role="tab"]')
          );
          el = candidates.find(
            (node) =>
              node.offsetParent !== null &&
              (node.textContent || '').replace(/\s+/g, ' ').trim().includes(txt)
          );
        }
        if (!el) return null;
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
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

    if (!coords) {
      console.warn('Could not locate element:', selector || textIncludes);
      return;
    }

    await recordFor(300);
    await page.evaluate(() => {
      const dot = document.getElementById('demo-touch-cursor');
      if (dot) dot.style.transform = 'scale(0.76)';
    });
    await page.mouse.click(coords.x, coords.y);
    await recordFor(140);
    await page.evaluate(() => {
      const dot = document.getElementById('demo-touch-cursor');
      if (dot) dot.style.transform = 'scale(1)';
    });
    await recordFor(holdAfterMs);
  };

  // Smoothly scroll the iPhone 16 viewport container
  const smoothScrollPhone = async (targetScrollTop, durationMs = 700) => {
    const frames = Math.max(1, Math.round((durationMs / 1000) * FPS));
    const startTop = await page.evaluate(() => {
      const sc = document.getElementById('iphone-viewport-scroll');
      return sc ? sc.scrollTop : 0;
    });
    for (let i = 1; i <= frames; i++) {
      const t = i / frames;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const nextTop = startTop + (targetScrollTop - startTop) * eased;
      await page.evaluate((val) => {
        const sc = document.getElementById('iphone-viewport-scroll');
        if (sc) sc.scrollTop = val;
      }, nextTop);
      await writeFrame();
    }
  };

  console.log('Opening InnovaTech in iPhone 16 Frame...');
  await page.goto(url, { waitUntil: 'networkidle0' });
  await injectTouchIndicator();

  // 1. Capture Animated InnovaTech Logo Loading Screen from 0% -> 100% -> Reveal Step 1
  console.log('Scene 1: InnovaTech Logo Loading Screen & Step 1 Guardrail...');
  await recordFor(450);
  await page.evaluate(() => {
    if (window.__startInnovaBoot) window.__startInnovaBoot();
  });
  await recordFor(3100);

  // Scroll slightly on Step 1, check Mandatory Clinical Scope checkbox & tap Start Mobile Screening
  await smoothScrollPhone(140, 450);
  await tapElement({ selector: '#scope-ack-checkbox', holdAfterMs: 650 });
  await tapElement({ textIncludes: 'Start Mobile Screening', holdAfterMs: 900 });

  // 2. Step 2: Rear-Camera Capture, Upload Dropzone & Dual-Gatekeeper Validation
  console.log('Scene 2: Step 2 Capture & Dual-Gatekeeper Validation...');
  await smoothScrollPhone(290, 550);
  await recordFor(600);
  await tapElement({ textIncludes: 'Simulate Invalid: Non-Skin Object', holdAfterMs: 1100 });
  await tapElement({ textIncludes: 'Simulate Invalid: Blurry Image', holdAfterMs: 1100 });
  await tapElement({ textIncludes: 'Reset Valid Sample', holdAfterMs: 900 });

  // Show Clinical Intake Context & tap Run Triage
  await smoothScrollPhone(680, 650);
  await recordFor(750);
  await tapElement({ textIncludes: 'Run Triage', holdAfterMs: 1000 });

  // 3. Step 3: Stage 1 Primary Cancer Triage (84% BCC/SCC) + Taxonomy Modal (2 Categories • 8 Core Conditions)
  console.log('Scene 3: Stage 1 Triage & Taxonomy Modal...');
  await recordFor(900);
  await tapElement({ textIncludes: 'Taxonomy', holdAfterMs: 1800 });
  await tapElement({ textIncludes: 'Close Taxonomy Drawer', holdAfterMs: 700 });

  // Proceed to Step 4 Stage 2 & Explainability
  await smoothScrollPhone(320, 450);
  await tapElement({ textIncludes: 'Stage 2 & Explainability', holdAfterMs: 1100 });

  // 4. Step 4: Stage 2 Pigmented BCC, Real-Time Canvas JET Grad-CAM (3 Modes + Opacity Slider) & LLM Trace
  console.log('Scene 4: Interactive Grad-CAM & Grounded LLM Reasoning Trace...');
  await smoothScrollPhone(250, 500);
  await recordFor(700);

  // Sweep Heatmap Opacity Slider smoothly (45% -> 88% -> 30% -> 52%)
  const sweepSlider = async (fromVal, toVal, ms) => {
    const steps = Math.max(1, Math.round((ms / 1000) * FPS));
    for (let i = 1; i <= steps; i++) {
      const val = Math.round(fromVal + ((toVal - fromVal) * i) / steps);
      await page.evaluate((v) => {
        const slider = document.getElementById('heatmap-opacity-slider');
        if (!slider) return;
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeSetter.call(slider, String(v));
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }, val);
      await writeFrame();
    }
  };
  await sweepSlider(45, 86, 550);
  await sweepSlider(86, 50, 450);

  await tapElement({ textIncludes: 'Original Clinical Image', holdAfterMs: 800 });
  await tapElement({ textIncludes: 'Side-by-Side Comparison', holdAfterMs: 1000 });
  await tapElement({ textIncludes: 'Grad-CAM Overlay (Conv_1)', holdAfterMs: 650 });

  // Scroll down through LLM Clinical Assistant Summary & "How the LLM Works" Live JSON Trace
  await smoothScrollPhone(860, 800);
  await recordFor(1100);
  await smoothScrollPhone(1320, 800);
  await recordFor(1300);

  // 5. Open 8-Condition Case Simulator -> Switch to Scabies (8th Condition, 91% Not Cancer) -> Back to BCC Report
  console.log('Scene 5: 8-Condition Case Simulator (Scabies & Melanoma)...');
  await tapElement({ textIncludes: 'Cases (8)', holdAfterMs: 1100 });
  await tapElement({ textIncludes: 'Common Non-Malignant (5)', holdAfterMs: 850 });
  await tapElement({ textIncludes: 'Scabies (Sarcoptes scabiei', holdAfterMs: 1100 });
  await tapElement({ textIncludes: 'Stage 2 & Explainability', holdAfterMs: 1100 });
  await smoothScrollPhone(240, 450);
  await recordFor(900);

  // Switch to Pigmented BCC or generate Referral Report directly! Let's show Pigmented BCC Referral Report
  await tapElement({ textIncludes: 'Cases (8)', holdAfterMs: 850 });
  await tapElement({ textIncludes: 'Cutaneous Malignancies (3)', holdAfterMs: 650 });
  await tapElement({ textIncludes: 'Pigmented Basal Cell Carcinoma', holdAfterMs: 900 });
  await smoothScrollPhone(320, 400);
  await tapElement({ textIncludes: 'Stage 2 & Explainability', holdAfterMs: 700 });
  await smoothScrollPhone(1380, 550);
  await tapElement({ textIncludes: 'Generate Referral Report', holdAfterMs: 1100 });

  // 6. Step 5: Printable Clinical Triage & Referral PDF Report + Export Toast
  console.log('Scene 6: Step 5 Printable Referral Report & PDF Export Toast...');
  await smoothScrollPhone(340, 750);
  await recordFor(800);
  await smoothScrollPhone(720, 700);
  await tapElement({ textIncludes: 'Export / Print Referral PDF', holdAfterMs: 1800 });

  // Hide touch dot at end for clean closing hold
  await page.evaluate(() => {
    const dot = document.getElementById('demo-touch-cursor');
    if (dot) dot.style.opacity = '0';
  });
  await recordFor(700);

  console.log(`Captured ${frameCount} frames (${(frameCount / FPS).toFixed(1)}s). Finalizing MP4...`);
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegErr}`));
    });
  });

  await browser.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
  server.close();
  console.log(`Saved full-HD iPhone 16 demo video to: ${OUT_MP4}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
