import { EditPost } from "@/components/EditPost";
import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";



export default function EditPostView({ post, onPostSave, onCancel }) {
    const dataContext = useDataContext();
    const { getAuthToken } = useAuthenticationContext();

    const savePost = (post, attachments) => {
        console.info({ msg: 'updating post', post })
        let authToken = getAuthToken();
        dataContext.getPostDao().updatePost(post, attachments, authToken)
            .then(onPostSave)
    };

    return <EditPost post={post} savePost={savePost} onCancel={onCancel} />
}
