
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {

        'neon-blue': '#00d4ff',
        'neon-purple': '#7c3aed',
        'neon-cyan': '#06ffd4',
        'neon-pink': '#ff0090',
        'electric': '#0066ff',

        'dark-900': '#020409',
        'dark-800': '#040d1a',
        'dark-700': '#061022',
        'dark-600': '#0a1628',
        'dark-500': '#0d1f35',

        'glass-10': 'rgba(255,255,255,0.04)',
        'glass-20': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        'display': ['Instrument Serif', 'Georgia', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'outfit': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 50%, #ff0090 100%)',
        'hero-gradient': 'linear-gradient(to bottom, #020409, #040d1a, #020409)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'typing': 'typing 3.5s steps(40, end)',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'shimmer': 'shimmer 2s infinite',
        'rain': 'rain 1s linear infinite',
        'lightning': 'lightning 0.5s ease-in-out',
        'particle': 'particle 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
          '50%': { opacity: 0.7, boxShadow: '0 0 40px rgba(0, 212, 255, 0.9), 0 0 80px rgba(0, 212, 255, 0.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        rain: {
          '0%': { transform: 'translateY(-100px)', opacity: 1 },
          '100%': { transform: 'translateY(100vh)', opacity: 0 },
        },
        lightning: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
        particle: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '50%': { transform: 'translateY(-30px) rotate(180deg)', opacity: 0.5 },
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.2)',
        'neon-purple': '0 0 20px rgba(124, 58, 237, 0.5), 0 0 60px rgba(124, 58, 237, 0.2)',
        'neon-pink': '0 0 20px rgba(255, 0, 144, 0.5), 0 0 60px rgba(255, 0, 144, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-hover': '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
      }
    },
  },
  plugins: [],
}
