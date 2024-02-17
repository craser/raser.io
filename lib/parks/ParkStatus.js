
export class Park {
    #name;
    #url;
    #status;

    static OPEN = 'open';
    static CLOSED = 'closed';
    static UNKNOWN = 'unknown';

    static CHSP = new Park('CHSP', 'https://www.parks.ca.gov/?page_id=648');
    static SANTIAGO = new Park('Santiago Oaks', 'https://ocparks.com/santiagooaks');

    constructor(name, url) {
        this.#name = name;
        this.#url = url;
    }

    #parseParkStatus(text) {
        if (/CLOSED/i.test(text)) {
            return Park.CLOSED;
        } else {
            return Park.OPEN;
        }
    }

    async getStatus() {
        if (this.#status) {
            return this.#status;
        } else {
            return fetch(this.#url)
                .then(response => {
                    if (response.ok) {
                        return response.text()
                            .then(text => this.#parseParkStatus(text))
                            .then(status => {
                                this.#status = status;
                                return this.#status;
                            })
                    } else {
                        return Park.UNKNOWN;
                    }
                })
        }
    }
}



export default async function getParkStatus() {
    return Park.CHSP.getStatus();
}
