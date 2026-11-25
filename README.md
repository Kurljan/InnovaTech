# InnovaTech — Explainable Multimodal Skin Disease Triage (GP Mobile)

Mobile-first clinical decision-support web application prototype for Primary Care General Practitioners screening major cutaneous conditions across Fitzpatrick I–VI skin tones.

## Key Features
- **Clinician Portal & PRC License Verification:** 4-step Doctor Sign-Up, practice profile setup, 6-point simulated PRC medical license verification, OTP check, and Philippine Data Privacy Act (RA 10173) attestation.
- **Dual-Gatekeeper Acquisition (OpenCV + LLM Vision):** Drag-and-drop / mobile camera lesion capture with Laplacian focus sharpness check (`>= 100`) and non-skin / full-face privacy guardrails.
- **2-Stage Multimodal Triage & `<65%` Abstention Gate:**
  - **Category 1 — Early-Detectable Cutaneous Malignancies (3):** Basal Cell Carcinoma (BCC), Squamous Cell Carcinoma (SCC), and Melanoma (MEL).
  - **Category 2 — Common Non-Malignant Skin Diseases (5):** Atopic Dermatitis / Eczema, Plaque Psoriasis, Contact Dermatitis, Seborrheic Dermatitis, and Scabies (*Sarcoptes scabiei*).
- **Real-Time HTML5 Canvas Grad-CAM (`Conv_1`) & Grounded LLM Trace:** Photorealistic Fitzpatrick III–V macro dermatology photography, dynamic pixel-contrast & border-gradient scientific JET saliency overlay (`0%–100%` opacity), structured LLM clinical synthesis, and an inspectable 4-step `"How the LLM Works"` JSON trace.
- **Printable One-Page A4 Clinical Referral PDF:** Includes verified attending physician credentials, side-by-side Original vs. Grad-CAM captures, Softmax probabilities, and mandatory histopathological biopsy disclaimer.
- **iPhone 16 Hardware UI & Logo Boot Screen:** Authentic iPhone 16 Dynamic Island display frame on desktop viewports and full-bleed mobile layout on phones.

## Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

> **Clinical Disclaimer:** InnovaTech is a preliminary primary care visual triage prototype and does *not* formulate autonomous medical diagnoses or replace specialist dermoscopy and histopathological biopsy.
