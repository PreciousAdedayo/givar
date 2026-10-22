import type { Config } from "tailwindcss";
export default { darkMode: "class", content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { lime: { givar: "#D8F24A" } }, fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] } } },
  plugins: [] } satisfies Config;
