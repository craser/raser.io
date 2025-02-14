import React, { memo } from 'react';
import styles from './LinkTree.module.scss';
import { File, Rss } from 'lucide-react';
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { getDownloadLink } from "@/lib/util/Links";

const links = [
    {
        title: 'LinkedIn',
        href: 'https://www.linkedin.com/in/chris-raser',
        alt: 'LinkedIn',
        event: 'link:linkedin',
    },
    {
        title: 'Threads',
        href: 'https://www.threads.net/@deathb4decaf',
        alt: 'Threads',
        event: 'link:threads',
    },
    {
        title: 'Blog',
        href: 'https://www.yourblog.com',
        icon: Rss,
        text: 'RSS',
        alt: 'Blog',
        event: 'link:blog',
    },
    {
        title: 'Resume',
        href: getDownloadLink('Christopher Raser.pdf'),
        icon: File,
        alt: 'Resume',
        event: 'link:resume',
    }
];

function DomainLogo({ href }) {
    const domain = new URL(href).host;
    const src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    const alt = `Logo for ${domain}`;
    return <img src={src} alt={alt} className={styles.logo}/>;
}

function LinkIcon({ link }) {
    const Icon = link.icon;
    return (
        <Icon className={styles.logo}/>
    );
}


export default memo(function LinkTree() {
    const analytics = useAnalytics();
    const onClick = (event, link) => analytics.fire(link.event);

    return (
        <div className={styles.linkTree}>
            {links.map((link, index) => (
                <a key={index} href={link.href} className={styles.roundrect} onClick={(e) => onClick(e, link)}>
                    {link.icon && <LinkIcon link={link}/>}
                    {!link.icon && <DomainLogo href={link.href}/>}
                    <span className={styles.linkTitle}>{link.title}</span>
                </a>
            ))}
        </div>
    );
});
