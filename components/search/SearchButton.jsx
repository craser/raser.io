import { useSearchContext } from "@/components/search/SearchContext";

// TODO: Make styling consistent with other nav items by pulling in nav styling

// TODO: add /Users/craser/dev/cjr/wk/raser.io/public/icons/search-circle-fill.svg as icon
export default function SearchButton(props) {
    const searchContext = useSearchContext();
    const showSearchUi = (e) => {
        e.preventDefault();
        searchContext.showSearchUi(true);
    };

    // FIXME: Using an <a> here to piggyback on nav styling.
    return (
        <a onClick={showSearchUi}>Search</a>
    );
}
