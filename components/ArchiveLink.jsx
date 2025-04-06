import Link from "next/link";

export default function ArchiveLink({ children, prefetch = true, ...props }) {
    return (
        <Link href="/archive" prefetch={prefetch} {...props}>{children}</Link>
    );
}
