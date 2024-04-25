/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        "blender-bold": ["BlenderPro-Bold", "sans-serif"],
        "dinpro-bold": ["DINPro-Bold", "sans-serif"],
        "dinpro-medium": ["DINPro-Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};
