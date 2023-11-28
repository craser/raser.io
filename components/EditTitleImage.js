import Dropzone from 'react-dropzone'




export default function EditTitleImage({ post }) {
    return (
        <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)}>
            {({getRootProps, getInputProps}) => (
                <section>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <p>Drag & drop some files here, or click to select files</p>
                    </div>
                </section>
            )}
        </Dropzone>
    );
}
