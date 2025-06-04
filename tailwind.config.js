/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(110, 40, 100)",    // #6E2864
          light:   "rgb(140, 80, 130)",    // lighter tint
          dark:    "rgb(80, 20, 60)",      // darker shade
        },

        secondary: {
          DEFAULT: "#7E00FF",
          light:   "#A44FFF",
          dark:    "#5300BF",
        },

        accent: {
          red: "#E10600",
        },

        gold: {
          50:  "#FFFEF7",      // Casi blanco dorado
          100: "#FEF9E7",      // Dorado muy claro
          200: "#FDF2C4",      // Dorado claro
          300: "#FCE96A",      // Dorado medio-claro
          400: "#FFD700",      // Dorado clásico
          500: "#F59E0B",      // Dorado amber
          600: "#D97706",      // Dorado oscuro
          700: "#B45309",      // Dorado muy oscuro
          800: "#92400E",      // Bronce dorado
          900: "#78350F",      // Bronce oscuro
        },

        gaming: {
          bg: {
            primary:   "rgba(0, 0, 0, 0.95)",     
            secondary: "rgba(30, 30, 30, 0.9)",   
            card:      "rgba(20, 20, 20, 0.8)",   
          },
          accent: {
            gold:       "rgba(255, 215, 0, 0.9)",  
            goldMuted:  "rgba(255, 215, 0, 0.6)",  
            goldLight:  "rgba(255, 215, 0, 0.3)", 
            goldBorder: "rgba(255, 215, 0, 0.2)",  
          }
        },

        neutral: {
          50:  "#F5F5F5",
          100: "#E5E5E5",
          200: "#CCCCCC",
          300: "#B3B3B3",
          400: "#999999",
          500: "#7F7F7F",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#1A1A1A",
        },
      },

      backdropBlur: {
        'gaming': '10px',
      },
      boxShadow: {
        'gaming': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      backgroundImage: {
        // "showroom-night": "url('/assets/fondo01.png')",
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body:    ["Poppins",    "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),

  ],
}