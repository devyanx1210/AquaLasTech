module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../layouts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#003a6b",
        secondary: "#9abddc", // example dark background
      },
    },
  },
  plugins: [],
};