/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Rubik', 'sans-serif'],
      },
      colors: {
        // רקעים נייטרליים מבוססי CSS variables (מתחלפים במצב כהה)
        cream: {
          DEFAULT: 'rgb(var(--c-bg) / <alpha-value>)',
          50: 'rgb(var(--c-surface-2) / <alpha-value>)',
          100: 'rgb(var(--c-surface-3) / <alpha-value>)',
          200: 'rgb(var(--c-muted) / <alpha-value>)',
        },
        // משטח כרטיסים (לבן במצב בהיר, כהה במצב כהה)
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        sand: '#F3E7D3',
        // צבע המותג הראשי - טורקיז/ירוק כהה (הכפתורים בעיצוב)
        teal: {
          50: '#E6F1F2',
          100: '#C2DEE0',
          200: '#8FC0C4',
          300: '#57A0A6',
          400: '#2D8088',
          500: '#15616D',
          600: '#114E58',
          700: '#0E3F47',
          800: '#0A2F35',
          900: '#071F23',
          DEFAULT: '#15616D',
        },
        // צהוב/כתום שמשי (כרטיס הכותרת)
        sun: {
          50: '#FEF6E7',
          100: '#FDE9C2',
          200: '#FAD389',
          300: '#F8BE55',
          400: '#F5A93C',
          500: '#EF9522',
          600: '#D97D12',
          DEFAULT: '#F5A93C',
        },
        // אלמון/אדום (כרטיסי הדגשה)
        coral: {
          50: '#FDECEC',
          100: '#FAD2D4',
          200: '#F4A7AB',
          300: '#EE7C83',
          400: '#EC6A6A',
          500: '#E14B57',
          600: '#C73746',
          DEFAULT: '#EC6A6A',
        },
        // ורוד רך
        blush: {
          50: '#FEF1F3',
          100: '#FBDCE1',
          200: '#F6C9CE',
          300: '#F0AFB7',
          DEFAULT: '#F6C9CE',
        },
        // תכלת רך
        sky: {
          50: '#EBF7F9',
          100: '#D2EDF1',
          200: '#BFE3E8',
          300: '#9BD2DA',
          DEFAULT: '#BFE3E8',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(42, 38, 32, 0.14)',
        card: '0 10px 30px -12px rgba(42, 38, 32, 0.18)',
        float: '0 16px 40px -14px rgba(21, 97, 109, 0.28)',
        glow: '0 8px 26px -6px rgba(245, 169, 60, 0.45)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.1)', opacity: '0' },
          '100%': { transform: 'scale(1.1)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(-100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
