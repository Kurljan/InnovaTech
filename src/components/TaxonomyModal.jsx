import React, { useEffect } from 'react';
import { TAXONOMY_CATEGORIES } from '../data/clinicalData';

const ACCENT_HEX = {
  malignant: '#DC2626',
  inflammatory: '#059669',
};

function CategoryIcon({ id }) {
  if (id === 'malignant') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function TaxonomyModal({ isOpen, onClose, matchedTaxId, onSelectCondition }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`taxonomy-backdrop no-print fixed inset-0 z-[85] flex items-end justify-center bg-slate-900/45 min-[460px]:absolute min-[460px]:inset-0 ${
        isOpen ? 'is-open' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="taxonomy-modal-title"
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="taxonomy-sheet flex max-h-[94dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[22px] border-t border-slate-300 bg-[#F8FAFC] sm:max-h-full sm:rounded-b-[27px]">
        {/* Crisp Flat Sheet Handle */}
        <div className="flex shrink-0 justify-center bg-white pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Sharp Legible Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-2.5 border-b border-slate-200 bg-white px-4 pt-1 pb-3">
          <div className="min-w-0">
            <span className="inline-block rounded-md border border-medicalTeal/25 bg-medicalTeal/10 px-2 py-0.5 text-[9.8px] font-extrabold uppercase tracking-[0.045em] text-medicalTeal">
              CLINICAL COVERAGE MATRIX • 2 CATEGORIES • 8 CORE CONDITIONS (PHILIPPINE CLINICAL SCOPE)
            </span>
            <h2
              id="taxonomy-modal-title"
              className="mt-1.5 text-[15.2px] font-extrabold leading-tight tracking-[-0.015em] text-slateDeep"
            >
              InnovaTech Supported Major Skin Disease Taxonomy
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Taxonomy Modal Drawer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slateDeep transition-colors hover:bg-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Two Color-Coded Flat UI Category Cards (8 Core Conditions) */}
        <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 py-3">
          {TAXONOMY_CATEGORIES.map((cat, idx) => (
            <section
              key={cat.id}
              style={{ '--stagger': idx }}
              className={`tax-stagger-card relative overflow-hidden rounded-2xl border border-l-[5px] p-3.5 ${cat.theme.cardBg} ${cat.theme.border} ${cat.theme.leftAccent}`}
            >
              <div
                style={{ '--stagger': idx, backgroundColor: ACCENT_HEX[cat.id] }}
                className="tax-accent-bar absolute top-0 right-0 left-0 h-[2px] opacity-80"
                aria-hidden="true"
              />

              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${cat.theme.iconWrap}`}
                    aria-hidden="true"
                  >
                    <CategoryIcon id={cat.id} />
                  </span>
                  <h3 className="text-[12.8px] font-extrabold leading-snug tracking-[-0.01em] text-slateDeep">
                    {cat.title}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${cat.theme.pillBg}`}
                >
                  {cat.pill}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {cat.items.map((item) => {
                  const isMatched = matchedTaxId && matchedTaxId === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        if (onSelectCondition && item.simKey) {
                          onSelectCondition(item.simKey);
                          onClose();
                        }
                      }}
                      className={`flex min-h-[40px] items-center justify-between gap-1.5 rounded-xl border px-3 py-1.5 text-left text-[12px] font-bold leading-snug transition hover:brightness-95 ${
                        cat.theme.chip
                      } ${isMatched ? 'font-extrabold ring-2 ring-slateDeep ring-offset-1' : ''}`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] font-extrabold opacity-75">
                        {isMatched ? 'Active' : 'Test →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Crisp Flat Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-3.5 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-slateDeep px-4 text-[13px] font-bold text-white transition-colors hover:bg-slate-800"
          >
            Close Taxonomy Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
