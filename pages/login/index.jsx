import LoginModal from "@/components/auth/LoginModal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthenticationContext, STATUS } from "@/components/auth/AuthenticationContext";

export default function Login() {
    const router = useRouter();
    const authManager = useAuthenticationContext();

    useEffect(() => {
        if (authManager.status == STATUS.authenticated) {
            router.push('/')
        }
    }, [authManager.status, router])
    return <LoginModal onDismiss={() => null} />
}
