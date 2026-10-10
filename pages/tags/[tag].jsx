import { useRouter } from "next/router";
import LogEntries from '@/components/LogEntries';
import StandardLayout from "@/components/templates/StandardLayout";
import SingleSectionContent from '@/components/templates/SingleSectionContent';
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Lists the posts carrying one tag, newest first, laid out like the archive.
 */
export default function TagPage() {
    const router = useRouter();
    if (!router.isReady) {
        return <LoadingSpinner/>;
    }
    const tag = router.query.tag;
    // Keyed by tag, so following a tag link from this page starts a fresh list.
    return (
        <StandardLayout content={
            <SingleSectionContent content={
                <LogEntries key={tag} tag={tag} initialPage={0} pageSize={30}/>
            }/>
        } />
    );
}
