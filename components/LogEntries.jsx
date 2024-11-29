import { Fragment, useEffect, useState } from 'react';
import PostDao from '../model/PostDao';
import EdgeConfigPostDao from "@/model/EdgeConfigPostDao";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostViewContext, { View } from "@/components/PostViewContext";

function markCachedEntries(entries) {
    return entries.map(e => ({ ...e, title: `cached: ${e.title}` }));
}

function markFetchedEntries(entries) {
    return entries.map(e => ({ ...e, title: `fetched: ${e.title}` }));
}

export default function LogEntries({ pageSize, initialEntries }) {
    console.log({ initialEntries });
    const [entries, setEntries] = useState(initialEntries || []);

    if (entries.length) {
        return (
            <Fragment>
                {entries.map(e => <PostViewContext key={e.entryId} post={e} initialView={View.ENTRY_LIST}/>)}
            </Fragment>
        );
    } else {
        return (
            <LoadingSpinner/>
        );
    }

}
