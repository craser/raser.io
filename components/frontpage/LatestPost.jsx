import Link from "next/link"
import { useDataContext } from "@/components/api/DataProvider";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PostedDate } from "@/components/frontpage/PostedDate";
import { EstimatedMinutesToRead } from "@/components/frontpage/EstimatedMinutesToRead";
import FrontPageTitleImage from "@/components/frontpage/FrontPageTitleImage";
import { PostBriefIntro } from "@/components/frontpage/PostBriefIntro";

export default function LatestPostSection() {
    const postDao = useDataContext().getPostDao();

    const [post, setPost] = useState(null);

    useEffect(() => {
        postDao.getLatestPost().then(setPost);
    }, []);

    if (!post) {
        return (
            <LoadingSpinner />
        );
    } else {

        return (
            <section className="relative w-full h-[500px] overflow-hidden">
                {/* Vertical "Latest Post" header */}
                <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
                    <h2 className="transform -rotate-90 origin-center whitespace-nowrap text-5xl font-bold tracking-wider text-white uppercase">
                        Latest
                    </h2>
                </div>

                {/* Background image */}
                <div className="absolute inset-0">
                    <FrontPageTitleImage post={post}/>
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/70"></div>
                </div>

                {/* Content overlay positioned on the right */}
                <div className="relative h-full flex items-center">
                    <div className="ml-auto w-2/3 md:w-1/2 p-8 md:p-12">
                        <Link href="/blog/latest-post">
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 hover:underline">
                                {post.title}
                            </h3>
                        </Link>
                        <PostBriefIntro post={post} className="text-white/80 text-sm md:text-base mb-6" />
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
                                <img src="/img/chris-social-avatar.png" alt="Chris Raser" className="w-10 h-10 rounded-full"/>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">Chris Raser</p>
                                <p className="text-white/70 text-xs">
                                    <PostedDate post={post}/> • <EstimatedMinutesToRead post={post}/></p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
}

