// ABOUTME: Nav button that opens the search UI.
// ABOUTME: Renders nothing while the search context says search is unavailable.

import { useSearchContext } from "@/components/search/SearchProvider";
import { Search } from 'lucide-react';
import { NavButton } from "@/components/navigation/NavButton";


// TODO: Make styling consistent with other nav items by pulling in nav styling

// TODO: add /Users/craser/dev/cjr/wk/raser.io/public/icons/search-circle-fill.svg as icon
export default function SearchButton({ className }) {
    const searchContext = useSearchContext();
    const isSearchAvailable = searchContext.isSearchAvailable();

    const showSearchUi = (e) => {
        e.preventDefault();
        searchContext.showSearchUi(true);
    };

    // FIXME: Using an <a> here to piggyback on nav styling.

    if (!isSearchAvailable) {
        return null;
    } else {
        return (
            <NavButton data-testid="search-button" Icon={Search} onClick={showSearchUi}>
                Search
            </NavButton>
        )
    }
}
