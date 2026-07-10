import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: 'rgb(var(--brand-navy) / <alpha-value>)',
          royal: 'rgb(var(--brand-royal) / <alpha-value>)',
          gold: 'rgb(var(--brand-gold) / <alpha-value>)',
          orange: 'rgb(var(--brand-orange) / <alpha-value>)',
          white: 'rgb(var(--brand-white) / <alpha-value>)',
          ink: 'rgb(var(--brand-ink) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -6px rgba(10, 36, 114, 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;
