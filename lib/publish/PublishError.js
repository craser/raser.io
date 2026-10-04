// ABOUTME: Error for publishing problems the user can fix, such as a bad post.json or a CDN name collision.
// ABOUTME: Carries a list of details so every problem can be reported at once.

export default class PublishError extends Error {
    /**
     * @param message {string} one-line summary
     * @param details {Array<string>} individual problems, printed one per line
     */
    constructor(message, details = []) {
        super(message);
        this.name = 'PublishError';
        this.details = details;
    }
}
