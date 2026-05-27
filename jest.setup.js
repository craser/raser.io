// Mock scrollIntoView - not implemented in jsdom
if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = jest.fn();
}

// Expose Node.js fetch globals (Request, Response, Headers) in jsdom environment
// so that Next.js server modules and API route tests can use them.
if (typeof global.Request === 'undefined') {
    global.Request = globalThis.Request;
    global.Response = globalThis.Response;
    global.Headers = globalThis.Headers;
    global.fetch = globalThis.fetch;
}

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
