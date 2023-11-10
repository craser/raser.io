export default class AuthenticationManager {
    #URL = 'http://localhost:8081/auth';

    constructor() {

    }

    /**
     * Authenticates the user via back end api call.
     *
     * Either resolves with boolean true on successful login,
     * or throws an Error.
     *
     * @param email
     * @param pass
     * @returns {Promise<boolean>}
     */
    async login(email, pass) {
        return fetch(`${this.#URL}/login?${new URLSearchParams({ email, pass })}`)
            .then(response => {
                if (response.ok) {
                    return response.json(); // promise
                } else {
                    throw new Error(`Login failed. HTTP response status: ${response.status}`);
                }
            });
    }

    async check(email, token) {
        return fetch(`${this.#URL}/check?${new URLSearchParams({ email, token })}`)
            .then(response => {
                if (response.ok) {
                    return true;
                } else {
                    throw new Error(`Authentication check failed. HTTP response status: ${response.status}`);
                }
            });
    }

}
