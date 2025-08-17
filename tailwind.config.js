/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            transform: 'translateY(-50%)',
            background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8))'
          },
          '50%': {
            transform: 'translateY(-50%)',
            background: 'linear-gradient(to bottom, rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to right, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8))'
          },
          '50%': {
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to right, rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8))'
          },
          '50%': {
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8))'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        accent: {
          500: '#ec4899',
          600: '#db2777',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}