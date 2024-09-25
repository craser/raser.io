import {Fragment, useEffect, useState} from 'react';
import PostDao from '../model/PostDao';
import EdgeConfigPostDao from "@/model/EdgeConfigPostDao";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostViewContext, { View } from "@/components/PostViewContext";

export default function LogEntries(props) {
    const [entries, setEntries] = useState([]);
    let pageSize = props.pageSize;

    useEffect(() => {
        const startTime = new Date().getTime();
        new EdgeConfigPostDao().getLatestPost()
            .then(post => { console.log('edge', post); return post; })
            .then(post => setEntries([post]))
            .then(() => {
                const now = new Date().getTime();
                const elapsed = now - startTime;
                console.log(`fetched from edge config in ${elapsed}ms`);
            })
            .then(() => PostDao.getCachingPostDao().getEntries())
            .then(entries => entries.slice(0, pageSize))
            .then(entries => { console.log('cached/fetched', entries); return entries; })
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
