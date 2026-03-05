module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const isTest = process.env.NODE_ENV === "test";

  const plugins = [];

  if (!isTest) {
    plugins.push([
      "@tamagui/babel-plugin",
      {
        components: ["tamagui"],
        config: "./tamagui.config.ts",
      },
    ]);
    plugins.push("react-native-reanimated/plugin");
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
