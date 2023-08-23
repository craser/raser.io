import {Fragment, useEffect, useState} from 'react';
import {Post} from './Post';
import PostDao from '../model/PostDao';
import ToggleDemo from "@/components/ToggleDemo";

export const LatestPost = () => {

    const [post, setPost] = useState({});

    useEffect(() => {
        new PostDao().getLatestPost()
            .then(post => setPost(post))
            .catch((e) => setPost({
                title: 'ERROR FETCHING LATEST',
                body: e.toString()
            }));
    });

    return (
        <Fragment>
            <Post post={post}/>
            <ToggleDemo />
        </Fragment>
    )

}
