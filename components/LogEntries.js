import {Fragment, useEffect, useState} from 'react';
import {Post} from './Post';
import PostDao from '../model/PostDao';
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LogEntries(props) {
    const [entries, setEntries] = useState([]);
    let pageSize = props.pageSize;

    useEffect(() => {
        new PostDao().getEntries()
            .then(entries => entries.slice(0, pageSize))
            .then(entries => setEntries(entries))
            .catch((e) => console.error(e));
    }, []);

    if (entries.length) {
        return (
            <Fragment>
                {entries.map(e => <Post key={e.Entry_ID} post={e}/>)}
            </Fragment>
        );
    } else {
        return (
            <LoadingSpinner/>
        );
    }

}
