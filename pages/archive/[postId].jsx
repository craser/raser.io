// ABOUTME: The single-post page, statically generated with ISR: each post is read from the database when
// ABOUTME: the page is generated and re-read in the background once the revalidate interval passes.

import SinglePostPage from "@/components/pages/SinglePostPage"
import PostRepository from "@/lib/data/PostRepository";
import SiteConfig from "@/lib/SiteConfig";

export default function PostIdParamPage({ post }) {
    return <SinglePostPage post={post}/>;
}

/**
 * Prerenders the newest posts at build time. Any other post is rendered on its first request
 * ('blocking'), so the page never shows a loading state.
 */
export async function getStaticPaths() {
    const postsToPrerender = new SiteConfig().getValue('staticGeneration.prerender.posts');
    const entries = await PostRepository.getInstance().getEntries(0, postsToPrerender);
    return {
        paths: entries.map(post => ({ params: { postId: post.entryId.toString() } })),
        fallback: 'blocking'
    };
}

/**
 * A missing post revalidates too, so a post published after someone requested its URL still appears.
 * Errors are left to propagate: during revalidation Next.js then keeps serving the last good page
 * rather than caching an empty one.
 */
export async function getStaticProps({ params }) {
    const revalidate = new SiteConfig().getValue('staticGeneration.prerender.revalidateSeconds');
    const post = await PostRepository.getInstance().getPostById(params.postId);
    if (!post) {
        return { notFound: true, revalidate };
    }
    return {
        props: { post },
        revalidate
    };
}
