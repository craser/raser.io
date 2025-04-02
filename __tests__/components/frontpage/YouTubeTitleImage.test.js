import YouTubeTitleImage, { hasYouTubeEmbed, getFirstYouTubeVideoId } from "@/components/frontpage/YouTubeTitleImage";
import { render } from "@testing-library/react";


const EXAMPLE_POST_INTRO_WITH_VIDEO = `<div><iframe width="630" height="354" src="https://www.youtube-nocookie.com/embed/WPjJW0afKuw" title="YouTube video player" frameborder="0" allow="accelerometer;
autoplay; clipboard-write; encrypted-media; gyroscope;
picture-in-picture" allowfullscreen="" style="--iframe-height: 354px;"></iframe>


<p> I did
    a <a href="https://www.youtube.com/watch?v=iH3swh6FNeU&amp;list=PLxYelmw06qAV9a27sJIl7UIARS0MmKEJY">series
    of "Race Notes" videos</a> covering my 2021 Over the Hump season,
    and trying to note what I could do better. 
</p>

<p> One thing that was really clear in 2021, and again this year in
    2022, was that I need to improve my cornering, especially on loose
    trail. So I've been practicing.
</p>`

const EXAMPLE_POST_INTRO_WITHOUT_VIDEO = `<div>
<p> I did
    a <a href="https://www.youtube.com/watch?v=iH3swh6FNeU&amp;list=PLxYelmw06qAV9a27sJIl7UIARS0MmKEJY">series
    of "Race Notes" videos</a> covering my 2021 Over the Hump season,
    and trying to note what I could do better. 
</p>

<p> One thing that was really clear in 2021, and again this year in
    2022, was that I need to improve my cornering, especially on loose
    trail. So I've been practicing.
</p>`


function renderScaffold(props) {
    return render(<YouTubeTitleImage {...props} />);
}

describe('YouTubeTitleImage', () => {

    it('should correctly detect when a post DOES have a video in the intro', () => {
        const post = {
            intro: EXAMPLE_POST_INTRO_WITH_VIDEO,
        };
        const hasVideo = hasYouTubeEmbed(post);
        expect(hasVideo).toBe(true);
    });

    it('should should correctly detect when a post does NOT have a video in the intro', () => {
        const post = {
            intro: EXAMPLE_POST_INTRO_WITHOUT_VIDEO,
        }
        const hasVideo = hasYouTubeEmbed(post);
        expect(hasVideo).toBe(false);
    });

    it('should find the correct video ID by parsing the body of the post', () => {
        const post = {
            intro: EXAMPLE_POST_INTRO_WITH_VIDEO,
        };

        const videoId = getFirstYouTubeVideoId(post);
        expect(videoId).toBe('WPjJW0afKuw');
    });

    it('should render an img tag with the correct src url', async () => {
        const post = {
            intro: EXAMPLE_POST_INTRO_WITH_VIDEO,
        };
        const result = await renderScaffold({ post });
        const img = await result.findByTestId('youtube-title-image');
        expect(img.src).toBe('https://i.ytimg.com/vi/WPjJW0afKuw/hqdefault.jpg');
    });
});

