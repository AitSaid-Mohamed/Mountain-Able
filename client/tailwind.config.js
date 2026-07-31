/**
 * Tailwind design system for the Mountain-Able platform.
 * Tokens are derived from the project Figma file (1440px design canvas).
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#21bf73', // brand green — headings, links, primary accents
        cta: '#25d366', // button green
        ink: '#2b2b2b', // body text
        cream: '#faf7f2', // page background
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Consolidated type scale (replaces the near-duplicate Figma sizes).
      fontSize: {
        display: ['42px', { lineHeight: '1.15', fontWeight: '600' }],
        h1: ['34px', { lineHeight: '1.2', fontWeight: '600' }],
        h2: ['27px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        body: ['16px', { lineHeight: '1.6' }],
        small: ['14px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        card: '10px',
        pill: '100px',
      },
      boxShadow: {
        card: '3px 4px 10px rgba(0,0,0,0.25)',
        input: '0 4px 10px 1px rgba(0,0,0,0.25)',
      },
      spacing: {
        13: '3.25rem', // 52px — design side gutter
      },
      maxWidth: {
        container: '1336px',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-h)' } },
      },
    },
  },
  plugins: [],
};
