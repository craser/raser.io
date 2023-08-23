
import { useEffect, useState } from 'react';
import { Post } from './Post';
import PostDao from '../model/PostDao';

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

    async function fetchLatestPost() {
        return {
            title: 'DUMMY_TITLE',
            body: 'DUMMY_BODY & WHATNOT'
        };
    }

    // fetch latest post from MySQL database
    // return latest post

    return <Post post={post} />;
}
