/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js}'],
  theme: {
    // Completely overriding the default color palette:
    colors: {
      // Ensure you keep these "core" references:
      transparent: 'transparent',
      current: 'currentColor',

      // Basic black & white:
      black: '#000000',
      white: '#FFFFFF',

      // --- GRAY (Neutral) ---
      gray: {
        50: '#F9FAFA',
        100: '#F3F4F5',
        200: '#E2E4E6',
        300: '#C4C7CB',
        400: '#9CA1A6',
        500: '#6B7075',
        600: '#4B5055',
        700: '#373C41',
        800: '#1F2428',
        900: '#0E1012',
      },

      // --- RED ---
      red: {
        50: '#FFF1F1',
        100: '#FFE1E1',
        200: '#FFBFBF',
        300: '#FF9595',
        400: '#FF6464',
        500: '#FF3333',
        600: '#DB1C1C',
        700: '#B71414',
        800: '#930D0D',
        900: '#7A0808',
      },

      // --- ORANGE ---
      orange: {
        50: '#FFF4E9',
        100: '#FFE8D3',
        200: '#FFCDA7',
        300: '#FFAA6A',
        400: '#FF8432',
        500: '#F86306',
        600: '#D24E03',
        700: '#A63C00',
        800: '#7C2D00',
        900: '#5F2100',
      },

      // --- YELLOW ---
      yellow: {
        50: '#FFFDE6',
        100: '#FFFACC',
        200: '#FFF199',
        300: '#FFE652',
        400: '#FFDA18',
        500: '#E6BC00',
        600: '#B89900',
        700: '#8A7500',
        800: '#5C5100',
        900: '#3B3300',
      },

      // --- GREEN ---
      green: {
        50: '#EDFCF4',
        100: '#D2F8E1',
        200: '#A4F1C7',
        300: '#73E7AD',
        400: '#47DB94',
        500: '#23C57C',
        600: '#189A61',
        700: '#0F7047',
        800: '#08462B',
        900: '#032615',
      },

      // --- TEAL ---
      teal: {
        50: '#EBFBFA',
        100: '#D6F7F6',
        200: '#ADEFEB',
        300: '#7EE3DF',
        400: '#52D4D0',
        500: '#30BCB5',
        600: '#24958E',
        700: '#186F68',
        800: '#0D4943',
        900: '#042625',
      },

      // --- BLUE ---
      blue: {
        50: '#E3F8FF',
        100: '#B3EEFF',
        200: '#81E3FE',
        300: '#4FD4FC',
        400: '#25C0F6',
        500: '#1894C8',
        600: '#106C97',
        700: '#094969',
        800: '#032B43',
        900: '#011522',
      },

      // --- INDIGO ---
      indigo: {
        50: '#EEF0FE',
        100: '#DCD9FE',
        200: '#C0B6FC',
        300: '#9E88FA',
        400: '#7E5AF7',
        500: '#6436E6',
        600: '#4E28BC',
        700: '#3B1F8D',
        800: '#271461',
        900: '#150936',
      },

      // --- PURPLE ---
      purple: {
        50: '#F8E8FE',
        100: '#F1D1FD',
        200: '#E5A9FA',
        300: '#D772F3',
        400: '#C73CEE',
        500: '#A91CD2',
        600: '#8213A3',
        700: '#5D0E77',
        800: '#3D084E',
        900: '#200227',
      },

      // --- PINK ---
      pink: {
        50: '#FFF1FA',
        100: '#FFE1F6',
        200: '#FFC2EC',
        300: '#FF99DF',
        400: '#FF6BCD',
        500: '#FF40B9',
        600: '#DB2694',
        700: '#B71C74',
        800: '#931558',
        900: '#7A1045',
      },
    },
  },
  plugins: [],
};
