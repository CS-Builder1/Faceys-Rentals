/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,tsx,jsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": {
                    DEFAULT: "#ff6e61",
                    50: "#fff1f0",
                    100: "#ffe0de",
                    200: "#ffc1bd",
                    300: "#ffa29b",
                    400: "#ff7b71",
                    500: "#ff6e61",
                    600: "#f05244",
                    700: "#cc3d31",
                    800: "#a63328",
                    900: "#862c23",
                },
                "ocean-deep": "#004E64",
                "ocean-teal": "#007085",
                "sand-warm": "#F5E6CC",
                "gold-accent": "#D4A574",
                "background-light": "#f8f6f5",
                "background-dark": "#23100f",
                "ocean": "#004E64", // Alias from different pages
                "sand": "#F5E6CC",  // Alias
                "gold": "#D4AF37",  // Alias
            },
            fontFamily: {
                "display": ["Inter", "Plus Jakarta Sans", "sans-serif"],
                "heading": ["Montserrat", "sans-serif"],
                "accent": ["Montserrat", "sans-serif"],
                "body": ["Inter", "Manrope", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
