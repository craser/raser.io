import standardStyles from "@/components/templates/StandardLayout.module.scss";
import SearchButton from "@/components/search/SearchButton";
import FeatureEnabled from "@/components/flags/FeatureEnabled";
import HighContrastToggle from "@/components/theme/HighContrastToggle";

export default function SiteNavigationHeader({ styles = standardStyles }) {
    return (
        <div data-testid="site-nav" className={styles.sitenav}>
            <FeatureEnabled feature="navSearch">
                <div className={styles.navitem}>
                    {/* I'm really annoyed with myself for blending the components like this. */}
                    <SearchButton className={styles.searchButton}/>
                </div>
            </FeatureEnabled>
            <div className={styles.navitem}>
                <HighContrastToggle/>
            </div>
        </div>
    );
}
