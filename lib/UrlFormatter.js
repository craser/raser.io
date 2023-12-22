function resolve(name, values, dflt) {
    if (name in values) {
        return values[name];
    } else {
        return dflt;
    }
}

export default function format(pattern, values) {
    return pattern.replaceAll(/\{([^}]+)\}/g, (m, name) => {
        return resolve(name, values, m)
    });
}
