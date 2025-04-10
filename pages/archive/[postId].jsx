import { useRouter } from "next/router";
import SinglePostPage from "@/components/pages/SinglePostPage"
import LoadingSpinner from "@/components/LoadingSpinner";
import PostDao from '@/model/PostDao';
import SiteConfig from '@/lib/SiteConfig';

export default function PostIdParamPage() {
    const router = useRouter();
    const postId = !router.query.postId;
    console.log(`PostIdParamPage: postId ${postId} (fallback? ${router.isFallback})`);
    if (postId) {
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

        return {
            props: {},
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        return {
            notFound: true
        };
    }
}


