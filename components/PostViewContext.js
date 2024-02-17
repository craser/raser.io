import { createContext, useContext, useState } from "react";
import EditPostView from "@/components/EditPostView";
import ReadPostView from "@/components/ReadPostView"

const PostViewContextObject = createContext({
    toReaderView: () => false,
    toEditView: () => false,
});

export function usePostViewContext() {
    const context = useContext(PostViewContextObject);
    return context;
}

export const View = {
    ENTRY_LIST: 'ENTRY_LIST',
    SINGLE_ENTRY: 'SINGLE_ENTRY',
    EDIT: 'EDIT'
}

export default function PostViewContext({ initialView, post, next, prev, children }) {
    const [views, setViews] = useState([]);
    const [view, setView] = useState(initialView || View.SINGLE_ENTRY);

    function pushView(v) {
        let vs = [...views, view];
        setViews(vs);
        setView(v);
    }

    function popView() {
        if (views.length) {
            let vs = views;
            let v = vs.pop();
            setViews(vs);
            setView(v);
        } else {
            setView(initialView);
        }
    }

    function toReaderView() {
        pushView(View.SINGLE_ENTRY);
    }

    function toEditView() {
        pushView(View.EDIT);
    }

    return (
        <PostViewContextObject.Provider value={{ toReaderView, toEditView }}>
            {(view === View.SINGLE_ENTRY) &&
                <ReadPostView post={post} next={next} prev={prev} showNextPrev={true}/>
            }
            {(view === View.ENTRY_LIST) &&
                <ReadPostView post={post} next={next} prev={prev} showNextPrev={false}/>
            }
            {(view === View.EDIT) &&
                <EditPostView post={post} onPostSave={popView} onCancel={popView} />
            }
        </PostViewContextObject.Provider>
    );
}
