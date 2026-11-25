// ABOUTME: Jest stand-in for next/font/google, which only works when Next's compiler rewrites the font calls.
// ABOUTME: Every font loader (JetBrains_Mono, Lato, ...) returns a next/font-shaped result named after the font.

function fontLoader(exportName) {
    const family = exportName.replace(/_/g, ' ');
    const slug = exportName.toLowerCase();
    return () => ({
        className: `__font_${slug}`,
        variable: `__font_variable_${slug}`,
        style: { fontFamily: `'${family}', '${family} Fallback'` },
    });
}

module.exports = new Proxy({ __esModule: true }, {
    get(target, name) {
        if (name in target || typeof name !== 'string') {
            return target[name];
        }
        return fontLoader(name);
    },
});
