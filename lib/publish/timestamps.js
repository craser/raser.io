// ABOUTME: Formats dates as local-time strings, the form post.json and the database columns use.
// ABOUTME: The blog's TIMESTAMP columns carry no time zone, so local time is stored as written.

const pad = (n) => String(n).padStart(2, '0');

export function formatLocalMinute(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatLocalSecond(date) {
    return `${formatLocalMinute(date)}:${pad(date.getSeconds())}`;
}
