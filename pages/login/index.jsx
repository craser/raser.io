import LoginModal from "@/components/auth/LoginModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthenticationContext, STATUS } from "@/components/auth/AuthenticationContext";

export default function Login() {
    const router = useRouter();
    const authManager = useAuthenticationContext();
    const [loaded, setLoaded] = useState(false); // hacky fix - see notes above useEffect

    // This is a hacky fix for an unintended interaction between how I'm rendering ModalProvider and
    // how this page behaves when minified by Next.js's build process.
    useEffect(() => {
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (authManager.status == STATUS.authenticated) {
            router.push('/')
        }
    }, [authManager.status, router])


    return <>{loaded && <LoginModal onDismiss={() => null} />}</>;
}
