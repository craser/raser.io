import LogEntries from '../../components/LogEntries';
import StandardLayout from "../../components/templates/StandardLayout";

export default function Home({ initialEntries }) {
    return (
        <StandardLayout
            content={<LogEntries initialEntries={initialEntries} initialPage={0} pageSize={30}/>}
        />
    )
}
