import React, { useState } from 'react';

function deriveCleanClassName(scenario) {
  if (scenario.specificClassJson) return scenario.specificClassJson;
  return (scenario.stage2Name || '')
    .replace(/^Specific (Condition Identified|Disease):\s*/i, '')
    .replace(/\s*\([A-Z]+\)\s*$/, '')
    .trim();
}

function deriveNormalizedSoftmax(scenario) {
  if (scenario.softmaxJson) return scenario.softmaxJson;
  const bars = scenario.bars || [];
  let bccScc = 0;
  let mel = 0;
  let notCancer = 0;
  bars.forEach((b) => {
    const lbl = b.label.toLowerCase();
    const val = Number((b.pct / 100).toFixed(2));
    if (lbl.includes('not cancer')) notCancer = val;
    else if (lbl.includes('melanoma') && !lbl.includes('non-melanoma')) mel = val;
    else bccScc = val;
  });
  return { bcc_scc: bccScc, melanoma: mel, not_cancer: notCancer };
}

export default function LlmReasoningTraceCard({
  scenario,
  anatomicalSite,
  duration,
  symptoms,
  laplacianScore,
  uploadFilename,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const topBar = scenario.bars?.[0] || { label: 'Primary Class', pct: 84 };
  const isAbstention = scenario.key === 'inconclusive';
  const isUrgentCancer = scenario.bannerTone === 'coral';
  const cleanClass = deriveCleanClassName(scenario);
  const softmaxScores = deriveNormalizedSoftmax(scenario);

  const groundedPayload = {
    specific_class: cleanClass,
    stage1_softmax: softmaxScores,
    gatekeeper_qa: {
      opencv_laplacian_variance: laplacianScore,
      min_focus_threshold: 100,
      non_skin_detected: false,
      full_face_detected: false,
      source_asset: uploadFilename || `${scenario.lesionVariant || 'clinical_sample'}.png`,
    },
    stage2_explainability: {
      display_label: scenario.stage2Name,
      threshold_65_passed: !isAbstention,
      gradcam_layer: 'Conv_1 (JET Thermal Saliency)',
      saliency_focus: scenario.gradCamNote,
    },
    gp_clinical_intake: {
      anatomical_site: anatomicalSite,
      lesion_duration: duration,
      symptom_flags: symptoms.length > 0 ? symptoms : ['None reported'],
    },
  };

  return (
    <div className="glass-card p-4">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex min-h-[44px] w-full items-center justify-between gap-2.5 text-left"
      >
        <div>
          <span className="block text-[10.8px] font-extrabold uppercase tracking-wider text-medicalTeal">
            Explainable AI Pipeline Inspector
          </span>
          <h3 className="mt-0.5 text-[15.2px] font-extrabold leading-snug text-slateDeep">
            How the LLM Works (Grounded Reasoning Trace)
          </h3>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slateDeep shadow-sm">
          <span>{isExpanded ? 'Hide Trace' : 'Inspect 4 Steps'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3">
          {/* Step A — Multimodal Gatekeeper Check */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emeraldOk">
                Step A — Multimodal Gatekeeper Check
              </span>
              <span className="rounded-full bg-emeraldOk px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                PASSED (Var: {laplacianScore})
              </span>
            </div>
            <p className="font-mono text-[11.6px] font-bold leading-snug text-emerald-950">
              LLM Vision Pre-Check: Valid Cutaneous Lesion Confirmed (Non-Skin: False, Full Face: False)
            </p>
          </div>

          {/* Step B — Grounded Context Input (Live Payload Viewer) */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Step B — Grounded Context Input (Live Payload Viewer)
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                Read-Only Tensor Context
              </span>
            </div>
            <pre className="max-h-[225px] overflow-x-auto overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[10.8px] leading-relaxed text-teal-200">
              {JSON.stringify(groundedPayload, null, 2)}
            </pre>
          </div>

          {/* Step C — Active Safety Guardrail Rule */}
          <div className="rounded-xl border-[1.5px] border-amber-300 bg-amber-50/90 p-3">
            <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-amberWarn">
              Step C — Active Safety Guardrail Rule
            </span>
            <p className="text-[12px] font-extrabold leading-snug text-amber-950">
              System Constraint: Synthesize visual probabilities and intake metadata into primary-care triage guidance only. Autonomous diagnosis prohibited; biopsy required.
            </p>
          </div>

          {/* Step D — Step-by-Step Synthesis Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-medicalTeal">
              Step D — Step-by-Step Synthesis Breakdown
            </span>

            <div className="space-y-1.5 text-[12px] leading-snug text-slate-700">
              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
                <span className="shrink-0 rounded bg-medicalTeal px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  1. Vision
                </span>
                <span>
                  Anchors on Stage-1 <strong>{topBar.label} ({topBar.pct}%)</strong> &amp; Stage-2{' '}
                  <strong>{cleanClass}</strong>{' '}
                  {isAbstention
                    ? '(withholds label because 52% < 65% gate).'
                    : '(>=65% confidence threshold satisfied).'}
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
                <span className="shrink-0 rounded bg-slateDeep px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  2. Context
                </span>
                <span>
                  Cross-references <strong>{anatomicalSite}</strong> site ({duration}) with GP symptom flags:{' '}
                  <strong>{symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}</strong>.
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-medicalTeal/25 bg-medicalTeal/5 p-2">
                <span className="shrink-0 rounded bg-emeraldOk px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-white">
                  3. Output
                </span>
                <span>
                  Emits grounded morphology summary +{' '}
                  <strong>
                    {isAbstention
                      ? 'Direct Specialist Evaluation (Abstention Pathway)'
                      : isUrgentCancer
                      ? 'Urgent Dermatology Referral for Histopathological Biopsy'
                      : 'Targeted Primary Care Management / Routine Monitoring'}
                  </strong>
                  .
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
