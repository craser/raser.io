import styles from "@/components/templates/StandardLayout.module.scss";
import Link from "next/link";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import LoginButton from "@/components/auth/LoginButton";
import LogoutButton from "@/components/auth/LogoutButton";
import AuthRecognized from "@/components/auth/AuthRecognized";
import SearchButton from "@/components/search/SearchButton";
import FeatureEnabled from "@/components/flags/FeatureEnabled";

export default function SiteNavigationHeader(props) {
    return (
        <div className={styles.sitenav}>
            <FeatureEnabled feature="navSearch">
                <div className={styles.navitem}>
                    {/* I'm really annoyed with myself for blending the components like this. */}
                    <SearchButton className={styles.searchButton}/>
                </div>
            </FeatureEnabled>
            <FeatureEnabled feature="userLogin">
                <AuthRecognized>
                    <div className={styles.navitem}>
                        <LoginButton className={styles.loginButton}/>
                    </div>
                </AuthRecognized>
                <AuthLoggedIn>
                    <div className={styles.navitem}>
                        <Link href={'/create'}>new entry</Link>
                        <LogoutButton>log out</LogoutButton>
                    </div>
                </AuthLoggedIn>
            </FeatureEnabled>
        </div>
    );
}
