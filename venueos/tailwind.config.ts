import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0b1220', 800: '#111a2e', 700: '#1a2540' },
        gold: { DEFAULT: '#b8924a', soft: '#d9bd85' },
        surface: 'var(--surface)', page: 'var(--page)', ink: 'var(--ink)', mute: 'var(--mute)', line: 'var(--line)',
      },
      fontFamily: { sans: ['var(--font-sans)', 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Kannada', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
