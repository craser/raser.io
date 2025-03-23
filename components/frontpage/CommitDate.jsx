export default function CommitDate({ date }) {
    console.log(`parsing commit date: ${date}`, { commitDate: date });
    const LOCALE = 'en-US' // TODO: Get the browser's locale.
    let posted = (typeof date === 'string') ? new Date(date) : date;
    let dayOfMonth = posted.getDate();
    let monthName = posted.toLocaleString(LOCALE, { month: 'long' });
    let year = posted.getFullYear();

    return <>{monthName} {dayOfMonth}, {year}</>;
}
