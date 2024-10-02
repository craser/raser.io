function format(template, values, wrap) {
    return template.replaceAll(/\{(\w+)\}/g, (match, key) => {
        let formatted = (values && (key in values))
            ? (wrap ? wrap(values[key]) : values[key])
            : match;
        return formatted;
    });
}

export function formatString(template, values) {
    return format(template, values);
}

export function formatUrl(template, values) {
    return format(template, values, encodeURIComponent);
}
