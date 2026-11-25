import React from 'react';
import { GUARDRAIL_REJECTIONS } from '../data/clinicalData';

export default function GuardrailSimulatorBar({
  activeGateStatus,
  activeScenarioKey,
  onTriggerRejection,
  onTriggerAbstention,
  onRestoreValid,
  onOpenExtendedDrawer,
}) {
  const isRejected =
    activeGateStatus === 'non-skin' ||
    activeGateStatus === 'full-face' ||
    activeGateStatus === 'blurry' ||
    activeGateStatus === 'custom-blurry';

  const isAbstention = !isRejected && activeScenarioKey === 'inconclusive';

  return (
    <div className="glass-card border-slate-300 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slateDeep">
            Guardrail &amp; Rejection Simulator
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Dual-Gatekeeper Rejections &amp; &lt;65% Abstention Controls
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenExtendedDrawer}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-full bg-medicalTeal px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-medicalTealDark"
        >
          <span>8 Cases</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {/* 1. Non-Skin Object */}
        <button
          type="button"
          onClick={() => onTriggerRejection('non-skin')}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[11.3px] font-bold leading-tight transition ${
            activeGateStatus === 'non-skin'
              ? 'border-coralAlert bg-red-50 text-red-900 ring-1 ring-coralAlert'
              : 'border-slate-300 bg-white text-slateDeep hover:bg-slate-50'
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-coralAlert" />
          <span>Reject: Non-Skin Object</span>
        </button>

        {/* 2. Full Face / Privacy Filter */}
        <button
          type="button"
          onClick={() => onTriggerRejection('full-face')}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[11.3px] font-bold leading-tight transition ${
            activeGateStatus === 'full-face'
              ? 'border-orange-600 bg-orange-50 text-orange-900 ring-1 ring-orange-600'
              : 'border-slate-300 bg-white text-slateDeep hover:bg-slate-50'
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange-600" />
          <span>Reject: Full Face / Privacy</span>
        </button>

        {/* 3. Blurry / Low-Res Capture (Var: 38) */}
        <button
          type="button"
          onClick={() => onTriggerRejection('blurry')}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[11.3px] font-bold leading-tight transition ${
            activeGateStatus === 'blurry'
              ? 'border-coralAlert bg-red-50 text-red-900 ring-1 ring-coralAlert'
              : 'border-slate-300 bg-white text-slateDeep hover:bg-slate-50'
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-coralAlert" />
          <span>Reject: Blurry (Var: 38)</span>
        </button>

        {/* 4. Low-Confidence Abstention (<65% Threshold, 52%) */}
        <button
          type="button"
          onClick={onTriggerAbstention}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[11.3px] font-bold leading-tight transition ${
            isAbstention
              ? 'border-amberWarn bg-amber-50 text-amber-900 ring-1 ring-amberWarn'
              : 'border-slate-300 bg-white text-slateDeep hover:bg-slate-50'
          }`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-amberWarn" />
          <span>Safeguard: &lt;65% (52%)</span>
        </button>
      </div>

      {/* Live Blocking Alert Banner if a Gatekeeper Rejection is Active */}
      {isRejected && (
        <div className="mt-2.5 space-y-2" aria-live="polite">
          <div
            role="alert"
            className={`flex items-start gap-2.5 rounded-xl border-[1.5px] p-2.5 text-[12.2px] font-bold leading-snug ${
              activeGateStatus === 'full-face'
                ? 'border-orange-600 bg-orange-50 text-orange-900'
                : 'border-coralAlert bg-red-50 text-red-900'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {activeGateStatus === 'full-face' ? '⚠' : '✕'}
            </span>
            <span>
              {activeGateStatus === 'custom-blurry'
                ? GUARDRAIL_REJECTIONS.blurry.bannerText
                : GUARDRAIL_REJECTIONS[activeGateStatus]?.bannerText}
            </span>
          </div>

          <button
            type="button"
            onClick={onRestoreValid}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-[12.2px] font-extrabold text-emeraldOk transition hover:bg-emerald-100"
          >
            <span>✓ Restore Valid Fitzpatrick IV Lesion (Focus: 152)</span>
          </button>
        </div>
      )}
    </div>
  );
}
