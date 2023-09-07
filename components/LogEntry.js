import { useEffect, useMemo, useState } from "react";
import PostDao from "@/model/PostDao";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import { Post } from "@/components/Post";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LogEntry(props) {
    console.log(`LogEntry(${props.postId})`);
    let postId = props.postId;
    const [post, setPost] = useState(null);

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        new PostDao().getPostById(postId)
            .then(post => setPost(post))
            .catch((e) => {
                console.error(e);
                setPost({})
            });

    }, []);

    if (!post) {
        return <LoadingSpinner/>;
    } else {
        return (
            <FrontPageLayout
                content={<Post post={post}/>}
            />
        );
    }
}
