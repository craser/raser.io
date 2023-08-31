import { useContext } from "react";
import ClickContext from "@/components/context/ClickContext";

export default function CLickButton(props) {
    let { addClick } = useContext(ClickContext);

    return (
        <button onClick={addClick}>Click Me</button>
    );
}
