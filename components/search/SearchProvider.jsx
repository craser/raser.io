import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Search from '@/lib/search/SearchImplementation';
import PostDao from "@/model/PostDao";

const MIN_SEARCH_TERM_LENGTH = 3;

const SearchContextObj = createContext({})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchProvider({ children }) {
    const [isSearchAvailable, setIsSearchAvailable] = useState(true);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const [completion, setCompletion] = useState('');
    const [searchImpl, setSearchImpl] = useState(null);
    const [matchedWords, setMatchedWords] = useState({});

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
        getMatchedWords: () => matchedWords,
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
            setMatchedWords({});
        } else if (searchTerms) {
            const results = searchImpl.search(searchTerms);
            setSearchResults(results.results);
            setCompletion(results.completion);
            setMatchedWords(results.matchedWords);
        }
    }, [searchTerms]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
