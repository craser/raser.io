import React, { useEffect, useState } from "react";
import { useSearchContext } from "@/components/search/SearchContext";
import styles from "./Search.module.scss"
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";

export default function Search(props) {
    const searchContext = useSearchContext();
    const contextUiVisible = searchContext.isUiVisible();
    const [uiVisible, setUiVisible] = useState(contextUiVisible);


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

    useEffect(() => {
        setUiVisible(contextUiVisible)
    }, [contextUiVisible]);

    return (
        <div className={styles.searchContainer} onKeyUp={onKeyUp}>
            {uiVisible &&
                <div className={styles.searchInterface}>
                    <SearchInput />
                    <SearchResults pageSize={10} />
                </div>
            }
        </div>
    )
}
