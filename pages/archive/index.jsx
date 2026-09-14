import LogEntries from '../../components/LogEntries';
import StandardLayout from "../../components/templates/StandardLayout";
import SingleSectionContent from '@/components/templates/SingleSectionContent';

export default function Home({ initialEntries }) {
    return (
        <StandardLayout content={
            <SingleSectionContent content={
                <LogEntries initialEntries={initialEntries} initialPage={0} pageSize={30}/>
            }/>
        } />
    )
}
