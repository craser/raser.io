import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";
import PostDao from '@/model/PostDao';
import SiteConfig from '@/lib/SiteConfig';

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
    const postDao = PostDao.getCachingPostDao();
    const config = new SiteConfig();
    const postsToPrerender = config.getValue('staticGeneration.prerender.posts') || 20;
    const recentPosts = await postDao.getEntries(0, postsToPrerender);

    // Create paths for each post
    const paths = recentPosts.map(post => ({
        params: { postId: post.entryId.toString() }
    }));

    return {
        paths,
        // Enable fallback to generate pages on demand for posts not generated at build time
        fallback: true
    };
}

export async function getStaticProps({ params }) {
    const { postId } = params;

    try {
        const config = new SiteConfig();
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;
        const postDao = PostDao.getCachingPostDao(); // Use caching DAO for better performance

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
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        return {
            notFound: true
        };
    }
}


