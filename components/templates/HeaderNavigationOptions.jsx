import styles from "@/components/templates/FrontPageLayout.module.scss";
import Link from "next/link";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import LoginButton from "@/components/auth/LoginButton";
import LogoutButton from "@/components/auth/LogoutButton";
import AuthRecognized from "@/components/auth/AuthRecognized";
import Search from "@/components/search/Search";
import SearchButton from "@/components/search/SearchButton";

export default function HeaderNavigationOptions(props) {
    return (
        <ul className={styles.sitenav}>
            <li>
                {/* I'm really annoyed with myself for blending the components like this. */}
                <SearchButton className={styles.searchButton}/>
            </li>
            <li>
                <AuthRecognized>
                    <LoginButton className={styles.loginButton}/>
                </AuthRecognized>
                <AuthLoggedIn>
                    <Link href={'/create'}>new entry</Link>
                    <LogoutButton>log out</LogoutButton>
                </AuthLoggedIn>
            </li>
        </ul>
    );
}
