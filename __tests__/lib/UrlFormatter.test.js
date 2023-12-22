import format from '../../lib/UrlFormatter'

test('should work on null/empty values', () => {
    const pattern = 'I want to be an Air Force Ranger!'
    const result = format(pattern, null);
    expect(result).toBe('I want to be an Air Force Ranger!');
})

test('should work on empty values', () => {
    const pattern = 'I want to be an Air Force Ranger!'
    const result = format(pattern, {});
    expect(result).toBe('I want to be an Air Force Ranger!');
})

test('should inject named values', () => {
    const pattern = 'I want to be {job}!'
    const values = {
        job: 'an Air Force Ranger'
    }
    const result = format(pattern, values);
    expect(result).toBe('I want to be an Air Force Ranger!');
})

test('should leave unmatched values in place', () => {
    const pattern = 'I want to be {job}!'
    const result = format(pattern, {});
    expect(result).toBe('I want to be {job}!')
})

test('should handle multiple values', () => {
    const pattern = 'I want to be an {branch} {rank}!';
    const values = {
        branch: 'Air Force',
        rank: 'Ranger'
    }
    const result = format(pattern, values);
    expect(result).toBe('I want to be an Air Force Ranger!');
})

test('should handle multiple values', () => {
    const pattern = 'I {verb} to be an {branch} {rank}!';
    const values = {
        branch: 'Air Force',
        rank: 'Ranger'
    }
    const result = format(pattern, values);
    expect(result).toBe('I {verb} to be an Air Force Ranger!');
})



