import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";
import PostDao from '@/model/PostDao';

export default function PostIdParamPage(props) {
    const router = useRouter();

    // If fallback is true and the page is being generated
    if (router.isFallback) {
        return <LoadingSpinner />
    }

    // If we have props from getStaticProps, use those directly
    if (props.post) {
        return <SinglePostPage
                postId={props.post.entryId}
                initialPost={props.post}
                initialNext={props.next}
                initialPrev={props.prev} />;
    }

    // Fallback for client-side navigation or if props aren't available
    if (!router.query.postId) {
        return <LoadingSpinner />
    } else {
        return <SinglePostPage postId={router.query.postId}/>;
    }
}

export async function getStaticPaths() {
    // Create the PostDao instance
    const postDao = PostDao.getPostDao();

    // Fetch the most recent posts (adjust the number as needed)
    const recentPosts = await postDao.getEntries(0, 20);

    // Create paths for each post
    const paths = recentPosts.map(post => ({
        params: { postId: Number(post.entryId).toString() } // same type it's expected by the router.
    }));

    // dump to console for debugging
    console.log("Paths for static generation:");
    paths.forEach(path => console.log(JSON.stringify(path)));


    return {
        paths,
        // Enable fallback to generate pages on demand for posts not generated at build time
        fallback: true
    };
}

export async function getStaticProps({ params }) {
    const { postId } = params;

    try {
        // Create the PostDao instance
        const postDao = PostDao.getPostDao();

        // Fetch the post and its next/prev posts
        const post = await postDao.getPostById(postId);
        const next = await postDao.getNextPost(post);
        const prev = await postDao.getPrevPost(post);

        return {
            props: {
                post,
                next,
                prev
            },
            // Revalidate every hour (3600 seconds)
            revalidate: 3600
        };
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        return {
            notFound: true
        };
    }
}


