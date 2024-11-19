import { useEffect, useState } from "react";

export default function SsrPage({ initialMessage }) {
    const [message, setMessage] = useState(initialMessage);

    useEffect(() => {
        let newMessage = 'This is a message from useEffect';
        console.log(`old message: ${message}`);
        console.log(`new message: ${newMessage}`);
        setMessage(newMessage);
    }, [message, setMessage]);

    return (
        <div>
            <h1>SSR Page</h1>
            <p>{message}</p>
        </div>
    );
}

export function getStaticProps() {
    return {
        props: {
            initialMessage: 'This is a message from getStaticProps'
        }
    }
}
