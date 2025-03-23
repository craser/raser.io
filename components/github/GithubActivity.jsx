import React, { useEffect, useState } from 'react';



export default function GithubActivity() {
    const [repos, setRepos] = useState([]);

    useEffect(() => {
        fetch('/api/github/recent')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch GitHub activity');
                }
                return response.json();
            })
            .then(({ repos }) => setRepos(repos));

    }, []);

    return (
        <section>
            {repos.map((repo) => {
                return (
                    <div key={repo.name}>
                        <h2>REPO: {repo.name} ({repo.commits.length} commits)</h2>
                        <div>
                            {repo.commits.map((event, i) => {
                                return (
                                    <div key={`event_${repo.name}_${i}`}>
                                        <span>COMMIT:</span>
                                        <a href={event.url}>{event.message}</a>
                                        <span>{event.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </section>
    );
};
