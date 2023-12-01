import { useDropzone } from 'react-dropzone'
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
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    console.log({ styles });
    console.log({ imgDataUrl });
    return (
        <section className={styles.dropzone}>
            {imgDataUrl &&
                <img src={imgDataUrl} className={styles.titleimg}/>
            }
            <div {...getRootProps()} className={styles.verbiageContainer}>
                {(isDragActive || !imgDataUrl) &&
                    <>
                        <input {...getInputProps()} />
                        <div className={styles.verbiage}><p>drop</p></div>
                    </>
                }
            </div>
        </section>
    );
}
