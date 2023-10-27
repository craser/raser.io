export default function NextPrevPostLinks({ nextPost, prevPost }) {
    return (
        <div>
            <h1 onClick={nextPost}>NEXT</h1>
            <h1 onClick={prevPost}>PREV</h1>
        </div>
    );
}
