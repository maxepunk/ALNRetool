/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
}