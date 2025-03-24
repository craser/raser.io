import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import SiteConfig from "@/lib/SiteConfig";

/**
 * Fetches the README for the given repository.
 *
 *   - pass the `repo` query parameter to specify the name of the repository.
 *   - we assume here that I'm the owner
 *   - we assume here that the README is in the root of the repository
 *
 *
 * @param request
 * @returns {Promise<unknown>}
 * @constructor
 */
export function GET(request) {
    const githubAuthToken = new SiteConfig().getValue('github.authToken');
    const githubUsername = new SiteConfig().getValue('github.username');
    const octokit = new Octokit({ auth: githubAuthToken });
    const repo = new URL(request.url).searchParams.get('repo');
    return octokit.rest.repos.getReadmeInDirectory({
        owner: githubUsername,
        repo,
        dir: '/',
        mediaType: {
            format: 'html'
        }
    })
        .then(({ data: html }) => new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        }))

}
