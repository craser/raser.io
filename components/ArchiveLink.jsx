import Link from "next/link";

export default function ArchiveLink({ children, ...props }) {
    return (
        <Link href="/archive" {...props}>{children}</Link>
    );
}
