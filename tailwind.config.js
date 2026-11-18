/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        creme: '#FFF8E7',
        ink: '#1F2933',
        vert: { DEFAULT: '#0E7C66', clair: '#D8F3EA' },
        soleil: { DEFAULT: '#F5B700', clair: '#FFF1C2' },
        terre: { DEFAULT: '#C2410C', clair: '#FFE4D3' },
        ciel: { DEFAULT: '#1D63C4', clair: '#DCEBFF' },
        violet: { DEFAULT: '#7C3AED', clair: '#EDE4FF' }
      },
      fontSize: { kid: ['1.6rem', '2rem'], big: ['2.4rem', '2.8rem'] },
      borderRadius: { xl2: '1.5rem' }
    }
  },
  plugins: []
};
