/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Пастельная тема
                primary: {
                    DEFAULT: '#d4a5f5',   // мягкий лавандовый
                    dark: '#9333ea',   // насыщенный фиолетовый
                    light: '#f0d9ff',   // светлый
                },
                accent: {
                    pink: '#f5a5d4',   // нежно-розовый
                    peach: '#ffd6a5',   // персиковый
                    mint: '#a5f5d4',   // мятный
                },
                dark: {
                    DEFAULT: '#0f0a1e',   // очень тёмный фиолетово-синий
                    50: '#1a1030',
                    100: '#221840',
                    200: '#2d1f55',
                },
                card: {
                    DEFAULT: '#1e1535',
                    border: '#3d2d6e',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '0.8' },
                    '50%': { opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
