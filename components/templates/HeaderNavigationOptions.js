import styles from "@/components/templates/FrontPageLayout.module.css";
import Link from "next/link";

export default function HeaderNavigationOptions(props) {
    return (
        <ul className={styles.sitenav}>
            <li className="trailmaps-link">
                <Link href={"trailmaps"}>trail maps</Link>
            </li>
            <li className="twitter-link">
                <a href="https://twitter.com/DeathB4Decaf">@DeathB4Decaf</a>
            </li>
            <li className="rss-link">
                <Link href={"rss/monkeyfeed.xml"}>RSS</Link>
            </li>
            <li className={"usernav"}>EMPTY USER NAV</li>
        </ul>
    );
}
