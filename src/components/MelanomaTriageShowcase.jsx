import React, { useEffect, useRef, useState } from 'react';
import { renderGradCamHeatmap, renderLesionScene } from '../utils/clinicalCanvas';

const STREAM_HEADLINE =
  'Immediate Dermatology & Oncology Referral Required — ABCDE High-Risk Pattern';

const STREAM_DETAIL =
  'Asymmetric multi-shaded brown-black pigment network with peripheral pseudopods and focal blue-white veil on Fitzpatrick IV skin. Arrange urgent specialist dermoscopy and excisional biopsy.';

export default function MelanomaTriageShowcase({ onOpenTaxonomy, onExitShowcase }) {
  const baseCanvasRef = useRef(null);
  const heatCanvasRef = useRef(null);

  const [phase, setPhase] = useState('scanning'); // 'scanning' | 'bars' | 'stage2' | 'streaming' | 'done'
  const [scanProgress, setScanProgress] = useState(0);
  const [bars, setBars] = useState({ mel: 0, nmsc: 0, notCancer: 0 });
  const [stage2Locked, setStage2Locked] = useState(false);
  const [camAlpha, setCamAlpha] = useState(0);
  const [streamedHeadline, setStreamedHeadline] = useState('');
  const [streamedDetail, setStreamedDetail] = useState('');
  const [runId, setRunId] = useState(0);

  // Render static Fitzpatrick IV asymmetric brown-black melanoma & focused Grad-CAM red hotspot
  useEffect(() => {
    if (baseCanvasRef.current) {
      const bCtx = baseCanvasRef.current.getContext('2d');
      renderLesionScene(bCtx, 480, 320, 'melanoma-fitzIV');
    }
    if (heatCanvasRef.current && baseCanvasRef.current) {
      const hCtx = heatCanvasRef.current.getContext('2d');
      renderGradCamHeatmap(hCtx, 480, 320, 'melanoma', baseCanvasRef.current);
    }
  }, []);

  // Keyboard 'R' to cleanly replay the 60fps choreography for screen recording
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setRunId((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 60fps requestAnimationFrame timeline choreography
  useEffect(() => {
    let rafId = null;
    const start = performance.now();

    setPhase('scanning');
    setScanProgress(0);
    setBars({ mel: 0, nmsc: 0, notCancer: 0 });
    setStage2Locked(false);
    setCamAlpha(0);
    setStreamedHeadline('');
    setStreamedDetail('');

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - start;

      // Phase 1: 0ms -> 650ms Lesion Scan Sweep
      if (elapsed <= 650) {
        setPhase('scanning');
        setScanProgress(Math.min(1, elapsed / 650));
      } else {
        setScanProgress(1);
      }

      // Phase 2: 550ms -> 1500ms Stage 1 Probability Bars Animate (89% / 7% / 4%)
      if (elapsed > 550) {
        const bt = Math.min(1, (elapsed - 550) / 900);
        const e = easeOutCubic(bt);
        setBars({
          mel: Math.round(89 * e),
          nmsc: Math.round(7 * e),
          notCancer: Math.round(4 * e),
        });
        if (elapsed < 1550) setPhase('bars');
      }

      // Phase 3: 1550ms -> 2250ms Stage 2 Lock-In + Focused Grad-CAM Red Hotspot
      if (elapsed >= 1550) {
        setStage2Locked(true);
        const ct = Math.min(1, (elapsed - 1550) / 650);
        setCamAlpha(0.56 * easeOutCubic(ct));
        if (elapsed < 2050) setPhase('stage2');
      }

      // Phase 4: 1950ms -> 4100ms 60fps LLM Clinical Notes Streaming
      if (elapsed >= 1950) {
        setPhase('streaming');
        const hChars = Math.min(
          STREAM_HEADLINE.length,
          Math.floor((elapsed - 1950) / 14)
        );
        setStreamedHeadline(STREAM_HEADLINE.slice(0, hChars));

        const detailStart = 1950 + STREAM_HEADLINE.length * 14 + 120;
        if (elapsed > detailStart) {
          const dChars = Math.min(
            STREAM_DETAIL.length,
            Math.floor((elapsed - detailStart) / 9)
          );
          setStreamedDetail(STREAM_DETAIL.slice(0, dChars));
          if (dChars >= STREAM_DETAIL.length) {
            setPhase('done');
            return;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [runId]);

  return (
    <section
      aria-label="InnovaTech Melanoma Triage Screen-Recording View"
      className="flex flex-1 flex-col justify-between gap-2.5 px-3.5 pt-2.5 pb-3 select-none"
    >
      {/* 1. Close-Up Fitzpatrick IV Lesion + Focused Grad-CAM Hotspot */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emeraldOk" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slateDeep">
              Fitzpatrick IV · Macro Dermoscopy
            </span>
          </div>
          <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-[#BE123C]">
            {stage2Locked ? 'Grad-CAM Hotspot (Conv_1)' : 'MobileNetV2 Analyzing...'}
          </span>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <canvas
            ref={baseCanvasRef}
            width={480}
            height={320}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <canvas
            ref={heatCanvasRef}
            width={480}
            height={320}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{ opacity: camAlpha }}
          />

          {/* 60fps Flat Optical Scan Sweep */}
          {phase === 'scanning' && (
            <div
              className="pointer-events-none absolute right-0 left-0 h-[2.5px] bg-teal-300 shadow-[0_0_12px_#2DD4BF]"
              style={{
                transform: `translate3d(0, ${scanProgress * 220}px, 0)`,
              }}
            />
          )}

          {/* Crisp Reticle & Hotspot Callout */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-2">
            <span className=" self-start rounded bg-slate-900/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              FOCUS 164 · SKIN ROI ✓
            </span>
            {stage2Locked && (
              <span className="self-end rounded bg-[#BE123C]/95 px-2 py-0.5 font-mono text-[10px] font-extrabold text-white">
                IRREGULAR PIGMENT NETWORK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stage 1 Primary Triage Animated Bars (89% Crimson / 7% Amber / 4% Slate) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10.8px] font-extrabold uppercase tracking-wider text-medicalTeal">
            Stage 1 — Primary Cancer Triage
          </span>
          <span className="font-mono text-[10.5px] font-bold text-slate-500">
            Threshold: 65%
          </span>
        </div>

        <div className="space-y-2">
          {/* Melanoma (MEL) — 89% Crimson Red */}
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[12.2px] font-extrabold">
              <span className="text-slateDeep">Melanoma (MEL)</span>
              <span className="font-mono text-[#BE123C]">{bars.mel}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#BE123C]"
                style={{ width: `${bars.mel}%` }}
              />
              <span className="absolute top-0 bottom-0 left-[65%] w-[1.5px] bg-slateDeep/40" />
            </div>
          </div>

          {/* Non-Melanoma (BCC/SCC) — 7% Amber */}
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[12px] font-bold">
              <span className="text-slate-700">Non-Melanoma (BCC/SCC)</span>
              <span className="font-mono text-amberWarn">{bars.nmsc}%</span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amberWarn"
                style={{ width: `${bars.nmsc}%` }}
              />
              <span className="absolute top-0 bottom-0 left-[65%] w-[1.5px] bg-slateDeep/30" />
            </div>
          </div>

          {/* Not Cancer — 4% Slate */}
          <div>
            <div className="mb-0.5 flex items-center justify-between text-[12px] font-bold">
              <span className="text-slate-600">Not Cancer</span>
              <span className="font-mono text-slate-600">{bars.notCancer}%</span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-500"
                style={{ width: `${bars.notCancer}%` }}
              />
              <span className="absolute top-0 bottom-0 left-[65%] w-[1.5px] bg-slateDeep/30" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Stage 2 Lock-In Card */}
      <div
        className={`rounded-2xl border px-3 py-2.5 transition-colors duration-200 ${
          stage2Locked
            ? 'border-[#FECACA] border-l-4 border-l-[#BE123C] bg-[#FFFDFD]'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
            Stage 2 Taxonomic Lock
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase ${
              stage2Locked
                ? 'bg-[#BE123C] text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {stage2Locked ? 'LOCKED · 89% CONF' : 'PENDING STAGE 1'}
          </span>
        </div>
        <p className="mt-0.5 text-[13.4px] font-extrabold leading-snug tracking-tight text-slateDeep">
          {stage2Locked
            ? 'Specific Disease: Acral / Cutaneous Malignant Melanoma'
            : 'Awaiting Stage 1 Softmax Gate...'}
        </p>
      </div>

      {/* 4. Live Streaming LLM Clinical Assistant Readout */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
            LLM Clinical Assistant Stream
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              title="Replay 60fps Animation (Shortcut: R)"
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
            >
              ↻ Replay (R)
            </button>
            <button
              type="button"
              onClick={onOpenTaxonomy}
              className="rounded-md border border-medicalTeal/30 bg-medicalTeal/10 px-2 py-0.5 text-[10px] font-bold text-medicalTeal hover:bg-medicalTeal/20"
            >
              Taxonomy (T)
            </button>
            <button
              type="button"
              onClick={onExitShowcase}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100"
            >
              5-Step Flow
            </button>
          </div>
        </div>

        <div className="min-h-[68px]">
          <p className="text-[12.8px] font-extrabold leading-snug text-[#BE123C]">
            {streamedHeadline}
            {phase === 'streaming' && streamedDetail.length === 0 && (
              <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#BE123C]" />
            )}
          </p>
          <p className="mt-1 text-[11.5px] font-medium leading-snug text-slate-700">
            {streamedDetail}
            {phase === 'streaming' && streamedDetail.length > 0 && (
              <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-medicalTeal" />
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
