import LogEntries from '@/components/LogEntries';
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function Home({ initialEntries }) {
    return (
        <FrontPageLayout
            content={<LogEntries pageSize={10}/>}
        />
    )
}
