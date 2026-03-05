/* eslint-env jest */
// Mock native modules that aren't available in the test environment
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    TouchableHighlight: View,
    TouchableNativeFeedback: View,
    TouchableOpacity: View,
    TouchableWithoutFeedback: View,
    Directions: {},
    gestureHandlerRootHOC: jest.fn(c => c),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 390, height: 844};
  return {
    SafeAreaProvider: ({children}) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({children}) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: {
      Consumer: ({children}) => children(inset),
    },
    SafeAreaFrameContext: {
      Consumer: ({children}) => children(frame),
    },
    initialWindowMetrics: {insets: inset, frame},
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  screensEnabled: jest.fn(() => true),
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-video', () => 'Video');

jest.mock('@react-native-vector-icons/feather', () => 'Feather');
