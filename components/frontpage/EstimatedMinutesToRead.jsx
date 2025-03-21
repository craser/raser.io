
function countWords(str) {
    if (!str) return 0;
    return str.split(/\s+/).length;
}


export function EstimatedMinutesToRead({ post }) {
    const wordCount = countWords(post.intro) + countWords(post.body);
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return <>{minutes} min read</>;
}
