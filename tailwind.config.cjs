const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: colors.slate[500],
                secondary: colors.orange[400],
                background: colors.slate[800],
                light: colors.gray[300],
            },
        },
    },
    plugins: [],
};
