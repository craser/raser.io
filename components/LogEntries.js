import {Fragment, useEffect, useState} from 'react';
import PostDao from '../model/PostDao';
import EdgeConfigPostDao from "@/model/EdgeConfigPostDao";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostViewContext, { View } from "@/components/PostViewContext";

function markCachedEntries(entries) {
    return entries.map(e => ({ ...e, title: `cached: ${e.title}`}));
}

function markFetchedEntries(entries) {
    return entries.map(e => ({ ...e, title: `fetched: ${e.title}`}));
}

export default function LogEntries(props) {
    const [entries, setEntries] = useState([]);
    let pageSize = props.pageSize;

    useEffect(() => {
        const startTime = new Date().getTime();
        new EdgeConfigPostDao().getLatestPost()
            .then(entries => setEntries(entries))
            .then(() => {
                const now = new Date().getTime();
                const elapsed = now - startTime;
                console.log(`fetched from blob cache in ${elapsed}ms`);
            })
            .then(() => PostDao.getCachingPostDao().getEntries())
            .then(entries => entries.slice(0, pageSize))
            .then(entries => setEntries(entries))
            .then(() => {
                const now = new Date().getTime();
                const elapsed = now - startTime;
                console.log(`fetched from api in ${elapsed}ms`);
            })
            .catch((e) => console.error(e));
    }, []);

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
