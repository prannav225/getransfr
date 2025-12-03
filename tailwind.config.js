/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        dropmate: {
          // Primary Brand Color
          primary: {
            DEFAULT: '#6366F1',
            dark: '#818CF8',
          },
          // Background Base
          bg: {
            DEFAULT: '#F4F4F5',
            dark: '#18181B',
          },
          // Text Colors
          text: {
            primary: {
              DEFAULT: '#111827',
              dark: '#F9FAFB',
            },
            muted: {
              DEFAULT: '#6B7280',
              dark: '#A1A1AA',
            },
          },
          // Accent Colors
          accent: {
            mint: {
              DEFAULT: '#2DD4BF',
              dark: '#5EEAD4',
            },
            pink: {
              DEFAULT: '#F472B6',
              dark: '#FB7185',
            },
          },
          // Card Background
          card: {
            DEFAULT: '#FFFFFF',
            dark: '#27272A',
          },
          // Border Colors
          border: {
            DEFAULT: '#E4E4E7',
            dark: '#3F3F46',
          },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-bg-light': 'radial-gradient(circle at top right, #F4F4F5 0%, #E4E4E7 100%)',
        'gradient-bg-dark': 'radial-gradient(circle at top right, #1E1B4B 0%, #18181B 100%)',
        'gradient-card-light': 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.9) 100%)',
        'gradient-card-dark': 'linear-gradient(135deg, rgba(39,39,42,0.4) 0%, rgba(39,39,42,0.6) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
        'gradient-accent-hover': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(99,102,241,0.1)',
        'soft-dark': '0 4px 20px rgba(0,0,0,0.3)',
        'glow': '0 0 30px rgba(99,102,241,0.3)',
        'glow-dark': '0 0 30px rgba(99,102,241,0.15)',
        'inner-light': 'inset 0 2px 4px rgba(0,0,0,0.05)',
        'inner-dark': 'inset 0 2px 4px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        radar: 'radar 2s infinite linear',
        breathe: 'breathe 3s infinite ease-in-out',
        float: 'float 6s infinite ease-in-out',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}