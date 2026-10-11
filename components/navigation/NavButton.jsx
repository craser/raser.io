import styles from "@/components/navigation/NavButton.module.scss";
export function NavButton({ children, onClick, Icon, ...props }) {
    return (
        <button className={styles.navButton} onClick={onClick} {...props}>
            <Icon className={styles.icon} />
            <span className={styles.label}>{children}</span>
        </button>
    );
}
