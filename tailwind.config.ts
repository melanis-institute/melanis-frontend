import type { Config } from "tailwindcss";

const config: Config = {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        melanis: {
          primitive: {
            primary: {
              500: "#5B1112",
            },
            cream: {
              200: "rgba(254, 240, 213, 0.6)",
              300: "rgba(254, 240, 213, 0.8)",
              500: "rgba(254, 240, 213, 0.92)",
              700: "#FEF0D5",
              DEFAULT: "#FEF0D5",
            },
            teal: {
              500: "#00415E",
              DEFAULT: "#00415E",
            },
            ink: {
              50: "rgba(17, 18, 20, 0.08)",
              100: "rgba(17, 18, 20, 0.14)",
              200: "rgba(17, 18, 20, 0.24)",
              300: "rgba(17, 18, 20, 0.4)",
              500: "rgba(17, 18, 20, 0.6)",
              700: "rgba(17, 18, 20, 0.8)",
              900: "#111214",
              DEFAULT: "#111214",
            },
          },
          semantic: {
            text: {
              primary: "#111214",
              secondary: "rgba(17, 18, 20, 0.8)",
              muted: "rgba(17, 18, 20, 0.6)",
              inverse: "#FEF0D5",
            },
            surface: {
              page: "#FEF0D5",
              card: "rgba(254, 240, 213, 0.92)",
              elevated: "rgba(254, 240, 213, 0.8)",
              inverse: "#111214",
              accent: "#00415E",
              brand: "#5B1112",
            },
            border: {
              default: "rgba(17, 18, 20, 0.24)",
              strong: "rgba(17, 18, 20, 0.4)",
              inverse: "rgba(254, 240, 213, 0.8)",
            },
            focus: {
              ring: "rgba(0, 65, 94, 0.5)",
            },
          },
          action: {
            primary: {
              default: "#5B1112",
              hover: "#521112",
              pressed: "#4B1112",
            },
            secondary: {
              bg: "rgba(254, 240, 213, 0.92)",
              hover: "rgba(254, 240, 213, 0.8)",
            },
            ghost: {
              hover: "rgba(17, 18, 20, 0.08)",
            },
            link: {
              default: "#00415E",
              hover: "#023B55",
            },
            disabled: {
              bg: "rgba(17, 18, 20, 0.08)",
              text: "rgba(17, 18, 20, 0.4)",
            },
          },
          status: {
            info: {
              bg: "rgba(0, 65, 94, 0.12)",
              text: "#00415E",
            },
            danger: {
              bg: "rgba(91, 17, 18, 0.14)",
              text: "#5B1112",
            },
            neutral: {
              bg: "rgba(17, 18, 20, 0.1)",
              text: "rgba(17, 18, 20, 0.8)",
            },
          },
        },
      },
      fontFamily: {
        aileron: ["Aileron", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Aileron", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontWeight: {
        light: "300",
        regular: "400",
        medium: "500",
        semibold: "600",
      },
      fontSize: {
        "display-h1": [
          "3rem",
          { lineHeight: "3.5rem", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "display-h2": [
          "2.5rem",
          { lineHeight: "3rem", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "display-h3": [
          "2rem",
          { lineHeight: "2.5rem", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        "heading-h4": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "heading-h5": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "heading-h6": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "body-l": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "400" }],
        "body-m": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "body-s": ["0.875rem", { lineHeight: "1.375rem", fontWeight: "400" }],
        "label-l": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "600" }],
        "label-m": ["0.75rem", { lineHeight: "1rem", fontWeight: "600" }],
        "label-s": ["0.6875rem", { lineHeight: "0.875rem", fontWeight: "600" }],
        caption: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
        helper: ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],
        overline: [
          "0.6875rem",
          { lineHeight: "0.875rem", letterSpacing: "0.04em", fontWeight: "600" },
        ],
        "button-m": ["0.875rem", { lineHeight: "1rem", fontWeight: "600" }],
        "button-s": ["0.75rem", { lineHeight: "0.875rem", fontWeight: "600" }],
      },
      letterSpacing: {
        tightDisplay: "-0.01em",
        tightHeading: "-0.005em",
        overline: "0.04em",
      },
    },
  },
  plugins: [],
};

export default config;
