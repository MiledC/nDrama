module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/setup.ts", "/__tests__/helpers.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|tamagui|@tamagui/.*)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/api/types.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
