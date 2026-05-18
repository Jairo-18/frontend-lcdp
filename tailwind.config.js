/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        ink:      '#1a1c2c',
        'ink-soft': '#3a3d52',
        'ink-mute': '#6b6e85',
        yellow:   '#ffcb05',
        coral:    '#e23e57',
        paper:    '#faf8f3',
        'paper-alt': '#f4f1e8',
        rule:     '#e5dec8',
        'rule-soft': '#efe9d6',
      },
      fontFamily: {
        display:  ['Bricolage Grotesque', 'sans-serif'],
        faster:   ['Faster One', 'sans-serif'],
        hand:     ['Caveat', 'cursive'],
        alegreya: ['Alegreya', 'serif'],
        mono:     ['JetBrains Mono', 'monospace'],
        body:     ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        '3xl': '1920px',
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-up':    'slide-in-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
