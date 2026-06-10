import imageCompression from 'browser-image-compression';

export const uploadToCloudinary = async (file: File) => {

    const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: false,
        fileType: 'image/webp',
    });

    const formData = new FormData();

    formData.append('file', compressedFile);

    formData.append(
        'upload_preset',
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    const data = await res.json();

    if (!data.secure_url) {
        throw new Error('Cloudinary upload failed');
    }

    return data.secure_url;
};