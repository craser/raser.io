import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import PostDao from '/model/PostDao';
import { Post } from "@/components/Post";
import FrontPageLayout from "@/components/templates/FrontPageLayout";
import LogEntry from "@/components/LogEntry";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SinglePost(props) {
    const router = useRouter();
    const postId = router.query.postId;

    if (!postId) {
        return <LoadingSpinner />
    } else {
        return <LogEntry postId={postId}/>;
    }
}
