import {useEffect, useState, useContext} from "react";
import {useRouter} from "next/router";
import PostDao from '/model/PostDao';
import {Post} from "@/components/Post";
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function SinglePost(props, pageProps) {
    const router = useRouter();
    const postId = router.query.postId;
    const [post, setPost] = useState(null);

    useEffect(() => {
        console.debug(`Fetching entry for ${postId}`);
        new PostDao().getPostById(postId)
            .then(post => setPost(post));
    });

    return (
        <FrontPageLayout
            content={<Post post={post}/>}
        />
    );
}
