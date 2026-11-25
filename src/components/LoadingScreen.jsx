import React, { useEffect, useState } from 'react';
import InnovaLogo from './InnovaLogo';

const BOOT_STAGES = [
  { threshold: 0, text: 'Initializing InnovaTech Clinical Engine...' },
  { threshold: 28, text: 'Loading MobileNetV2 2-Stage Softmax Weights...' },
  { threshold: 58, text: 'Calibrating OpenCV + LLM Vision Gatekeeper...' },
  { threshold: 84, text: 'Mounting Conv_1 Real-Time JET Grad-CAM...' },
  { threshold: 98, text: 'GP Mobile Triage Workspace Ready' },
];

export default function LoadingScreen({ isVisible, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isVisible) return undefined;
    setProgress(0);
    setIsExiting(false);

    let rafId = null;
    const waitSignal =
      typeof window !== 'undefined' && window.location.search.includes('waitboot=1');
    const durationMs = 2400;

    const startAnimation = () => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setProgress(Math.round(eased * 100));

        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setIsExiting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 360);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    if (waitSignal) {
      window.__startInnovaBoot = startAnimation;
    } else {
      startAnimation();
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (typeof window !== 'undefined') {
        delete window.__startInnovaBoot;
      }
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const activeStage =
    [...BOOT_STAGES].reverse().find((s) => progress >= s.threshold) || BOOT_STAGES[0];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print absolute inset-0 z-[80] flex flex-col items-center justify-between bg-[#F8FAFC] px-6 pt-16 pb-10 transition-all duration-300 ${
        isExiting ? 'scale-[1.02] opacity-0 pointer-events-none' : 'scale-100 opacity-100'
      }`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 34%, rgba(13, 148, 136, 0.14), transparent 58%)',
      }}
    >
      {/* Top Clinical Scope Pill */}
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-medicalTeal/25 bg-white/95 px-3.5 py-1.5 shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-medicalTeal" />
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slateDeep">
          InnovaTech · GP Mobile v2.6
        </span>
      </div>

      {/* Center Animated Logo Hero */}
      <div className="flex w-full max-w-[300px] flex-col items-center text-center">
        <div className="relative mb-5 flex h-[172px] w-[172px] items-center justify-center">
          <span className="absolute -inset-2.5 rounded-[40px] border border-medicalTeal/20 bg-medicalTeal/5" />
          <div className="relative flex h-full w-full items-center justify-center rounded-[34px] border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/5">
            <InnovaLogo variant="full" className="h-full w-full object-contain" />
          </div>
        </div>

        <h2 className="text-[19px] font-extrabold leading-tight tracking-tight text-slateDeep">
          Explainable Skin Disease Triage
        </h2>
        <p className="mt-1 text-[12.2px] font-semibold text-medicalTeal">
          MobileNet CNN · Grad-CAM · Grounded LLM
        </p>

        {/* Smooth Progress Bar */}
        <div className="mt-6 w-full">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] font-extrabold">
            <span className="text-slate-600">SYSTEM BOOT</span>
            <span className="text-medicalTeal">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-200/80 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slateDeep via-medicalTeal to-teal-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 min-h-[18px] font-mono text-[10.6px] font-semibold text-slate-500">
            {activeStage.text}
          </p>
        </div>
      </div>

      {/* Footer Clinical Safeguard Note */}
      <div className="text-center">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
          Primary Care Decision-Support Prototype
        </p>
        <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">
          8 Core Conditions · 65% Confidence Gate · Biopsy Verified
        </p>
      </div>
    </div>
  );
}
