import LogEntries from '@/components/LogEntries';
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function Home() {
    return (
        <FrontPageLayout
            content={<LogEntries pageSize={20}/>}
        />
    )
}
