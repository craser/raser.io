import {Fragment, useEffect, useState} from 'react';
import {Post} from './Post';
import PostDao from '../model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";
import PostViewContext, { View } from "@/components/PostViewContext";

export default function LogEntries(props) {
    const [entries, setEntries] = useState([]);
    let pageSize = props.pageSize;

    useEffect(() => {
        console.log('useEffect firing!');
        PostDao.getCachingPostDao().getEntries()
            .then(entries => entries.slice(0, pageSize))
            .then(entries => setEntries(entries))
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
