import styles from "@/components/navigation/NavButton.module.scss";
export function NavButton({ children, onClick, Icon }) {
    return <button className={styles.navButton} onClick={onClick}><Icon className={styles.icon} />{children}</button>
}
