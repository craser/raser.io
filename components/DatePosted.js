
export default function DatePosted(props) {
    const LOCALE = 'en-US' // TODO: Get the browser's locale.
    let posted = new Date(props.post.datePosted);
    let weekDay = posted.toLocaleString(LOCALE, { weekday: 'short' })
    let date = posted.getDate();
    let monthName = posted.toLocaleString(LOCALE, { month: 'short' });
    let year = posted.getFullYear();

    return <>{weekDay}, {monthName} {date}, {year}</>;
}
