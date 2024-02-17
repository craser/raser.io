import { formatString, formatUrl } from '../../../lib/util/StringFormatter'

test('Should interpolate string values', () => {
    let template = 'I want to be an {occupation}!';
    let output = formatString(template, {
        occupation: 'Air Force Ranger'
    });

    expect(output).toBe('I want to be an Air Force Ranger!');
})

test('Should deal with multiple injections', () => {
    let template = 'The {noun} that can be {verb} of is not the true {noun}.';
    let output = formatString(template, {
        noun: 'way',
        verb: 'spoken'
    });
    expect(output).toBe('The way that can be spoken of is not the true way.');
})

test('Should leave brackets in place if no match is found.', () => {
    let template = 'Spongebob {lastName}';
    let output = formatString(template, {});
    expect(output).toBe(template);
})

test('Should leave brackets in place if values is entirely null', () => {
    let template = 'Spongebob {lastName}';
    let output = formatString(template);
    expect(output).toBe(template);
})

test('Should not lose its mind over a zero', () => {
    let template = '{count} bugs found';
    let output = formatString(template, { count: 0 });
    expect(output).toBe('0 bugs found');
})

test('Should encode values in a URL', () => {
    let template = 'foo?bar={bar}';
    let output = formatUrl(template, {
        bar: '1 2'
    });
    expect(output).toBe('foo?bar=1%202');
})
