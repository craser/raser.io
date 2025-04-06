import LogEntries from '../../components/LogEntries';
import StandardLayout from "../../components/templates/StandardLayout";
import PostDao from '@/model/PostDao';

export default function Home({ initialEntries }) {
    return (
        <StandardLayout
            content={<LogEntries initialEntries={initialEntries} initialPage={0} pageSize={30}/>}
        />
    )
}

export async function getStaticProps() {
    try {
        // Create the PostDao instance
        const postDao = PostDao.getPostDao();
        
        // Fetch the first page of entries
        const initialEntries = await postDao.getEntries(0, 30);
        
        return {
            props: {
                initialEntries
            },
            // Revalidate every hour (3600 seconds)
            revalidate: 3600
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
