import React, { useState } from 'react';

export default function InnovaLogo({ variant = 'full', className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    const isEmblemOnly = variant === 'emblem';
    return (
      <svg
        viewBox={isEmblemOnly ? '25 22 175 148' : '0 0 220 220'}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="InnovaTech Wave and Ribbon Logo"
      >
        <g fill="#0F172A">
          <path d="M108 32c-34 4-62 34-62 72 0 36 26 65 64 67 28 2 52-11 63-31-14 10-33 14-51 8-22-7-34-28-31-51 3-22 20-38 42-40 12-1 22 3 30 9-5-20-26-37-55-34z" />
          <circle cx="52" cy="56" r="4.5" />
          <circle cx="40" cy="78" r="3.8" />
          <circle cx="38" cy="108" r="4" />
          <circle cx="156" cy="58" r="4" />
          <circle cx="168" cy="76" r="4.5" />
          <path
            d="M162 140c6-16 6-34 14-36 10-2 26 12 24 22-2 11-19 20-34 22z"
            fill="none"
            stroke="#0F172A"
            strokeWidth="4.5"
          />
          <path
            d="M167 136l14-26M171 138l19-20M175 140l21-12"
            stroke="#0F172A"
            strokeWidth="2.2"
          />
          <path d="M106 82c-9 0-15 8-15 17 0 9 7 18 16 28l-13 15 9 4 11-12 11 12 9-4-13-15c9-10 16-19 16-28 0-9-6-17-15-17h-16zm8 8c4 0 7 3 7 8 0 5-3 10-7 15-4-5-7-10-7-15 0-5 3-8 7-8z" />
          {!isEmblemOnly && (
            <text
              x="110"
              y="202"
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontWeight="800"
              fontSize="30"
              letterSpacing="-0.8"
            >
              InnovaTech
            </text>
          )}
        </g>
      </svg>
    );
  }

  return (
    <img
      src="/logo/INNOvatech.png"
      alt="InnovaTech Wave-and-Ribbon Clinical Logo"
      className={`${className} mix-blend-multiply`}
      onError={() => setImgFailed(true)}
    />
  );
}
