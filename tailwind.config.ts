import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#fffefb',
        'cream-off': '#fffdf9',
        'warm-black': '#201515',
        charcoal: '#36342e',
        'warm-gray': '#939084',
        sand: '#c5c0b1',
        'mid-warm': '#b5b2aa',
        'light-sand': '#eceae3',
        accent: '#ff4f00',
        'accent-hover': '#e64500',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
