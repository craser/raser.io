import Image from 'next/image'
//import { Inter } from 'next/font/google'
import LogEntries from '@/components/LogEntries';
import FrontPageLayout from "@/components/templates/FrontPageLayout";

export default function Home() {
    return (
        <FrontPageLayout
            content={<LogEntries pageSize={10}/>}
        />
    )
}
