import React from 'react';

export default function IPhone16Frame({
  enabled = true,
  isCameraActive = false,
  scrollContainerRef,
  overlays = null,
  children,
}) {
  if (!enabled) {
    return (
      <div className="app-outer-wrapper min-h-[100dvh] min-[460px]:flex min-[460px]:items-start min-[460px]:justify-center min-[460px]:px-3 min-[460px]:pt-5 min-[460px]:pb-8">
        <div
          ref={scrollContainerRef}
          className="mobile-shell-frame relative flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-canvas min-[460px]:min-h-[calc(100dvh-52px)] min-[460px]:overflow-x-clip min-[460px]:rounded-[28px] min-[460px]:border min-[460px]:border-slate-300 min-[460px]:shadow-shell"
        >
          {children}
          {overlays}
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-outer-wrapper min-h-[100dvh] min-[460px]:flex min-[460px]:items-center min-[460px]:justify-center min-[460px]:px-4 min-[460px]:py-5"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(13, 148, 136, 0.16), transparent 45%), radial-gradient(circle at 80% 85%, rgba(15, 23, 42, 0.14), transparent 48%), #CBD5E1',
      }}
    >
      {/* iPhone 16 Black Titanium Hardware Chassis */}
      <div className="iphone16-chassis relative mx-auto w-full max-w-[430px] min-[460px]:w-[419px] min-[460px]:max-w-[419px] min-[460px]:rounded-[58px] min-[460px]:bg-gradient-to-b min-[460px]:from-[#2E3440] min-[460px]:via-[#14171D] min-[460px]:to-[#232730] min-[460px]:p-[13px] min-[460px]:shadow-[0_32px_80px_-14px_rgba(15,23,42,0.52),0_0_0_1.5px_rgba(255,255,255,0.22)_inset]">
        {/* Left Physical Buttons: Action + Volume Up + Volume Down */}
        <span
          aria-hidden="true"
          className="no-print hidden min-[460px]:block min-[460px]:absolute min-[460px]:-left-[3.5px] min-[460px]:top-[126px] min-[460px]:h-[28px] min-[460px]:w-[3.5px] min-[460px]:rounded-l-sm min-[460px]:bg-[#475569]"
        />
        <span
          aria-hidden="true"
          className="no-print hidden min-[460px]:block min-[460px]:absolute min-[460px]:-left-[3.5px] min-[460px]:top-[176px] min-[460px]:h-[52px] min-[460px]:w-[3.5px] min-[460px]:rounded-l-sm min-[460px]:bg-[#475569]"
        />
        <span
          aria-hidden="true"
          className="no-print hidden min-[460px]:block min-[460px]:absolute min-[460px]:-left-[3.5px] min-[460px]:top-[240px] min-[460px]:h-[52px] min-[460px]:w-[3.5px] min-[460px]:rounded-l-sm min-[460px]:bg-[#475569]"
        />

        {/* Right Physical Buttons: Side Power + iPhone 16 Camera Control */}
        <span
          aria-hidden="true"
          className="no-print hidden min-[460px]:block min-[460px]:absolute min-[460px]:-right-[3.5px] min-[460px]:top-[194px] min-[460px]:h-[74px] min-[460px]:w-[3.5px] min-[460px]:rounded-r-sm min-[460px]:bg-[#475569]"
        />
        <span
          aria-hidden="true"
          className="no-print hidden min-[460px]:block min-[460px]:absolute min-[460px]:-right-[3px] min-[460px]:top-[516px] min-[460px]:h-[42px] min-[460px]:w-[3px] min-[460px]:rounded-r-sm min-[460px]:bg-[#64748B]"
        />

        {/* Inner iPhone 16 Super Retina XDR Display (393 x 852 logical viewport) */}
        <div className="mobile-shell-frame relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-canvas min-[460px]:h-[852px] min-[460px]:min-h-[852px] min-[460px]:rounded-[46px] min-[460px]:ring-1 min-[460px]:ring-black">
          {/* iOS 18 Status Bar + Dynamic Island (Always above LoadingScreen & App) */}
          <div className="no-print relative z-[90] hidden shrink-0 select-none items-center justify-between bg-[#F8FAFC] px-7 pt-2.5 pb-1.5 text-slateDeep min-[460px]:flex">
            <span className="w-[58px] text-[13.5px] font-extrabold tracking-tight">
              9:41
            </span>

            {/* Dynamic Island */}
            <div className="relative flex h-[31px] w-[118px] items-center justify-end rounded-full bg-[#06080C] px-3">
              <span className="mr-auto ml-1 h-3 w-3 rounded-full bg-[#131A29] ring-1 ring-slate-700/70">
                <span className="mt-0.5 ml-0.5 block h-1 w-1 rounded-full bg-sky-400/50" />
              </span>
              <span
                className={`h-2 w-2 rounded-full transition-opacity duration-300 ${
                  isCameraActive ? 'bg-emerald-400 opacity-100' : 'bg-emerald-400 opacity-0'
                }`}
              />
            </div>

            {/* Signal + Wi-Fi + Battery */}
            <div className="flex w-[66px] items-center justify-end gap-1.5 text-slateDeep">
              <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                <rect x="0.5" y="8" width="2.5" height="3.5" rx="0.7" />
                <rect x="4.3" y="6" width="2.5" height="5.5" rx="0.7" />
                <rect x="8.1" y="3.5" width="2.5" height="8" rx="0.7" />
                <rect x="11.9" y="1" width="2.5" height="10.5" rx="0.7" />
              </svg>
              <svg width="14" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1.5 4.2a10.5 10.5 0 0 1 13 0" />
                <path d="M4.2 7a6.5 6.5 0 0 1 7.6 0" />
                <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              <div className="flex items-center">
                <div className="h-[11px] w-[21px] rounded-[3.5px] border-[1.4px] border-slateDeep p-[1.5px]">
                  <div className="h-full w-full rounded-[1.5px] bg-slateDeep" />
                </div>
                <span className="ml-[1px] h-[4px] w-[1.5px] rounded-r-sm bg-slateDeep" />
              </div>
            </div>
          </div>

          {/* Scrollable App Content */}
          <div
            ref={scrollContainerRef}
            id="iphone-viewport-scroll"
            className="relative flex flex-1 flex-col min-[460px]:overflow-y-auto min-[460px]:overflow-x-hidden min-[460px]:overscroll-contain"
          >
            {children}
          </div>

          {/* iOS Bottom Home Indicator */}
          <div className="no-print pointer-events-none relative z-[90] hidden shrink-0 justify-center bg-canvas/95 pt-1 pb-2 min-[460px]:flex">
            <span className="h-[5px] w-[134px] rounded-full bg-slate-900/80" />
          </div>

          {/* Screen-Level Overlays (Loading Screen, Modals, Toast) */}
          {overlays}
        </div>
      </div>
    </div>
  );
}
