import React from "react";

export function createMockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => true),
    getParent: jest.fn(),
    getState: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    setParams: jest.fn(),
    getId: jest.fn(),
  };
}

export function createMockRoute(params = {}) {
  return {
    key: "test-route",
    name: "TestScreen",
    params,
  };
}
