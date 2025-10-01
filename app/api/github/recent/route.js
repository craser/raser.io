import { NextResponse, NextRequest } from "next/server";
import { Octokit } from "octokit";
import SiteConfig from "@/lib/SiteConfig";

export class RepoInfo {
    name;
    commits = [];

    constructor(repo, commits = []) {
        this.name = repo.name;
        this.url = repo.html_url;
        this.description = repo.description;
        this.commits = commits.splice(0, 5).map((commit) => {
            return new Commit({
                message: commit.commit.message,
                date: commit.commit.author.date,
                hash: commit.sha,
                url: commit.html_url,
            });
        });
    }
}

export class Commit {
    constructor({ message, date, hash, url }) {
        this.message = message;
        this.date = date;
        this.hash = hash;
        this.url = url;
    }
}

const fetchGithubActivity = () => {
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
                        page: 0,
                        per_page: 5,
                    }).then(({ data: commits }) => {
                        console.log(`retrieved ${commits.length} commits for ${repo.name}`);
                        return new RepoInfo(repo, commits);
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
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400'
            }
        }));
}
