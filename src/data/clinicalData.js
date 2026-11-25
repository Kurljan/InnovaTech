export const ANATOMICAL_SITES = [
  'Cheek / Sun-Exposed Face',
  'Interdigital Finger Webs / Inner Wrist',
  'Left Forearm',
  'Head/Neck',
  'Trunk',
  'Upper Extremity',
  'Lower Extremity',
  'Palms/Soles/Nails',
];

export const LESION_DURATIONS = [
  '< 1 month (Acute onset)',
  '3 Weeks',
  '1–3 months',
  '6 Months',
  '3–6 months (Progressive)',
  '6–12 months',
  '> 1 year (Longstanding / Changing)',
];

export const SYMPTOM_OPTIONS = [
  'Pearly Rolled Border',
  'Slow Progressive Growth',
  'Pigmented Margin',
  'Intense Nocturnal Pruritus',
  'Clustered Excoriated Papules',
  'Household Contact History',
  'Asymmetry',
  'Border Irregularity',
  'Color Variegation',
  'Rapid Growth',
  'Bleeding/Ulceration',
];

// Guardrail Rejection Messages (Exact Verbatim Clinical Banners)
export const GUARDRAIL_REJECTIONS = {
  'non-skin': {
    id: 'non-skin',
    shortLabel: 'Reject: Non-Skin Object',
    subLabel: 'LLM Vision Gatekeeper',
    tone: 'coral',
    laplacian: 168,
    hudRight: 'SKIN ROI: 0%',
    bannerText:
      'Inference Blocked — LLM Vision Gatekeeper Detected Non-Cutaneous Object (No Human Skin Lesion Found).',
  },
  'full-face': {
    id: 'full-face',
    shortLabel: 'Reject: Full Face / Privacy',
    subLabel: 'LLM Vision Gatekeeper',
    tone: 'amber-red',
    laplacian: 138,
    hudRight: 'FACE DETECTED',
    bannerText:
      'Inference Blocked — Full Face Detected. Privacy & Framing Guardrail Requires Localized Lesion Close-Up Only.',
  },
  blurry: {
    id: 'blurry',
    shortLabel: 'Reject: Blurry / Low-Res',
    subLabel: 'OpenCV Gatekeeper (Var: 38)',
    tone: 'red',
    laplacian: 38,
    hudRight: 'LAPLACIAN: 38',
    bannerText:
      'OpenCV Quality Gate Failed — Laplacian Sharpness Variance: 38 (Minimum Required: 100). Recapture Focused Image.',
  },
  abstention: {
    id: 'abstention',
    shortLabel: 'Safeguard: <65% Abstention',
    subLabel: 'Max Confidence: 52%',
    tone: 'amber',
    laplacian: 146,
    hudRight: 'LAPLACIAN: 146',
    bannerText:
      'Inconclusive Prediction (Max Confidence: 52% < 65% Threshold) — Automated Disease Label Withheld; Direct Specialist Evaluation Required.',
  },
};

