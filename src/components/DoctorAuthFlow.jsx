import React, { useEffect, useRef, useState } from 'react';
import InnovaLogo from './InnovaLogo';
import {
  DEMO_DOCTOR_PROFILE,
  DEMO_LICENSE_PRESETS,
  FACILITY_TYPES,
  PH_REGIONS,
  SPECIALTIES,
  createSamplePrcIdDataUrl,
  createVerificationReference,
  downscaleImageFile,
  formatPhMobile,
  generateOtp,
  hashPassword,
  isValidEmail,
  isValidPhMobile,
  isValidPrcLicenseFormat,
  loadAccount,
  maskEmail,
  maskPhMobile,
  passwordChecks,
  passwordStrength,
  runPrcVerificationChecks,
  saveAccount,
  setSession,
} from '../utils/doctorAuth';

const SIGNUP_STEPS = [
  { num: 1, label: '1. Account' },
  { num: 2, label: '2. Practice' },
  { num: 3, label: '3. PRC ID' },
  { num: 4, label: '4. Verify' },
];

export default function DoctorAuthFlow({ onAuthenticated, initialMode = 'signup' }) {
  const existingAccount = loadAccount();
  const [mode, setMode] = useState(
    initialMode === 'signin' && existingAccount ? 'signin' : 'signup'
  );
  const [step, setStep] = useState(1);

  // Sign-In Form State
  const [loginEmail, setLoginEmail] = useState(existingAccount?.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Step 1 — Identity & Credentials
  const [title, setTitle] = useState('Dr.');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileDigits, setMobileDigits] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Step 2 — Clinical Practice Profile
  const [specialty, setSpecialty] = useState('General Practitioner');
  const [facilityName, setFacilityName] = useState('');
  const [facilityType, setFacilityType] = useState('Rural Health Unit (RHU)');
  const [region, setRegion] = useState('NCR — National Capital Region');
  const [city, setCity] = useState('');
  const [yearsInPractice, setYearsInPractice] = useState('5');
  const [philhealthNo, setPhilhealthNo] = useState('');

  // Step 3 — PRC Medical License Verification
  const [prcLicense, setPrcLicense] = useState('');
  const [prcRegistrationDate, setPrcRegistrationDate] = useState('');
  const [prcExpiryDate, setPrcExpiryDate] = useState('');
  const [prcIdImage, setPrcIdImage] = useState(null);
  const [isVerifyingPrc, setIsVerifyingPrc] = useState(false);
  const [prcChecks, setPrcChecks] = useState([]);
  const [revealedCheckCount, setRevealedCheckCount] = useState(0);
  const [prcVerifiedRecord, setPrcVerifiedRecord] = useState(null);

  // Step 4 — OTP & Privacy Attestation
  const [otpTarget, setOtpTarget] = useState('mobile'); // 'mobile' | 'email'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [privacyAttested, setPrivacyAttested] = useState(false);
  const [stepError, setStepError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarInputRef = useRef(null);
  const prcFileInputRef = useRef(null);
  const verifyTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      verifyTimersRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  // Automatically issue a simulated OTP upon arriving at Step 4
  useEffect(() => {
    if (mode === 'signup' && step === 4 && !generatedOtp) {
      setGeneratedOtp(generateOtp());
      setOtpInput('');
      setOtpVerified(false);
      setOtpError('');
    }
  }, [mode, step, generatedOtp]);

  const clearPrcVerification = () => {
    verifyTimersRef.current.forEach((id) => clearTimeout(id));
    verifyTimersRef.current = [];
    setIsVerifyingPrc(false);
    setPrcChecks([]);
    setRevealedCheckCount(0);
    setPrcVerifiedRecord(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await downscaleImageFile(file, 256, 0.82);
      setAvatarUrl(url);
    } catch {
      setStepError('Could not read selected profile image.');
    }
  };

  const handlePrcIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await downscaleImageFile(file, 680, 0.82);
      setPrcIdImage(url);
      clearPrcVerification();
    } catch {
      setStepError('Could not read PRC ID image file.');
    }
  };

  const handleGenerateSamplePrcId = () => {
    const sampleUrl = createSamplePrcIdDataUrl({
      firstName: firstName || 'Maria',
      middleName: middleName || 'S',
      lastName: lastName || 'Reyes',
      prcLicense: prcLicense || '0712345',
      prcRegistrationDate: prcRegistrationDate || '2015-06-18',
      prcExpiryDate: prcExpiryDate || '2028-03-14',
    });
    setPrcIdImage(sampleUrl);
    clearPrcVerification();
  };

  const applyLicensePreset = (presetKey) => {
    const preset = DEMO_LICENSE_PRESETS[presetKey];
    if (!preset) return;
    setPrcLicense(preset.prcLicense);
    setPrcRegistrationDate(preset.prcRegistrationDate);
    setPrcExpiryDate(preset.prcExpiryDate);
    setPrcIdImage(
      createSamplePrcIdDataUrl({
        firstName: firstName || 'Maria',
        middleName: middleName || 'S',
        lastName: lastName || 'Reyes',
        prcLicense: preset.prcLicense,
        prcRegistrationDate: preset.prcRegistrationDate,
        prcExpiryDate: preset.prcExpiryDate,
      })
    );
    clearPrcVerification();
    setStepError('');
  };

  const handleRunPrcVerification = () => {
    setStepError('');
    clearPrcVerification();

    const results = runPrcVerificationChecks({
      prcLicense,
      prcRegistrationDate,
      prcExpiryDate,
      firstName: firstName || 'Clinician',
      middleName,
      lastName: lastName || 'Physician',
      hasIdDocument: Boolean(prcIdImage),
    });

    // Stop animating at the first failure so the clinician sees exact blocking check
    const firstFailIdx = results.findIndex((c) => c.status === 'fail');
    const displayList = firstFailIdx >= 0 ? results.slice(0, firstFailIdx + 1) : results;

    setPrcChecks(displayList);
    setIsVerifyingPrc(true);
    setRevealedCheckCount(0);

    displayList.forEach((_, idx) => {
      const t = setTimeout(() => {
        setRevealedCheckCount(idx + 1);
        if (idx === displayList.length - 1) {
          setIsVerifyingPrc(false);
          if (firstFailIdx === -1) {
            setPrcVerifiedRecord({
              status: 'verified',
              method: 'Simulated PRC Registry Lookup',
              referenceId: createVerificationReference(prcLicense),
              verifiedAt: new Date().toISOString(),
            });
          } else {
            setPrcVerifiedRecord(null);
          }
        }
      }, (idx + 1) * 240);
      verifyTimersRef.current.push(t);
    });
  };

  const validateAndAdvance = () => {
    setStepError('');
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError('Enter both your first and last name as registered on your PRC ID.');
        return;
      }
      if (!isValidEmail(email)) {
        setStepError('Enter a valid clinical or work email address.');
        return;
      }
      if (!isValidPhMobile(mobileDigits)) {
        setStepError('Enter a valid 10-digit Philippine mobile number starting with 9 (e.g. 917 123 4567).');
        return;
      }
      const pwStrength = passwordStrength(password);
      if (pwStrength.score < 3) {
        setStepError('Choose a stronger password (at least 8 characters with uppercase, lowercase, and a number).');
        return;
      }
      if (password !== confirmPassword) {
        setStepError('Password confirmation does not match.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!facilityName.trim()) {
        setStepError('Enter your primary clinic, RHU, or hospital facility name.');
        return;
      }
      if (!city.trim()) {
        setStepError('Enter your city or municipality.');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!prcVerifiedRecord) {
        setStepError('Complete PRC license verification before proceeding.');
        return;
      }
      setStep(4);
    }
  };

  const handleVerifyOtp = () => {
    setOtpError('');
    if (otpInput.trim() === generatedOtp) {
      setOtpVerified(true);
    } else {
      setOtpVerified(false);
      setOtpError('Incorrect 6-digit verification code. Check the simulated OTP banner above.');
    }
  };

  const handleResendOtp = () => {
    const next = generateOtp();
    setGeneratedOtp(next);
    setOtpInput('');
    setOtpVerified(false);
    setOtpError('');
  };

  const handleCompleteSignup = async () => {
    setStepError('');
    if (!otpVerified) {
      setStepError('Verify your 6-digit contact code first.');
      return;
    }
    if (!privacyAttested) {
      setStepError('Accept the Licensed Physician & Data Privacy attestation to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      const passwordHash = await hashPassword(password);
      const cleanFirst = firstName.trim();
      const cleanMiddle = middleName.trim();
      const cleanLast = lastName.trim();
      const fullName = [cleanFirst, cleanMiddle, cleanLast].filter(Boolean).join(' ');
      const profile = {
        id: `doc-${Date.now()}`,
        title,
        firstName: cleanFirst,
        middleName: cleanMiddle,
        lastName: cleanLast,
        fullName,
        displayName: `${title} ${cleanFirst} ${cleanLast}`,
        email: email.trim().toLowerCase(),
        mobile: `+63${mobileDigits}`,
        specialty,
        facilityName: facilityName.trim(),
        facilityType,
        region,
        city: city.trim(),
        yearsInPractice,
        philhealthNo: philhealthNo.trim(),
        prcLicense,
        prcRegistrationDate,
        prcExpiryDate,
        photo: avatarUrl,
        prcIdImage,
        passwordHash,
        verification: prcVerifiedRecord,
        createdAt: new Date().toISOString(),
      };
      saveAccount(profile);
      setSession(true);
      onAuthenticated(profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoginError('');
    const stored = loadAccount();
    if (!stored) {
      setLoginError('No clinician account saved in this browser yet. Switch to Sign Up or use the Demo Physician.');
      return;
    }
    if (stored.email.toLowerCase() !== loginEmail.trim().toLowerCase()) {
      setLoginError('Email does not match the registered clinician account on this device.');
      return;
    }
    const candidateHash = await hashPassword(loginPassword);
    if (stored.passwordHash && candidateHash !== stored.passwordHash) {
      setLoginError('Incorrect password. Please try again.');
      return;
    }
    setSession(true);
    onAuthenticated(stored);
  };

  const handleContinueAsDemoDoctor = () => {
    saveAccount(DEMO_DOCTOR_PROFILE);
    setSession(true);
    onAuthenticated(DEMO_DOCTOR_PROFILE);
  };

  const pwChecks = passwordChecks(password);
  const pwStrength = passwordStrength(password);

  return (
    <div className="flex flex-1 flex-col bg-canvas px-4 pt-3 pb-6">
      {/* Compact Brand Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <InnovaLogo variant="emblem" className="h-12 w-12 object-cover object-[center_34%]" />
          </span>
          <div>
            <div className="text-[16px] font-extrabold leading-tight tracking-tight text-slateDeep">
              InnovaTech Clinician Portal
            </div>
            <div className="text-[11px] font-semibold text-medicalTeal">
              Licensed Physician Onboarding &amp; PRC Verification
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Sign Up vs. Sign In */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white/85 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setLoginError('');
          }}
          className={`min-h-[44px] rounded-lg text-[12.5px] font-extrabold transition ${
            mode === 'signup'
              ? 'bg-medicalTeal text-white shadow-sm'
              : 'text-slate-600 hover:text-slateDeep'
          }`}
        >
          Doctor Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setStepError('');
          }}
          className={`min-h-[44px] rounded-lg text-[12.5px] font-extrabold transition ${
            mode === 'signin'
              ? 'bg-slateDeep text-white shadow-sm'
              : 'text-slate-600 hover:text-slateDeep'
          }`}
        >
          Sign In
        </button>
      </div>

      {/* ====================================================================
          SIGN IN VIEW
          ==================================================================== */}
      {mode === 'signin' && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <div className="glass-card p-4">
            <span className="text-[10.8px] font-extrabold uppercase tracking-wider text-medicalTeal">
              Returning Clinician
            </span>
            <h2 className="mt-0.5 text-[16.5px] font-extrabold text-slateDeep">
              Sign in to GP Mobile Triage
            </h2>
            <p className="mt-0.5 mb-3 text-[12px] text-slate-500">
              Access your verified physician profile and screening workspace.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-slateDeep" htmlFor="signin-email">
                  Work Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="dr.santos@rhu.gov.ph"
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[13.5px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold text-slateDeep" htmlFor="signin-pw">
                  Password
                </label>
                <input
                  id="signin-pw"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[13.5px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                />
              </div>
            </div>

            {loginError && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-[12px] font-semibold text-coralAlert"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-medicalTeal px-4 text-[14.5px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark"
            >
              Sign In &amp; Launch Screening →
            </button>
          </div>

          <button
            type="button"
            onClick={handleContinueAsDemoDoctor}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[12.5px] font-extrabold text-slateDeep transition hover:border-medicalTeal hover:text-medicalTeal"
          >
            <span>Quick Demo: Continue as Dr. Maria Reyes (PRC #0712345)</span>
          </button>
        </form>
      )}

      {/* ====================================================================
          MULTI-STEP DOCTOR SIGN UP FLOW (4 STEPS)
          ==================================================================== */}
      {mode === 'signup' && (
        <div className="flex flex-col gap-3">
          {/* 4-Step Progress Bar */}
          <div className="flex items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white/85 p-1">
            {SIGNUP_STEPS.map((st) => {
              const active = step === st.num;
              const done = step > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  disabled={st.num > step}
                  onClick={() => {
                    if (st.num < step) {
                      setStep(st.num);
                      setStepError('');
                    }
                  }}
                  className={`min-h-[38px] flex-1 rounded-lg px-1 text-[10.8px] font-bold transition ${
                    active
                      ? 'bg-medicalTeal text-white shadow-sm'
                      : done
                      ? 'bg-emerald-50 text-emeraldOk'
                      : 'text-slate-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {done ? `✓ ${st.label.slice(3)}` : st.label}
                </button>
              );
            })}
          </div>

          {/* STEP 1 — Account & Personal Identity */}
          {step === 1 && (
            <div className="glass-card p-4">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Step 1 of 4 · Physician Identity
              </span>
              <h2 className="mt-0.5 mb-3 text-[16px] font-extrabold text-slateDeep">
                Create Your Clinician Account
              </h2>

              {/* Profile Photo Picker */}
              <div className="mb-3.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarUpload}
                />
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-medicalTeal/40 bg-white text-[16px] font-extrabold text-medicalTeal">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Doctor avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <span>
                      {(firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'MD'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.2px] font-extrabold text-slateDeep">
                    Clinician Profile Photo
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Optional · Shown on header &amp; referral report
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="min-h-[40px] shrink-0 rounded-full border border-slate-300 bg-white px-3 text-[11.5px] font-bold text-slateDeep hover:border-medicalTeal"
                >
                  {avatarUrl ? 'Change' : 'Upload'}
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-title">
                      Title
                    </label>
                    <select
                      id="doc-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-2 text-[13px] font-bold text-slateDeep focus:border-medicalTeal focus:outline-none"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="MD">MD</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-first">
                      First Name *
                    </label>
                    <input
                      id="doc-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Maria"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-middle">
                      Middle Name
                    </label>
                    <input
                      id="doc-middle"
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Santos"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-last">
                      Last Name *
                    </label>
                    <input
                      id="doc-last"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Reyes"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-email">
                    Clinical / Work Email *
                  </label>
                  <input
                    id="doc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria.reyes@rhu.gov.ph"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-mobile">
                    Philippine Mobile Number *
                  </label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-medicalTeal">
                    <span className="border-r border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[12.5px] font-bold text-slate-600">
                      +63
                    </span>
                    <input
                      id="doc-mobile"
                      type="tel"
                      inputMode="numeric"
                      value={formatPhMobile(mobileDigits)}
                      onChange={(e) =>
                        setMobileDigits(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="917 123 4567"
                      className="min-h-[44px] w-full px-3 font-mono text-[13px] font-semibold text-slateDeep focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11.5px] font-bold text-slateDeep" htmlFor="doc-pw">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-[11px] font-bold text-medicalTeal"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="doc-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars, mixed case & number"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />

                  {/* Live Password Strength Meter */}
                  {password && (
                    <div className="mt-1.5">
                      <div className="mb-1 flex items-center justify-between text-[10.8px] font-bold">
                        <span className="text-slate-500">Password strength</span>
                        <span style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <span
                            key={bar}
                            className="h-1.5 rounded-full transition-colors"
                            style={{
                              backgroundColor:
                                pwStrength.score >= bar ? pwStrength.color : '#E2E8F0',
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10.4px] font-semibold">
                        {pwChecks.map((c) => (
                          <span
                            key={c.id}
                            className={c.ok ? 'text-emeraldOk' : 'text-slate-400'}
                          >
                            {c.ok ? '✓' : '○'} {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-pw-confirm">
                    Confirm Password *
                  </label>
                  <input
                    id="doc-pw-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Clinical Practice Profile */}
          {step === 2 && (
            <div className="glass-card p-4">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Step 2 of 4 · Practice Details
              </span>
              <h2 className="mt-0.5 mb-3 text-[16px] font-extrabold text-slateDeep">
                Clinical Practice Profile
              </h2>

              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-spec">
                    Medical Specialty *
                  </label>
                  <select
                    id="doc-spec"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                  >
                    {SPECIALTIES.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-fac">
                    Primary Clinic / RHU / Hospital Name *
                  </label>
                  <input
                    id="doc-fac"
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="e.g., Quezon City RHU 3"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13.2px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-factype">
                    Facility Type *
                  </label>
                  <select
                    id="doc-factype"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                  >
                    {FACILITY_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-region">
                    Region (Philippines) *
                  </label>
                  <select
                    id="doc-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[12.8px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
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
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-city">
                      City / Municipality *
                    </label>
                    <input
                      id="doc-city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Quezon City"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-yrs">
                      Years in Practice
                    </label>
                    <input
                      id="doc-yrs"
                      type="number"
                      min="0"
                      max="60"
                      value={yearsInPractice}
                      onChange={(e) => setYearsInPractice(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-[13px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-phic">
                    PhilHealth Accreditation No. (Optional)
                  </label>
                  <input
                    id="doc-phic"
                    type="text"
                    value={philhealthNo}
                    onChange={(e) => setPhilhealthNo(e.target.value)}
                    placeholder="e.g., 1502-1234567-8"
                    className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 font-mono text-[13px] font-medium text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — PRC Medical License Verification */}
          {step === 3 && (
            <div className="glass-card p-4">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Step 3 of 4 · Credential Gatekeeper
              </span>
              <h2 className="mt-0.5 text-[16px] font-extrabold text-slateDeep">
                PRC Physician License Verification
              </h2>
              <p className="mt-0.5 mb-2.5 text-[11.8px] text-slate-500">
                Simulated PRC LERIS registry &amp; ID check for prototype evaluation.
              </p>

              {/* Quick Test Presets */}
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <span className="mb-1.5 block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                  Quick-Fill Test Presets:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyLicensePreset('valid')}
                    className="min-h-[38px] rounded-lg border border-emerald-200 bg-emerald-50 px-1.5 text-[11px] font-extrabold text-emeraldOk hover:bg-emerald-100"
                  >
                    ✓ Valid ID
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLicensePreset('expired')}
                    className="min-h-[38px] rounded-lg border border-amber-200 bg-amber-50 px-1.5 text-[11px] font-extrabold text-amberWarn hover:bg-amber-100"
                  >
                    ! Expired ID
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLicensePreset('notFound')}
                    className="min-h-[38px] rounded-lg border border-red-200 bg-red-50 px-1.5 text-[11px] font-extrabold text-coralAlert hover:bg-red-100"
                  >
                    ✕ Not Found
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11.5px] font-bold text-slateDeep" htmlFor="doc-prc-num">
                    <span>PRC License Number (7 Digits) *</span>
                    <span
                      className={`font-mono text-[10.8px] ${
                        isValidPrcLicenseFormat(prcLicense) ? 'text-emeraldOk' : 'text-slate-400'
                      }`}
                    >
                      {prcLicense.length}/7
                    </span>
                  </label>
                  <input
                    id="doc-prc-num"
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={prcLicense}
                    onChange={(e) => {
                      setPrcLicense(e.target.value.replace(/\D/g, '').slice(0, 7));
                      clearPrcVerification();
                    }}
                    placeholder="0712345"
                    className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-[15px] font-extrabold tracking-[0.12em] text-slateDeep focus:border-medicalTeal focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-prc-reg">
                      Registration Date *
                    </label>
                    <input
                      id="doc-prc-reg"
                      type="date"
                      value={prcRegistrationDate}
                      onChange={(e) => {
                        setPrcRegistrationDate(e.target.value);
                        clearPrcVerification();
                      }}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] font-bold text-slateDeep" htmlFor="doc-prc-exp">
                      ID Valid Until *
                    </label>
                    <input
                      id="doc-prc-exp"
                      type="date"
                      value={prcExpiryDate}
                      onChange={(e) => {
                        setPrcExpiryDate(e.target.value);
                        clearPrcVerification();
                      }}
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slateDeep focus:border-medicalTeal focus:outline-none"
                    />
                  </div>
                </div>

                {/* PRC ID Document Upload / Sample Card Generator */}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
                  <input
                    ref={prcFileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handlePrcIdUpload}
                  />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-extrabold text-slateDeep">
                      PRC ID Front Photo *
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500">
                      {prcIdImage ? 'Document Attached ✓' : 'Required'}
                    </span>
                  </div>

                  {prcIdImage && (
                    <div className="mb-2.5 overflow-hidden rounded-lg border border-slate-300 bg-white">
                      <img
                        src={prcIdImage}
                        alt="Uploaded PRC License ID"
                        className="aspect-[16/10] w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => prcFileInputRef.current?.click()}
                      className="min-h-[42px] rounded-full bg-slateDeep px-3 text-[11.5px] font-bold text-white hover:bg-slate-800"
                    >
                      Upload PRC Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSamplePrcId}
                      className="min-h-[42px] rounded-full border border-medicalTeal/40 bg-white px-3 text-[11.5px] font-extrabold text-medicalTeal hover:bg-teal-50"
                    >
                      Use Sample PRC ID
                    </button>
                  </div>
                </div>

                {/* Run PRC Verification Pipeline Button */}
                <button
                  type="button"
                  disabled={isVerifyingPrc}
                  onClick={handleRunPrcVerification}
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-slateDeep px-4 text-[13.5px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {isVerifyingPrc ? 'Verifying against PRC Registry...' : 'Verify PRC License Now'}
                </button>

                {/* Live Animated 6-Step PRC Verification Checklist */}
                {prcChecks.length > 0 && (
                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
                    {prcChecks.slice(0, revealedCheckCount).map((chk) => (
                      <div key={chk.id} className="flex items-start gap-2 text-[11.8px]">
                        <span
                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white ${
                            chk.status === 'pass'
                              ? 'bg-emeraldOk'
                              : chk.status === 'warn'
                              ? 'bg-amberWarn'
                              : 'bg-coralAlert'
                          }`}
                        >
                          {chk.status === 'pass' ? '✓' : chk.status === 'warn' ? '!' : '✕'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-slateDeep">{chk.label}: </span>
                          <span
                            className={
                              chk.status === 'fail'
                                ? 'font-semibold text-coralAlert'
                                : 'text-slate-600'
                            }
                          >
                            {chk.detail}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {prcVerifiedRecord && (
                  <div
                    role="status"
                    className="rounded-xl border-[1.5px] border-emeraldOk bg-emerald-50 p-3 text-[12px] text-emerald-950"
                  >
                    <div className="font-extrabold text-emeraldOk">
                      ✓ PRC Physician License Verified
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] font-semibold">
                      Ref: {prcVerifiedRecord.referenceId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 — Contact OTP & Clinical Privacy Attestation */}
          {step === 4 && (
            <div className="glass-card p-4">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-medicalTeal">
                Step 4 of 4 · Final Security Check
              </span>
              <h2 className="mt-0.5 mb-2 text-[16px] font-extrabold text-slateDeep">
                Contact Verification &amp; Attestation
              </h2>

              {/* Channel Toggle */}
              <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOtpTarget('mobile');
                    handleResendOtp();
                  }}
                  className={`min-h-[40px] rounded-xl border px-2 text-[11.5px] font-bold transition ${
                    otpTarget === 'mobile'
                      ? 'border-medicalTeal bg-teal-50 text-medicalTeal'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  SMS ({maskPhMobile(`+63${mobileDigits}`)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpTarget('email');
                    handleResendOtp();
                  }}
                  className={`min-h-[40px] rounded-xl border px-2 text-[11.5px] font-bold transition ${
                    otpTarget === 'email'
                      ? 'border-medicalTeal bg-teal-50 text-medicalTeal'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Email ({maskEmail(email)})
                </button>
              </div>

              {/* Prototype Simulated OTP Banner */}
              <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px]">
                <div>
                  <span className="block text-[10px] font-extrabold uppercase text-amberWarn">
                    Simulated Demo OTP Code
                  </span>
                  <span className="font-mono text-[15px] font-extrabold tracking-[0.2em] text-slateDeep">
                    {generatedOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpInput(generatedOtp);
                    setOtpVerified(true);
                    setOtpError('');
                  }}
                  className="min-h-[38px] rounded-full bg-slateDeep px-3 text-[11px] font-bold text-white"
                >
                  Auto-Fill
                </button>
              </div>

              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(clean);
                    setOtpVerified(false);
                    setOtpError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="min-h-[46px] flex-1 rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-[15px] font-extrabold tracking-[0.18em] text-slateDeep focus:border-medicalTeal focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="min-h-[46px] shrink-0 rounded-xl bg-medicalTeal px-4 text-[12.5px] font-bold text-white hover:bg-medicalTealDark"
                >
                  Confirm
                </button>
              </div>

              {otpError && (
                <p className="mb-2.5 text-[11.5px] font-semibold text-coralAlert">{otpError}</p>
              )}

              {otpVerified && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emeraldOk">
                  ✓ Contact {otpTarget === 'mobile' ? 'mobile' : 'email'} verified
                </div>
              )}

              {/* Credential Summary Card */}
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11.8px]">
                <div className="font-extrabold text-slateDeep">
                  {title} {firstName} {lastName} · {specialty}
                </div>
                <div className="mt-0.5 text-slate-600">
                  {facilityName} ({city})
                </div>
                <div className="mt-1 font-mono text-[11px] font-bold text-emeraldOk">
                  PRC Lic. #{prcLicense} · Verified ({prcVerifiedRecord?.referenceId})
                </div>
              </div>

              {/* Mandatory Licensed Physician & RA 10173 Privacy Attestation */}
              <label
                htmlFor="privacy-attest-box"
                className={`flex min-h-[54px] cursor-pointer items-start gap-2.5 rounded-xl border-[1.5px] p-3 transition ${
                  privacyAttested
                    ? 'border-medicalTeal bg-medicalTeal/5'
                    : 'border-slate-300 bg-white'
                }`}
              >
                <input
                  id="privacy-attest-box"
                  type="checkbox"
                  checked={privacyAttested}
                  onChange={(e) => setPrivacyAttested(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-medicalTeal"
                />
                <span className="text-[12px] font-semibold leading-snug text-slateDeep">
                  I attest that I am a PRC-licensed physician using InnovaTech solely as a preliminary triage aid in compliance with the Philippine Data Privacy Act (RA 10173).
                </span>
              </label>
            </div>
          )}

          {/* Error Banner */}
          {stepError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-coralAlert"
            >
              {stepError}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s - 1);
                  setStepError('');
                }}
                className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-slateDeep px-4 text-[13.5px] font-bold text-white"
              >
                ← Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={validateAndAdvance}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-medicalTeal px-4 text-[14.2px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark"
              >
                Continue to Step {step + 1} →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || !otpVerified || !privacyAttested}
                onClick={handleCompleteSignup}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-medicalTeal px-4 text-[14px] font-bold text-white shadow-md shadow-medicalTeal/25 transition hover:bg-medicalTealDark disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting ? 'Creating Verified Profile...' : 'Complete Verified Setup →'}
              </button>
            )}
          </div>

          {/* 1-Tap Demo Clinician Shortcut */}
          <button
            type="button"
            onClick={handleContinueAsDemoDoctor}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-[12px] font-bold text-slate-600 transition hover:border-medicalTeal hover:text-medicalTeal"
          >
            Skip for Demo · Use Dr. Maria Reyes (PRC #0712345)
          </button>
        </div>
      )}
    </div>
  );
}
