import React, { memo } from 'react';
import styles from './LinkTree.module.scss';

const links = [
    {
        href: 'https://www.linkedin.com/in/yourprofile',
        logo: '/images/linkedin-logo.png',
        background: '/images/linkedin-bg.jpg',
        alt: 'LinkedIn'
    },
    {
        href: 'https://www.threads.net/yourprofile',
        logo: '/images/threads-logo.png',
        background: '/images/threads-bg.jpg',
        alt: 'Threads'
    },
    {
        href: 'https://www.yourblog.com',
        logo: '/images/blog-logo.png',
        background: '/images/blog-bg.jpg',
        alt: 'Blog'
    },
    {
        href: '/resume.pdf',
        logo: '/images/resume-logo.png',
        background: '/images/resume-bg.jpg',
        alt: 'Resume'
    }
];

function LinkTree() {
    return (
        <div className={styles.linkTree}>
            {links.map((link, index) => (
                <a key={index} href={link.href} className={styles.roundrect} style={{ backgroundImage: `url(${link.background})` }}>
                    <img src={link.logo} alt={link.alt} className={styles.logo} />
                </a>
            ))}
        </div>
    );
}

export default memo(LinkTree);
