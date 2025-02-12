import React from "react";
import { useSearchContext } from "@/components/search/SearchProvider";
import styles from "./Search.module.scss"
import SearchInput from "@/components/search/SearchInput";
import SearchResults from "@/components/search/SearchResults";
import Modal from "@/components/Modal";

export default function Search(props) {
    const searchContext = useSearchContext();
    const uiVisible = searchContext.isUiVisible();

    if (!uiVisible) {
        return null;
    } else {
        return (
            <Modal onDismiss={() => searchContext.showSearchUi(false)}>
                <div data-testid="search-ui" className={styles.searchInterface}>
                    <SearchInput/>
                    <SearchResults selectedResult={searchContext.getSelectedResult()}/>
                </div>
            </Modal>
        )
    }
}
