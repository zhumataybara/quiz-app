/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#455EBC',
          dark: '#3A4D9F',
          light: '#5B75D9',
        },
        
        // Accent colors
        accent: {
          pink: '#F72843',
          purple: '#944BFF',
          orange: '#FF7826',
          teal: '#48D1A7',
        },
        
        // Background & Surface colors (dark theme)
        background: {
          DEFAULT: '#0A0B0F',
          elevated: '#222631',
          hover: '#2F374C',
        },
        
        // Text colors
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A6C0',
          muted: '#727C94',
        },
        
        // Status colors
        success: '#48D1A7',
        error: '#F72843',
        warning: '#FF7826',
        info: '#455EBC',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      
      fontSize: {
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-lg': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      
      spacing: {
        'mobile': '1rem',
        'tablet': '1.5rem',
        'desktop': '2rem',
      },
      
      borderRadius: {
        'card': '1rem',
        'button': '0.75rem',
        'input': '0.5rem',
        'pill': '9999px',
      },
      
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
