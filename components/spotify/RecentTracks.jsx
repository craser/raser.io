// ABOUTME: Front page "Listening" section: the tracks Chris most recently played on Spotify.
// ABOUTME: Renders nothing until tracks arrive, so a failed or empty fetch leaves no trace on the page.

import styles from './RecentTracks.module.scss';
import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import PageSection from '@/components/frontpage/PageSection';
import SiteConfig from '@/lib/SiteConfig';

function TrackRow({ track }) {
    return (
        <li className={styles.track}>
            <a className={styles.trackLink} href={track.url}>
                {track.albumImageUrl &&
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.albumImage} src={track.albumImageUrl} alt="" width={48} height={48}/>
                }
                <span className={styles.trackText}>
                    <span className={styles.title}>{track.title}</span>
                    <span className={styles.artists}>{track.artists.join(', ')}</span>
                </span>
            </a>
        </li>
    );
}

export default function RecentTracks() {
    const [tracks, setTracks] = useState([]);

    useEffect(() => {
        fetch(new SiteConfig().getValue('spotify.endpoints.recent'))
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch recent tracks: HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(({ tracks }) => setTracks(tracks))
            .catch((error) => console.error(error));
    }, []);

    if (tracks.length === 0) {
        return null;
    }
    return (
        <PageSection title="Listening" BgIcon={Music}>
            <ul className={styles.trackList}>
                {tracks.map((track) => <TrackRow key={track.id} track={track}/>)}
            </ul>
        </PageSection>
    );
}
