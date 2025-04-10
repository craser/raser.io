
export function hasYouTubeEmbed(post) {
    return !!getFirstYouTubeVideoId(post);
}

export function getFirstYouTubeVideoId(post) {
    const regex = /src="https:\/\/www.youtube.*?\/embed\/(?<videoId>\w+)/;
    if (regex.test(post.intro)){
        const videoId = post.intro.match(regex).groups.videoId;
        return videoId;
    } else {
        return null;
    }
}

export function getYouTubeTitleImageUrl(post) {
    const videoId = getFirstYouTubeVideoId(post);
    const url = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return url;
}

export default function YouTubeTitleImage({ post, onError, ...props}) {
    const url = getYouTubeTitleImageUrl(post);
    return <img data-testid="youtube-title-image" src={url}
                onError={onError}
                {...props}
    />;
}
