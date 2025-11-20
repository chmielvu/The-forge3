/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Zinc 950
        foreground: "#e4e4e7", // Zinc 200
        card: "#18181b", // Zinc 900
        "card-foreground": "#e4e4e7",
        popover: "#09090b",
        "popover-foreground": "#e4e4e7",
        primary: "#f4f4f5", // Zinc 100
        "primary-foreground": "#18181b",
        secondary: "#27272a", // Zinc 800
        "secondary-foreground": "#f4f4f5",
        muted: "#27272a",
        "muted-foreground": "#a1a1aa",
        accent: "#27272a",
        "accent-foreground": "#f4f4f5",
        destructive: "#450a0a", // Red 950
        "destructive-foreground": "#fca5a5", // Red 300
        border: "#27272a",
        input: "#27272a",
        ring: "#d4d4d8",
        // Custom Lore Colors
        oxblood: "#881337", // Rose 900/Red mix
        concrete: "#52525b", // Zinc 600
        gold: "#a16207", // Yellow 700
      },
      fontFamily: {
        heading: ["'Cinzel'", "serif"],
        body: ["'Crimson Text'", "serif"],
        mono: ["monospace"], // For UI elements
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}