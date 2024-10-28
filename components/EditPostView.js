import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";
import PostDao from "@/model/PostDao";


export default function EditPostView({ post, onPostSave, onCancel }) {
    const { getAuthToken } = useAuthenticationContext();

    const savePost = (post, attachments) => {
        console.info({ msg: 'updating post', post })
        let authToken = getAuthToken();
        const postDao = PostDao.getPostDao();
        postDao.updatePost(post, attachments, authToken)
            .then(onPostSave)
    };

    return <EditPost post={post} savePost={savePost} onCancel={onCancel} />
}
