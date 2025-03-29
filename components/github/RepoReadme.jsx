import Modal from "@/components/Modal";
import SiteConfig from "@/lib/SiteConfig";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import styles from './RepoReadme.module.scss';
import PageSection from "@/components/frontpage/PageSection";
import { FileImage } from 'lucide-react';

export default function RepoReadme({ repoName, onBlankReadme = () => 0, ...props }) {
    const siteConfig = new SiteConfig();
    const [readme, setReadme] = useState(null);
    const [loaded, setLoaded] = useState(false);

    const readmeIsLoaded = (html) => {
        setReadme(html);
        setLoaded(true);
    }

    const readmeIsBlank = () => {
        console.log(`readme is blank for repo ${repoName}`);
        setReadme(null);
        setLoaded(false);
        onBlankReadme(repoName);
    }

    useEffect(() => {
        fetch(siteConfig.getValue('github.endpoints.readme', { repo: repoName }))
            .then((res) => res.text())
            .then((html) => {
                if (html) {
                    readmeIsLoaded(html);
                } else {
                    readmeIsBlank();
                }
            });
    }, [repoName]);

    return (
        <Modal className={styles.readmeModal} {...props}>
            <PageSection title="Readme" BgIcon={FileImage}>
                <div className={['prose', styles.readme].join(' ')}>
                    {!loaded && <LoadingSpinner/>}
                    {loaded && <div dangerouslySetInnerHTML={{ __html: readme }}/>}
                </div>
            </PageSection>
        </Modal>
    );

}
