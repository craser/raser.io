import getConfig from "@/lib/SiteConfig";

export default class AuthenticationManager {
    #config = getConfig();


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
        let url = `${this.#config.api.root}${this.#config.api.endpoints.auth.login}?${new URLSearchParams({ email, pass })}`;
        return fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.json(); // promise
                } else {
                    throw new Error(`Login failed. HTTP response status: ${response.status}`);
                }
            });
    }

    async check(email, token) {
        return fetch(`${this.#config.api.root}${this.#config.api.endpoints.auth.check}?${new URLSearchParams({ email, token })}`)
            .then(response => {
                if (response.status === 200) { // check sucessful, token is valid
                    return true;
                } else if (response.status === 401) { // unauthorized, token is expired/invalid
                    return false;
                } else {
                    throw new Error(`Authentication check failed. HTTP response status: ${response.status}`);
                }
            });
    }

}
