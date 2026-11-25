/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        slateDeep: '#0F172A',
        medicalTeal: '#0D9488',
        medicalTealDark: '#0F766E',
        coralAlert: '#DC2626',
        amberWarn: '#D97706',
        emeraldOk: '#059669',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 24px -6px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        shell: '0 24px 60px -15px rgba(15, 23, 42, 0.14), 0 0 1px 1px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
