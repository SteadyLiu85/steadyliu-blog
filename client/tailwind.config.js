module.exports = {
  darkMode: 'class',
  content:[
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-base': 'rgb(var(--color-bg-base) / <alpha-value>)',
        'theme-surface': 'rgb(var(--color-bg-surface) / <alpha-value>)',
        'theme-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
        'theme-text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'theme-text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'theme-border': 'rgb(var(--color-border) / <alpha-value>)',
        'theme-shadow': 'rgb(var(--color-shadow) / <alpha-value>)',
        'theme-accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'theme-accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
  ],
}