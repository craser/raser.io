export function PostedDate({ post }) {
    const LOCALE = 'en-US' // TODO: Get the browser's locale.
    let posted = new Date(post.datePosted);
    let date = posted.getDate();
    let monthName = posted.toLocaleString(LOCALE, { month: 'long' });
    let year = posted.getFullYear();

    return <>{monthName} {date}, {year}</>;
}
