import { useDropzone } from 'react-dropzone'
import styles from './EditTitleImage.module.scss'
import { useCallback, useState } from "react";

/*
  Uploading attachments:
    1. Send Attachment JSON to "create" endpoint to create a new Attachment
    2. Send file contents to "upload" endpoint to create AttachmentBytes
 */
export default function EditTitleImage({ post, setTitleImage }) {
    const [imgDataUrl, setImgDataUrl] = useState(null);
    const onDrop = useCallback(acceptedFiles => {
        console.log({ acceptedFiles });
        const reader = new FileReader();
        const titleImage = acceptedFiles[0];
        reader.addEventListener('load', () => {
            console.log({ result: reader.result });
            setImgDataUrl(reader.result);
            setTitleImage(titleImage);
        });
        reader.readAsDataURL(titleImage);
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
