import React, { useEffect, useState } from 'react';
import { Octokit } from 'octokit';
import SiteConfig from "@/lib/SiteConfig";


class RepoInfo {
    name;
    commits = [];

    constructor(name, commits = []) {
        this.name = name;
        this.commits = commits;
    }

    addCommit(event) {
        this.commits.push(event);
    }
}

class Commit {
    message;
    date;
    hash;
    url;

    constructor({ message, date, hash, url }) {
        this.message = message;
        this.date = date;
        this.hash = hash;
        this.url = url;
    }
}

export default function GithubActivity() {
    const githubAuthToken = new SiteConfig().getValue('github.authToken');
    const githubUsername = new SiteConfig().getValue('github.username');
    console.log(`GithubActivity: username=${githubUsername}, githubAuthToken=${githubAuthToken}`);
    const [repos, setRepos] = useState([]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const octokit = new Octokit({ auth: githubAuthToken });
                octokit.rest.repos.listForAuthenticatedUser()
                    .then(({ data: publicRepos }) => {
                        const recentRepos = publicRepos
                            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                            .slice(0, 5);
                        return Promise.all(recentRepos.map((repo) => {
                            return octokit.rest.repos.listCommits({
                                owner: githubUsername,
                                repo: repo.name,
                            }).then(({ data: commits }) => {
                                return new RepoInfo(
                                    repo.name,
                                    commits.map((commit) => {
                                        return new Commit({
                                            message: commit.commit.message,
                                            date: commit.commit.author.date,
                                            hash: commit.sha,
                                            url: commit.html_url,
                                        });
                                    })
                                );
                            });
                        }))
                            .then((repos) => {
                                console.log(`Fetched ${repos.length} repos`);
                                console.log({ repos });
                                return repos;
                            })
                            .then(setRepos);
                    });
            } catch (error) {
                console.error('Error fetching GitHub activity:', error);
            }
        };

        fetchActivity();
    }, [githubUsername, githubAuthToken]);

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
