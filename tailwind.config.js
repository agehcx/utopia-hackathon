/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        canvas: '#E9E9E7',
        paper: '#F6F6F4',
        mute: '#8A8A86',
        line: '#EDEDED',
        brand: { DEFAULT: '#FF6A1A', soft: '#FFE9DC', deep: '#C24400' },
        good: { DEFAULT: '#1F9D55', soft: '#E4F5EA' },
        bad: { DEFAULT: '#E5484D', soft: '#FDE8E9' },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
