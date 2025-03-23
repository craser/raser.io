import { NextResponse, NextRequest } from "next/server";
import { Octokit } from "octokit";
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

const fetchGithubActivity = async () => {
    const githubAuthToken = new SiteConfig().getValue('github.authToken');
    const githubUsername = new SiteConfig().getValue('github.username');

    try {
        const octokit = new Octokit({ auth: githubAuthToken });
        return octokit.rest.repos.listForAuthenticatedUser()
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
                }));
            })
            .then((repos) => ({ repos }));
    } catch (error) {
        console.error('Error fetching GitHub activity:', error);
    }
};


export function GET(request) {
    console.log(`fetching github activity`);
    return fetchGithubActivity()
        .then(json => new NextResponse(JSON.stringify(json), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
}
