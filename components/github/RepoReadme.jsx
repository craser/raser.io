import Modal from "@/components/Modal";
import SiteConfig from "@/lib/SiteConfig";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RepoReadme({ repoName, ...props }) {
    const siteConfig = new SiteConfig();
    const [readme, setReadme] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch(siteConfig.getValue('github.endpoints.readme', { repo: repoName }))
            .then((res) => res.text())
            .then((text) => {
                setReadme(text);
                setLoaded(true);
            });
    }, [repoName]);

    return (
        <Modal {...props}>
            <div style={{minHeight: '100px', minWidth: '100px' }}>
                {!loaded && <LoadingSpinner />}
                {loaded && <div dangerouslySetInnerHTML={{ __html: readme }}/>}
            </div>
        </Modal>
    );
}
