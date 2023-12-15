import { EditPost } from "@/components/EditPost";

export default function EditPostView({ post, onPostSave, onCancel }) {

    const savePost = (post, attachments) => {
        console.info({ msg: 'updating post', post })
        let authToken = getAuthToken();
        postDao.updatePost(post, attachments, authToken)
            .then(onPostSave)
    };

    return <EditPost post={post} savePost={savePost} onCancel={onCancel} />
}
