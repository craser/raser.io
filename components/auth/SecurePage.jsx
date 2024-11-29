import LoginModal from "@/components/auth/LoginModal";
import AuthLoggedIn from "@/components/auth/AuthLoggedIn";
import AuthGuest from "@/components/auth/AuthGuest";

export default function SecurePage({ children }) {
    return (
        <>
            <AuthGuest>
                <LoginModal />
            </AuthGuest>
            <AuthLoggedIn>
                {children}
            </AuthLoggedIn>
        </>
    )
}