// Baseline 3 + Melanoma + Abstention + All 10 New Extended Simulation Profiles
export const SCENARIOS = {
  // --- Existing Baseline Profiles (Excluded from the 10-card Extended Drawer per Strict Exclusion Rule) ---
  malignancy: {
    key: 'malignancy',
    isBaseline: true,
    tabLabel: 'BCC (84%)',
    cardTitle: 'Pigmented Basal Cell Carcinoma (BCC)',
    cardSub: 'Translucent pearly rolled hyperpigmented border · Fitzpatrick IV',
    lesionVariant: 'bcc',
    specificClassJson: 'Pigmented Basal Cell Carcinoma',
    softmaxJson: { bcc_scc: 0.84, melanoma: 0.10, not_cancer: 0.06 },
    intake: {
      site: 'Cheek / Sun-Exposed Face',
      duration: '6 Months',
      symptoms: ['Pearly Rolled Border', 'Slow Progressive Growth', 'Pigmented Margin'],
    },
    bannerTone: 'coral',
    bannerTitle:
      'Preliminary Triage Alert: Urgent Specialist Referral (Confidence 84% > 65% Threshold)',
    bannerSub: 'MobileNetV2 Stage-1 softmax (84%) exceeds the 65% primary care referral threshold.',
    bars: [
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 84, color: '#DC2626' },
      { label: 'Melanoma (MEL)', pct: 10, color: '#D97706' },
      { label: 'Not Cancer (Benign / Inflammatory / Infectious)', pct: 6, color: '#64748B' },
    ],
    stage2Category: 'Malignant & Premalignant Cancer — Urgent Specialist Referral',
    stage2Name: 'Specific Condition Identified: Pigmented Basal Cell Carcinoma (BCC)',
    stage2Meta: 'ICD-10: C44.31 · Fitzpatrick Type IV · Urgent Dermatology Biopsy Pathway',
    stage2BadgeText: '84% Conf.',
    matchedTaxId: 'BCC',
    gradCamNote:
      'Conv_1 JET thermal overlay localizes directly along the lesion’s rolled, hyperpigmented peripheral border.',
    fitzpatrickNote:
      'Fitzpatrick Type IV Clinical Note: Pigmented BCC variants represent >50% of basal cell carcinomas in darker skin tones (Fitzpatrick IV–VI) and frequently mimic nodular/superficial melanoma or seborrheic keratosis.',
    morphology:
      'Well-circumscribed pigmented papule/nodule on sun-exposed Fitzpatrick Type IV skin exhibiting a characteristic translucent pearly rolled border, peripheral hyperpigmented margin, blue-gray ovoid nests, and fine arborizing telangiectasias.',
    differentials:
      '1. Melanoma (10% — critical pigmented mimic requiring dermoscopic & histological exclusion) · 2. Seborrheic Keratosis · 3. Benign Pigmented Nevus.',
    action:
      'Initiate urgent dermatology referral for polarized dermoscopy and histopathological punch or excisional biopsy confirmation. Avoid empiric cryotherapy or laser ablation without tissue diagnosis.',
  },

  melanoma: {
    key: 'melanoma',
    isBaseline: true,
    extendedGroup: 'cancer',
    tabLabel: 'Melanoma (89%)',
    cardTitle: 'Malignant Melanoma (MEL)',
    cardSub: 'Asymmetric variegated dark brown-black & slate-gray plaque · Fitzpatrick IV',
    lesionVariant: 'melanoma-fitzIV',
    intake: {
      site: 'Palms/Soles/Nails',
      duration: '3–6 months (Progressive)',
      symptoms: ['Asymmetry', 'Border Irregularity', 'Color Variegation', 'Rapid Growth'],
    },
    bannerTone: 'coral',
    bannerTitle: 'Immediate Dermatology & Oncology Referral Required — ABCDE High-Risk Pattern',
    bannerSub: 'Stage-1 Melanoma probability (89%) exceeds urgent oncology referral threshold (>65%).',
    bars: [
      { label: 'Melanoma (MEL)', pct: 89, color: '#BE123C' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 7, color: '#D97706' },
      { label: 'Not Cancer', pct: 4, color: '#64748B' },
    ],
    stage2Category: 'Neoplastic — Cutaneous / Acral Malignancy',
    stage2Name: 'Specific Disease: Acral / Cutaneous Malignant Melanoma',
    stage2Meta: 'ICD-10: C43.9 · Immediate Dermatology & Oncology Pathway',
    stage2BadgeText: '89% Conf.',
    matchedTaxId: 'MEL',
    gradCamNote: 'Focused red hotspot localizes directly over the irregular dark-black pigment network and peripheral pseudopods.',
    morphology:
      'Markedly asymmetric, multi-shaded dark brown-to-jet-black lesion on Fitzpatrick Type IV skin with an atypical broadened pigment network, peripheral pseudopods, and focal blue-white veil.',
    differentials:
      '1. Acral / Cutaneous Malignant Melanoma (89%) · 2. Pigmented BCC / SCC (7%) · 3. Dysplastic Melanocytic Nevus (4%).',
    action:
      'Immediate Dermatology & Oncology Referral Required — ABCDE High-Risk Pattern. Arrange urgent specialist dermoscopy and full-thickness excisional biopsy.',
  },

  benign: {
    key: 'benign',
    isBaseline: true,
    extendedGroup: 'benign',
    tabLabel: 'Seborrheic Keratosis (88%)',
    cardTitle: 'Seborrheic Keratosis (BKL)',
    cardSub: 'Well-demarcated verrucous ("stuck-on") tan-brown plaque · Fitzpatrick IV',
    lesionVariant: 'benign-sk',
    intake: {
      site: 'Trunk',
      duration: '> 1 year (Longstanding / Changing)',
      symptoms: ['Color Variegation'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Routine Primary Care Monitoring',
    bannerSub: 'Benign cutaneous mimic exceeds 65% threshold; low malignancy probability.',
    bars: [
      { label: 'Not Cancer (Benign / Inflammatory / Infectious)', pct: 88, color: '#059669' },
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 7, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 5, color: '#64748B' },
    ],
    stage2Category: 'Benign Mimics — Epidermal Proliferation',
    stage2Name: 'Seborrheic Keratosis',
    stage2Meta: 'ICD-10: L82.1 · Routine Primary Care Observation',
    stage2BadgeText: '88% Conf.',
    matchedTaxId: 'BKL',
    gradCamNote: 'Uniform Conv_1 activation across stuck-on verrucous keratin surface without invasive border streaming.',
    morphology:
      'Well-demarcated, dull hyperkeratotic brown plaque with a classic "stuck-on" verrucous surface, comedo-like openings, and milia-like cysts.',
    differentials:
      '1. Seborrheic Keratosis (88%) · 2. Benign Melanocytic Nevus · 3. Verrucous Melanoma (exclude if bleeding).',
    action:
      'Reassure patient and document baseline macro photo in primary care chart. Review if symptomatic irritation, bleeding, or rapid change develops.',
  },

  inconclusive: {
    key: 'inconclusive',
    isBaseline: false,
    isGuardrail: true,
    tabLabel: 'Abstention (52%)',
    lesionVariant: 'inconclusive-lesion',
    intake: {
      site: 'Trunk',
      duration: '3–6 months (Progressive)',
      symptoms: ['Asymmetry', 'Color Variegation'],
    },
    bannerTone: 'amber',
    bannerTitle:
      'Inconclusive Prediction (Max Confidence: 52% < 65% Threshold) — Automated Disease Label Withheld; Direct Specialist Evaluation Required.',
    bannerSub: 'Maximum softmax confidence (52%) falls below the mandatory 65% clinical safety gate.',
    bars: [
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 52, color: '#D97706' },
      { label: 'Melanoma (MEL)', pct: 28, color: '#D97706' },
      { label: 'Not Cancer', pct: 20, color: '#64748B' },
    ],
    stage2Category: 'Safety Abstention Gate Triggered (<65% Threshold)',
    stage2Name: 'Automated Disease Label Withheld (Max Confidence: 52%)',
    stage2Meta: 'Sub-threshold split: BCC/SCC (52%) vs. Melanoma (28%) · Direct Specialist Review',
    stage2BadgeText: '52% (<65% Gate)',
    matchedTaxId: '',
    gradCamNote: 'Diffuse heterogeneous saliency across overlapping pigment zones; insufficient certainty for autonomous labeling.',
    morphology:
      'Equivocal polymorphous pigmented macule/papule demonstrating overlapping neoplastic and atypical melanocytic features with partial border ambiguity.',
    differentials:
      'Automated classification intentionally withheld due to sub-threshold split across Non-Melanoma Skin Cancer (52%), Melanoma (28%), and Benign Mimics (20%).',
    action:
      'Do NOT rely on automated categorization. Refer patient directly for in-person specialist dermatological examination, polarized dermoscopy, and biopsy if indicated.',
  },

  // ==========================================================================
  // DISEASE SIMULATOR PROFILES (Including Pigmented BCC under Cancer Category)
  // ==========================================================================

  // 1. Malignant & Rare Cutaneous Cancers (4)
  bcc: {
    key: 'bcc',
    extendedGroup: 'cancer',
    cardTitle: 'Pigmented Basal Cell Carcinoma (BCC)',
    cardSub: 'Translucent pearly rolled hyperpigmented border · Fitzpatrick IV',
    lesionVariant: 'bcc',
    specificClassJson: 'Pigmented Basal Cell Carcinoma',
    softmaxJson: { bcc_scc: 0.84, melanoma: 0.10, not_cancer: 0.06 },
    intake: {
      site: 'Cheek / Sun-Exposed Face',
      duration: '6 Months',
      symptoms: ['Pearly Rolled Border', 'Slow Progressive Growth', 'Pigmented Margin'],
    },
    bannerTone: 'coral',
    bannerTitle:
      'Preliminary Triage Alert: Urgent Specialist Referral (Confidence 84% > 65% Threshold)',
    bannerSub: 'Non-Melanoma Skin Cancer (BCC / SCC) probability (84%) exceeds the 65% referral threshold.',
    bars: [
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 84, color: '#DC2626' },
      { label: 'Melanoma (MEL)', pct: 10, color: '#D97706' },
      { label: 'Not Cancer (Benign / Inflammatory / Infectious)', pct: 6, color: '#64748B' },
    ],
    stage2Category: 'Malignant & Premalignant Cancer — Urgent Specialist Referral',
    stage2Name: 'Specific Condition Identified: Pigmented Basal Cell Carcinoma (BCC)',
    stage2Meta: 'ICD-10: C44.31 · Fitzpatrick Type IV · Urgent Dermatology Biopsy Pathway',
    stage2BadgeText: '84% Conf.',
    matchedTaxId: 'BCC',
    gradCamNote:
      'Conv_1 JET thermal overlay localizes directly along the lesion’s rolled, hyperpigmented peripheral border.',
    fitzpatrickNote:
      'Fitzpatrick Type IV Clinical Note: Pigmented BCC variants represent >50% of basal cell carcinomas in darker skin tones (Fitzpatrick IV–VI) and frequently mimic nodular/superficial melanoma or seborrheic keratosis.',
    morphology:
      'Well-circumscribed pigmented papule/nodule on sun-exposed Fitzpatrick Type IV skin exhibiting a characteristic translucent pearly rolled border, peripheral hyperpigmented margin, blue-gray ovoid nests, and fine arborizing telangiectasias.',
    differentials:
      '1. Melanoma (10% — critical pigmented mimic requiring dermoscopic & histological exclusion) · 2. Seborrheic Keratosis · 3. Benign Pigmented Nevus.',
    action:
      'Initiate urgent dermatology referral for polarized dermoscopy and histopathological punch or excisional biopsy confirmation. Avoid empiric cryotherapy or laser ablation without tissue diagnosis.',
  },

  scc: {
    key: 'scc',
    extendedGroup: 'cancer',
    cardTitle: 'Squamous Cell Carcinoma (SCC)',
    cardSub: 'Hyperkeratotic crusted central ulceration · Fitzpatrick IV',
    lesionVariant: 'scc',
    intake: {
      site: 'Head/Neck',
      duration: '1–3 months',
      symptoms: ['Border Irregularity', 'Rapid Growth', 'Bleeding/Ulceration'],
    },
    bannerTone: 'coral',
    bannerTitle: 'Preliminary Triage Alert: Urgent Specialist Referral (>65% Threshold)',
    bannerSub: 'High-risk Non-Melanoma Skin Cancer probability (86%) requires urgent surgical/dermatology biopsy.',
    bars: [
      { label: 'Non-Melanoma Skin Cancer (BCC/SCC)', pct: 86, color: '#DC2626' },
      { label: 'Melanoma', pct: 9, color: '#D97706' },
      { label: 'Not Cancer', pct: 5, color: '#64748B' },
    ],
    stage2Category: 'Malignant & Premalignant Cancer — Urgent Specialist Referral',
    stage2Name: 'Invasive Cutaneous Squamous Cell Carcinoma (SCC)',
    stage2Meta: 'ICD-10: C44.92 · Urgent 2-Week-Wait Dermatology / Surgical Excision Pathway',
    stage2BadgeText: '86% Conf.',
    matchedTaxId: 'SCC',
    gradCamNote: 'Grad-CAM JET heatmap highlights hyperkeratotic crusted central ulceration and indurated rim on Fitzpatrick Type IV skin.',
    morphology:
      'Firm, elevated erythematous-to-hyperpigmented nodule on sun-exposed Fitzpatrick Type IV skin featuring an indurated keratotic border, adherent yellowish-brown hyperkeratotic scale-crust, and central friable ulceration.',
    differentials:
      '1. Invasive Cutaneous Squamous Cell Carcinoma (86%) · 2. Keratoacanthoma · 3. Ulcerated Basal Cell Carcinoma or Amelanotic Melanoma (9%).',
    action:
      'Urgent 2-week-wait dermatology / plastic surgery referral for diagnostic wedge/punch biopsy and margin-controlled surgical excision. Palpate regional lymphatics given metastatic potential if untreated.',
  },

  ctcl: {
    key: 'ctcl',
    extendedGroup: 'cancer',
    cardTitle: 'Cutaneous T-Cell Lymphoma (CTCL / Mycosis Fungoides)',
    cardSub: 'Recalcitrant erythematous-hyperpigmented patch · Trunk',
    lesionVariant: 'ctcl',
    intake: {
      site: 'Trunk',
      duration: '> 1 year (Longstanding / Changing)',
      symptoms: ['Asymmetry', 'Border Irregularity', 'Color Variegation'],
    },
    bannerTone: 'coral',
    bannerTitle: 'Preliminary Triage Alert: Urgent Specialist Referral (>65% Threshold)',
    bannerSub: 'Rare cutaneous lymphoma pattern (74%) exceeds 65% specialist biopsy referral threshold.',
    bars: [
      { label: 'Non-Melanoma / Rare Cutaneous Malignancy', pct: 74, color: '#DC2626' },
      { label: 'Melanoma', pct: 11, color: '#D97706' },
      { label: 'Not Cancer', pct: 15, color: '#64748B' },
    ],
    stage2Category: 'Malignant & Rare Cutaneous Cancer — Urgent Specialist Referral',
    stage2Name: 'Cutaneous T-Cell Lymphoma (Mycosis Fungoides)',
    stage2Meta: 'ICD-10: C84.0 · Dermatology Biopsy & T-Cell Immunophenotyping Pathway',
    stage2BadgeText: '74% Conf.',
    matchedTaxId: 'CTCL',
    gradCamNote: 'Grad-CAM highlights irregular arcuate erythematous-to-hyperpigmented patch borders on sun-protected trunk skin.',
    morphology:
      'Persistent, asymmetrically scalloped erythematous-to-dusky-brown thin plaque on sun-protected bathing-suit trunk skin exhibiting fine cigarette-paper epidermal atrophy and subtle surface scale.',
    differentials:
      '1. Cutaneous T-Cell Lymphoma / Mycosis Fungoides (74%) · 2. Recalcitrant Adult Eczema or Parapsoriasis (15%) · 3. Tinea Corporis.',
    action:
      'Refer urgently to dermatology for multiple deep shave/punch skin biopsies, histopathology (Pautrier microabscesses), and CD3/CD4/CD8 immunophenotyping. Hold topical steroids for 2 weeks prior to biopsy if clinically safe.',
  },

  ks: {
    key: 'ks',
    extendedGroup: 'cancer',
    cardTitle: 'Kaposi Sarcoma (KS)',
    cardSub: 'Violaceous-to-dark-brown plaques/nodules · Lower Extremity',
    lesionVariant: 'ks',
    intake: {
      site: 'Lower Extremity',
      duration: '3–6 months (Progressive)',
      symptoms: ['Asymmetry', 'Color Variegation', 'Rapid Growth'],
    },
    bannerTone: 'coral',
    bannerTitle: 'Preliminary Triage Alert: Urgent Specialist Referral (>65% Threshold)',
    bannerSub: 'Vascular cutaneous malignancy signature (79%) warrants urgent biopsy & systemic workup.',
    bars: [
      { label: 'Non-Melanoma / Rare Cutaneous Malignancy', pct: 79, color: '#DC2626' },
      { label: 'Melanoma', pct: 13, color: '#D97706' },
      { label: 'Not Cancer', pct: 8, color: '#64748B' },
    ],
    stage2Category: 'Malignant & Rare Cutaneous Cancer — Urgent Specialist Referral',
    stage2Name: 'Kaposi Sarcoma',
    stage2Meta: 'ICD-10: C46.0 · Urgent Dermatology / Oncology Biopsy & Systemic Evaluation',
    stage2BadgeText: '79% Conf.',
    matchedTaxId: 'KS',
    gradCamNote: 'Grad-CAM localizes intensely over coalescing violaceous-to-dark-brown dermal plaques and nodules on the lower extremity.',
    morphology:
      'Infiltrated violaceous, purpuric-to-deep-mahogany dermal plaque with satellite vascular nodules on the lower extremity, non-blanching on diascopy with subtle perilesional hemosiderin halo.',
    differentials:
      '1. Kaposi Sarcoma (79%) · 2. Nodular / Acral Melanoma (13%) · 3. Bacillary Angiomatosis or Hemosiderotic Dermatofibroma (8%).',
    action:
      'Arrange urgent specialist punch biopsy with HHV-8 (LANA-1) immunostaining, complete mucocutaneous and lymph node exam, and systemic immunocompetence / oncology evaluation.',
  },

  // 2. Remaining Benign Cutaneous Mimics (3)
  nv: {
    key: 'nv',
    extendedGroup: 'benign',
    cardTitle: 'Melanocytic Nevus (NV)',
    cardSub: 'Symmetric uniform tan-brown mole · Routine Monitoring',
    lesionVariant: 'nv',
    intake: {
      site: 'Upper Extremity',
      duration: '> 1 year (Longstanding / Changing)',
      symptoms: [],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Routine Primary Care Monitoring',
    bannerSub: 'High-confidence benign melanocytic lesion (92% Not Cancer); negative ABCDE red flags.',
    bars: [
      { label: 'Not Cancer', pct: 92, color: '#059669' },
      { label: 'Melanoma', pct: 5, color: '#D97706' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 3, color: '#64748B' },
    ],
    stage2Category: 'Benign Cutaneous Mimics — Not Cancer (Routine Monitoring)',
    stage2Name: 'Benign Melanocytic Nevus (Common Mole)',
    stage2Meta: 'ICD-10: D22.9 · Routine Primary Care Observation & Self-Checks',
    stage2BadgeText: '92% Conf.',
    matchedTaxId: 'NV',
    gradCamNote: 'Grad-CAM shows uniform, symmetric attention across regular pigment borders with zero focal border hotspot.',
    morphology:
      'Small (<5 mm), round-to-oval, symmetric macule with smoothly circumscribed borders and homogeneous medium tan-brown reticular pigmentation across all quadrants.',
    differentials:
      '1. Benign Junctional / Compound Melanocytic Nevus (92%) · 2. Solar Lentigo · 3. Early Dysplastic Nevus (5% — low risk).',
    action:
      'Reassure patient; no biopsy indicated for stable symmetric nevi. Counsel on sun protection and monthly ABCDE / "ugly duckling" self-skin checks; re-evaluate if rapid evolution occurs.',
  },

  df: {
    key: 'df',
    extendedGroup: 'benign',
    cardTitle: 'Dermatofibroma (DF)',
    cardSub: 'Firm hyperpigmented central fibrous papule · Lower Leg',
    lesionVariant: 'df',
    intake: {
      site: 'Lower Extremity',
      duration: '6–12 months',
      symptoms: [],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Routine Primary Care Monitoring',
    bannerSub: 'Benign dermal fibrous nodule (89% Not Cancer); low malignancy probability.',
    bars: [
      { label: 'Not Cancer', pct: 89, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 7, color: '#64748B' },
      { label: 'Melanoma', pct: 4, color: '#64748B' },
    ],
    stage2Category: 'Benign Cutaneous Mimics — Not Cancer (Routine Monitoring)',
    stage2Name: 'Dermatofibroma',
    stage2Meta: 'ICD-10: D23.7 · Benign Fibrous Histiocytoma · Routine Observation',
    stage2BadgeText: '89% Conf.',
    matchedTaxId: 'DF',
    gradCamNote: 'Grad-CAM focuses tightly on the firm central scar-like fibrous core and symmetric peripheral pigment ring on the lower leg.',
    morphology:
      'Firm, dome-shaped 6 mm dermal papule on the anterior lower leg exhibiting a delicate peripheral tan-brown pigment ring surrounding a central pale pinkish-white scar-like patch.',
    differentials:
      '1. Benign Dermatofibroma (89%) · 2. Melanocytic Nevus · 3. Dermatofibrosarcoma Protuberans or Nodular BCC (if rapid enlargement).',
    action:
      'Confirm positive lateral compression "dimple sign" on clinical palpation. Reassure patient of benign etiology and advise routine observation unless painful, bleeding, or enlarging.',
  },

  vasc: {
    key: 'vasc',
    extendedGroup: 'benign',
    cardTitle: 'Benign Vascular Lesion (VASC — Cherry Angioma)',
    cardSub: 'Bright red-to-purple vascular papule · Trunk',
    lesionVariant: 'vasc',
    intake: {
      site: 'Trunk',
      duration: '6–12 months',
      symptoms: [],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Routine Primary Care Monitoring',
    bannerSub: 'Benign capillary proliferation (90% Not Cancer); well-circumscribed lacunar architecture.',
    bars: [
      { label: 'Not Cancer', pct: 90, color: '#059669' },
      { label: 'Melanoma', pct: 6, color: '#64748B' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 4, color: '#64748B' },
    ],
    stage2Category: 'Benign Cutaneous Mimics — Not Cancer (Routine Monitoring)',
    stage2Name: 'Benign Vascular Lesion (Cherry Angioma)',
    stage2Meta: 'ICD-10: D18.01 · Benign Capillary Proliferation · Routine Monitoring',
    stage2BadgeText: '90% Conf.',
    matchedTaxId: 'VASC',
    gradCamNote: 'Grad-CAM cleanly isolates the well-circumscribed bright ruby-red to violaceous vascular papule.',
    morphology:
      'Sharply demarcated 4 mm dome-shaped bright cherry-red to violaceous papule composed of clustered round red-purple vascular lacunae separated by fine fibrous septa, without pigment network or ulceration.',
    differentials:
      '1. Cherry Angioma / Benign Vascular Lesion (90%) · 2. Pyogenic Granuloma (if friable/bleeding) · 3. Amelanotic Nodular Melanoma (6%).',
    action:
      'Reassure patient and advise routine primary care observation. Consider elective outpatient electrocautery/laser or biopsy only if recurrently traumatized, bleeding (pyogenic granuloma), or rapidly growing.',
  },

  // 3. Remaining Inflammatory Dermatoses (2)
  pso: {
    key: 'pso',
    extendedGroup: 'inflammatory',
    cardTitle: 'Plaque Psoriasis',
    cardSub: 'Erythematous plaque with silvery-white scale · Extensor',
    lesionVariant: 'pso',
    intake: {
      site: 'Upper Extremity',
      duration: '> 1 year (Longstanding / Changing)',
      symptoms: ['Border Irregularity'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Primary Care Inflammatory Management',
    bannerSub: 'Immune-mediated inflammatory dermatosis (93% Not Cancer).',
    bars: [
      { label: 'Not Cancer', pct: 93, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 5, color: '#64748B' },
      { label: 'Melanoma', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Inflammatory Dermatoses — Not Cancer (Primary Care Management)',
    stage2Name: 'Plaque Psoriasis',
    stage2Meta: 'ICD-10: L40.0 · Primary Care Topical Regimen & Monitoring',
    stage2BadgeText: '93% Conf.',
    matchedTaxId: 'PSO',
    gradCamNote: 'Grad-CAM highlights well-demarcated erythematous plaques topped with micaceous silvery-white scale over extensor elbow/knee.',
    morphology:
      'Sharply demarcated, raised salmon-to-deep-erythematous plaque over extensor skin surfaced with thick, lamellated silvery-white hyperkeratotic scale and regular dotted vessels.',
    differentials:
      "1. Chronic Plaque Psoriasis (93%) · 2. Bowen's Disease / SCC in situ (5% — exclude if solitary non-responding plaque) · 3. Lichen Simplex Chronicus.",
    action:
      'Initiate primary care management with potent topical corticosteroid + calcipotriol combination and regular keratolytic emollients. Screen for psoriatic arthritis and refer to dermatology if BSA >10% or refractory.',
  },

  cd: {
    key: 'cd',
    extendedGroup: 'inflammatory',
    cardTitle: 'Contact Dermatitis',
    cardSub: 'Localized erythematous eczematous exposure patch · Fitzpatrick IV',
    lesionVariant: 'cd',
    intake: {
      site: 'Upper Extremity',
      duration: '< 1 month (Acute onset)',
      symptoms: ['Asymmetry', 'Border Irregularity'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Primary Care Inflammatory Management',
    bannerSub: 'Localized exogenous inflammatory dermatitis (91% Not Cancer).',
    bars: [
      { label: 'Not Cancer', pct: 91, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 6, color: '#64748B' },
      { label: 'Melanoma', pct: 3, color: '#64748B' },
    ],
    stage2Category: 'Common Inflammatory Mimics — Not Cancer (Primary Care Management)',
    stage2Name: 'Contact Dermatitis',
    stage2Meta: 'ICD-10: L25.9 · Allergen Avoidance & Barrier Repair Protocol',
    stage2BadgeText: '91% Conf.',
    matchedTaxId: 'CD',
    gradCamNote: 'Grad-CAM spans the localized erythematous, micro-vesicular eczematous borders matching external contact geometry.',
    morphology:
      'Acute well-to-moderately demarcated erythematous, edematous eczematous patch with pinpoint micro-vesicles and fine serous scale conforming to a localized external contact zone.',
    differentials:
      '1. Allergic / Irritant Contact Dermatitis (91%) · 2. Atopic Dermatitis Flare · 3. Plaque Psoriasis.',
    action:
      'Take targeted occupational/topical exposure history, enforce strict culprit allergen or irritant avoidance, restore skin barrier with fragrance-free emollients, and prescribe short-course medium-potency topical corticosteroid.',
  },

  sd: {
    key: 'sd',
    extendedGroup: 'inflammatory',
    cardTitle: 'Seborrheic Dermatitis',
    cardSub: 'Erythematous patch with greasy yellowish scale · Seborrheic Zone',
    lesionVariant: 'sd',
    specificClassJson: 'Seborrheic Dermatitis',
    softmaxJson: { bcc_scc: 0.05, melanoma: 0.02, not_cancer: 0.93 },
    intake: {
      site: 'Cheek / Sun-Exposed Face',
      duration: '1–3 months',
      symptoms: ['Border Irregularity'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Primary Care Inflammatory Management',
    bannerSub: 'Common seborrheic inflammatory dermatosis (93% Not Cancer); low malignancy probability.',
    bars: [
      { label: 'Not Cancer (Common Non-Malignant Skin Disease)', pct: 93, color: '#059669' },
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 5, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Common Non-Malignant Skin Diseases — Not Cancer (Primary Care Management)',
    stage2Name: 'Seborrheic Dermatitis',
    stage2Meta: 'ICD-10: L21.9 · Primary Care Antifungal + Mild Anti-Inflammatory Regimen',
    stage2BadgeText: '93% Conf.',
    matchedTaxId: 'SD',
    gradCamNote:
      'Conv_1 JET saliency localizes over the erythematous seborrheic patch and adherent greasy yellowish-white scale.',
    morphology:
      'Moderately demarcated salmon-to-erythematous patch on Fitzpatrick Type IV facial seborrheic skin surfaced by characteristic greasy, yellowish-white bran-like furfuraceous scale.',
    differentials:
      '1. Seborrheic Dermatitis (93%) · 2. Sebopsoriasis / Plaque Psoriasis · 3. Superficial Basal Cell Carcinoma (5% — exclude if solitary, pearly, or non-responsive).',
    action:
      'Initiate primary care therapy with topical ketoconazole 2% cream (targeting Malassezia yeast) plus short-course low-potency hydrocortisone 1% for acute erythema/pruritus, gentle non-soap cleansing, and routine primary care follow-up.',
  },

  scab: {
    key: 'scab',
    extendedGroup: 'inflammatory',
    cardTitle: 'Scabies (Sarcoptes scabiei Infestation)',
    cardSub: 'Clustered erythematous papules & serpiginous burrows · Fitzpatrick IV',
    lesionVariant: 'scab',
    specificClassJson: 'Scabies',
    softmaxJson: { not_cancer: 0.91, bcc_scc: 0.06, melanoma: 0.03 },
    intake: {
      site: 'Interdigital Finger Webs / Inner Wrist',
      duration: '3 Weeks',
      symptoms: [
        'Intense Nocturnal Pruritus',
        'Clustered Excoriated Papules',
        'Household Contact History',
      ],
    },
    bannerTone: 'emerald',
    bannerTitle:
      'Non-Cancer Triage: Primary Care Parasitic Management (Confidence 91% > 65% Threshold)',
    bannerSub:
      'High-confidence non-malignant ectoparasitic infestation (91% Not Cancer); targeted scabicide care indicated.',
    bars: [
      { label: 'Not Cancer (Common Non-Malignant Skin Disease)', pct: 91, color: '#059669' },
      { label: 'Non-Melanoma Skin Cancer (BCC / SCC)', pct: 6, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 3, color: '#64748B' },
    ],
    stage2Category: 'Common Non-Malignant Skin Diseases — Not Cancer (Primary Care Management)',
    stage2Name: 'Specific Condition Identified: Scabies (Cutaneous Sarcoptes scabiei Infestation)',
    stage2Meta: 'ICD-10: B86 · Fitzpatrick Type IV · Primary Care Permethrin & Contact Protocol',
    stage2BadgeText: '91% Conf.',
    matchedTaxId: 'SCAB',
    gradCamNote:
      'Conv_1 JET heatmap localizes directly over the clustered erythematous papular burrows and excoriated tracks on wrist/finger-web skin.',
    fitzpatrickNote:
      'Fitzpatrick Type IV Clinical Note: On medium-brown skin, scabietic erythema can appear dusky red-brown; inspect interdigital webs and flexor wrists closely for fine grayish-white thread-like burrows and nocturnal/household pruritus.',
    morphology:
      'Clustered 2–4 mm erythematous-to-dusky papules and fine, slightly scaly grayish-white serpiginous burrows (5–10 mm) with secondary pinpoint hemorrhagic excoriations in the interdigital finger webs and flexor inner wrist on Fitzpatrick Type IV skin.',
    differentials:
      'Differential Warning: Must be differentiated from Atopic Eczema and Allergic/Irritant Contact Dermatitis BEFORE prescribing standalone topical corticosteroids (which mask pruritus transiently and precipitate widespread hyperinfestation / "scabies incognito").',
    action:
      'Initiate topical scabicide therapy (e.g., 5% permethrin cream applied neck-down overnight for 8–14 hours and repeated in 7 days), launder all bedding and clothing in hot water (>50–60°C) or seal in plastic bags for 72 hours, and treat all close household contacts simultaneously even if asymptomatic.',
  },

  // 4. Remaining Infectious Skin Diseases (2)
  imp: {
    key: 'imp',
    extendedGroup: 'infectious',
    cardTitle: 'Impetigo',
    cardSub: 'Honey-colored crusted superficial bacterial erosions',
    lesionVariant: 'imp',
    intake: {
      site: 'Head/Neck',
      duration: '< 1 month (Acute onset)',
      symptoms: ['Border Irregularity', 'Bleeding/Ulceration'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Targeted Primary Care Antimicrobial Care',
    bannerSub: 'Superficial bacterial cutaneous infection (92% Not Cancer).',
    bars: [
      { label: 'Not Cancer', pct: 92, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 6, color: '#64748B' },
      { label: 'Melanoma', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Infectious Skin Diseases — Not Cancer (Targeted Antimicrobial Care)',
    stage2Name: 'Impetigo (Superficial Bacterial Skin Infection)',
    stage2Meta: 'ICD-10: L01.00 · Primary Care Topical / Oral Antibiotic Protocol',
    stage2BadgeText: '92% Conf.',
    matchedTaxId: 'IMP',
    gradCamNote: 'Grad-CAM localizes intensely over adherent golden honey-colored meliceric crusts and erythematous erosions.',
    morphology:
      'Clustered superficial erythematous erosions covered by characteristic thick, adherent golden-yellow ("honey-colored") meliceric exudative crusts without deep dermal induration.',
    differentials:
      '1. Non-Bullous Impetigo — S. aureus / S. pyogenes (92%) · 2. Secondary Impetiginized Herpes Simplex or Eczema · 3. Crusted Squamous Cell Carcinoma (6% — if chronic).',
    action:
      'Treat localized disease with topical mupirocin or fusidic acid (or oral anti-staphylococcal antibiotic if extensive), gently soak off crusts, and advise contact hygiene/towel isolation to prevent spread.',
  },

  akiec: {
    key: 'akiec',
    extendedGroup: 'cancer',
    cardTitle: 'Actinic Keratosis / Intraepithelial Carcinoma (AKIEC)',
    cardSub: 'Rough gritty erythematous-tan macule with adherent scale · Fitzpatrick IV',
    lesionVariant: 'akiec',
    intake: {
      site: 'Cheek / Sun-Exposed Face',
      duration: '6–12 months',
      symptoms: ['Border Irregularity', 'Slow Progressive Growth'],
    },
    bannerTone: 'coral',
    bannerTitle: 'Preliminary Triage Alert: Premalignant / In-Situ Lesion (>65% Threshold)',
    bannerSub: 'Actinic Keratosis / Bowen’s spectrum (76%) warrants specialist evaluation to exclude invasive SCC.',
    bars: [
      { label: 'Non-Melanoma / Premalignant (AKIEC / SCC)', pct: 76, color: '#DC2626' },
      { label: 'Not Cancer', pct: 16, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 8, color: '#D97706' },
    ],
    stage2Category: 'Malignant & Premalignant Cancer — Urgent Specialist Referral',
    stage2Name: 'Actinic Keratosis / Intraepithelial Carcinoma (AKIEC)',
    stage2Meta: 'ICD-10: L57.0 / D04.9 · Dermatology Assessment & Field Therapy / Biopsy',
    stage2BadgeText: '76% Conf.',
    matchedTaxId: 'AKIEC',
    gradCamNote: 'Conv_1 JET heatmap localizes over rough gritty hyperkeratotic scale and erythematous dysplasia.',
    morphology:
      'Ill-to-moderately defined erythematous-tan macule on chronically sun-exposed Fitzpatrick IV skin surfaced by rough, gritty ("sandpaper-like") adherent white-yellow hyperkeratotic scale.',
    differentials:
      '1. Actinic Keratosis / Bowen’s Disease (76%) · 2. Early Invasive Squamous Cell Carcinoma · 3. Seborrheic Keratosis (16%).',
    action:
      'Refer to dermatology for polarized dermoscopy; perform diagnostic biopsy if indurated, tender, or ulcerated to rule out invasive SCC prior to cryotherapy or topical 5-FU field therapy.',
  },

  ecz: {
    key: 'ecz',
    extendedGroup: 'inflammatory',
    cardTitle: 'Atopic Dermatitis / Eczema',
    cardSub: 'Ill-defined erythematous dry lichenified scaly patch · Flexor / Forearm',
    lesionVariant: 'ecz',
    intake: {
      site: 'Left Forearm',
      duration: '6–12 months',
      symptoms: ['Border Irregularity'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Primary Care Inflammatory Management',
    bannerSub: 'Benign chronic eczematous dermatitis (93% Not Cancer); low malignancy probability.',
    bars: [
      { label: 'Not Cancer (Common Inflammatory Skin Disease)', pct: 93, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 5, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Common Inflammatory Skin Diseases — Not Cancer (Primary Care Management)',
    stage2Name: 'Atopic Dermatitis / Eczema',
    stage2Meta: 'ICD-10: L20.9 · Barrier Repair & Anti-Inflammatory Primary Care Regimen',
    stage2BadgeText: '93% Conf.',
    matchedTaxId: 'ECZ',
    gradCamNote: 'Conv_1 JET saliency spans the ill-defined erythematous, dry, mildly lichenified scaly patch.',
    morphology:
      'Ill-defined erythematous-to-hyperpigmented xerotic patch on flexor forearm skin exhibiting accentuated transverse skin markings (mild lichenification) and fine dry white desquamative scale.',
    differentials:
      '1. Atopic Dermatitis / Chronic Eczema (93%) · 2. Allergic Contact Dermatitis · 3. Plaque Psoriasis.',
    action:
      'Initiate intensive fragrance-free ceramide/petrolatum barrier emollients, trigger avoidance, and short-course topical corticosteroid or calcineurin inhibitor; review in 2–4 weeks.',
  },

  tin: {
    key: 'tin',
    extendedGroup: 'infectious',
    cardTitle: 'Tinea Corporis',
    cardSub: 'Annular plaque with active raised scaly erythematous border & central clearing',
    lesionVariant: 'tin',
    intake: {
      site: 'Trunk',
      duration: '1–3 months',
      symptoms: ['Border Irregularity'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Targeted Primary Care Antifungal Care',
    bannerSub: 'Superficial dermatophyte ringworm pattern (94% Not Cancer).',
    bars: [
      { label: 'Not Cancer (Benign / Inflammatory / Infectious)', pct: 94, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 4, color: '#64748B' },
      { label: 'Melanoma (MEL)', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Infectious Skin Diseases — Not Cancer (Targeted Antimicrobial Care)',
    stage2Name: 'Tinea Corporis (Superficial Dermatophytosis)',
    stage2Meta: 'ICD-10: B35.4 · KOH Microscopy & Topical Terbinafine / Azole Therapy',
    stage2BadgeText: '94% Conf.',
    matchedTaxId: 'TIN',
    gradCamNote: 'Conv_1 JET heatmap tracks the active raised scaly erythematous annular border while sparing central clearing.',
    morphology:
      'Classic annular (ring-shaped) centrifugally expanding plaque on Fitzpatrick IV skin featuring an active, sharply marginated raised erythematous border with fine leading-edge scale and central clearing.',
    differentials:
      '1. Tinea Corporis / Dermatophytosis (94%) · 2. Nummular Eczema · 3. Pityriasis Rosea Herald Patch or Granuloma Annulare.',
    action:
      'Confirm with primary care KOH potassium hydroxide scraping if needed; prescribe topical allylamine (terbinafine) or azole cream for 2–4 weeks and avoid standalone topical steroids (tinea incognito risk).',
  },

  hz: {
    key: 'hz',
    extendedGroup: 'infectious',
    cardTitle: 'Herpes Zoster (Shingles)',
    cardSub: 'Grouped dermatomal vesicular clusters · Unilateral',
    lesionVariant: 'hz',
    intake: {
      site: 'Trunk',
      duration: '< 1 month (Acute onset)',
      symptoms: ['Asymmetry', 'Bleeding/Ulceration'],
    },
    bannerTone: 'emerald',
    bannerTitle: 'Non-Cancer Triage: Targeted Primary Care Antiviral Care',
    bannerSub: 'Unilateral viral vesicular eruption (94% Not Cancer); time-sensitive antiviral window.',
    bars: [
      { label: 'Not Cancer', pct: 94, color: '#059669' },
      { label: 'Non-Melanoma (BCC/SCC)', pct: 4, color: '#64748B' },
      { label: 'Melanoma', pct: 2, color: '#64748B' },
    ],
    stage2Category: 'Infectious Skin Diseases — Not Cancer (Targeted Antimicrobial Care)',
    stage2Name: 'Herpes Zoster (Shingles)',
    stage2Meta: 'ICD-10: B02.9 · Prompt Oral Antiviral (<72h) & Neuropathic Pain Care',
    stage2BadgeText: '94% Conf.',
    matchedTaxId: 'HZ',
    gradCamNote: 'Grad-CAM highlights grouped tense vesicular clusters ("dewdrop on a rose petal") following a unilateral dermatomal band.',
    morphology:
      'Coalescing clusters of umbilicated clear-to-cloudy vesicles on a vivid unilateral erythematous base strictly respecting the midline along a single thoracic dermatome.',
    differentials:
      '1. Herpes Zoster / VZV Reactivation (94%) · 2. Zosteriform Herpes Simplex · 3. Acute Vesicular Contact Dermatitis.',
    action:
      'Initiate oral valacyclovir/acyclovir promptly (ideally within 72 hours of rash onset), provide neuropathic pain control, cover active vesicles, and refer urgently to ophthalmology if V1 trigeminal/ocular involvement is suspected.',
  },
};

export const EXTENDED_DISEASE_KEYS = [
  'bcc',
  'scc',
  'melanoma',
  'ecz',
  'pso',
  'cd',
  'sd',
  'scab',
];

export const TAXONOMY_CATEGORIES = [
  {
    id: 'malignant',
    title: 'Category 1 — Early-Detectable Cutaneous Malignancies (Urgent Biopsy Referral — 3 Conditions)',
    pill: 'Urgent Biopsy Referral',
    theme: {
      cardBg: 'bg-[#FFFDFD]',
      border: 'border-[#FECACA]',
      leftAccent: 'border-l-[#DC2626]',
      iconWrap: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      pillBg: 'bg-[#DC2626] text-white',
      chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    },
    items: [
      { code: 'BCC', simKey: 'bcc', label: 'Basal Cell Carcinoma (BCC)' },
      { code: 'SCC', simKey: 'scc', label: 'Squamous Cell Carcinoma (SCC)' },
      { code: 'MEL', simKey: 'melanoma', label: 'Melanoma (MEL)' },
    ],
  },
  {
    id: 'inflammatory',
    title: 'Category 2 — Common Non-Malignant Skin Diseases (Not Cancer — 5 Conditions)',
    pill: 'Not Cancer · Primary Care',
    theme: {
      cardBg: 'bg-[#FCFFFE]',
      border: 'border-[#A7F3D0]',
      leftAccent: 'border-l-[#059669]',
      iconWrap: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      pillBg: 'bg-[#059669] text-white',
      chip: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    },
    items: [
      { code: 'ECZ', simKey: 'ecz', label: 'Atopic Dermatitis / Eczema' },
      { code: 'PSO', simKey: 'pso', label: 'Plaque Psoriasis' },
      { code: 'CD', simKey: 'cd', label: 'Contact Dermatitis' },
      { code: 'SD', simKey: 'sd', label: 'Seborrheic Dermatitis' },
      { code: 'SCAB', simKey: 'scab', label: 'Scabies (Sarcoptes scabiei Infestation)' },
    ],
  },
];
