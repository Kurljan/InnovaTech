// ==========================================================================
// InnovaTech Photorealistic Clinical Macro Dermatology Renderer (Fitzpatrick III-V)
// + Real-Time Pixel-Contrast & Border-Gradient HTML5 Canvas JET Grad-CAM Engine
// ==========================================================================

const renderCache = new Map();

// Fast deterministic hash & 2D gradient/value noise for realistic skin micro-topography
function hash2(ix, iy) {
  let n = ix * 374761393 + iy * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return val;
}

// Voronoi cellular distance for natural rhomboidal skin creases (dermatoglyphics) & pores
function skinCreaseAndPoreField(x, y) {
  const sx = x * 0.085;
  const sy = y * 0.085;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  let d1 = 99;
  let d2 = 99;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx;
      const cy = iy + dy;
      const px = cx + 0.18 + 0.64 * hash2(cx, cy);
      const py = cy + 0.18 + 0.64 * hash2(cx + 91, cy + 37);
      const dist = Math.hypot(sx - px, sy - py);
      if (dist < d1) {
        d2 = d1;
        d1 = dist;
      } else if (dist < d2) {
        d2 = dist;
      }
    }
  }
  // Fine polygonal sulcus line where d2 - d1 is near 0, plus central follicular pore pit
  const sulcus = Math.exp(-Math.pow((d2 - d1) / 0.095, 2));
  const pore = Math.exp(-Math.pow(d1 / 0.11, 2));
  return { sulcus, pore };
}

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Synthesize photorealistic 480x360 macro clinical photography onto an ImageData buffer
function buildPhotorealisticPresetCanvas(variant) {
  const w = 480;
  const h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Non-skin & Full-face gatekeeper scenes use clean realistic macro studio renders
  if (variant === 'non-skin') {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#CBD5E1');
    bg.addColorStop(1, '#94A3B8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
    for (let x = 20; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(0, 62);
    ctx.quadraticCurveTo(12, 132, 98, 168);
    ctx.stroke();
    ctx.restore();
    return canvas;
  }

  if (variant === 'full-face') {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#E2E8F0');
    bg.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.ellipse(0, 145, 135, 70, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#9E6640';
    ctx.fillRect(-26, 52, 52, 48);
    ctx.fillStyle = '#B2774E';
    ctx.beginPath();
    ctx.ellipse(0, -10, 66, 84, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(0, -44, 68, 52, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-24, -14, 5.5, 0, Math.PI * 2);
    ctx.arc(24, -14, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6B3E1E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-5, 14);
    ctx.lineTo(5, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 28, 16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
    return canvas;
  }

  if (variant === 'blurry') {
    const sharp = getCachedPresetCanvas('bcc');
    ctx.save();
    ctx.filter = 'blur(9px)';
    ctx.drawImage(sharp, 0, 0);
    ctx.restore();
    return canvas;
  }

  // Per-pixel PBR Macro Skin & Pathological Morphology Synthesis (Fitzpatrick Types III-V)
  const imgData = ctx.createImageData(w, h);
  const pixels = imgData.data;
  const heightMap = new Float32Array(w * h);
  const specMap = new Float32Array(w * h);
  const rgbBuf = new Float32Array(w * h * 3);

  const cx = w * 0.5;
  const cy = h * 0.5;

  // Slightly vary Fitzpatrick III-V baseline tone per anatomical context for natural realism
  let baseSkin = [182, 126, 89]; // Warm medium-brown Fitzpatrick IV
  if (variant === 'nv' || variant === 'pso' || variant === 'cd') {
    baseSkin = [194, 139, 102]; // Fitzpatrick III-IV
  } else if (variant === 'ks' || variant === 'df' || variant === 'melanoma-fitzIV') {
    baseSkin = [168, 112, 76]; // Rich Fitzpatrick IV-V
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const dx = (x - cx) / 108;
      const dy = (y - cy) / 96;
      const rNorm = Math.hypot(dx, dy);
      const theta = Math.atan2(dy, dx);

      // Natural skin micro-relief: Voronoi dermatoglyphic creases + follicular pores + mottled melanin
      const { sulcus, pore } = skinCreaseAndPoreField(x + fbm(x * 0.03, y * 0.03, 2) * 8, y);
      const mottle = fbm(x * 0.018, y * 0.018, 3); // Subtle vascular/melanin mottling
      const fineTex = fbm(x * 0.14, y * 0.14, 3);

      let R = baseSkin[0] + (mottle - 0.5) * 18 - sulcus * 13 - pore * 17 + (fineTex - 0.5) * 7;
      let G = baseSkin[1] + (mottle - 0.5) * 13 - sulcus * 11 - pore * 14 + (fineTex - 0.5) * 5;
      let B = baseSkin[2] + (mottle - 0.5) * 10 - sulcus * 9 - pore * 11 + (fineTex - 0.5) * 4;

      let elev = -sulcus * 0.35 - pore * 0.5 + fineTex * 0.18;
      let spec = 0.14; // Natural skin hydrolipid sheen

      const warp1 = fbm(x * 0.035 + 3.1, y * 0.035 + 7.4, 4);
      const warp2 = fbm(x * 0.09 + 11.2, y * 0.09 + 1.9, 3);

      // Disease-Specific Photorealistic Macro Morphology
      switch (variant) {
        case 'bcc':
        case 'valid': {
          // Pigmented Basal Cell Carcinoma: Well-circumscribed shiny dark-brown/pearly papule with rolled translucent hyperpigmented border
          const contour = 0.66 + (warp1 - 0.5) * 0.12 + 0.03 * Math.sin(theta * 5);
          const mask = 1 - smoothstep(contour - 0.06, contour + 0.04, rNorm);
          const halo = (1 - smoothstep(contour, contour + 0.24, rNorm)) * (1 - mask);

          // Subtle perilesional vascular blush
          R += halo * 16;
          G -= halo * 8;
          B -= halo * 8;

          if (mask > 0.005) {
            const rimDist = Math.abs(rNorm - (contour - 0.12));
            const rolledRim = Math.exp(-Math.pow(rimDist / 0.11, 2));
            const pigmentBeads = smoothstep(0.42, 0.72, fbm(x * 0.075 + 2, y * 0.075 + 5, 3));
            const blueGrayNest = smoothstep(0.54, 0.78, fbm(x * 0.055 + 9, y * 0.055 + 4, 3));

            // Translucent pearly pink-tan stroma + dark brown/black peripheral pigment + slate blue-gray ovoid nests
            let lR = 132 - pigmentBeads * 86 - blueGrayNest * 48 + rolledRim * 36;
            let lG = 86 - pigmentBeads * 62 - blueGrayNest * 26 + rolledRim * 28;
            let lB = 74 - pigmentBeads * 52 - blueGrayNest * 8 + rolledRim * 28;

            // Fine arborizing sub-epidermal micro-vessels across shiny dome
            const vesselField = Math.abs(fbm(x * 0.045, y * 0.045, 3) - 0.5);
            const vessel = Math.exp(-Math.pow(vesselField / 0.016, 2)) * (1 - pigmentBeads * 0.7);
            lR += vessel * 68;
            lG -= vessel * 24;
            lB -= vessel * 22;

            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;

            // 3D dome + prominent rolled peripheral rim + glossy pearly specular highlight
            elev = elev * (1 - mask * 0.75) + mask * (1.8 + rolledRim * 2.4 + (warp2 - 0.5) * 0.4);
            spec = 0.14 + mask * (0.48 + rolledRim * 0.34);
          }
          break;
        }

        case 'melanoma':
        case 'melanoma-fitzIV': {
          // Malignant Melanoma: Asymmetric, notched/pseudopod macule-plaque with variegated dark brown, jet black & slate-gray veil
          const asymR =
            0.76 +
            0.18 * Math.sin(theta * 2 + 0.5) +
            0.11 * Math.cos(theta * 3 - 0.9) +
            (warp1 - 0.5) * 0.34;
          const stretchX = dx > -0.1 ? dx * 0.86 : dx * 1.08;
          const mDist = Math.hypot(stretchX, dy * 1.06);
          const mask = 1 - smoothstep(asymR - 0.08, asymR + 0.05, mDist);

          if (mask > 0.005) {
            const variegation = fbm(x * 0.04 + 4.2, y * 0.04 + 8.1, 4);
            const jetCore = smoothstep(0.45, 0.76, fbm(x * 0.032 - 1.5, y * 0.032 + 2.2, 3));
            const slateVeil =
              smoothstep(0.52, 0.78, fbm(x * 0.05 + 12, y * 0.05 + 6, 3)) *
              Math.exp(-Math.pow(Math.hypot(dx - 0.15, dy + 0.08) / 0.42, 2));
            const netGrid = Math.sin(x * 0.45 + warp2 * 5) * Math.sin(y * 0.45 + warp1 * 5);

            // Rich variegated chestnut -> dark umber -> jet black -> slate-blue veil
            let lR = 88 - variegation * 54 - jetCore * 42 + slateVeil * 26 - netGrid * 9;
            let lG = 48 - variegation * 32 - jetCore * 26 + slateVeil * 32 - netGrid * 6;
            let lB = 30 - variegation * 18 - jetCore * 16 + slateVeil * 48 - netGrid * 4;

            R = R * (1 - mask) + Math.max(12, lR) * mask;
            G = G * (1 - mask) + Math.max(9, lG) * mask;
            B = B * (1 - mask) + Math.max(10, lB) * mask;

            elev = elev * (1 - mask * 0.5) + mask * (0.85 + jetCore * 1.3 + warp2 * 0.45);
            spec = 0.14 + mask * (0.16 + slateVeil * 0.22);
          }
          break;
        }

        case 'scc': {
          // Squamous Cell Carcinoma: Indurated erythematous-brown plaque with rough hyperkeratotic central scale/crusting
          const contour = 0.74 + (warp1 - 0.5) * 0.22;
          const mask = 1 - smoothstep(contour - 0.09, contour + 0.06, rNorm);
          const inflHalo = (1 - smoothstep(contour, contour + 0.34, rNorm)) * (1 - mask);

          R += inflHalo * 32;
          G -= inflHalo * 12;
          B -= inflHalo * 14;

          if (mask > 0.005) {
            const coreMask = 1 - smoothstep(0.28, 0.54, rNorm + (warp2 - 0.5) * 0.18);
            const keratin = smoothstep(0.38, 0.72, fbm(x * 0.11 + 5, y * 0.11 + 3, 4));
            const ulcerFissure = smoothstep(0.66, 0.84, fbm(x * 0.09 + 14, y * 0.09 + 9, 3)) * coreMask;

            // Indurated erythematous-brown base
            let lR = 158 + (warp1 - 0.5) * 24;
            let lG = 72 + (warp1 - 0.5) * 16;
            let lB = 58 + (warp1 - 0.5) * 14;

            // Adherent rough yellowish-ivory hyperkeratotic crust & dark hemorrhagic fissures
            const scaleMix = coreMask * (0.45 + 0.55 * keratin) + keratin * 0.28;
            lR = lR * (1 - scaleMix) + 218 * scaleMix - ulcerFissure * 115;
            lG = lG * (1 - scaleMix) + 194 * scaleMix - ulcerFissure * 135;
            lB = lB * (1 - scaleMix) + 156 * scaleMix - ulcerFissure * 115;

            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;

            elev =
              elev * (1 - mask * 0.8) +
              mask * (1.9 + scaleMix * 2.6 - ulcerFissure * 2.2 + (fineTex - 0.5) * 1.4);
            spec = 0.08 + mask * (0.04 + ulcerFissure * 0.28);
          }
          break;
        }

        case 'benign-sk':
        case 'bkl': {
          // Seborrheic Keratosis: Well-demarcated slightly raised verrucous ("stuck-on") tan-to-dark-brown plaque with crypts & milia
          const ovalDist = Math.hypot(dx * 0.92, dy * 1.08);
          const contour = 0.68 + (warp1 - 0.5) * 0.11;
          // Crisp "stuck-on" steep border transition
          const mask = 1 - smoothstep(contour - 0.035, contour + 0.02, ovalDist);

          if (mask > 0.005) {
            // Cerebriform verrucous ridges & follicular comedo-like crypts
            const ridges = Math.sin(fbm(x * 0.065, y * 0.065, 3) * 19);
            const crypt = smoothstep(0.76, 0.9, fbm(x * 0.13 + 7, y * 0.13 + 2, 2));
            const milia = smoothstep(0.83, 0.92, fbm(x * 0.16 + 21, y * 0.16 + 13, 2));

            let lR = 104 + ridges * 18 - crypt * 52 + milia * 98;
            let lG = 68 + ridges * 13 - crypt * 38 + milia * 88;
            let lB = 44 + ridges * 9 - crypt * 24 + milia * 74;

            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;

            elev = elev * (1 - mask * 0.85) + mask * (2.1 + ridges * 0.85 - crypt * 1.4);
            spec = 0.07; // Matte hyperkeratotic waxy-verrucous finish
          }
          break;
        }

        case 'ecz': {
          // Atopic Dermatitis / Eczema: Ill-defined erythematous, dry, mildly lichenified scaly patch on flexor skin
          const patchField = rNorm + (warp1 - 0.5) * 0.48 + (warp2 - 0.5) * 0.22;
          const mask = 1 - smoothstep(0.45, 1.08, patchField);

          if (mask > 0.01) {
            // Accentuated transverse flexor lichenification creases + dry fine white desquamation
            const lichenCrease = Math.pow(Math.abs(Math.sin(y * 0.22 + warp1 * 4)), 6);
            const dryFlake = smoothstep(0.67, 0.86, fbm(x * 0.15 + 3, y * 0.15 + 8, 3));
            const excoriation = smoothstep(0.84, 0.93, fbm(x * 0.12 + 19, y * 0.12 + 5, 3));

            let lR = R + 36 - lichenCrease * 22 + dryFlake * 48 - excoriation * 35;
            let lG = G - 18 - lichenCrease * 16 + dryFlake * 52 - excoriation * 42;
            let lB = B - 16 - lichenCrease * 12 + dryFlake * 54 - excoriation * 38;

            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;

            elev += mask * (0.45 - lichenCrease * 0.95 + dryFlake * 0.75);
            spec = 0.06; // Dry xerotic barrier
          }
          break;
        }

        case 'tin': {
          // Tinea Corporis: Classic annular (ring-shaped) plaque with active raised scaly erythematous border & central clearing
          const ringR = 0.74 + (warp1 - 0.5) * 0.14;
          const activeRing = Math.exp(-Math.pow((rNorm - ringR) / 0.14, 2));
          const interior = 1 - smoothstep(ringR - 0.08, ringR + 0.04, rNorm);
          const leadingScale =
            smoothstep(0.52, 0.82, fbm(x * 0.16 + 6, y * 0.16 + 11, 3)) * activeRing;
          const microPapule =
            smoothstep(0.72, 0.9, fbm(x * 0.14 + 2, y * 0.14 + 17, 2)) * activeRing;

          // Mildly post-inflammatory / clearing center + vivid raised erythematous scaly peripheral ring
          R += interior * 10 + activeRing * 46 + leadingScale * 44 + microPapule * 18;
          G += -interior * 4 - activeRing * 22 + leadingScale * 48 - microPapule * 16;
          B += -interior * 4 - activeRing * 20 + leadingScale * 50 - microPapule * 14;

          elev += activeRing * 1.9 + leadingScale * 1.1 + microPapule * 0.9;
          spec = 0.11 - leadingScale * 0.06;
          break;
        }

        case 'akiec': {
          // Actinic Keratosis / Intraepithelial Carcinoma: Rough gritty erythematous-tan macule with adherent white-yellow hyperkeratotic scale
          const patchField = rNorm + (warp1 - 0.5) * 0.35;
          const mask = 1 - smoothstep(0.42, 0.88, patchField);
          if (mask > 0.01) {
            const grittyScale = smoothstep(0.46, 0.78, fbm(x * 0.17 + 4, y * 0.17 + 9, 4));
            const lR = R + 34 + grittyScale * 46;
            const lG = G - 14 + grittyScale * 48;
            const lB = B - 12 + grittyScale * 44;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (0.5 + grittyScale * 1.6);
            spec = 0.07;
          }
          break;
        }

        case 'ctcl': {
          // Cutaneous T-Cell Lymphoma (Mycosis Fungoides): Irregular erythematous-to-hyperpigmented trunk patch with cigarette-paper crinkling
          const arcDist = Math.hypot(dx * 0.84, dy * 1.1) + 0.14 * Math.sin(theta * 2 + 0.6) + (warp1 - 0.5) * 0.24;
          const mask = 1 - smoothstep(0.68, 0.86, arcDist);
          if (mask > 0.01) {
            const crinkle = Math.sin(y * 0.36 + warp2 * 5) * 0.5 + 0.5;
            const fineScale = smoothstep(0.68, 0.88, fbm(x * 0.14, y * 0.14, 3));
            const lR = R * 0.82 + 44 + fineScale * 34;
            const lG = G * 0.68 + 10 + fineScale * 32;
            const lB = B * 0.72 + 14 + fineScale * 34;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (0.45 + (crinkle - 0.5) * 0.65);
          }
          break;
        }

        case 'ks': {
          // Kaposi Sarcoma: Violaceous-to-dark-mahogany dermal plaques & satellite vascular nodules
          const n1 = Math.exp(-Math.pow(Math.hypot((dx + 0.08) * 0.9, (dy + 0.04) * 1.15) / 0.56, 3));
          const n2 = Math.exp(-Math.pow(Math.hypot(dx - 0.44, dy - 0.28) / 0.28, 3));
          const mask = Math.min(1, (n1 + n2) * (0.88 + warp1 * 0.25));
          if (mask > 0.01) {
            const lR = 88 - warp2 * 24;
            const lG = 36 - warp2 * 14;
            const lB = 68 - warp2 * 12;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * 2.1;
            spec = 0.14 + mask * 0.26;
          }
          break;
        }

        case 'nv': {
          // Benign Melanocytic Nevus: Symmetric round-oval regular tan-brown mole with delicate reticular pigment grid
          const nDist = Math.hypot(dx * 1.02, dy * 1.08) + (warp2 - 0.5) * 0.04;
          const mask = 1 - smoothstep(0.41, 0.48, nDist);
          if (mask > 0.01) {
            const retic = Math.sin(x * 0.42) * Math.sin(y * 0.42) * 0.5 + 0.5;
            const lR = 98 - retic * 18;
            const lG = 62 - retic * 14;
            const lB = 38 - retic * 10;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * 0.55;
          }
          break;
        }

        case 'df': {
          // Dermatofibroma: Firm central whitish-pink scar-like fibrous papule with delicate peripheral brown pigment ring
          const dDist = rNorm + (warp2 - 0.5) * 0.05;
          const outerMask = 1 - smoothstep(0.44, 0.56, dDist);
          const scarCore = 1 - smoothstep(0.08, 0.27, dDist);
          if (outerMask > 0.01) {
            let lR = 112 + scarCore * 98;
            let lG = 72 + scarCore * 96;
            let lB = 50 + scarCore * 98;
            R = R * (1 - outerMask) + lR * outerMask;
            G = G * (1 - outerMask) + lG * outerMask;
            B = B * (1 - outerMask) + lB * outerMask;
            elev += outerMask * 1.45;
            spec = 0.14 + scarCore * 0.16;
          }
          break;
        }

        case 'vasc': {
          // Benign Vascular Lesion (Cherry Angioma): Sharply circumscribed ruby-red to violaceous dome-shaped lacunar papule
          const vDist = rNorm + (warp2 - 0.5) * 0.03;
          const mask = 1 - smoothstep(0.34, 0.39, vDist);
          if (mask > 0.01) {
            const lacuna = smoothstep(0.35, 0.72, fbm(x * 0.14 + 3, y * 0.14 + 7, 2));
            const lR = 192 - lacuna * 42;
            const lG = 24 + (1 - lacuna) * 18;
            const lB = 42 + lacuna * 18;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (2.4 * Math.sqrt(Math.max(0, 1 - Math.pow(vDist / 0.4, 2))));
            spec = 0.14 + mask * 0.44;
          }
          break;
        }

        case 'pso': {
          // Plaque Psoriasis: Sharply demarcated salmon-erythematous plaque + thick layered silvery-white micaceous scale
          const pDist = Math.hypot(dx * 0.88, dy * 1.05) + (warp1 - 0.5) * 0.12;
          const mask = 1 - smoothstep(0.68, 0.74, pDist);
          if (mask > 0.01) {
            const silverPlate = smoothstep(0.36, 0.68, fbm(x * 0.095 + 8, y * 0.095 + 3, 4));
            let lR = 178 * (1 - silverPlate * 0.78) + 234 * (silverPlate * 0.78);
            let lG = 66 * (1 - silverPlate * 0.78) + 236 * (silverPlate * 0.78);
            let lB = 64 * (1 - silverPlate * 0.78) + 240 * (silverPlate * 0.78);
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (1.7 + silverPlate * 1.5);
            spec = 0.06;
          }
          break;
        }

        case 'cd': {
          // Contact Dermatitis: Localized erythematous edematous eczematous patch with pinpoint spongiotic micro-vesicles
          const boxDist = Math.max(Math.abs(dx) * 0.78, Math.abs(dy) * 1.12) + (warp1 - 0.5) * 0.22;
          const mask = 1 - smoothstep(0.58, 0.84, boxDist);
          if (mask > 0.01) {
            const vesicle = smoothstep(0.79, 0.91, fbm(x * 0.18 + 5, y * 0.18 + 11, 2));
            const lR = R + 42 + vesicle * 28;
            const lG = G - 20 + vesicle * 34;
            const lB = B - 18 + vesicle * 26;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (0.7 + vesicle * 1.4);
            spec = 0.14 + mask * vesicle * 0.35;
          }
          break;
        }

        case 'sd': {
          // Seborrheic Dermatitis: Salmon-erythematous seborrheic facial patch with greasy yellowish-white furfuraceous scale
          const sdDist = Math.hypot(dx * 0.88, dy * 1.04) + (warp1 - 0.5) * 0.34;
          const mask = 1 - smoothstep(0.46, 0.92, sdDist);
          if (mask > 0.01) {
            const greasyFlake = smoothstep(0.48, 0.76, fbm(x * 0.13 + 7, y * 0.13 + 4, 4));
            const sebPore = smoothstep(0.74, 0.9, fbm(x * 0.21 + 3, y * 0.21 + 12, 2));
            const lR = R + 38 + greasyFlake * 48 - sebPore * 16;
            const lG = G - 14 + greasyFlake * 44 - sebPore * 14;
            const lB = B - 16 + greasyFlake * 22 - sebPore * 10;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (0.55 + greasyFlake * 1.25 - sebPore * 0.45);
            spec = 0.18 + mask * greasyFlake * 0.22; // Subtle sebaceous lipid sheen
          }
          break;
        }

        case 'scab': {
          // Scabies (Sarcoptes scabiei): Flexor wrist / interdigital web skin creases on Fitzpatrick IV skin
          // with clustered erythematous-dusky papules, pinpoint hemorrhagic excoriations, and fine serpiginous burrows
          const wristCrease = Math.exp(-Math.pow((dy + 0.34 + 0.05 * Math.sin(dx * 2.6)) / 0.045, 2));
          const webCrease = Math.exp(-Math.pow((dy - 0.42 - 0.06 * Math.cos(dx * 2.1)) / 0.05, 2));
          const creaseMix = Math.min(1, (wristCrease + webCrease) * 0.65);
          R -= creaseMix * 18;
          G -= creaseMix * 15;
          B -= creaseMix * 12;
          elev -= creaseMix * 0.85;

          // Clustered erythematous papules + central pinpoint excoriation crusts
          const papules = [
            [-0.42, -0.14, 0.14, true],
            [-0.18, 0.06, 0.15, true],
            [0.08, -0.18, 0.13, false],
            [0.26, 0.12, 0.15, true],
            [0.46, -0.06, 0.12, false],
            [-0.06, 0.28, 0.13, true],
            [-0.32, 0.22, 0.11, false],
          ];

          for (let i = 0; i < papules.length; i++) {
            const [px, py, pr, hasExcor] = papules[i];
            const pd = Math.hypot(dx - px, dy - py) + (warp2 - 0.5) * 0.025;
            const flare = Math.exp(-Math.pow(pd / (pr * 1.65), 2));
            const dome = Math.max(0, 1 - Math.pow(pd / pr, 2));
            if (flare > 0.02) {
              R += flare * 34 + dome * 24;
              G -= flare * 16 + dome * 18;
              B -= flare * 14 + dome * 16;
              elev += dome * 2.05;
              spec += dome * 0.12;
            }
            if (hasExcor) {
              const exDist = Math.hypot(dx - (px + 0.015), dy - (py - 0.01));
              const crust = 1 - smoothstep(0.022, 0.048, exDist);
              if (crust > 0.01) {
                R = R * (1 - crust) + 92 * crust;
                G = G * (1 - crust) + 22 * crust;
                B = B * (1 - crust) + 20 * crust;
                elev += crust * 0.55;
              }
            }
          }

          // Fine thread-like serpiginous grayish-white burrows (S-curved tracks + terminal dark mite delta)
          const burrows = [
            { x0: -0.36, y0: -0.08, len: 0.24, ang: 0.35 },
            { x0: 0.06, y0: -0.08, len: 0.26, ang: 0.62 },
            { x0: 0.24, y0: 0.16, len: 0.21, ang: -0.28 },
          ];
          for (let bIdx = 0; bIdx < burrows.length; bIdx++) {
            const bw = burrows[bIdx];
            const ux = (dx - bw.x0) * Math.cos(-bw.ang) - (dy - bw.y0) * Math.sin(-bw.ang);
            const uy = (dx - bw.x0) * Math.sin(-bw.ang) + (dy - bw.y0) * Math.cos(-bw.ang);
            if (ux >= -0.02 && ux <= bw.len + 0.02) {
              const curveY = 0.032 * Math.sin((ux / bw.len) * Math.PI * 2);
              const trackDist = Math.abs(uy - curveY);
              const track = Math.exp(-Math.pow(trackDist / 0.014, 2));
              if (track > 0.05) {
                R = R * (1 - track * 0.68) + 224 * (track * 0.68);
                G = G * (1 - track * 0.68) + 208 * (track * 0.68);
                B = B * (1 - track * 0.68) + 196 * (track * 0.68);
                elev += track * 0.95;
              }
              // Tiny dark brown-gray terminal mite delta ("hang-glider" point) at end of burrow
              const miteDist = Math.hypot(ux - bw.len, uy - curveY);
              const miteDot = 1 - smoothstep(0.008, 0.02, miteDist);
              if (miteDot > 0.02) {
                R = R * (1 - miteDot) + 48 * miteDot;
                G = G * (1 - miteDot) + 34 * miteDot;
                B = B * (1 - miteDot) + 30 * miteDot;
              }
            }
          }
          break;
        }

        case 'imp': {
          // Impetigo: Clustered superficial erythematous erosions topped with golden honey-colored meliceric crusts
          const baseMask = 1 - smoothstep(0.55, 0.86, rNorm + (warp1 - 0.5) * 0.26);
          if (baseMask > 0.01) {
            const crust = smoothstep(0.42, 0.66, fbm(x * 0.085 + 2, y * 0.085 + 9, 4));
            const amberCrystal = fbm(x * 0.22, y * 0.22, 2);
            let lR = 176 * (1 - crust) + (218 + amberCrystal * 24) * crust;
            let lG = 58 * (1 - crust) + (148 + amberCrystal * 32) * crust;
            let lB = 52 * (1 - crust) + (38 + amberCrystal * 20) * crust;
            R = R * (1 - baseMask) + lR * baseMask;
            G = G * (1 - baseMask) + lG * baseMask;
            B = B * (1 - baseMask) + lB * baseMask;
            elev += baseMask * (0.6 + crust * 2.3);
            spec = 0.14 + baseMask * crust * 0.24;
          }
          break;
        }

        case 'hz': {
          // Herpes Zoster (Shingles): Grouped umbilicated vesicles on vivid unilateral erythematous dermatomal band
          const rx = dx * Math.cos(0.26) - dy * Math.sin(0.26);
          const ry = dx * Math.sin(0.26) + dy * Math.cos(0.26);
          const bandMask =
            (1 - smoothstep(0.95, 1.32, Math.abs(rx))) *
            (1 - smoothstep(0.26, 0.52, Math.abs(ry) + (warp1 - 0.5) * 0.18));

          if (bandMask > 0.01) {
            R = R * (1 - bandMask) + (R + 48) * bandMask;
            G = G * (1 - bandMask) + (G - 28) * bandMask;
            B = B * (1 - bandMask) + (B - 24) * bandMask;

            // Grouped vesicular clusters along dermatome
            const vesCenters = [
              [-0.62, -0.04],
              [-0.48, 0.09],
              [-0.44, -0.11],
              [-0.06, -0.05],
              [0.08, 0.08],
              [0.14, -0.09],
              [0.54, 0.03],
              [0.68, -0.07],
              [0.63, 0.12],
            ];
            let vMax = 0;
            let umb = 0;
            for (let i = 0; i < vesCenters.length; i++) {
              const vd = Math.hypot(rx - vesCenters[i][0], ry - vesCenters[i][1]);
              const v = Math.max(0, 1 - Math.pow(vd / 0.095, 2));
              if (v > vMax) {
                vMax = v;
                umb = Math.exp(-Math.pow(vd / 0.028, 2));
              }
            }
            if (vMax > 0) {
              R = R * (1 - vMax * 0.78) + (226 - umb * 65) * (vMax * 0.78);
              G = G * (1 - vMax * 0.78) + (212 - umb * 95) * (vMax * 0.78);
              B = B * (1 - vMax * 0.78) + (208 - umb * 95) * (vMax * 0.78);
              elev += vMax * 2.5 - umb * 0.9;
              spec = 0.14 + vMax * 0.52;
            }
          }
          break;
        }

        case 'inconclusive-lesion':
        default: {
          // Equivocal polymorphous atypical pigmented macule
          const eDist = rNorm + (warp1 - 0.5) * 0.24;
          const mask = 1 - smoothstep(0.45, 0.68, eDist);
          if (mask > 0.01) {
            const mott = fbm(x * 0.07, y * 0.07, 3);
            const lR = 108 - mott * 46;
            const lG = 66 - mott * 32;
            const lB = 46 - mott * 22;
            R = R * (1 - mask) + lR * mask;
            G = G * (1 - mask) + lG * mask;
            B = B * (1 - mask) + lB * mask;
            elev += mask * (0.65 + mott * 0.5);
          }
          break;
        }
      }

      heightMap[idx] = elev;
      specMap[idx] = spec;
      rgbBuf[idx * 3] = R;
      rgbBuf[idx * 3 + 1] = G;
      rgbBuf[idx * 3 + 2] = B;
    }
  }

  // Pass 2: 3D Bump-Mapped Dermatoscope Lighting + Subtle Lens Vignette
  const lx = -0.38;
  const ly = -0.44;
  const lz = 0.813;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const xm = x > 0 ? x - 1 : x;
      const xp = x < w - 1 ? x + 1 : x;
      const ym = y > 0 ? y - 1 : y;
      const yp = y < h - 1 ? y + 1 : y;

      const dhx = (heightMap[y * w + xp] - heightMap[y * w + xm]) * 0.55;
      const dhy = (heightMap[yp * w + x] - heightMap[ym * w + x]) * 0.55;

      const invLen = 1 / Math.sqrt(dhx * dhx + dhy * dhy + 1);
      const nx = -dhx * invLen;
      const ny = -dhy * invLen;
      const nz = invLen;

      const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
      const diffuse = 0.68 + 0.42 * ndotl;

      // Halfway vector H for polarized / non-polarized macro specular highlight
      const hx = lx * 0.5;
      const hy = ly * 0.5;
      const hz = (lz + 1) * 0.5;
      const hLen = Math.hypot(hx, hy, hz);
      const ndoth = Math.max(0, (nx * hx + ny * hy + nz * hz) / hLen);
      const specular = Math.pow(ndoth, 26) * specMap[idx] * 92;

      // Natural soft dermatoscope field-of-view vignette
      const vDist = Math.hypot((x - cx) / (w * 0.62), (y - cy) / (h * 0.62));
      const vignette = 1 - 0.18 * Math.pow(vDist, 2.2);

      const pIdx = idx * 4;
      pixels[pIdx] = clampByte((rgbBuf[idx * 3] * diffuse + specular) * vignette);
      pixels[pIdx + 1] = clampByte((rgbBuf[idx * 3 + 1] * diffuse + specular * 0.96) * vignette);
      pixels[pIdx + 2] = clampByte((rgbBuf[idx * 3 + 2] * diffuse + specular * 0.94) * vignette);
      pixels[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Subtle fine peripheral skin hairs (vellus hairs) for authentic clinical macro realism
  ctx.save();
  ctx.strokeStyle = 'rgba(38, 22, 14, 0.24)';
  ctx.lineWidth = 0.85;
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2 + 0.2;
    const dist = 135 + (i % 5) * 18;
    const hx0 = cx + Math.cos(ang) * dist;
    const hy0 = cy + Math.sin(ang) * (dist * 0.78);
    ctx.beginPath();
    ctx.moveTo(hx0, hy0);
    ctx.quadraticCurveTo(hx0 + 9, hy0 + 5, hx0 + 18, hy0 + 13);
    ctx.stroke();
  }
  ctx.restore();

  return canvas;
}

function getCachedPresetCanvas(variant) {
  const key = variant || 'bcc';
  if (!renderCache.has(key)) {
    renderCache.set(key, buildPhotorealisticPresetCanvas(key));
  }
  return renderCache.get(key);
}

export function renderLesionScene(ctx, w, h, variant, customImage = null) {
  ctx.clearRect(0, 0, w, h);

  if (customImage && (variant === 'custom-valid' || variant === 'custom-blurry')) {
    const scale = Math.max(w / customImage.width, h / customImage.height);
    const dw = customImage.width * scale;
    const dh = customImage.height * scale;
    ctx.save();
    if (variant === 'custom-blurry') ctx.filter = 'blur(6px)';
    ctx.drawImage(customImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.restore();
    return;
  }

  const presetCanvas = getCachedPresetCanvas(variant || 'bcc');
  ctx.drawImage(presetCanvas, 0, 0, w, h);
}

// ==========================================================================
// Scientific JET Colormap (#000080 -> #00FFFF -> #00FF00 -> #FFFF00 -> #FF0000)
// ==========================================================================
export function jetColormap(v) {
  const x = Math.max(0, Math.min(1, v));
  let r = 0;
  let g = 0;
  let b = 0;

  if (x < 0.125) {
    r = 0;
    g = 0;
    b = 0.5 + 4 * x; // #000080 -> #0000FF
  } else if (x < 0.375) {
    r = 0;
    g = 4 * (x - 0.125); // -> #00FFFF
    b = 1;
  } else if (x < 0.625) {
    r = 4 * (x - 0.375); // -> #00FF00 -> #FFFF00
    g = 1;
    b = 1 - 4 * (x - 0.375);
  } else if (x < 0.875) {
    r = 1;
    g = 1 - 4 * (x - 0.625); // -> #FF0000
    b = 0;
  } else {
    r = 1 - 2.2 * (x - 0.875); // Deep crimson peak
    g = 0;
    b = 0;
  }

  return [
    clampByte(Math.round(r * 255)),
    clampByte(Math.round(g * 255)),
    clampByte(Math.round(b * 255)),
  ];
}

// Separable 1D Gaussian blur pass on a Float32 grid for smooth Conv_1 spatial pooling
function gaussianBlurGrid(src, gw, gh, radius = 6, sigma = 3.2) {
  const weights = new Float32Array(radius * 2 + 1);
  let wSum = 0;
  for (let k = -radius; k <= radius; k++) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma));
    weights[k + radius] = w;
    wSum += w;
  }
  for (let i = 0; i < weights.length; i++) weights[i] /= wSum;

  const tmp = new Float32Array(gw * gh);
  const out = new Float32Array(gw * gh);

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.max(0, Math.min(gw - 1, x + k));
        acc += src[y * gw + sx] * weights[k + radius];
      }
      tmp[y * gw + x] = acc;
    }
  }

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.max(0, Math.min(gh - 1, y + k));
        acc += tmp[sy * gw + x] * weights[k + radius];
      }
      out[y * gw + x] = acc;
    }
  }
  return out;
}

