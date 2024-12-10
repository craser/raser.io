import { createContext, useContext, useEffect, useState } from "react";
import allEntries from './mock-entries';

function extractText(post) {
    const div = document.createElement('div');
    div.innerHTML = [
        post.intro,
        post.body,
    ].filter(t => t).join(' ');
    const stripped = div.innerText;
    const sanitized = stripped.replaceAll(/\s+/g, ' ');
    return sanitized;
}


const SearchContextObj = createContext({
    showSearchUi: (show) => console.log(`(noop) showSearchContext(${show})`),
    search: (terms) => console.log(`(noop) search("${terms}")`),
})

export function useSearchContext() {
    return useContext(SearchContextObj);
}

export default function SearchContext({ children }) {
    const [index, setIndex] = useState([]);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [searchTerms, setSearchTerms] = useState('');
    const [searchResults, setSearchResults] = useState([])
    const [typeAheadSuggestion, setTypeAheadSuggestion] = useState('');

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
        getSearchResults: () => [...searchResults],
        getTypeAheadSuggestion: () => typeAheadSuggestion,
    };

    const onKeyUp = (e) => {
        if (e.key === '/') {
            context.showSearchUi(true);
        }
    };

    /**
     * Returns an array of search results: { post, text }
     *
     * Matches if the text contains all the tokens.
     */
    const search = () => {
        const tokenMatchers = searchTerms
            .split(/\s+/)
            .map(t => new RegExp(t, 'i'))
        const results = index.filter(result => tokenMatchers.every(matcher => matcher.test(result.text)));
        const typeAheadSuggestion = 'suggestion'; // TODO: implement this
        return {
            typeAheadSuggestion,
            results,
        }
    }

    useEffect(() => {
        console.log('SearchContext: binding global key listener');
        document.addEventListener('keyup', onKeyUp);
    }, [])

    useEffect(() => {
        let newIndex = allEntries.map(post => ({ post, text: extractText(post) }));
        console.log({ index: newIndex });
        setIndex(newIndex);
    }, []);

    useEffect(() => {
        if (searchTerms) {
            const { results, typeAheadSuggestion } = search();
            setSearchResults(results);
            setTypeAheadSuggestion(typeAheadSuggestion);
        } else {
            setSearchResults([]);
            setTypeAheadSuggestion('I want to be an Air Force Ranger!'); // FIXME... obviously
        }
    }, [searchTerms]);

    return (
        <SearchContextObj.Provider value={context}>
            {children}
        </SearchContextObj.Provider>
    );
}
