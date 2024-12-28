import React from "react";
import { useSearchContext } from "@/components/search/SearchProvider";
import styles from "./Search.module.scss"
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

export default function Search(props) {

    // FIXME: This just seems unnecessarily hacky...
    const searchContext = useSearchContext();
    const uiVisible = searchContext.isUiVisible();


    /* Close the Search UI if user hits esc
     * (Bound on container around input, NOT input itself.)
     */
    const onKeyUp = (e) => {
        console.log({ key: e });
        if (e.keyCode === 27) {
            searchContext.showSearchUi(false);
        } else if (e.code === 'Escape') {
            searchContext.showSearchUi(false);
        }
    }

    return (
        <>
            {uiVisible &&
                <div className={styles.searchBackdrop} onClick={() => searchContext.showSearchUi(false)}></div>
            }
            <div className={styles.searchContainer} onKeyUp={onKeyUp}>
                {uiVisible &&
                    <div data-testid="search-ui" className={styles.searchInterface}>
                        <SearchInput/>
                        <SearchResults pageSize={10}/>
                    </div>
                }
            </div>
        </>
    )
}
