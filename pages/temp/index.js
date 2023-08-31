import { useState } from "react";
import ClickContext from "@/components/context/ClickContext";
import ClickButton from "@/components/temp/ClickButton";
import ClickDisplay from "@/components/temp/ClickDisplay";


export default function TempIndex(props) {
    let [ totalClicks, setTotalClicks ] = useState(0);
    let addClick = () => {
        setTotalClicks(totalClicks + 1);
    }

    return (
      <ClickContext.Provider value={{ totalClicks, addClick }}>
          <ClickButton />
          <ClickDisplay />
      </ClickContext.Provider>
    );
}
