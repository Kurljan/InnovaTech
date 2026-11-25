import React, { useEffect, useState } from 'react';
import {
  FACILITY_TYPES,
  PH_REGIONS,
  SPECIALTIES,
  formatDisplayDate,
  getInitials,
  maskPhMobile,
} from '../utils/doctorAuth';

export default function DoctorProfileSheet({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onSignOut,
  onResetAccount,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [specialty, setSpecialty] = useState(profile?.specialty || 'General Practitioner');
  const [facilityName, setFacilityName] = useState(profile?.facilityName || '');
  const [facilityType, setFacilityType] = useState(profile?.facilityType || 'Rural Health Unit (RHU)');
  const [region, setRegion] = useState(profile?.region || 'NCR — National Capital Region');
  const [city, setCity] = useState(profile?.city || '');
  const [philhealthNo, setPhilhealthNo] = useState(profile?.philhealthNo || '');

  useEffect(() => {
    if (!profile) return;
    setSpecialty(profile.specialty || 'General Practitioner');
    setFacilityName(profile.facilityName || '');
    setFacilityType(profile.facilityType || 'Rural Health Unit (RHU)');
    setRegion(profile.region || 'NCR — National Capital Region');
    setCity(profile.city || '');
    setPhilhealthNo(profile.philhealthNo || '');
  }, [profile, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!profile) return null;

  const handleSaveEdit = () => {
    onUpdateProfile({
      ...profile,
      specialty,
      facilityName: facilityName.trim() || profile.facilityName,
      facilityType,
      region,
      city: city.trim() || profile.city,
      philhealthNo: philhealthNo.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div
      className={`taxonomy-backdrop no-print fixed inset-0 z-[88] flex items-end justify-center bg-slate-900/50 min-[460px]:absolute min-[460px]:inset-0 ${
        isOpen ? 'is-open' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-profile-sheet-title"
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="taxonomy-sheet flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[22px] border-t border-slate-300 bg-[#F8FAFC] sm:max-h-full sm:rounded-b-[27px]">
        <div className="flex shrink-0 justify-center bg-white pt-2 pb-1">
          <span className="h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-slate-200 bg-white px-4 pt-1 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emeraldOk/50 bg-emerald-50 text-[15px] font-extrabold text-emeraldOk">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{getInitials(profile)}</span>
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emeraldOk">
                ✓ PRC Verified Physician
              </span>
              <h2
                id="doctor-profile-sheet-title"
                className="mt-0.5 text-[15.5px] font-extrabold leading-tight text-slateDeep"
              >
                {profile.displayName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Clinician Profile"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slateDeep hover:bg-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain p-4">
          {/* Verified PRC Credential Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emeraldOk">
                PRC License Credentials
              </span>
              <span className="font-mono text-[10.5px] font-extrabold text-emerald-900">
                {profile.verification?.referenceId || 'PRC-VERIFIED'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <span className="block text-[10.2px] font-semibold text-emerald-800/80">
                  PRC License No.
                </span>
                <span className="font-mono text-[14px] font-extrabold text-slateDeep">
                  {profile.prcLicense}
                </span>
              </div>
              <div>
                <span className="block text-[10.2px] font-semibold text-emerald-800/80">
                  Valid Until
                </span>
                <span className="font-bold text-slateDeep">
                  {formatDisplayDate(profile.prcExpiryDate)}
                </span>
              </div>
            </div>
            {profile.prcIdImage && (
              <div className="mt-2.5 overflow-hidden rounded-lg border border-emerald-200 bg-white">
                <img
                  src={profile.prcIdImage}
                  alt="Verified PRC ID"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Practice & Contact Details (View or Edit Mode) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.8px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Clinical Practice Profile
              </span>
              <button
                type="button"
                onClick={() => setIsEditing((e) => !e)}
                className="text-[11.5px] font-extrabold text-medicalTeal hover:underline"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-2 text-[12.2px]">
                <div className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Specialty</span>
                  <span className="font-bold text-slateDeep">{profile.specialty}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Facility</span>
                  <span className="text-right font-bold text-slateDeep">{profile.facilityName}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Type</span>
                  <span className="text-right font-semibold text-slateDeep">{profile.facilityType}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Location</span>
                  <span className="text-right font-semibold text-slateDeep">
                    {profile.city}, {profile.region?.split(' — ')[0]}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slateDeep">{profile.email}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Mobile</span>
                  <span className="font-mono font-semibold text-slateDeep">
                    {maskPhMobile(profile.mobile)}
                  </span>
                </div>
                {profile.philhealthNo && (
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500">PhilHealth No.</span>
                    <span className="font-mono font-semibold text-slateDeep">
                      {profile.philhealthNo}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slateDeep">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-[12.5px] font-semibold"
                  >
                    {SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slateDeep">Facility Name</label>
                  <input
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[12.5px] font-medium"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slateDeep">Facility Type</label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-[12.5px] font-semibold"
                  >
                    {FACILITY_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slateDeep">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-[12px] font-semibold"
                  >
                    {PH_REGIONS.map((rg) => (
                      <option key={rg} value={rg}>
                        {rg}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slateDeep">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[12.5px] font-medium"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slateDeep">PhilHealth No.</label>
                    <input
                      type="text"
                      value={philhealthNo}
                      onChange={(e) => setPhilhealthNo(e.target.value)}
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-[12px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-medicalTeal px-4 text-[13px] font-bold text-white hover:bg-medicalTealDark"
                >
                  Save Profile Changes
                </button>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-slateDeep px-4 text-[13px] font-bold text-white hover:bg-slate-800"
            >
              Sign Out / Switch Clinician
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onResetAccount();
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-[12.2px] font-bold text-coralAlert hover:bg-red-100"
            >
              Register New Doctor Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
