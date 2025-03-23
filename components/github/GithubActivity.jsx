import styles from './GithubActivity.module.scss';
import React, { useEffect, useState } from 'react';
import { Github, Code } from 'lucide-react';
import Link from "next/link";
import { PostedDate } from "@/components/frontpage/PostedDate";
import CommitDate from "@/components/frontpage/CommitDate";

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
            .then((data) => {
                console.log({ data }); // FIXME: DO NOT COMMIT TO CODE REPOSITORY!
                return data;
            })
            .then(({ repos }) => setRepos(repos));

    }, []);

    console.log({ renderingRepos: repos });
    return (
        <section className={styles.githubActivitySection}>
            <div class={styles.sectionBackground}><Github className={styles.icon}/></div>

            <h2 className={styles.header}><span>Recent Github Activity</span></h2>
            {repos.map((repo) => {
                console.log({ repo: repo });
                if (!repo.commits.length) {
                    return null;
                } else {
                    return (
                        <div className={styles.repo} key={`repo_${repo.name}`}>
                            <h2 className={styles.header}>
                                <Github className={styles.inlineIcon}/><a className={styles.repoLink} href={repo.url}>{repo.name}</a>
                            </h2>
                            {repo.commits.slice(0, 3).map((event, i) => {
                                console.log({ commit: event });
                                return (
                                    <div className={styles.commit} key={`commit_${repo.name}_${i}`}>
                                        <div class={styles.commitInfo}>
                                            <a className={styles.commitMessage} href={event.url}>{event.message}</a>
                                            <span className={styles.commitDate}><CommitDate date={event.date}/></span>
                                        </div>
                                        <a href={event.url} className={styles.commitHash}>{event.hash && event.hash.substring(0, 8)}</a>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            })}
        </section>
    );
};
