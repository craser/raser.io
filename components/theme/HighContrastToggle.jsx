// ABOUTME: Header button that turns High Contrast Mode (the high-contrast-dark theme) on and off.
// ABOUTME: Rendered as a role="switch" so screen readers announce its on/off state; the icon itself shows that state.
import { Contrast } from 'lucide-react';
import styles from './HighContrastToggle.module.scss';
import { useTheme } from "@/components/theme/ThemeProvider";
import { THEMES } from "@/lib/theme/themes";

const LABEL = 'High Contrast Mode';

export default function HighContrastToggle() {
    const { theme, setTheme } = useTheme();
    const isOn = theme === THEMES.HIGH_CONTRAST_DARK;

    const toggle = () => setTheme(isOn ? THEMES.DEFAULT : THEMES.HIGH_CONTRAST_DARK);

    return (
        <button type="button" role="switch" aria-checked={isOn} aria-label={LABEL} title={LABEL}
                data-testid="high-contrast-toggle" className={styles.toggle} onClick={toggle}>
            <Contrast className={styles.icon} aria-hidden="true"/>
        </button>
    );
}
