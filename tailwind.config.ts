import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tc-black': '#0A0A0A',
        'tc-dark': '#0D0D0D',
        'tc-cream': '#F5F0EB',
        'tc-gold': '#D4AF37',
        'tc-red': '#C0392B',
        'tc-navy': '#1B2A5C',
        'tc-emerald': '#1A6B5A',
        'tc-burgundy': '#8B1A2F',
        'tc-mustard': '#C9982A',
        'tc-game-red': '#E8232A',
        'tc-game-orange': '#FF8C00',
        'tc-game-cyan': '#00E5FF',
        'tc-game-purple': '#7B2FBE',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        scroll: 'scroll 30s linear infinite',
        shake: 'shake 0.45s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.8)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'tc-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1a0a0a 100%)',
        'lounge-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #0D1B2A 100%)',
        'game-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1A0A1A 100%)',
      },
    },
  },
  plugins: [],
}

export default config
