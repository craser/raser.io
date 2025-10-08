// mock out console so we're not spewing to test logs
global.console = ((original) => ({
    ...original,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    test: original
}))(global.console);
