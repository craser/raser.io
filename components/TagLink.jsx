import Link from "next/link";

export default function TagLink(props) {
    let { tag } = props;

    return (
        <Link href={`/tags/${tag}`}>{tag}</Link>
    )
}
