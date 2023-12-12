import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import RawPostDao from "@/model/PostDao";
import { useState } from "react";
import { useRouter } from "next/router";

export default function DeleteLink({ post, children }) {
    const router = useRouter();
    const { getAuthToken } = useAuthenticationContext();
    const [postDao, setPostDao] = useState(new RawPostDao());

    function deletePost(e) {
        e.preventDefault();
        postDao.deletePost(post, getAuthToken())
            .then(() => router.push('/'));
    }

    return (
        <a onClick={deletePost} style={{ cursor: 'pointer' }}>{children}</a>
    )
}
