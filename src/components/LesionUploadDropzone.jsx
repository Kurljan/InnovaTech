import React, { useMemo, useRef, useState } from 'react';
import { createLesionThumbnailDataUrl } from '../utils/clinicalCanvas';

const INVALID_CHIP_BANNERS = {
  'upload-non-skin': {
    tone: 'coral',
    filename: 'desk_stethoscope_obj.jpg',
    resolution: '1280 × 960 px',
    sharpness: 164,
    variant: 'non-skin',
    message:
      'Upload Rejected — LLM Vision Gatekeeper Detected Non-Cutaneous Object (No Skin Region Found).',
  },
  'upload-full-face': {
    tone: 'amber-red',
    filename: 'patient_full_portrait.png',
    resolution: '1080 × 1440 px',
    sharpness: 142,
    variant: 'full-face',
    message:
      'Upload Rejected — Full Facial Portrait Detected. Privacy Guardrail Requires Localized Lesion Close-Up Only.',
  },
  'upload-blurry': {
    tone: 'red',
    filename: 'out_of_focus_lesion.webp',
    resolution: '640 × 480 px',
    sharpness: 42,
    variant: 'blurry',
    message:
      'OpenCV Quality Gate Failed — Laplacian Sharpness: 42 (Minimum Required: 100). Please upload a focused photo.',
  },
};

