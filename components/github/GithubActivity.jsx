import styles from './GithubActivity.module.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { Github, File } from 'lucide-react';
import CommitDate from "@/components/frontpage/CommitDate";
import PageSection from "@/components/frontpage/PageSection";
import RepoReadme from "@/components/github/RepoReadme";
import ShowMore from "@/components/ui/ShowMore";

function RepoActivity({ repo, reposWithoutReadmes, onClick }) {
    return <div className={styles.repo}>
        <h2 className={styles.header}>
            <Github className={styles.inlineIcon}/>
             <a className={styles.repoLink} href={repo.url}>{repo.name}</a>
            {!reposWithoutReadmes[repo.name] &&
                <button className={styles.readmeButton} onClick={onClick}>
                    <span>readme</span>
                    <File className={styles.inlineIcon}/>
                </button>
            }
        </h2>
        {repo.commits.slice(0, 3).map((commit, i) => <Commit key={`commit_${repo.name}_${i}`} event={commit}/>)}
    </div>;
}

function Commit(props) {
    return <div className={styles.commit}>
        <div class={styles.commitInfo}>
            <a className={styles.commitMessage} href={props.event.url}>{props.event.message}</a>
            <span className={styles.commitDate}><CommitDate date={props.event.date}/></span>
        </div>
        <a href={props.event.url} className={styles.commitHash}>{props.event.hash && props.event.hash.substring(0, 8)}</a>
    </div>;
}

export default function GithubActivity() {
    const [repos, setRepos] = useState([]);
    const [displayReadme, setDisplayReadme] = useState(false);
    const [readmeRepoName, setReadmeRepoName] = useState(null);
    const [reposWithoutReadmes, setReposWithoutReadmes] = useState({});

    useEffect(() => {
        fetch('/api/github/recent')// TODO: Pull this from SiteConfig
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch GitHub activity');
                }
                return response.json();
            })
            .then(({ repos }) => repos)
            .then((repos) => repos.filter((r) => r.commits.length > 0))
            .then((repos) => setRepos(repos));
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
                    {repos.slice(0, 3).map((repo) => (
                        <RepoActivity key={`repo_${repo.name}`} repo={repo} reposWithoutReadmes={reposWithoutReadmes} onClick={() => showReadme(repo.name)}/>
                    ))}
                    <ShowMore>
                    {repos.slice(3).map((repo) => (
                        <RepoActivity key={`repo_${repo.name}`} repo={repo} reposWithoutReadmes={reposWithoutReadmes} onClick={() => showReadme(repo.name)}/>
                    ))}
                    </ShowMore>
                </div>
                <div className={styles.footer}>


                </div>
            </PageSection>
        </>
    );
};
