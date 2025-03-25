import styles from './GithubActivity.module.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { Github, File } from 'lucide-react';
import CommitDate from "@/components/frontpage/CommitDate";
import PageSection from "@/components/frontpage/PageSection";
import RepoReadme from "@/components/github/RepoReadme";

export default function GithubActivity() {
    const [repos, setRepos] = useState([]);
    const [displayReadme, setDisplayReadme] = useState(false);
    const [readmeRepoName, setReadmeRepoName] = useState(null);
    const [reposWithoutReadmes, setReposWithoutReadmes] = useState({});

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

    const showReadme = (repoName) => {
        console.log(`showing readme for repo ${repoName}`);
        setReadmeRepoName(() => repoName);
        setDisplayReadme(() => true);
    };

    const hideReadme = () => {
        console.log(`hiding readme (presumably for repo ${readmeRepoName})`);
        setDisplayReadme(false);
        setReadmeRepoName(null);
    };

    const onMissingReadme = (repo) => {
        hideReadme();
        console.log(`Repo ${repo} has no readme.`);
        setReposWithoutReadmes((repos) => ({ ...repos, [repo]: true }))
    };

    console.log({ renderingRepos: repos });
    return (
        <>
            {displayReadme &&
                <RepoReadme repoName={readmeRepoName} onDismiss={() => hideReadme()} onBlankReadme={(r) => onMissingReadme(r)}/>
            }
            <PageSection title="Recent Github Activity" BgIcon={Github}>
                <div className={styles.githubActivitySection}>
                    {repos.map((repo) => {
                        console.log({ repo: repo });
                        if (!repo.commits.length) {
                            return null;
                        } else {
                            return (
                                <div className={styles.repo} key={`repo_${repo.name}`}>
                                    <h2 className={styles.header}>
                                        <Github className={styles.inlineIcon}/> <a className={styles.repoLink} href={repo.url}>{repo.name}</a>
                                        {!reposWithoutReadmes[repo.name] &&
                                            <button className={styles.readmeButton} onClick={() => showReadme(repo.name)}>
                                                <span>readme</span>
                                                <File className={styles.inlineIcon}/>
                                            </button>
                                        }
                                    </h2>
                                    {repo.commits.slice(0, 3).map((event, i) => {
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
                </div>
                <div className={styles.footer}>


                </div>
            </PageSection>
        </>
    );
};
