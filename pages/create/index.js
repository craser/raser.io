import SecurePage from "@/components/auth/SecurePage";
import CreatePostPage from "@/components/pages/CreatePostPage";
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function PostIdParamPage(props) {
    return (
        <FrontPageLayout content={
            <CreatePostPage/>
        }/>
    );
}
