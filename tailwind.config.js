const weapon = {
  outline: '#05080f',
  iron1: '#a7aeb6', iron2: '#8a9199', iron3: '#646b73', iron4: '#4e545b', ironline: '#d9dee4',
  steel1: '#eef4fb', steel2: '#b8c6d6', steel3: '#7d8fa5', steel4: '#4f5f75',
  frost1: '#4a6296', frost2: '#28396a', frost3: '#162040', frost4: '#0b1226',
  shade1: '#6a48b0', shade2: '#3b2778', shade3: '#21154a', shade4: '#0f0826',
  light1: '#ffffff', light2: '#c4f7ff', light3: '#63d3ec', light4: '#2a8fb8',
  gold1: '#f8dc82', gold2: '#9a6b1e',
  guard1: '#55617a', guard2: '#1a2233',
  plum1: '#6b57a8', plum2: '#1a1233',
  grip1: '#2d3342', grip2: '#12151c', grip6: '#3a1d3a',
  ice: '#7ad8ff', violet: '#8a5cff', white: '#ffffff', frostwhite: '#e6ffff', halo: '#9be9ff',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        weapon,
        bg: '#070b16',
        panel: '#0c1424',
        cyan: { DEFAULT: '#2de2e6' },
        ink: '#e6f7ff',
        muted: '#8aa6bd',
        tier: { blue: '#4aa3ff', purple: '#b06cff', gold: '#ffc83d', red: '#ff4a4a' },
        log: { drop: '#ff9f43' },
        zone: { safe: '#3ddc97', drop: '#ffc83d', reset: '#ff4a4a' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Microsoft JhengHei', 'Noto Sans TC', 'PingFang TC', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(45,226,230,0.25)',
        glowStrong: '0 0 18px rgba(45,226,230,0.5)',
      },
    },
  },
  plugins: [
    ({ addBase }) => addBase({
      ':root': Object.fromEntries(Object.entries(weapon).map(([k, v]) => [`--w-${k}`, v])),
    }),
  ],
}
