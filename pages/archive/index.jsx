import LogEntries from '../../components/LogEntries';
import StandardLayout from "../../components/templates/StandardLayout";
import PostDao from '@/model/PostDao';
import SiteConfig from '@/lib/SiteConfig';
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

export async function getStaticProps() {
    try {
        // Get config
        const config = new SiteConfig();
        const entriesCount = config.getValue('staticGeneration.prerender.archiveEntries') || 30;
        const revalidateSeconds = config.getValue('staticGeneration.prerender.revalidateSeconds') || 3600;
        const postDao = PostDao.getCachingPostDao(); // Use caching DAO for better performance
        const initialEntries = await postDao.getEntries(0, entriesCount);

        return {
            props: {
                initialEntries
            },
            revalidate: revalidateSeconds
        };
    } catch (error) {
        console.error('Error fetching initial entries:', error);
        return {
            props: {
                initialEntries: []
            }
        };
    }
}
