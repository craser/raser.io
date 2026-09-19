import standardStyles from "@/components/templates/StandardLayout.module.scss";
import SearchButton from "@/components/search/SearchButton";
import FeatureEnabled from "@/components/flags/FeatureEnabled";

export default function SiteNavigationHeader({ styles = standardStyles }) {
    return (
        <div data-testid="site-nav" className={styles.sitenav}>
            <FeatureEnabled feature="navSearch">
                <div className={styles.navitem}>
                    {/* I'm really annoyed with myself for blending the components like this. */}
                    <SearchButton className={styles.searchButton}/>
                </div>
            </FeatureEnabled>
        </div>
    );
}
