export default class AuthenticationManager {
    #URL = 'http://localhost:8081/auth';

    constructor() {

    }

    async mock_login() {
        return Promise.resolve(true);
    }


    /**
     * Authenticates the user via back end api call.
     *
     * Either resolves with boolean true on successful login,
     * or throws an Error.
     *
     * @param user
     * @param pass
     * @returns {Promise<boolean>}
     */
    async login(user, pass) {
        return fetch(`${this.#URL}/login?${new URLSearchParams({ user, pass })}`)
            .then(response => {
                if (response.ok) {
                    return true;
                } else {
                    throw new Error(`Login failed. HTTP response status: ${response.status}`);
                }
            })
    }
}
