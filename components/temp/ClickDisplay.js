import { useContext } from "react";
import ClickContext from "@/components/context/ClickContext";

export default function ClickDisplay(props) {
    let { totalClicks } = useContext(ClickContext);

    return (
        <div>Total: {totalClicks}</div>
    );
}
