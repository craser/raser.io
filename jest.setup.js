// mock out console so we're not spewing to test logs
global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
