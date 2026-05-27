// ABOUTME: Context provider for post view state, shared across post sub-components.
// ABOUTME: Renders the appropriate ReadPostView variant based on the initialView prop.
import { createContext, useContext } from "react";
import ReadPostView from "@/components/ReadPostView"

const PostViewContextObject = createContext({
    toEditView: () => false,
});

export function usePostViewContext() {
    const context = useContext(PostViewContextObject);
    return context;
}

export const View = {
    ENTRY_LIST: 'ENTRY_LIST',
    SINGLE_ENTRY: 'SINGLE_ENTRY',
}

export default function PostViewContext({ initialView, post, showBody, next, prev, children }) {
    const view = initialView || View.SINGLE_ENTRY;

    return (
        <PostViewContextObject.Provider value={{ toEditView: () => false }}>
            {(view === View.SINGLE_ENTRY) &&
                <ReadPostView post={post} showBody={showBody} next={next} prev={prev} showNextPrev={true}/>
            }
            {(view === View.ENTRY_LIST) &&
                <ReadPostView post={post} showBody={showBody} next={next} prev={prev} showNextPrev={false}/>
            }
        </PostViewContextObject.Provider>
    );
}
