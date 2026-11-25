import { createContext, useContext, useEffect, useRef, useState } from "react";
import Search from '@/lib/search/SearchImplementation';
import { useRouter } from "next/router";
import { useDataContext } from "@/components/api/DataProvider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { getPostLink } from "@/lib/util/Links";

const MIN_SEARCH_TERM_LENGTH = 3;

const SearchContextObj = createContext({})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchProvider({ children }) {
    const analytics = useAnalytics();
    const dataContext = useDataContext()
    const router = useRouter();

    const [isSearchAvailable, setIsSearchAvailable] = useState(true);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const [completion, setCompletion] = useState('');
    const [searchImpl, setSearchImpl] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null); // index of currently selected search result
    const [searchedTerms, setSearchedTerms] = useState(null); // the terms the current results are for
    const [searchedImpl, setSearchedImpl] = useState(null); // the index the current results came from
    const indexRequested = useRef(false);

    // New terms, or the index arriving, replace the results and clear the selection. Terms typed
    // before the index has loaded find nothing until it arrives, then are searched.
    if (searchTerms !== searchedTerms || searchImpl !== searchedImpl) {
        setSearchedTerms(searchTerms);
        setSearchedImpl(searchImpl);
        if (!searchTerms || searchTerms.length < MIN_SEARCH_TERM_LENGTH) {
            setSearchResults([]);
            setCompletion('');
            setSelectedResult(-1);
        } else if (searchImpl) {
            const results = searchImpl.search(searchTerms);
            setSearchResults(results.results);
            setCompletion(results.completion);
            setSelectedResult(-1);
        }
    }

    function range(v) {
        let result = v;
        let max = searchResults.length - 1;
        if (v <= -1) {
            result = -1;
        } else if (v >= max) {
            result = max;
        }
        console.log(`range(${v}) (max: ${max}) = ${result}`)
        return result;
    }

    function goToResult(i = selectedResult) {
        setIsUiVisible(false);
        const { post } = (i in searchResults)
            ? searchResults[i]
            : searchResults[0];

        analytics.fireUiEngagement('search', 'select result', {
            terms: searchTerms,
            post: post.entryId,
        });
        router.push(getPostLink(post));
    }

    /**
     * Fetches the stubs and builds the index, the first time search is opened. Most page views
     * never search, so they never download the index.
     */
    function loadSearchIndex() {
        if (indexRequested.current) {
            return;
        }
        indexRequested.current = true;
        const start = new Date().getTime();
        dataContext.getPostDao().getSearchStubs()
            .then(stubs => {
                console.log(`fetched ${stubs.length} search stubs in ${new Date().getTime() - start}ms`);
                setSearchImpl(new Search(stubs));
            })
            .catch((e) => {
                console.error('error fetching search stubs', e);
                setIsSearchAvailable(false);
                setIsUiVisible(false);
            });
    }

    const context = {
        minSearchTermLength: MIN_SEARCH_TERM_LENGTH,
        isSearchAvailable: () => isSearchAvailable,
        showSearchUi: (show) => {
            console.log(`showSearchUi(${show})`);
            analytics.fireUiEngagement('search', 'open');
            if (show) {
                loadSearchIndex();
            }
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
        setSelectedResult: (i) => {
            console.log(`selected: ${i}`);
            setSelectedResult(i)
        },
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
        return () => document.removeEventListener('keyup', onKeyUp);
    }, [])


    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}


