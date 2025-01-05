import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Search from '@/lib/search/SearchImplementation';
import PostDao from "@/model/PostDao";
import { useRouter } from "next/router";
import { getPostLink } from "@/components/PostLink";

const MIN_SEARCH_TERM_LENGTH = 3;

const SearchContextObj = createContext({})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchProvider({ children }) {
    const router = useRouter();

    const [isSearchAvailable, setIsSearchAvailable] = useState(true);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const [completion, setCompletion] = useState('');
    const [searchImpl, setSearchImpl] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null); // index of currently selected search result

    function range(v) {
        if (v < -1) {
            return -1;
        } else if (v > searchResults.length - 1) {
            return searchResults.length - 1
        } else {
            return v;
        }
    }

    function goToResult(i = selectedResult) {
        setIsUiVisible(false);
        const post = searchResults[i].post;
        router.push(getPostLink(post));
    }

    const context = {
        isSearchAvailable: () => isSearchAvailable,
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
        getSearchResults: () => [...searchResults],
        getCompletion: () => completion,
        getSelectedResult: () => selectedResult,
        setSelectedResult: (i) => { console.log(`selected: ${i}`); setSelectedResult(i) },
        selectNextResult: () => setSelectedResult(range(selectedResult + 1)),
        selectPrevResult: () => setSelectedResult(range(selectedResult - 1)),
        goToResult
    };

    const onKeyUp = (e) => {
        if (e.key === '/') {
            context.showSearchUi(true);
        }
    };

    useEffect(() => {
        console.log('SearchContext: binding global key listener');
        document.addEventListener('keyup', onKeyUp);
    }, [])

    useEffect(() => {
        const start = new Date().getTime();
        new PostDao().getSearchStubs()
            .then(stubs => {
                console.log(`fetched search stubs in ${new Date().getTime() - start}ms`)
                console.log({ stubs: stubs });
                return stubs;
            })
            .then(stubs => setSearchImpl(new Search(stubs)))
            .catch((e) => {
                //console.error('error fetching search stubs', e);
                setIsSearchAvailable(false);
                setIsUiVisible(false);
            });
    }, []);

    useEffect(() => {
        if (!searchTerms || searchTerms.length < MIN_SEARCH_TERM_LENGTH) {
            setSearchResults([]);
            setCompletion('');
            setSelectedResult(-1);
        } else if (!searchImpl) {
            return; // no point
        } else if (searchTerms) {
            const results = searchImpl.search(searchTerms);
            setSearchResults(results.results);
            setCompletion(results.completion);
            setSelectedResult(-1);
        }
    }, [searchTerms]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}


