import { createContext, useContext, useEffect, useState } from "react";

const GlobalAccessContextObject = createContext({
    value: null
});

function useGlobalAccessContext() {
    const ctx = useContext(GlobalAccessContextObject);
    return ctx;
}

function ContextClient() {
    console.log(`rendering ContextClient`);
    const ctx = useGlobalAccessContext();
    return <div>value: {ctx.value}</div>
}

function InertChild() {
    console.log(`rending InertChild`);
    return (
        <div>I want to live a life of danger!</div>
    )
}

function GlobalAccessContext({ children }) {
    const ctx = useGlobalAccessContext();
    const [value, setValue] = useState(null);

    useEffect(() => {
        console.log('resetting global accessors');
        window.setGlobalAccessValue = (v) => {
            console.log(`setting value: ${v}`)
            setValue(v);
        };
        window.getGlobalAccessValue = () => {
            console.log(`getting value: ${ctx.value}`)
            return value;
        };
    }, [value]);

    console.log('rendering GlobalAccessContext');
    return (
        <GlobalAccessContextObject.Provider value={{ value }}>
            {children}
        </GlobalAccessContextObject.Provider>
    );
}

export default function TempIndex() {
    return (
        <GlobalAccessContext>
            <ContextClient/>
            <InertChild />
        </GlobalAccessContext>
    );
}
