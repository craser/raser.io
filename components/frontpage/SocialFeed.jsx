import styles from './SocialFeed.module.scss';
import PageSection from "@/components/frontpage/PageSection";
import { Heart } from 'lucide-react';

export function SocialFeed() {
    return (
        <PageSection title="Social Feed" BgIcon={Heart}>

            <h2>Recent Social Activity</h2>
            <p>Here's what I've been up to lately:</p>
            <ul>
                <li>Posted a new blog entry: <a href="https://raser.io/blog/2021/08/01/this-is-a-test">This is a test</a></li>
            </ul>
        </PageSection>
    );
}
