import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import { useRouter } from "next/router";
import { useDataContext } from "@/components/api/DataProvider";

export default function DeleteLink({ post, children }) {
    const dataContext = useDataContext();
    const router = useRouter();
    const { getAuthToken } = useAuthenticationContext();

    function deletePost(e) {
        e.preventDefault();
        dataContext.getPostDao().deletePost(post, getAuthToken())
            .then(() => router.push('/'));
    }

    return (
        <a onClick={deletePost} style={{ cursor: 'pointer' }}>{children}</a>
    )
}
