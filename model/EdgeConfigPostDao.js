

export default class EdgeConfigPostDao {

    async getLatestPost() {
        return fetch('/api/latest')
            .then(async (response) => {
                if (response.ok) {
                    console.log('fetched latest from edge config');
                    const json = await response.text();
                    const { latest } = JSON.parse(json);
                    return latest;
                } else {
                    console.log('error fetching from edge config');
                    throw new Error(`HTTP code ${response.status} while fetching welcome entry.`);
                }
            });
    }

}
