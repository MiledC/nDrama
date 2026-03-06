/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mock the entire navigator so we don't need to resolve the full native stack
jest.mock('../src/navigation/AppNavigator', () => {
  const {View, Text} = require('react-native');
  return function MockAppNavigator() {
    return (
      <View>
        <Text>MockAppNavigator</Text>
      </View>
    );
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
