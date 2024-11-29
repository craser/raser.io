import { useAuthenticationContext } from "@/components/auth/AuthenticationContext";

export default function LogoutButton({ children }) {
    const { logout } = useAuthenticationContext();
    return <button onClick={logout}>{children}</button>
}
