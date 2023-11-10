import styles from "@/components/templates/FrontPageLayout.module.scss";
import Link from "next/link";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import AuthGuest from "@/components/auth/AuthGuest";
import LoginButton from "@/components/auth/LoginButton";
import CheckAuthButton from "@/components/auth/CheckAuthButton";

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
            <AuthGuest>
                <LoginButton />
            </AuthGuest>
            <AuthLoggedIn>
                <CheckAuthButton />
            </AuthLoggedIn>
        </ul>
    );
}
