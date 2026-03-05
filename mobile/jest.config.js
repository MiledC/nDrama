module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-native-gesture-handler' +
      '|react-native-reanimated' +
      '|react-native-safe-area-context' +
      '|react-native-screens' +
      '|react-native-video' +
      '|@gorhom/bottom-sheet' +
      '|@react-native-vector-icons' +
      '|react-i18next' +
      '|i18next' +
    ')/)',
  ],
  moduleNameMapper: {
    '\\.(ttf|otf|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
