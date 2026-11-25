import React, { useEffect, useMemo, useState } from 'react';
import {
  EXTENDED_DISEASE_KEYS,
  GUARDRAIL_REJECTIONS,
  SCENARIOS,
} from '../data/clinicalData';
import { createLesionThumbnailDataUrl } from '../utils/clinicalCanvas';

const FILTER_TABS = [
  { id: 'all', label: 'All Core (8)' },
  { id: 'cancer', label: 'Cutaneous Malignancies (3)' },
  { id: 'inflammatory', label: 'Common Non-Malignant (5)' },
  { id: 'rejections', label: 'Guardrails (4)' },
];

const GROUP_BADGES = {
  cancer: {
    label: 'Urgent Biopsy Referral',
    pillClass: 'bg-[#DC2626] text-white',
    borderClass: 'border-[#FECACA] border-l-[#DC2626]',
    bgClass: 'bg-[#FFFDFD]',
  },
  inflammatory: {
    label: 'Not Cancer · Primary Care',
    pillClass: 'bg-[#059669] text-white',
    borderClass: 'border-[#A7F3D0] border-l-[#059669]',
    bgClass: 'bg-[#FCFFFE]',
  },
};

export default function ExtendedSimulationDrawer({
  isOpen,
  onClose,
  activeScenarioKey,
  activeGateStatus,
  onSelectDisease,
  onSelectRejection,
  onSelectAbstention,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const thumbnails = useMemo(() => {
    const map = {};
    EXTENDED_DISEASE_KEYS.forEach((key) => {
      const sc = SCENARIOS[key];
      if (sc) {
        map[key] = createLesionThumbnailDataUrl(sc.lesionVariant, 128, 96);
      }
    });
    map['non-skin'] = createLesionThumbnailDataUrl('non-skin', 128, 96);
    map['full-face'] = createLesionThumbnailDataUrl('full-face', 128, 96);
    map.blurry = createLesionThumbnailDataUrl('blurry', 128, 96);
    map.abstention = createLesionThumbnailDataUrl('inconclusive-lesion', 128, 96);
    return map;
  }, []);

  const filteredDiseases = useMemo(() => {
    if (activeFilter === 'rejections') return [];
    return EXTENDED_DISEASE_KEYS.map((k) => SCENARIOS[k])
      .filter(Boolean)
      .filter((sc) => (activeFilter === 'all' ? true : sc.extendedGroup === activeFilter));
  }, [activeFilter]);

  const rejectionCards = [
    {
      id: 'non-skin',
      title: 'Reject: Non-Skin Object (LLM Vision Gatekeeper)',
      badge: 'Blocked',
      badgeClass: 'bg-[#DC2626] text-white',
      borderClass: 'border-[#FECACA] border-l-[#DC2626] bg-[#FFFDFD]',
      desc: GUARDRAIL_REJECTIONS['non-skin'].bannerText,
      action: () => onSelectRejection('non-skin'),
    },
    {
      id: 'full-face',
      title: 'Reject: Full Face / Privacy Filter (LLM Vision)',
      badge: 'Privacy Hold',
      badgeClass: 'bg-orange-600 text-white',
      borderClass: 'border-orange-200 border-l-orange-600 bg-orange-50/40',
      desc: GUARDRAIL_REJECTIONS['full-face'].bannerText,
      action: () => onSelectRejection('full-face'),
    },
    {
      id: 'blurry',
      title: 'Reject: Blurry / Low-Res Capture (OpenCV Gatekeeper)',
      badge: 'Var: 38 < 100',
      badgeClass: 'bg-[#DC2626] text-white',
      borderClass: 'border-[#FECACA] border-l-[#DC2626] bg-[#FFFDFD]',
      desc: GUARDRAIL_REJECTIONS.blurry.bannerText,
      action: () => onSelectRejection('blurry'),
    },
    {
      id: 'abstention',
      title: 'Safeguard: Low-Confidence Abstention (<65% Gate)',
      badge: '52% Max Conf',
      badgeClass: 'bg-[#D97706] text-white',
      borderClass: 'border-[#FDE68A] border-l-[#D97706] bg-[#FFFFFC]',
      desc: GUARDRAIL_REJECTIONS.abstention.bannerText,
      action: () => onSelectAbstention(),
    },
  ];

  return (
    <div
      className={`taxonomy-backdrop no-print fixed inset-0 z-[85] flex items-end justify-center bg-slate-900/50 min-[460px]:absolute min-[460px]:inset-0 ${
        isOpen ? 'is-open' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="extended-sim-drawer-title"
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="taxonomy-sheet flex max-h-[94dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[22px] border-t border-slate-300 bg-[#F8FAFC] sm:max-h-full sm:rounded-b-[27px]">
        <div className="flex shrink-0 justify-center bg-white pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Drawer Header */}
        <div className="flex shrink-0 items-start justify-between gap-2.5 border-b border-slate-200 bg-white px-4 pt-1 pb-2.5">
          <div className="min-w-0">
            <span className="block text-[9.8px] font-extrabold uppercase tracking-[0.045em] text-medicalTeal">
              CLINICAL COVERAGE MATRIX • 2 CATEGORIES • 8 CORE CONDITIONS (PHILIPPINE CLINICAL SCOPE)
            </span>
            <h2
              id="extended-sim-drawer-title"
              className="mt-0.5 text-[15px] font-extrabold leading-tight tracking-[-0.015em] text-slateDeep"
            >
              InnovaTech Clinical Case Simulator (8 Core Conditions)
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Case Simulator Drawer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slateDeep transition hover:bg-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Filter Tab Bar */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
          <div
            role="tablist"
            aria-label="Filter Core Clinical Conditions"
            className="flex gap-1.5 overflow-x-auto pb-0.5"
          >
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`min-h-[38px] shrink-0 rounded-full border px-3 py-1 text-[11.2px] font-extrabold whitespace-nowrap transition ${
                    active
                      ? 'border-slateDeep bg-slateDeep text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slateDeep'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable 8 Core Simulation Cards */}
        <div className="flex flex-col gap-2.5 overflow-y-auto overscroll-contain p-3.5">
          {filteredDiseases.map((sc) => {
            const grp = GROUP_BADGES[sc.extendedGroup] || GROUP_BADGES.inflammatory;
            const topBar = sc.bars[0];
            const isSelected =
              activeGateStatus === 'valid' && activeScenarioKey === sc.key;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => {
                  onSelectDisease(sc.key);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl border border-l-[5px] p-2.5 text-left transition hover:shadow-md active:scale-[0.99] ${
                  grp.bgClass
                } ${grp.borderClass} ${isSelected ? 'ring-2 ring-slateDeep' : ''}`}
              >
                <img
                  src={thumbnails[sc.key]}
                  alt={sc.cardTitle}
                  className="h-[62px] w-[78px] shrink-0 rounded-lg border border-slate-300 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.8px] font-extrabold uppercase tracking-wide ${grp.pillClass}`}
                    >
                      {grp.label}
                    </span>
                    <span className="font-mono text-[11.5px] font-extrabold text-slateDeep">
                      {topBar.pct}%
                    </span>
                  </div>

                  <div className="truncate text-[13px] font-extrabold leading-snug text-slateDeep">
                    {sc.cardTitle}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] font-medium text-slate-600">
                    {sc.intake.site} · {sc.cardSub}
                  </div>
                </div>
              </button>
            );
          })}

          {activeFilter === 'rejections' &&
            rejectionCards.map((rc) => (
              <button
                key={rc.id}
                type="button"
                onClick={() => {
                  rc.action();
                  onClose();
                }}
                className={`flex w-full items-start gap-3 rounded-xl border border-l-[5px] p-2.5 text-left transition hover:shadow-md active:scale-[0.99] ${rc.borderClass}`}
              >
                <img
                  src={thumbnails[rc.id]}
                  alt={rc.title}
                  className="h-[62px] w-[78px] shrink-0 rounded-lg border border-slate-300 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.8px] font-extrabold uppercase tracking-wide ${rc.badgeClass}`}
                    >
                      {rc.badge}
                    </span>
                    <span className="text-[10.5px] font-bold text-medicalTeal">
                      Simulate →
                    </span>
                  </div>
                  <div className="text-[12.6px] font-extrabold leading-tight text-slateDeep">
                    {rc.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-600">
                    {rc.desc}
                  </p>
                </div>
              </button>
            ))}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-3.5 py-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-slateDeep px-4 text-[13px] font-bold text-white transition hover:bg-slate-800"
          >
            Close Case Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
