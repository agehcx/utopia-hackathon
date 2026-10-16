/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        canvas: v('canvas'),
        paper: v('paper'),
        surface: v('surface'),
        mute: v('mute'),
        line: v('line'),
        brand: { DEFAULT: '#FF6A1A', soft: v('brand-soft'), deep: v('brand-deep') },
        auto: { DEFAULT: v('auto'), soft: v('auto-soft') },
        ask: { DEFAULT: v('brand-deep'), soft: v('brand-soft') },
        block: { DEFAULT: v('block'), soft: v('block-soft') },
        freeze: { DEFAULT: v('freeze'), soft: v('freeze-soft') },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
