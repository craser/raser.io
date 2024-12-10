import { createContext, useContext, useEffect, useState } from "react";


const SearchContextObj = createContext({
    showSearchUi: (show) => console.log(`(noop) showSearchContext(${show})`),
    search: (terms) => console.log(`(noop) search("${terms}")`),
})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchContext({ children }) {
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');

    const context = {
        showSearchUi: (show) => {
            console.log(`showSearchUi(${show})`);
            setIsUiVisible(show);
        },
        isUiVisible: () => isUiVisible,
        setSearchTerms: (terms) => {
            console.log(`setSearchTerms("${terms}")`)
            setSearchTerms(terms);
        },
        getSearchTerms: () => searchTerms,
    };

    const onKeyUp = (e) => {
        if (e.key == '/') {
            context.showSearchUi(true);
        }
    };

    useEffect(() => {
        console.log('SearchContext: binding global key listener');
        document.addEventListener('keyup', onKeyUp);
    })

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