// ==========================================================================
// Real-Time Pixel-Intensity, Chromophore-Contrast & Border-Gradient Grad-CAM
// Works dynamically on BOTH Built-In Presets AND Real User-Uploaded Skin Photos!
// ==========================================================================
export function renderGradCamHeatmap(ctx, w, h, scenarioKey, sourceCanvas = null) {
  const gw = 120;
  const gh = 90;
  let activationGrid = new Float32Array(gw * gh);

  if (sourceCanvas) {
    // Analyze actual pixels of the displayed lesion image (preset or real user upload!)
    const probe = document.createElement('canvas');
    probe.width = gw;
    probe.height = gh;
    const pCtx = probe.getContext('2d');
    pCtx.drawImage(sourceCanvas, 0, 0, gw, gh);
    const px = pCtx.getImageData(0, 0, gw, gh).data;

    const lum = new Float32Array(gw * gh);
    const ery = new Float32Array(gw * gh); // Redness / erythema chromophore
    const yel = new Float32Array(gw * gh); // Melanin / honey-crust / yellow-blue contrast

    // 1. Estimate surrounding normal skin tone from the outer peripheral ring
    let bgLumSum = 0;
    let bgErySum = 0;
    let bgYelSum = 0;
    let bgCount = 0;

    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const r = px[i * 4];
        const g = px[i * 4 + 1];
        const b = px[i * 4 + 2];

        const L = 0.299 * r + 0.587 * g + 0.114 * b;
        const E = r - 0.55 * g - 0.45 * b;
        const Y = 0.5 * (r + g) - b;

        lum[i] = L;
        ery[i] = E;
        yel[i] = Y;

        const ndx = (x - gw * 0.5) / (gw * 0.5);
        const ndy = (y - gh * 0.5) / (gh * 0.5);
        const rDist = Math.hypot(ndx, ndy);
        // Sample peripheral skin ring while skipping extreme dark corners or specular highlights
        if (rDist > 0.68 && rDist < 0.95 && L > 35 && L < 235) {
          bgLumSum += L;
          bgErySum += E;
          bgYelSum += Y;
          bgCount++;
        }
      }
    }

    const bgLum = bgCount > 10 ? bgLumSum / bgCount : 145;
    const bgEry = bgCount > 10 ? bgErySum / bgCount : 38;
    const bgYel = bgCount > 10 ? bgYelSum / bgCount : 32;

    // Select morphological attention weighting (e.g. border-dominant for rolled/annular rims)
    const isBorderDominant =
      scenarioKey === 'bcc' ||
      scenarioKey === 'malignancy' ||
      scenarioKey === 'tin' ||
      scenarioKey === 'ctcl';

    // 2. Compute pixel-level color-contrast + local morphological Sobel border gradient
    for (let y = 1; y < gh - 1; y++) {
      for (let x = 1; x < gw - 1; x++) {
        const i = y * gw + x;

        const darkContrast = Math.max(0, bgLum - lum[i]); // Hyperpigmented core / nests
        const scaleContrast = Math.max(0, lum[i] - bgLum) * 0.72; // Silvery scale / vesicles / keratin
        const eryContrast = Math.max(0, ery[i] - bgEry) * 1.35; // Erythematous / vascular rim
        const chromaShift = Math.abs(yel[i] - bgYel) * 0.65;

        // Sobel border gradient magnitude
        const gx =
          -lum[i - gw - 1] +
          lum[i - gw + 1] -
          2 * lum[i - 1] +
          2 * lum[i + 1] -
          lum[i + gw - 1] +
          lum[i + gw + 1];
        const gy =
          -lum[i - gw - 1] -
          2 * lum[i - gw] -
          lum[i - gw + 1] +
          lum[i + gw - 1] +
          2 * lum[i + gw] +
          lum[i + gw + 1];
        const edgeMag = Math.hypot(gx, gy) * 0.22;

        // Soft field-of-view prior to suppress camera frame corner vignette
        const ndx = (x - gw * 0.5) / (gw * 0.5);
        const ndy = (y - gh * 0.5) / (gh * 0.5);
        const centerWindow = Math.exp(-Math.pow(Math.hypot(ndx, ndy) / 0.86, 4));

        let score = 0;
        if (isBorderDominant) {
          score = (edgeMag * 1.75 + eryContrast * 1.15 + darkContrast * 0.65) * centerWindow;
        } else {
          score =
            (darkContrast * 1.15 +
              eryContrast * 1.2 +
              scaleContrast * 0.85 +
              chromaShift * 0.5 +
              edgeMag * 0.9) *
            centerWindow;
        }
        activationGrid[i] = score;
      }
    }

    // 3. Smooth Gaussian spatial pooling (Conv_1 receptive field) & [0, 1] normalization
    activationGrid = gaussianBlurGrid(activationGrid, gw, gh, 8, 3.8);
    activationGrid = gaussianBlurGrid(activationGrid, gw, gh, 6, 2.8);

    let maxVal = 0.0001;
    let minVal = Infinity;
    for (let i = 0; i < gw * gh; i++) {
      if (activationGrid[i] > maxVal) maxVal = activationGrid[i];
      if (activationGrid[i] < minVal) minVal = activationGrid[i];
    }
    const span = Math.max(1e-4, maxVal - minVal);
    for (let i = 0; i < gw * gh; i++) {
      const norm = (activationGrid[i] - minVal) / span;
      // Non-linear gamma shaping to cleanly separate peak pathological foci from background skin
      activationGrid[i] = Math.pow(norm, 1.25);
    }
  } else {
    // Analytical fallback if no sourceCanvas is passed
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const dx = (x - gw * 0.5) / (gw * 0.22);
        const dy = (y - gh * 0.5) / (gh * 0.22);
        activationGrid[y * gw + x] = Math.exp(-(dx * dx + dy * dy));
      }
    }
  }

  // 4. Bilinear upsample to full target canvas resolution & apply true JET colormap
  const outImg = ctx.createImageData(w, h);
  const out = outImg.data;

  for (let y = 0; y < h; y++) {
    const gy = (y / (h - 1)) * (gh - 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(gh - 1, y0 + 1);
    const fy = gy - y0;

    for (let x = 0; x < w; x++) {
      const gx = (x / (w - 1)) * (gw - 1);
      const x0 = Math.floor(gx);
      const x1 = Math.min(gw - 1, x0 + 1);
      const fx = gx - x0;

      const v00 = activationGrid[y0 * gw + x0];
      const v10 = activationGrid[y0 * gw + x1];
      const v01 = activationGrid[y1 * gw + x0];
      const v11 = activationGrid[y1 * gw + x1];

      const v0 = v00 + (v10 - v00) * fx;
      const v1 = v01 + (v11 - v01) * fx;
      const act = v0 + (v1 - v0) * fy;

      const [r, g, b] = jetColormap(act);
      const p = (y * w + x) * 4;
      out[p] = r;
      out[p + 1] = g;
      out[p + 2] = b;
      // Smooth low-activation transparency -> deep blue (#000080) -> vivid crimson (#FF0000)
      const alphaFactor = smoothstep(0.03, 0.24, act);
      out[p + 3] = Math.round((0.28 + 0.72 * alphaFactor) * 255);
    }
  }

  ctx.putImageData(outImg, 0, 0);
}

export function createLesionThumbnailDataUrl(variant, w = 128, h = 96) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  renderLesionScene(ctx, w, h, variant);
  return c.toDataURL('image/png');
}

export function computeLaplacianVariance(img) {
  const c = document.createElement('canvas');
  const size = 160;
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const gray = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    gray[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;
      const lap = gray[idx - size] + gray[idx + size] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  const mean = sum / count;
  return Math.round(sumSq / count - mean * mean);
}
