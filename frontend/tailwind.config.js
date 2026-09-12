/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b1220',
        'ink-soft': '#111a2e',
        panel: '#0f1830',
        line: 'rgba(228, 224, 214, 0.09)',
        parchment: '#f6f3ec',
        'parchment-dim': '#c9c6bd',
        gold: '#c9a227',
        'gold-soft': '#e3c766',
        teal: '#4a8f88',
        coral: '#c1584d',
        muted: '#8892a6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