export default function LesionUploadDropzone({
  gateStatus,
  laplacianScore,
  uploadMeta,
  activeLesionVariant,
  activeScenarioLabel,
  onProcessImageFile,
  onSimulateUploadChip,
  onRestoreValidSample,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const browseInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const sampleThumbUrl = useMemo(() => {
    if (uploadMeta?.previewUrl) return uploadMeta.previewUrl;
    const chipMeta = INVALID_CHIP_BANNERS[gateStatus];
    if (chipMeta) {
      return createLesionThumbnailDataUrl(chipMeta.variant, 160, 120);
    }
    if (
      gateStatus === 'non-skin' ||
      gateStatus === 'full-face' ||
      gateStatus === 'blurry'
    ) {
      return createLesionThumbnailDataUrl(gateStatus, 160, 120);
    }
    return createLesionThumbnailDataUrl(activeLesionVariant || 'valid', 160, 120);
  }, [uploadMeta, gateStatus, activeLesionVariant]);

  const activeChipBanner = INVALID_CHIP_BANNERS[gateStatus] || null;
  const isCustomBlurry = gateStatus === 'custom-blurry';
  const isGateValid = gateStatus === 'valid' || gateStatus === 'custom-valid';

  const displayMeta = useMemo(() => {
    if (uploadMeta) {
      return {
        filename: uploadMeta.filename,
        resolution: uploadMeta.resolution,
        sharpness: laplacianScore,
      };
    }
    if (activeChipBanner) {
      return {
        filename: activeChipBanner.filename,
        resolution: activeChipBanner.resolution,
        sharpness: activeChipBanner.sharpness,
      };
    }
    return {
      filename: `${(activeLesionVariant || 'fitzpatrick_iv_lesion').replace(/[^a-z0-9]/gi, '_')}.png`,
      resolution: '1440 × 1080 px',
      sharpness: laplacianScore,
    };
  }, [uploadMeta, activeChipBanner, activeLesionVariant, laplacianScore]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onProcessImageFile(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onProcessImageFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-medicalTeal">
          Lesion Upload &amp; Dual-Gatekeeper Validation
        </span>
        <span className="font-mono text-[10.5px] font-semibold text-slate-500">
          .JPG · .PNG · .WEBP
        </span>
      </div>

      {/* Drag-and-Drop Zone + File / Mobile Camera Inputs */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-3 transition ${
          isDragging
            ? 'border-medicalTeal bg-medicalTeal/10'
            : 'border-slate-300 bg-white hover:border-medicalTeal/60'
        }`}
      >
        <input
          ref={browseInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          hidden
          onChange={handleInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleInputChange}
        />

        {/* Live Thumbnail Preview + File Metadata */}
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-slate-900">
            <img
              src={sampleThumbUrl}
              alt="Lesion upload thumbnail preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.4px] font-extrabold text-slateDeep">
              {displayMeta.filename}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[10.8px] font-semibold text-slate-600">
              <span>Res: {displayMeta.resolution}</span>
              <span
                className={
                  displayMeta.sharpness < 100
                    ? 'font-extrabold text-coralAlert'
                    : 'font-extrabold text-emeraldOk'
                }
              >
                Laplacian: {displayMeta.sharpness}
              </span>
            </div>
            <div className="mt-0.5 truncate text-[10.8px] font-medium text-slate-500">
              {uploadMeta
                ? 'Custom device image loaded'
                : `Preset: ${activeScenarioLabel} — or drag & drop image here`}
            </div>
          </div>
        </div>

        {/* Browse File & Snap Mobile Camera Buttons */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => browseInputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-slateDeep px-3 text-[12px] font-bold text-white transition hover:bg-slate-800"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Browse Image</span>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-medicalTeal bg-medicalTeal/10 px-3 text-[12px] font-extrabold text-medicalTeal transition hover:bg-medicalTeal hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span>Mobile Camera</span>
          </button>
        </div>
      </div>

      {/* One-Tap Gatekeeper Test Chips (Below the Upload Box) */}
      <div className="mt-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600">
            Quick-Test Gatekeeper Error Chips:
          </span>
          {!isGateValid && (
            <button
              type="button"
              onClick={onRestoreValidSample}
              className="text-[11px] font-extrabold text-emeraldOk underline hover:text-emerald-700"
            >
              Reset Valid Sample
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSimulateUploadChip('upload-non-skin', 164)}
            className={`min-h-[40px] rounded-full border px-3 py-1.5 text-[11.2px] font-bold transition ${
              gateStatus === 'upload-non-skin'
                ? 'border-coralAlert bg-red-50 text-red-900 ring-1 ring-coralAlert'
                : 'border-slate-300 bg-white text-slate-700 hover:border-coralAlert'
            }`}
          >
            Simulate Invalid: Non-Skin Object
          </button>

          <button
            type="button"
            onClick={() => onSimulateUploadChip('upload-full-face', 142)}
            className={`min-h-[40px] rounded-full border px-3 py-1.5 text-[11.2px] font-bold transition ${
              gateStatus === 'upload-full-face'
                ? 'border-orange-600 bg-orange-50 text-orange-900 ring-1 ring-orange-600'
                : 'border-slate-300 bg-white text-slate-700 hover:border-orange-600'
            }`}
          >
            Simulate Invalid: Full Face
          </button>

          <button
            type="button"
            onClick={() => onSimulateUploadChip('upload-blurry', 42)}
            className={`min-h-[40px] rounded-full border px-3 py-1.5 text-[11.2px] font-bold transition ${
              gateStatus === 'upload-blurry'
                ? 'border-coralAlert bg-red-50 text-red-900 ring-1 ring-coralAlert'
                : 'border-slate-300 bg-white text-slate-700 hover:border-coralAlert'
            }`}
          >
            Simulate Invalid: Blurry Image
          </button>
        </div>
      </div>

      {/* Validation Status Output: Rejection Alert Banner OR Two Green Verified Pills */}
      <div className="mt-2.5" aria-live="polite">
        {activeChipBanner && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border-[1.5px] p-2.5 text-[12px] font-bold leading-snug ${
              activeChipBanner.tone === 'amber-red'
                ? 'border-orange-600 bg-orange-50 text-orange-900'
                : 'border-coralAlert bg-red-50 text-red-900'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {activeChipBanner.tone === 'amber-red' ? '⚠' : '✕'}
            </span>
            <span>{activeChipBanner.message}</span>
          </div>
        )}

        {isCustomBlurry && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border-[1.5px] border-coralAlert bg-red-50 p-2.5 text-[12px] font-bold leading-snug text-red-900"
          >
            <span className="mt-0.5 shrink-0">✕</span>
            <span>
              OpenCV Quality Gate Failed — Laplacian Sharpness: {laplacianScore} (Minimum Required: 100). Please upload a focused photo.
            </span>
          </div>
        )}

        {isGateValid && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11.8px] font-bold text-emeraldOk">
              <span>✓</span>
              <span>OpenCV Focus Verified</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11.8px] font-bold text-emeraldOk">
              <span>✓</span>
              <span>LLM Skin Region Confirmed</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
