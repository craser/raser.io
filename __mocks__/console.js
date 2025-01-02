// __mocks__/console.js
module.exports = {
  log: jest.fn(),
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};
