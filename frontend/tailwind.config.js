/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'like': "url('/like.svg')",
        'dislike': "url('/dislike.svg')",
      },
      gridTemplateColumns: {
        'auto-fit-320': 'repeat(auto-fit, minmax(320px, 1fr))',
      },
      flex: {
        '2': '2 2 0%'
      },
    },
    fontFamily: {
      'fantasy': 'Papyrus, fantasy'
    }
  },
  plugins: [],
}

