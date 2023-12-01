import Dropzone from 'react-dropzone'
import styles from './EditTitleImage.module.scss'
import { useCallback, useState } from "react";

export default function EditTitleImage({ post }) {
    const [imgDataUrl, setImgDataUrl] = useState(null);
    const onDrop = useCallback(acceptedFiles => {
        console.log({ acceptedFiles });
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            console.log({ result: reader.result });
            setImgDataUrl(reader.result);
        });
        reader.readAsDataURL(acceptedFiles[0]);
    }, [])

    console.log({ styles });
    console.log({ imgDataUrl });
    return (
        <Dropzone onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
                <section className={styles.dropzone}>
                    {imgDataUrl && <img src={imgDataUrl} className={styles.titleimg}/>}
                    <div {...getRootProps()} className={styles.verbiageContainer}>
                        <input {...getInputProps()} />
                        <p>Drag & drop some files here, or click to select files</p>
                    </div>
                </section>
            )}
        </Dropzone>
    );
}
