

export default class EdgeConfigPostDao {

    async getLatestPost() {
        return fetch('/api/latest')
            .then(async (response) => {
                if (response.ok) {
                    const json = await response.text();
                    const { latest } = JSON.parse(json);
                    return latest;
                } else {
                    console.log('error fetching from edge config');
                    return [];
                }
            });
    }

}
