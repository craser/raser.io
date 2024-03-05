import { useDropzone } from 'react-dropzone'
import styles from './EditTitleImage.module.scss'
import { useCallback, useState } from "react";
import PostTitleImage from "@/components/PostTitleImage";

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

    let image = null;
    if (post.imageFileName) {
        image = <PostTitleImage post={post} className={styles.titleimg} />;
    } else if (imgDataUrl) {
        image = <img src={imgDataUrl} className={styles.titleimg}/>;
    }

    return (
        <section className={styles.dropzone}>
            {image}
            <div {...getRootProps()} className={styles.verbiageContainer}>
                {(isDragActive || !image) &&
                    <>
                        <input {...getInputProps()} />
                        <div className={styles.verbiage}><p>drop</p></div>
                    </>
                }
            </div>
        </section>
    );
}
