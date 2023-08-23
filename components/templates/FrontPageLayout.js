import styles from './PageLayout.module.css';
import SiteHeader from "@/components/templates/SiteHeader";
import SiteFooter from "@/components/templates/SiteFooter";

export default function FrontPageLayout(props) {
    return (
        <div className={styles.page}>
            {props.header || <SiteHeader/>}
            {props.content}
            {props.footer || <SiteFooter/>}
        </div>
    )
}
