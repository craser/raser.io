import {Fragment, useEffect, useState} from "react";
import {useRouter} from "next/router";
import PostDao from '/model/PostDao';
import {Post} from "@/components/Post";

export default function SinglePost(props, pageProps) {
    const router = useRouter();
    const postId = router.query.postId;

    let [ post, setPost ] = useState({});

    useEffect(() => {
        new PostDao().getPostById(postId)
            .then(post => setPost(post));
    });

    return (
        <Post post={post} />
    );
}
