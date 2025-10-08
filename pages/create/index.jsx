import SecurePage from "@/components/auth/SecurePage";
import CreatePostPage from "@/components/pages/CreatePostPage";
import StandardLayout from "@/components/templates/StandardLayout";

export default function PostIdParamPage(props) {
    return (
        <StandardLayout content={
            <CreatePostPage/>
        }/>
    );
}
