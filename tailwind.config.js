/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Exclude CSS Module files from Tailwind processing
    "!./src/**/*.module.css"
  ],
  theme: {
    extend: {
      colors: {
        // Map to existing CSS variables for consistency
        background: 'var(--background-primary)',
        foreground: 'var(--text-primary)',
        border: 'var(--border-primary)',
        // Node type color themes
        puzzle: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        character: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        element: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#7c3aed',
        },
        timeline: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
        },
      },
    },
  },
  plugins: [],
}