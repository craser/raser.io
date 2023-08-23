import renderer from 'react-test-renderer';
import LatestPost from '@/components/LatestPost';

it('renders correctly', () => {
    const tree = renderer
        .create(<LatestPost />)
        .toJSON();
    expect(tree).toMatchSnapshot();
});
