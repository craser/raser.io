import { useRef } from "react";

export default function EditableField({ text, onChange }) {
    const spanRef = useRef();
    function update(e) {
        const html = spanRef.current.valueOf().innerHTML;
        console.log({ e, html });
        onChange(html);
    }

    return (
        <span ref={spanRef} onInput={update} contentEditable={true}>{text}</span>
    );
}
