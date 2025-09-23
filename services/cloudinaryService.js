import {
    cloud_name,
    upload_present,
} from "@env";

export class CloudinaryService {
    static CLOUD_NAME = cloud_name;
    static UPLOAD_PRESET = upload_present;

    static async uploadImage(imageUri) {
        try {
            console.log('Starting Cloudinary upload...');

            const formData = new FormData();

            // Create the file object properly for React Native
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'complaint.jpg',
            });

            formData.append('upload_preset', this.UPLOAD_PRESET);

            console.log('Uploading to Cloudinary...');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Cloudinary response:', data);

            if (data.secure_url) {
                console.log('Upload successful:', data.secure_url);
                return data.secure_url;
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }
}

// Export a single instance
export default CloudinaryService;