import React, { useEffect, useMemo, useRef, useState } from 'react';
import DoctorAuthFlow from './components/DoctorAuthFlow';
import DoctorProfileSheet from './components/DoctorProfileSheet';
import ExtendedSimulationDrawer from './components/ExtendedSimulationDrawer';
import GuardrailSimulatorBar from './components/GuardrailSimulatorBar';
import InnovaLogo from './components/InnovaLogo';
import IPhone16Frame from './components/IPhone16Frame';
import LesionUploadDropzone from './components/LesionUploadDropzone';
import LlmReasoningTraceCard from './components/LlmReasoningTraceCard';
import LoadingScreen from './components/LoadingScreen';
import MelanomaTriageShowcase from './components/MelanomaTriageShowcase';
import TaxonomyModal from './components/TaxonomyModal';
import {
  ANATOMICAL_SITES,
  GUARDRAIL_REJECTIONS,
  LESION_DURATIONS,
  SCENARIOS,
  SYMPTOM_OPTIONS,
} from './data/clinicalData';
import {
  computeLaplacianVariance,
  renderGradCamHeatmap,
  renderLesionScene,
} from './utils/clinicalCanvas';
import {
  DEMO_DOCTOR_PROFILE,
  clearAccount,
  getInitials,
  hasActiveSession,
  loadAccount,
  saveAccount,
  setSession,
} from './utils/doctorAuth';

const STEPS = [
  { num: 1, label: '1. Scope' },
  { num: 2, label: '2. Intake' },
  { num: 3, label: '3. Triage' },
  { num: 4, label: '4. Analysis' },
  { num: 5, label: '5. Report' },
];

