// ABOUTME: Mock implementation of localStorage for testing
// ABOUTME: This is an opt-in mock that tests can use when they need localStorage functionality

export const MockLocalStorage = jest.fn(() => {
    const store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            value ? store[key] = (value) : delete store[key];
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
        })
    };
});
