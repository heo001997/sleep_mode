/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sleep/Wellness themed color palette
        primary: {
          50: '#f0f0ff',
          100: '#e6e6ff',
          200: '#d0d0ff',
          300: '#b3b3ff',
          400: '#9999ff',
          500: '#5D5FEF', // Primary brand color
          600: '#4d4fcc',
          700: '#3d3faa',
          800: '#2d2f88',
          900: '#1d1f66',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#e1eaff',
          200: '#c3d5ff',
          300: '#a5c0ff',
          400: '#87abff',
          500: '#6996ff',
          600: '#5478cc',
          700: '#3f5a99',
          800: '#2a3c66',
          900: '#151e33',
        },
        background: {
          light: '#E6E6FF', // Pastel blue background
          dark: '#121212',  // Dark mode background
        },
        sleep: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        wellness: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'sleep': '0 4px 6px -1px rgba(93, 95, 239, 0.1), 0 2px 4px -1px rgba(93, 95, 239, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

