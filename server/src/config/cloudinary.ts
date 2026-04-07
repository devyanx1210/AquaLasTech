// cloudinary - shared upload middleware factory using Cloudinary storage
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
})

export function createUpload(folder: string, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `aqualastech/${folder}`,
            allowed_formats: allowedFormats,
            resource_type: 'image',
        } as any,
    })
    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
    })
}

export default cloudinary