function createCaseId() {
  return `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function App() {
  const isDemoTaxonomy =
    typeof window !== 'undefined' && window.location.search.includes('demo=taxonomy');
  const isDemoExtended =
    typeof window !== 'undefined' && window.location.search.includes('drawer=extended');
  const initialShowcase =
    typeof window !== 'undefined' && window.location.search.includes('scene=melanoma');
  const bypassAuth =
    typeof window !== 'undefined' &&
    (isDemoTaxonomy ||
      isDemoExtended ||
      initialShowcase ||
      window.location.search.includes('record=1') ||
      window.location.search.includes('noauth=1'));
  const forceSignup =
    typeof window !== 'undefined' && window.location.search.includes('auth=signup');
  const skipBoot =
    typeof window !== 'undefined' &&
    (isDemoTaxonomy || isDemoExtended || initialShowcase || window.location.search.includes('noboot=1'));

  const [isBooting, setIsBooting] = useState(!skipBoot);
  const [doctorProfile, setDoctorProfile] = useState(() => {
    if (forceSignup) return null;
    if (bypassAuth) return loadAccount() || DEMO_DOCTOR_PROFILE;
    return hasActiveSession() ? loadAccount() : null;
  });
  const [authInitialMode, setAuthInitialMode] = useState(() =>
    !forceSignup && loadAccount() ? 'signin' : 'signup'
  );
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [useIphoneFrame, setUseIphoneFrame] = useState(true);
  const [isShowcaseMode, setIsShowcaseMode] = useState(initialShowcase);
  const [currentStep, setCurrentStep] = useState(isDemoTaxonomy || isDemoExtended ? 3 : 1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(
    isDemoTaxonomy || isDemoExtended ? 5 : 1
  );
  const [scopeAcknowledged, setScopeAcknowledged] = useState(
    isDemoTaxonomy || isDemoExtended
  );

  // Step 2 Gatekeeper & Intake State
  const [gateStatus, setGateStatus] = useState('valid');
  const [laplacianScore, setLaplacianScore] = useState(152);
  const [customImage, setCustomImage] = useState(null);
  const [uploadMeta, setUploadMeta] = useState(null);
  const [anatomicalSite, setAnatomicalSite] = useState('Cheek / Sun-Exposed Face');
  const [duration, setDuration] = useState('6 Months');
  const [symptoms, setSymptoms] = useState([
    'Pearly Rolled Border',
    'Slow Progressive Growth',
    'Pigmented Margin',
  ]);

  // Active Clinical Scenario + Grad-CAM + Drawers
  const [scenarioKey, setScenarioKey] = useState('bcc');
  const [camViewMode, setCamViewMode] = useState('overlay'); // 'original' | 'overlay' | 'split'
  const [heatmapOpacity, setHeatmapOpacity] = useState(45);
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(() =>
    typeof window !== 'undefined' && window.location.search.includes('taxonomy=open')
  );
  const [isExtendedDrawerOpen, setIsExtendedDrawerOpen] = useState(isDemoExtended);

  // Streaming LLM Readout State in Step 4
  const [streamedMorph, setStreamedMorph] = useState('');
  const [streamedAction, setStreamedAction] = useState('');
  const [isStreamingLlm, setIsStreamingLlm] = useState(false);

  // Step 5 Report & Toast State
  const [caseId, setCaseId] = useState(createCaseId);
  const [reportOrigUrl, setReportOrigUrl] = useState('');
  const [reportCamUrl, setReportCamUrl] = useState('');
  const [showPdfToast, setShowPdfToast] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const viewfinderCanvasRef = useRef(null);
  const gradBaseCanvasRef = useRef(null);
  const gradHeatCanvasRef = useRef(null);
  const sbsOrigCanvasRef = useRef(null);
  const sbsCamCanvasRef = useRef(null);
  const masterLesionRef = useRef(null);
  const masterHeatRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const scenario = SCENARIOS[scenarioKey] || SCENARIOS.malignancy;
  const isGateValid = gateStatus === 'valid' || gateStatus === 'custom-valid';

  const navigateStep = (stepNum) => {
    if (stepNum < 1 || stepNum > 5) return;
    if (stepNum > 1 && !scopeAcknowledged) return;
    setCurrentStep(stepNum);
    setMaxUnlockedStep((prev) => Math.max(prev, stepNum));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // Keyboard shortcuts: 'T' = Taxonomy Drawer, 'S' = Extended Simulation Drawer
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        setIsExtendedDrawerOpen(false);
        setIsTaxonomyOpen((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setIsTaxonomyOpen(false);
        setIsExtendedDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!isDemoTaxonomy) return undefined;
    const timer = setTimeout(() => setIsTaxonomyOpen(true), 450);
    return () => clearTimeout(timer);
  }, [isDemoTaxonomy]);

  // Select any of the 10 Extended Diseases (or baseline scenarios) and wire full 5-step pipeline
  const applyDiseaseSimulation = (key, jumpToStep = 3) => {
    const target = SCENARIOS[key];
    if (!target) return;
    setIsShowcaseMode(false);
    setScopeAcknowledged(true);
    setCustomImage(null);
    setUploadMeta(null);
    setGateStatus('valid');
    setLaplacianScore(152);
    setScenarioKey(key);
    if (target.intake) {
      setAnatomicalSite(target.intake.site);
      setDuration(target.intake.duration);
      setSymptoms(target.intake.symptoms);
    }
    setCaseId(createCaseId());
    setMaxUnlockedStep(5);
    if (jumpToStep) {
      setCurrentStep(jumpToStep);
    }
  };

  // Trigger Dual-Gatekeeper Rejection ('non-skin' | 'full-face' | 'blurry')
  const handleTriggerRejection = (rejMode) => {
    setIsShowcaseMode(false);
    setScopeAcknowledged(true);
    setCustomImage(null);
    setUploadMeta(null);
    setGateStatus(rejMode);
    const meta = GUARDRAIL_REJECTIONS[rejMode];
    if (meta) setLaplacianScore(meta.laplacian);
    if (currentStep === 1 || currentStep > 3) {
      setCurrentStep(2);
      setMaxUnlockedStep((prev) => Math.max(prev, 2));
    }
  };

  // Trigger <65% Low-Confidence Abstention Safeguard (52% Max Confidence)
  const handleTriggerAbstention = () => {
    applyDiseaseSimulation('inconclusive', 3);
  };

  // Restore valid capture after testing a rejection
  const handleRestoreValidLesion = () => {
    setCustomImage(null);
    setUploadMeta(null);
    setGateStatus('valid');
    setLaplacianScore(152);
    if (scenarioKey === 'inconclusive') {
      setScenarioKey('bcc');
    }
  };

  const toggleSymptom = (sym) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const processImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const score = Math.max(25, computeLaplacianVariance(img));
        setCustomImage(img);
        setUploadMeta({
          filename: file.name || 'captured_lesion.jpg',
          resolution: `${img.naturalWidth} × ${img.naturalHeight} px`,
          previewUrl: dataUrl,
        });
        setLaplacianScore(score);
        setGateStatus(score < 100 ? 'custom-blurry' : 'custom-valid');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateUploadChip = (chipStatus, score) => {
    setCustomImage(null);
    setUploadMeta(null);
    setGateStatus(chipStatus);
    setLaplacianScore(score);
  };

  // Render Step 2 Viewfinder Canvas (shows rejection scene OR active disease lesion OR uploaded photo)
  useEffect(() => {
    const canvas = viewfinderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chipMap = {
      'upload-non-skin': 'non-skin',
      'upload-full-face': 'full-face',
      'upload-blurry': 'blurry',
    };
    const vfVariant = isGateValid
      ? customImage
        ? 'custom-valid'
        : scenario.lesionVariant || 'valid'
      : chipMap[gateStatus] || gateStatus;
    renderLesionScene(ctx, canvas.width, canvas.height, vfVariant, customImage);
  }, [gateStatus, customImage, scenario.lesionVariant, isGateValid, currentStep]);

  // 1. Synthesize / Draw Master Clinical Image & Compute Real-Time Pixel-Contrast JET Grad-CAM
  useEffect(() => {
    if (!masterLesionRef.current) {
      const ml = document.createElement('canvas');
      ml.width = 480;
      ml.height = 360;
      masterLesionRef.current = ml;
    }
    if (!masterHeatRef.current) {
      const mh = document.createElement('canvas');
      mh.width = 480;
      mh.height = 360;
      masterHeatRef.current = mh;
    }

    const masterLesion = masterLesionRef.current;
    const mCtx = masterLesion.getContext('2d');
    const lesionVariant = customImage ? 'custom-valid' : scenario.lesionVariant || 'bcc';
    renderLesionScene(mCtx, 480, 360, lesionVariant, customImage);

    const masterHeat = masterHeatRef.current;
    const hCtx = masterHeat.getContext('2d');
    renderGradCamHeatmap(hCtx, 480, 360, scenarioKey, masterLesion);

    setReportOrigUrl(masterLesion.toDataURL('image/png'));
  }, [scenarioKey, scenario.lesionVariant, customImage]);

  // 2. Sync Interactive Clinician Canvas Views & Export Composited PNG to Step 5 Referral PDF
  useEffect(() => {
    const masterLesion = masterLesionRef.current;
    const masterHeat = masterHeatRef.current;
    if (!masterLesion || !masterHeat) return;

    if (gradBaseCanvasRef.current && gradHeatCanvasRef.current) {
      const bCtx = gradBaseCanvasRef.current.getContext('2d');
      bCtx.clearRect(0, 0, 480, 360);
      bCtx.drawImage(masterLesion, 0, 0);

      const ghCtx = gradHeatCanvasRef.current.getContext('2d');
      ghCtx.clearRect(0, 0, 480, 360);
      ghCtx.drawImage(masterHeat, 0, 0);
    }

    if (sbsOrigCanvasRef.current && sbsCamCanvasRef.current) {
      const sx = (480 - 360) / 2;
      const oCtx = sbsOrigCanvasRef.current.getContext('2d');
      oCtx.clearRect(0, 0, 320, 320);
      oCtx.drawImage(masterLesion, sx, 0, 360, 360, 0, 0, 320, 320);

      const cCtx = sbsCamCanvasRef.current.getContext('2d');
      cCtx.clearRect(0, 0, 320, 320);
      cCtx.drawImage(masterLesion, sx, 0, 360, 360, 0, 0, 320, 320);
      cCtx.save();
      cCtx.globalAlpha = heatmapOpacity / 100;
      cCtx.drawImage(masterHeat, sx, 0, 360, 360, 0, 0, 320, 320);
      cCtx.restore();
    }

    const comp = document.createElement('canvas');
    comp.width = 480;
    comp.height = 360;
    const compCtx = comp.getContext('2d');
    compCtx.drawImage(masterLesion, 0, 0);
    compCtx.save();
    compCtx.globalAlpha = heatmapOpacity / 100;
    compCtx.drawImage(masterHeat, 0, 0);
    compCtx.restore();
    setReportCamUrl(comp.toDataURL('image/png'));
  }, [scenarioKey, scenario.lesionVariant, customImage, heatmapOpacity, camViewMode, currentStep]);

  // Condition-Specific 60fps LLM Clinical Summary Streaming when Step 4 opens or scenario changes
  useEffect(() => {
    const fullMorph = `[${anatomicalSite} · Duration: ${duration}] ${scenario.morphology}`;
    const fullAction = scenario.action;

    if (currentStep !== 4) {
      setStreamedMorph(fullMorph);
      setStreamedAction(fullAction);
      setIsStreamingLlm(false);
      return undefined;
    }

    let rafId = null;
    const start = performance.now();
    setIsStreamingLlm(true);
    setStreamedMorph('');
    setStreamedAction('');

    const tick = (now) => {
      const elapsed = now - start;
      const mChars = Math.min(fullMorph.length, Math.floor(elapsed / 5));
      setStreamedMorph(fullMorph.slice(0, mChars));

      const actStart = fullMorph.length * 5 + 80;
      if (elapsed > actStart) {
        const aChars = Math.min(fullAction.length, Math.floor((elapsed - actStart) / 5));
        setStreamedAction(fullAction.slice(0, aChars));
        if (aChars >= fullAction.length) {
          setIsStreamingLlm(false);
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentStep, scenarioKey, anatomicalSite, duration, scenario.morphology, scenario.action]);

  const abcdeChecklist = useMemo(() => {
    const has = (s) => symptoms.includes(s);
    const isCancer = scenario.bannerTone === 'coral';
    return [
      {
        letter: 'A',
        flagged: has('Asymmetry') || isCancer,
        text: has('Asymmetry')
          ? 'Asymmetry: Positive — non-uniform lesion architecture across principal axes.'
          : 'Architecture: Well-circumscribed pigmented papule/nodule requiring dermoscopy.',
      },
      {
        letter: 'B',
        flagged: has('Border Irregularity') || has('Pearly Rolled Border') || isCancer,
        text: has('Pearly Rolled Border')
          ? 'Border: Translucent pearly rolled peripheral border localized by Conv_1 Grad-CAM.'
          : has('Border Irregularity')
          ? 'Border: Irregular / scalloped or indurated margin aligned with Conv_1 saliency.'
          : 'Border: Smooth, regular perimeter without invasive notching.',
      },
      {
        letter: 'C',
        flagged: has('Color Variegation') || has('Pigmented Margin') || isCancer,
        text: has('Pigmented Margin')
          ? 'Color / Pigmented Margin: Hyperpigmented peripheral rim & blue-gray ovoid nests on Fitzpatrick IV skin.'
          : has('Color Variegation')
          ? 'Color: Multi-tonal pigment / violaceous / erythematous heterogeneity.'
          : 'Color: Uniform chromatic distribution without suspicious variegation.',
      },
      {
        letter: 'D',
        flagged: has('Bleeding/Ulceration'),
        text: has('Bleeding/Ulceration')
          ? 'Dermoscopic / Surface Erosion: Crusting, ulceration, or vesicular disruption noted.'
          : 'Dermoscopic / Surface: Arborizing telangiectasias; monitor for central micro-ulceration.',
      },
      {
        letter: 'E',
        flagged:
          has('Rapid Growth') ||
          has('Slow Progressive Growth') ||
          duration.includes('Progressive') ||
          duration.includes('6 Months'),
        text: `Evolution (${duration}): ${
          has('Slow Progressive Growth')
            ? `Slow progressive growth at ${anatomicalSite} characteristic of Pigmented BCC.`
            : has('Rapid Growth')
            ? 'Rapid growth history elevates urgent clinical biopsy priority.'
            : `Correlate progression at ${anatomicalSite} site.`
        }`,
      },
    ];
  }, [symptoms, scenario.bannerTone, duration, anatomicalSite]);

  const formattedTimestamp = useMemo(
    () =>
      new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [currentStep, caseId]
  );

  const handlePrintExport = () => {
    setShowPdfToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowPdfToast(false), 4000);
    if (typeof window !== 'undefined' && !window.location.search.includes('record=1')) {
      setTimeout(() => {
        window.print();
      }, 180);
    }
  };

  const handleScreenAnother = () => {
    setCaseId(createCaseId());
    setCustomImage(null);
    setUploadMeta(null);
    setScenarioKey('bcc');
    setAnatomicalSite('Cheek / Sun-Exposed Face');
    setDuration('6 Months');
    setSymptoms(['Pearly Rolled Border', 'Slow Progressive Growth', 'Pigmented Margin']);
    setHeatmapOpacity(45);
    setGateStatus('valid');
    setLaplacianScore(152);
    setMaxUnlockedStep(2);
    setCurrentStep(2);
  };

  const handleUpdateDoctorProfile = (updated) => {
    saveAccount(updated);
    setDoctorProfile(updated);
  };

  const handleDoctorSignOut = () => {
    setSession(false);
    setIsProfileSheetOpen(false);
    setAuthInitialMode('signin');
    setDoctorProfile(null);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const handleResetDoctorAccount = () => {
    clearAccount();
    setIsProfileSheetOpen(false);
    setAuthInitialMode('signup');
    setDoctorProfile(null);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const screenOverlays = (
    <>
      <LoadingScreen isVisible={isBooting} onComplete={() => setIsBooting(false)} />

      <DoctorProfileSheet
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
        profile={doctorProfile}
        onUpdateProfile={handleUpdateDoctorProfile}
        onSignOut={handleDoctorSignOut}
        onResetAccount={handleResetDoctorAccount}
      />

      <ExtendedSimulationDrawer
        isOpen={isExtendedDrawerOpen}
        onClose={() => setIsExtendedDrawerOpen(false)}
        activeScenarioKey={scenarioKey}
        activeGateStatus={gateStatus}
        onSelectDisease={(key) => applyDiseaseSimulation(key, 3)}
        onSelectRejection={(rej) => handleTriggerRejection(rej)}
        onSelectAbstention={handleTriggerAbstention}
      />

      <TaxonomyModal
        isOpen={isTaxonomyOpen}
        onClose={() => setIsTaxonomyOpen(false)}
        matchedTaxId={scenario.matchedTaxId}
        onSelectCondition={(key) => applyDiseaseSimulation(key, 3)}
      />

      <div
        role="status"
        aria-live="polite"
        className={`no-print pointer-events-none absolute bottom-7 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-emeraldOk px-4 py-2.5 text-[12.5px] font-bold whitespace-nowrap text-white shadow-xl transition-all duration-200 ${
          showPdfToast ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        <span>✓</span>
        <span>Referral_Report_InnovaTech.pdf Ready</span>
      </div>
    </>
  );

  // If no verified clinician is signed in, show the 4-step Doctor Onboarding & PRC Verification Portal
  if (!doctorProfile) {
    return (
      <IPhone16Frame
        enabled={useIphoneFrame}
        isCameraActive={false}
        scrollContainerRef={scrollContainerRef}
        overlays={<LoadingScreen isVisible={isBooting} onComplete={() => setIsBooting(false)} />}
      >
        <DoctorAuthFlow
          initialMode={authInitialMode}
          onAuthenticated={(profile) => {
            setDoctorProfile(profile);
            setCurrentStep(1);
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
          }}
        />
      </IPhone16Frame>
    );
  }

  return (
    <IPhone16Frame
      enabled={useIphoneFrame}
      isCameraActive={currentStep === 2 && !isShowcaseMode}
      scrollContainerRef={scrollContainerRef}
      overlays={screenOverlays}
    >
      {/* ====================================================================
          Persistent Sticky Mobile Top Bar & 5-Step Progress Indicator
          ==================================================================== */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-canvas/95 px-3.5 pt-2 pb-2.5 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsShowcaseMode(false);
                navigateStep(1);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
                <InnovaLogo variant="emblem" className="h-11 w-11 object-cover object-[center_34%]" />
              </span>
              <span className="flex flex-col">
                <span className="text-[15.5px] font-extrabold leading-none tracking-tight text-slateDeep">
                  InnovaTech
                </span>
                <span className="mt-0.5 text-[10.2px] font-semibold text-slate-500">
                  Clinical Skin Triage
                </span>
              </span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsTaxonomyOpen(false);
                  setIsExtendedDrawerOpen(true);
                }}
                title="Open Case Simulator (8 Core Conditions · Shortcut: S)"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-medicalTeal px-2.5 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-medicalTealDark"
              >
                <span>Cases (8)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExtendedDrawerOpen(false);
                  setIsTaxonomyOpen(true);
                }}
                title="Open Supported Major Skin Disease Taxonomy (Shortcut: T)"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-medicalTeal/35 bg-white px-2.5 text-[11px] font-bold text-medicalTeal transition hover:bg-medicalTeal/10"
              >
                <span>Taxonomy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExtendedDrawerOpen(false);
                  setIsTaxonomyOpen(false);
                  setIsProfileSheetOpen(true);
                }}
                title={`${doctorProfile.displayName} · PRC #${doctorProfile.prcLicense} (Verified)`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-slateDeep px-2.5 py-1 text-[10.8px] font-bold text-white transition hover:bg-slate-800"
              >
                {doctorProfile.photo ? (
                  <img
                    src={doctorProfile.photo}
                    alt={doctorProfile.displayName}
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-400"
                  />
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emeraldOk text-[9.5px] font-extrabold text-white">
                    {getInitials(doctorProfile)}
                  </span>
                )}
                <span className="max-w-[64px] truncate">
                  {doctorProfile.title} {doctorProfile.lastName}
                </span>
              </button>
            </div>
          </div>

          {/* 5-Step Progress Indicator */}
          {!isShowcaseMode && (
            <nav
              aria-label="5-Step Clinical Triage Progress"
              className="flex items-center justify-between gap-0.5 rounded-xl border border-slate-200 bg-white/85 p-1"
            >
              {STEPS.map((st, idx) => {
                const isActive = currentStep === st.num;
                const isDone = !isActive && st.num <= maxUnlockedStep;
                const isDisabled = st.num > maxUnlockedStep;
                return (
                  <React.Fragment key={st.num}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => navigateStep(st.num)}
                      className={`min-h-[44px] flex-1 rounded-lg px-1 text-[10.8px] font-semibold whitespace-nowrap transition ${
                        isActive
                          ? 'bg-medicalTeal font-bold text-white shadow-sm'
                          : isDone
                          ? 'bg-emerald-50 text-emeraldOk'
                          : 'text-slate-500 disabled:cursor-not-allowed disabled:opacity-50'
                      }`}
                    >
                      {st.label}
                    </button>
                    {idx < STEPS.length - 1 && (
                      <span className="select-none text-[10px] text-slate-400" aria-hidden="true">
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}
        </header>

        {/* Static 2D Screen-Recording Melanoma Showcase OR 5-Step Pipeline */}
        {isShowcaseMode ? (
          <MelanomaTriageShowcase
            onOpenTaxonomy={() => {
              setScenarioKey('melanoma');
              setIsTaxonomyOpen(true);
            }}
            onExitShowcase={() => setIsShowcaseMode(false)}
          />
        ) : (
          <main className="flex flex-1 flex-col px-4 pt-4 pb-7">
            {/* ================================================================
                STEP 1 — Splash & Clinical Scope Guardrail
                ================================================================ */}
            {currentStep === 1 && (
              <section className="flex flex-col gap-3.5">
                <div className="glass-card px-4 py-5 text-center">
                  <div className="mx-auto mb-3 flex h-[150px] w-[150px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-2 shadow-sm">
                    <InnovaLogo variant="full" className="h-full w-full object-contain" />
                  </div>

                  <h1 className="text-[20.5px] font-extrabold leading-snug tracking-tight text-slateDeep">
                    Explainable Multimodal Skin Disease Triage
                  </h1>
                  <p className="mt-1 mb-3 text-[13.2px] font-semibold text-medicalTeal">
                    MobileNet CNN + Grad-CAM + LLM Clinical Assistant
                  </p>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11.2px] font-semibold text-slate-700">
                      OpenCV + LLM Gatekeeper
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11.2px] font-semibold text-slate-700">
                      8 Core Conditions
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11.2px] font-semibold text-slate-700">
                      Grad-CAM Conv_1 XAI
                    </span>
                  </div>
                </div>

                {/* Verified Attending Physician Strip */}
                <button
                  type="button"
                  onClick={() => setIsProfileSheetOpen(true)}
                  className="flex min-h-[54px] w-full items-center justify-between gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/75 px-3.5 py-2.5 text-left transition hover:bg-emerald-50"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300 bg-white text-[12px] font-extrabold text-emeraldOk">
                      {doctorProfile.photo ? (
                        <img
                          src={doctorProfile.photo}
                          alt={doctorProfile.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(doctorProfile)
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[12.6px] font-extrabold text-slateDeep">
                        {doctorProfile.displayName} · {doctorProfile.specialty}
                      </div>
                      <div className="truncate font-mono text-[10.8px] font-bold text-emeraldOk">
                        ✓ PRC #{doctorProfile.prcLicense} Verified · {doctorProfile.facilityName}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[10.5px] font-extrabold text-emeraldOk">
                    Profile
                  </span>
                </button>

                {/* Quick Launch to 8-Condition Case Simulator Drawer */}
                <button
                  type="button"
                  onClick={() => setIsExtendedDrawerOpen(true)}
                  className="flex min-h-[50px] w-full items-center justify-between gap-2 rounded-2xl border-[1.5px] border-medicalTeal/40 bg-white px-4 py-2.5 text-left shadow-sm transition hover:border-medicalTeal hover:bg-teal-50/40"
                >
                  <div>
                    <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                      Philippine Clinical Scope · 2 Categories
                    </span>
                    <span className="text-[13.2px] font-extrabold text-slateDeep">
                      Clinical Case Simulator (8 Core Conditions)
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-medicalTeal px-2.5 py-1 text-[11px] font-extrabold text-white">
                    8 Cases →
                  </span>
                </button>

                <div className="glass-card border-l-4 border-l-medicalTeal p-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medicalTeal/10 text-medicalTeal">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <div>
                      <h2 className="text-[15.5px] font-extrabold leading-tight text-slateDeep">
                        Clinical Scope &amp; Safety Boundary
                      </h2>
                      <p className="text-xs text-slate-500">Mandatory Primary Care GP Attestation</p>
                    </div>
                  </div>

                  <label
                    htmlFor="scope-ack-checkbox"
                    className={`flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-3 transition ${
                      scopeAcknowledged
                        ? 'border-medicalTeal bg-medicalTeal/5'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      id="scope-ack-checkbox"
                      type="checkbox"
                      checked={scopeAcknowledged}
                      onChange={(e) => setScopeAcknowledged(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-medicalTeal"
                    />
                    <span className="text-[12.8px] font-semibold leading-snug text-slateDeep">
                      I acknowledge that InnovaTech is a preliminary visual triage aid for primary care and does not formulate autonomous diagnoses or replace histopathological biopsy.
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!scopeAcknowledged}
                  onClick={() => navigateStep(2)}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-medicalTeal px-4 text-[15px] font-bold text-white shadow-md shadow-medicalTeal/30 transition hover:bg-medicalTealDark disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                >
                  <span>Start Mobile Screening</span>
                  <span>→</span>
                </button>
              </section>
            )}

            {/* ================================================================
                STEP 2 — Lesion Acquisition, Clinical Intake & Guardrail Bar
                ================================================================ */}
            {currentStep === 2 && (
              <section className="flex flex-col gap-3.5">
                {/* Persistent Guardrail & Rejection Simulator Bar (Top of Step 2) */}
                <GuardrailSimulatorBar
                  activeGateStatus={gateStatus}
                  activeScenarioKey={scenarioKey}
                  onTriggerRejection={handleTriggerRejection}
                  onTriggerAbstention={handleTriggerAbstention}
                  onRestoreValid={handleRestoreValidLesion}
                  onOpenExtendedDrawer={() => setIsExtendedDrawerOpen(true)}
                />

                <div className="glass-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                        Dual Gatekeeper Acquisition
                      </span>
                      <h2 className="text-[16px] font-extrabold text-slateDeep">
                        Rear-Camera Lesion Capture
                      </h2>
                    </div>
                    {isGateValid && (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10.8px] font-bold text-slate-700">
                        {scenario.cardTitle || scenario.stage2Name}
                      </span>
                    )}
                  </div>

                  {/* Viewfinder Frame */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                    <canvas
                      ref={viewfinderCanvasRef}
                      width={480}
                      height={360}
                      className="block h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md border border-white/15 bg-slate-900/75 px-2 py-1 font-mono text-[10.5px] font-semibold text-slate-100 backdrop-blur-sm">
                          REAR MACRO 1.8x
                        </span>
                        <span className="rounded-md border border-white/15 bg-slate-900/75 px-2 py-1 font-mono text-[10.5px] font-semibold text-slate-100 backdrop-blur-sm">
                          {gateStatus === 'non-skin' || gateStatus === 'upload-non-skin'
                            ? 'SKIN ROI: 0%'
                            : gateStatus === 'full-face' || gateStatus === 'upload-full-face'
                            ? 'FACE DETECTED'
                            : `LAPLACIAN: ${laplacianScore}`}
                        </span>
                      </div>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                          className={`relative h-[146px] w-[146px] rounded-full shadow-[0_0_0_999px_rgba(15,23,42,0.32)] transition ${
                            isGateValid
                              ? 'border-[2.5px] border-emerald-400'
                              : 'border-[2.5px] border-red-400'
                          }`}
                        >
                          <span className="absolute top-1/2 left-1/2 h-[1.5px] w-3.5 -translate-x-1/2 -translate-y-1/2 bg-white/60" />
                          <span className="absolute top-1/2 left-1/2 h-3.5 w-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-white/60" />
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-200">
                          {isGateValid
                            ? 'Localized Cutaneous Lesion Aligned'
                            : 'Inference Blocked — Recapture Close-Up Lesion'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feature 1: Interactive Lesion Upload Dropzone & Dual-Gatekeeper Validation */}
                  <LesionUploadDropzone
                    gateStatus={gateStatus}
                    laplacianScore={laplacianScore}
                    uploadMeta={uploadMeta}
                    activeLesionVariant={scenario.lesionVariant}
                    activeScenarioLabel={scenario.cardTitle || scenario.stage2Name}
                    onProcessImageFile={processImageFile}
                    onSimulateUploadChip={handleSimulateUploadChip}
                    onRestoreValidSample={handleRestoreValidLesion}
                  />
                </div>

                {/* Clinical Intake Form */}
                <div className="glass-card p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                    Structured Patient Metadata
                  </span>
                  <h3 className="mt-0.5 mb-3 text-[16px] font-extrabold text-slateDeep">
                    Clinical Intake Context
                  </h3>

                  {/* Anatomical Site */}
                  <div className="mb-3.5">
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slateDeep">
                      Anatomical Site
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ANATOMICAL_SITES.map((site) => {
                        const active = anatomicalSite === site;
                        return (
                          <button
                            key={site}
                            type="button"
                            onClick={() => setAnatomicalSite(site)}
                            className={`min-h-[44px] rounded-full border px-3.5 py-2 text-[12.2px] font-semibold transition ${
                              active
                                ? 'border-medicalTeal bg-medicalTeal font-bold text-white shadow-sm'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-medicalTeal'
                            }`}
                          >
                            {site}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lesion Duration */}
                  <div className="mb-3.5">
                    <label
                      htmlFor="lesion-duration-select"
                      className="mb-1.5 block text-[12.5px] font-bold text-slateDeep"
                    >
                      Lesion Duration
                    </label>
                    <select
                      id="lesion-duration-select"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[13.2px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                    >
                      {LESION_DURATIONS.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Multi-select Symptoms */}
                  <div>
                    <span className="mb-1.5 block text-[12.5px] font-bold text-slateDeep">
                      Presenting Clinical Features &amp; Symptoms
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SYMPTOM_OPTIONS.map((sym) => {
                        const active = symptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => toggleSymptom(sym)}
                            className={`min-h-[44px] rounded-full border px-3.5 py-2 text-[12.2px] font-semibold transition ${
                              active
                                ? 'border-slateDeep bg-slateDeep font-bold text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-slateDeep'
                            }`}
                          >
                            {sym}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-2.5 z-20 rounded-2xl border border-slate-200 bg-canvas/95 p-2 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    disabled={!isGateValid}
                    onClick={() => navigateStep(3)}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-medicalTeal px-4 text-[14.8px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                  >
                    <span>Run Triage</span>
                    <span>→</span>
                  </button>
                </div>
              </section>
            )}

            {/* ================================================================
                STEP 3 — Stage 1 Primary Cancer Triage + Persistent Guardrail Bar
                ================================================================ */}
            {currentStep === 3 && (
              <section className="flex flex-col gap-3.5">
                {/* Persistent Guardrail & Rejection Simulator Bar (Top of Step 3) */}
                <GuardrailSimulatorBar
                  activeGateStatus={gateStatus}
                  activeScenarioKey={scenarioKey}
                  onTriggerRejection={handleTriggerRejection}
                  onTriggerAbstention={handleTriggerAbstention}
                  onRestoreValid={handleRestoreValidLesion}
                  onOpenExtendedDrawer={() => setIsExtendedDrawerOpen(true)}
                />

                <div
                  className={`glass-card p-4 transition-opacity ${
                    !isGateValid ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                        Stage 1 — Primary Risk Stratification
                      </span>
                      <h2 className="mt-0.5 text-[16.5px] font-extrabold text-slateDeep">
                        Cancer Types vs. Not Cancer
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsExtendedDrawerOpen(true)}
                      className="shrink-0 rounded-xl border border-medicalTeal/40 bg-medicalTeal/10 px-2.5 py-1.5 text-[11px] font-extrabold text-medicalTeal transition hover:bg-medicalTeal hover:text-white"
                    >
                      Simulate 8 Cases
                    </button>
                  </div>

                  {/* Active Profile Indicator */}
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11.8px]">
                    <span className="font-semibold text-slate-600">Active Profile:</span>
                    <span className="font-extrabold text-slateDeep">
                      {scenario.cardTitle || scenario.stage2Name}
                    </span>
                  </div>

                  {/* High-Visibility Triage Banner */}
                  <div
                    role="status"
                    className={`mb-4 rounded-2xl border-[1.5px] p-3.5 ${
                      scenario.bannerTone === 'coral'
                        ? 'border-coralAlert bg-red-50 text-red-900'
                        : scenario.bannerTone === 'emerald'
                        ? 'border-emeraldOk bg-emerald-50 text-emerald-900'
                        : 'border-amberWarn bg-amber-50 text-amber-900'
                    }`}
                  >
                    <p className="text-[13.8px] font-extrabold leading-snug">
                      {scenario.bannerTitle}
                    </p>
                    <p className="mt-1 text-[11.8px] font-medium opacity-90">
                      {scenario.bannerSub}
                    </p>
                  </div>

                  {/* Dynamic Three Horizontal Stage 1 Probability Bars */}
                  <div className="space-y-3.5">
                    {scenario.bars.map((bar) => (
                      <div key={bar.label}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="text-[12.6px] font-bold text-slateDeep">
                            {bar.label}
                          </span>
                          <span
                            className="font-mono text-[14.5px] font-extrabold"
                            style={{ color: bar.color }}
                          >
                            {bar.pct}%
                          </span>
                        </div>
                        <div className="relative h-3.5 rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${bar.pct}%`,
                              backgroundColor: bar.color,
                            }}
                          />
                          <span
                            className="pointer-events-none absolute -top-1 -bottom-1 left-[65%] w-0.5 bg-slateDeep/45"
                            title="65% Decision Threshold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-slate-200 pt-2.5 text-[11.2px] font-semibold text-slate-500">
                    <span>
                      Vertical marker: <strong>65% Confidence Gate</strong>
                    </span>
                    <span>Site: {anatomicalSite}</span>
                  </div>

                  {/* Open Case Simulator Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setIsExtendedDrawerOpen(true)}
                    className="mt-3 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border-[1.5px] border-medicalTeal/40 bg-white px-3.5 py-2 text-left text-[12.4px] font-extrabold text-slateDeep transition hover:border-medicalTeal hover:bg-teal-50/30"
                  >
                    <span>Clinical Case Simulator (2 Categories · 8 Conditions)</span>
                    <span className="shrink-0 rounded-full bg-medicalTeal px-2.5 py-0.5 text-[10.8px] font-extrabold text-white">
                      8 Core + 4
                    </span>
                  </button>
                </div>

                <div className="sticky bottom-2.5 z-20 flex gap-2 rounded-2xl border border-slate-200 bg-canvas/95 p-2 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => navigateStep(2)}
                    className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-slateDeep px-4 text-[13.5px] font-bold text-white"
                  >
                    ← Intake
                  </button>
                  <button
                    type="button"
                    disabled={!isGateValid}
                    onClick={() => navigateStep(4)}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-medicalTeal px-4 text-[14.2px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>Stage 2 &amp; Explainability</span>
                    <span>→</span>
                  </button>
                </div>
              </section>
            )}

            {/* ================================================================
                STEP 4 — Stage 2 Specific Condition, Grad-CAM & Streaming LLM
                ================================================================ */}
            {currentStep === 4 && (
              <section className="flex flex-col gap-3.5">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                      Stage 2 — Specific Disease Identification
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExtendedDrawerOpen(true)}
                      className="rounded-full bg-medicalTeal/10 px-2.5 py-1 text-[10.8px] font-extrabold text-medicalTeal hover:bg-medicalTeal hover:text-white"
                    >
                      Switch Case (8)
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div>
                      <span className="block text-[11.2px] font-semibold text-slate-500">
                        {scenario.stage2Category}
                      </span>
                      <div className="my-0.5 text-[16px] font-extrabold leading-tight text-slateDeep">
                        {scenario.stage2Name}
                      </div>
                      <span className="block text-[11.2px] font-semibold text-slate-500">
                        {scenario.stage2Meta}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg border px-2.5 py-1.5 font-mono text-[12px] font-extrabold ${
                        scenario.bannerTone === 'coral'
                          ? 'border-red-200 bg-red-50 text-coralAlert'
                          : scenario.bannerTone === 'emerald'
                          ? 'border-emerald-200 bg-emerald-50 text-emeraldOk'
                          : 'border-amber-200 bg-amber-50 text-amberWarn'
                      }`}
                    >
                      {scenario.stage2BadgeText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTaxonomyOpen(true)}
                    className="mt-3 flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border-[1.5px] border-slate-300 bg-white px-3.5 py-2 text-left text-[12.4px] font-extrabold text-slateDeep transition hover:border-medicalTeal"
                  >
                    <span>InnovaTech Supported Major Skin Disease Taxonomy</span>
                    <span className="shrink-0 rounded-full border border-medicalTeal/30 bg-medicalTeal/10 px-2.5 py-0.5 text-[10.8px] font-extrabold text-medicalTeal">
                      8 Core
                    </span>
                  </button>
                </div>

                {/* Interactive Grad-CAM Explainability Card */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                      Real-Time HTML5 Canvas Grad-CAM Engine
                    </span>
                    <span className="rounded-md border border-medicalTeal/30 bg-medicalTeal/10 px-2 py-0.5 font-mono text-[10.5px] font-bold text-medicalTeal">
                      {customImage ? 'Live Upload Analysis' : 'Fitzpatrick III–V Macro'}
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-[16px] font-extrabold text-slateDeep">
                    Interactive Grad-CAM Explainability
                  </h3>
                  <p className="mt-0.5 text-[11.8px] font-medium text-slate-600">
                    {scenario.gradCamNote}
                  </p>

                  {/* 3-Mode Clinician View Toggle */}
                  <div
                    role="tablist"
                    aria-label="Grad-CAM Clinician View Mode"
                    className="my-2.5 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={camViewMode === 'original'}
                      onClick={() => setCamViewMode('original')}
                      className={`min-h-[44px] rounded-lg px-1.5 py-1 text-[10.8px] font-bold leading-tight transition ${
                        camViewMode === 'original'
                          ? 'bg-white text-slateDeep shadow-sm'
                          : 'text-slate-600 hover:text-slateDeep'
                      }`}
                    >
                      Original Clinical Image
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={camViewMode === 'overlay'}
                      onClick={() => setCamViewMode('overlay')}
                      className={`min-h-[44px] rounded-lg px-1.5 py-1 text-[10.8px] font-bold leading-tight transition ${
                        camViewMode === 'overlay'
                          ? 'bg-white text-medicalTeal shadow-sm'
                          : 'text-slate-600 hover:text-slateDeep'
                      }`}
                    >
                      Grad-CAM Overlay (Conv_1)
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={camViewMode === 'split'}
                      onClick={() => setCamViewMode('split')}
                      className={`min-h-[44px] rounded-lg px-1.5 py-1 text-[10.8px] font-bold leading-tight transition ${
                        camViewMode === 'split'
                          ? 'bg-white text-slateDeep shadow-sm'
                          : 'text-slate-600 hover:text-slateDeep'
                      }`}
                    >
                      Side-by-Side Comparison
                    </button>
                  </div>

                  {/* Single Stage View (Original Clinical Image OR Grad-CAM Overlay Conv_1) */}
                  <div
                    className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-300 bg-slateDeep ${
                      camViewMode === 'split' ? 'hidden' : 'block'
                    }`}
                  >
                    <canvas
                      ref={gradBaseCanvasRef}
                      width={480}
                      height={360}
                      className="absolute inset-0 h-full w-full"
                    />
                    <canvas
                      ref={gradHeatCanvasRef}
                      width={480}
                      height={360}
                      className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-75"
                      style={{
                        opacity: camViewMode === 'original' ? 0 : heatmapOpacity / 100,
                      }}
                    />
                    <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                      {camViewMode === 'original'
                        ? 'Original Clinical Macro (0% Overlay)'
                        : `Grad-CAM Conv_1 (${heatmapOpacity}% JET Alpha)`}
                    </div>
                  </div>

                  {/* Side-by-Side Comparison View */}
                  <div
                    className={`grid-cols-2 gap-2 ${
                      camViewMode === 'split' ? 'grid' : 'hidden'
                    }`}
                  >
                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slateDeep">
                      <canvas
                        ref={sbsOrigCanvasRef}
                        width={320}
                        height={320}
                        className="aspect-square block w-full"
                      />
                      <div className="border-t border-slate-200 bg-white py-1.5 text-center text-[10.8px] font-bold text-slate-700">
                        Original Clinical Image
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-slateDeep">
                      <canvas
                        ref={sbsCamCanvasRef}
                        width={320}
                        height={320}
                        className="aspect-square block w-full"
                      />
                      <div className="border-t border-slate-200 bg-white py-1.5 text-center text-[10.8px] font-bold text-slate-700">
                        Grad-CAM Overlay ({heatmapOpacity}%)
                      </div>
                    </div>
                  </div>

                  {/* Compact Horizontal JET Colorbar Legend Directly Beneath Canvas */}
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between font-mono text-[10.2px] font-bold text-slate-600">
                      <span>Low Attention (0.0)</span>
                      <span className="text-slate-400">#000080 → #00FFFF → #FFFF00 → #FF0000</span>
                      <span className="text-coralAlert">Peak Saliency (1.0)</span>
                    </div>
                    <div className="jet-gradient-strip h-2.5 w-full rounded-full border border-slate-300/60" />
                  </div>

                  {/* Opacity Range Slider (0% - 100%, Default 45%) */}
                  <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-1 flex items-center justify-between text-[12.4px] font-bold">
                      <label htmlFor="heatmap-opacity-slider">Heatmap Opacity Slider</label>
                      <span className="font-mono text-medicalTeal">
                        {camViewMode === 'original' ? '0% (Original Mode)' : `${heatmapOpacity}%`}
                      </span>
                    </div>
                    <input
                      id="heatmap-opacity-slider"
                      type="range"
                      min={0}
                      max={100}
                      value={heatmapOpacity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeatmapOpacity(val);
                        if (camViewMode === 'original' && val > 0) {
                          setCamViewMode('overlay');
                        }
                      }}
                      className="min-h-[44px] w-full cursor-pointer accent-medicalTeal"
                    />
                  </div>
                </div>

                {/* Condition-Specific Streaming LLM Clinical Assistant Summary */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-medicalTeal">
                      Multimodal Clinical Synthesis
                    </span>
                    <span className="font-mono text-[10.5px] font-bold text-slate-500">
                      {isStreamingLlm ? '● Streaming LLM...' : '✓ Grounded'}
                    </span>
                  </div>
                  <h3 className="mt-0.5 mb-2.5 text-[16px] font-extrabold text-slateDeep">
                    LLM Clinical Assistant Summary
                  </h3>

                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="mb-1 text-[11.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                        1. Visual Morphology Findings
                      </h4>
                      <p className="text-[12.6px] leading-relaxed text-slate-700">
                        {streamedMorph}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="mb-1.5 text-[11.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                        2. Fitzpatrick Skin Tone &amp; Clinical Feature Checklist
                      </h4>
                      {scenario.fitzpatrickNote && (
                        <p className="mb-2 rounded-lg border border-teal-200 bg-teal-50/70 p-2 text-[12px] font-semibold leading-snug text-teal-950">
                          {scenario.fitzpatrickNote}
                        </p>
                      )}
                      <ul className="space-y-1.5">
                        {abcdeChecklist.map((item) => (
                          <li
                            key={item.letter}
                            className="flex items-start gap-2 text-[12.3px] text-slate-700"
                          >
                            <span
                              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10.8px] font-extrabold ${
                                item.flagged
                                  ? 'border-red-200 bg-red-50 text-coralAlert'
                                  : 'border-slate-200 bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.letter}
                            </span>
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <h4 className="mb-1 text-[11.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                        3. Differential Considerations
                      </h4>
                      <p className="text-[12.6px] leading-relaxed text-slate-700">
                        {scenario.differentials}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 border-l-4 border-l-medicalTeal bg-white p-3">
                      <h4 className="mb-1 text-[11.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                        4. Recommended Primary Care Action
                      </h4>
                      <p className="text-[12.6px] font-semibold leading-relaxed text-slateDeep">
                        {streamedAction || scenario.action}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2: "How the LLM Works" Expandable Grounded Reasoning Trace */}
                <LlmReasoningTraceCard
                  scenario={scenario}
                  anatomicalSite={anatomicalSite}
                  duration={duration}
                  symptoms={symptoms}
                  laplacianScore={laplacianScore}
                  uploadFilename={uploadMeta?.filename}
                />

                <div className="sticky bottom-2.5 z-20 flex gap-2 rounded-2xl border border-slate-200 bg-canvas/95 p-2 shadow-lg backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => navigateStep(3)}
                    className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-slateDeep px-4 text-[13.5px] font-bold text-white"
                  >
                    ← Triage
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateStep(5)}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-medicalTeal px-4 text-[14.2px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark"
                  >
                    <span>Generate Referral Report</span>
                    <span>→</span>
                  </button>
                </div>
              </section>
            )}

            {/* ================================================================
                STEP 5 — Printable One-Page Clinical Triage & Referral PDF Report
                ================================================================ */}
            {currentStep === 5 && (
              <section className="flex flex-col gap-3.5">
                <article className="print-only-sheet rounded-2xl border border-slate-300 bg-white p-4 shadow-md">
                  {/* Report Header */}
                  <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-slateDeep pb-3">
                    <div className="flex items-center gap-2.5">
                      <InnovaLogo variant="full" className="h-14 w-14 shrink-0 object-contain" />
                      <div>
                        <h2 className="text-[15px] font-extrabold leading-tight tracking-tight text-slateDeep">
                          Clinical Skin Triage &amp; Referral Summary
                        </h2>
                        <p className="mt-0.5 text-[11.2px] font-semibold text-slate-500">
                          InnovaTech Multimodal Primary Care Decision-Support Aid
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10.8px] leading-snug text-slate-600">
                      <div>REF: {caseId}</div>
                      <div>{formattedTimestamp}</div>
                      <div>{doctorProfile.facilityName}</div>
                    </div>
                  </div>

                  {/* Intake & Gatekeeper QA */}
                  <div className="mb-3">
                    <h3 className="mb-1.5 border-b border-slate-200 pb-1 text-[11.2px] font-extrabold uppercase tracking-wider text-slate-500">
                      Patient Intake &amp; Acquisition Quality Gate
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-[12px] print:grid-cols-4">
                      <div>
                        <strong className="block text-[10.5px] text-slate-500">Anatomical Site</strong>
                        <span className="font-semibold">{anatomicalSite}</span>
                      </div>
                      <div>
                        <strong className="block text-[10.5px] text-slate-500">Lesion Duration</strong>
                        <span className="font-semibold">{duration}</span>
                      </div>
                      <div>
                        <strong className="block text-[10.5px] text-slate-500">Gatekeeper QA</strong>
                        <span className="font-bold text-emeraldOk">
                          Focus {laplacianScore} · Skin Verified
                        </span>
                      </div>
                      <div>
                        <strong className="block text-[10.5px] text-slate-500">
                          Reported Symptoms
                        </strong>
                        <span className="font-semibold">
                          {symptoms.length ? symptoms.join(', ') : 'None reported'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Original vs Grad-CAM */}
                  <div className="mb-3">
                    <h3 className="mb-1.5 border-b border-slate-200 pb-1 text-[11.2px] font-extrabold uppercase tracking-wider text-slate-500">
                      Visual Capture &amp; Grad-CAM Saliency Map (Conv_1)
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="overflow-hidden rounded-xl border border-slate-200 text-center">
                        {reportOrigUrl && (
                          <img
                            src={reportOrigUrl}
                            alt="Original Cutaneous Lesion Capture"
                            className="aspect-[4/3] w-full object-cover print:max-h-[150px] print:bg-slateDeep print:object-contain"
                          />
                        )}
                        <div className="border-t border-slate-200 bg-slate-50 py-1 text-[10.8px] font-bold text-slate-700">
                          Original Macro Lesion Capture
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200 text-center">
                        {reportCamUrl && (
                          <img
                            src={reportCamUrl}
                            alt="Grad-CAM Saliency Map Overlay"
                            className="aspect-[4/3] w-full object-cover print:max-h-[150px] print:bg-slateDeep print:object-contain"
                          />
                        )}
                        <div className="border-t border-slate-200 bg-slate-50 py-1 text-[10.8px] font-bold text-slate-700">
                          Grad-CAM (Conv_1 · {heatmapOpacity}% JET)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stage 1 & Stage 2 Probability Breakdown */}
                  <div className="mb-3">
                    <h3 className="mb-1.5 border-b border-slate-200 pb-1 text-[11.2px] font-extrabold uppercase tracking-wider text-slate-500">
                      Stage 1 &amp; Stage 2 Multimodal Triage Breakdown
                    </h3>
                    <div
                      className={`mb-2 rounded-lg border px-2.5 py-1.5 text-[12px] font-extrabold ${
                        scenario.bannerTone === 'coral'
                          ? 'border-red-200 bg-red-50 text-coralAlert'
                          : scenario.bannerTone === 'emerald'
                          ? 'border-emerald-200 bg-emerald-50 text-emeraldOk'
                          : 'border-amber-200 bg-amber-50 text-amberWarn'
                      }`}
                    >
                      {scenario.bannerTitle}
                    </div>

                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10.5px] uppercase text-slate-500">
                          <th className="py-1 text-left">Triage Stage &amp; Taxonomic Class</th>
                          <th className="py-1 text-right">Probability / Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.bars.map((bar) => (
                          <tr key={bar.label} className="border-b border-slate-100">
                            <td className="py-1.5">Stage 1 · {bar.label}</td>
                            <td className="py-1.5 text-right font-mono font-bold">
                              {bar.pct}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                          <td className="py-1.5 pl-1">Stage 2 · Specific Condition</td>
                          <td className="py-1.5 pr-1 text-right font-mono">
                            {scenario.stage2Name} ({scenario.stage2BadgeText})
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* LLM Clinical Notes */}
                  <div>
                    <h3 className="mb-1.5 border-b border-slate-200 pb-1 text-[11.2px] font-extrabold uppercase tracking-wider text-slate-500">
                      LLM Clinical Assistant Synthesis
                    </h3>
                    <div className="grid grid-cols-1 gap-1.5 text-[11.8px] leading-snug print:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <strong>Morphology:</strong> {scenario.morphology}
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <strong>Fitzpatrick IV &amp; Feature Flags:</strong>{' '}
                        {scenario.fitzpatrickNote ? `${scenario.fitzpatrickNote} ` : ''}
                        (Flags:{' '}
                        {abcdeChecklist
                          .filter((i) => i.flagged)
                          .map((i) => i.letter)
                          .join(', ') || 'None flagged'}
                        ; {anatomicalSite}, {duration}).
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <strong>Differentials:</strong> {scenario.differentials}
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <strong>GP Action Plan:</strong> {scenario.action}
                      </div>
                    </div>
                  </div>

                  {/* Attending Physician & PRC Credential Block */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-[11.2px]">
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emeraldOk">
                        Attending Primary Care Physician (PRC Verified)
                      </span>
                      <div className="font-extrabold text-slateDeep">
                        {doctorProfile.displayName} · {doctorProfile.specialty}
                      </div>
                      <div className="text-slate-600">
                        {doctorProfile.facilityName} ({doctorProfile.city})
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10.5px] leading-snug text-slate-700">
                      <div className="font-extrabold text-slateDeep">
                        PRC Lic. #{doctorProfile.prcLicense}
                      </div>
                      <div className="font-bold text-emeraldOk">
                        Ref: {doctorProfile.verification?.referenceId || 'VERIFIED'}
                      </div>
                      {doctorProfile.philhealthNo && (
                        <div>PHIC: {doctorProfile.philhealthNo}</div>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Histopathological Biopsy Disclaimer Footer */}
                  <footer className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[11px] leading-snug text-slate-700">
                    <strong>MANDATORY CLINICAL &amp; HISTOPATHOLOGICAL BIOPSY DISCLAIMER:</strong>{' '}
                    InnovaTech is a preliminary primary care visual triage support prototype and does{' '}
                    <u>not</u> render an autonomous medical diagnosis. Algorithmic probability estimates and Grad-CAM saliency maps cannot rule out cutaneous malignancy. Definitive diagnosis strictly requires specialist dermoscopy and{' '}
                    <strong>histopathological tissue biopsy</strong>.
                  </footer>
                </article>

                {/* Report Actions (Hidden in @media print) */}
                <div className="no-print flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrintExport}
                    className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-medicalTeal px-4 text-[14.8px] font-bold text-white shadow-md shadow-medicalTeal/30 transition hover:bg-medicalTealDark"
                  >
                    <span>Export / Print Referral PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExtendedDrawerOpen(true)}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-medicalTeal bg-white px-4 text-[13.8px] font-extrabold text-medicalTeal transition hover:bg-teal-50"
                  >
                    <span>Simulate Another Condition (8 Core Drawer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScreenAnother}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-slateDeep px-4 text-[14px] font-bold text-white transition hover:bg-slate-800"
                  >
                    <span>Screen Another Lesion</span>
                  </button>
                </div>
              </section>
            )}
          </main>
        )}
    </IPhone16Frame>
  );
}
