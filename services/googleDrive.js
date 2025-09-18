// services/googleDrive.js
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '501170379930-kn1ubka0o0vq8v0m9h5n96e791gtdl0r.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

const COMPLAINTS_FOLDER_ID = '1ii8GmxCHD3_hr8KZ4gnUrdHLjbJIZbna'; 

export class GoogleDriveService {
    static async authenticate() {
        try {
            const discovery = {
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
            };

            const request = new AuthSession.AuthRequest({
                clientId: GOOGLE_CLIENT_ID,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
                redirectUri: GOOGLE_REDIRECT_URI,
                usePKCE: true,
            });

            await request.makeAuthUrlAsync(discovery);
            const result = await AuthSession.startAsync({
                authUrl: request.url,
                returnUrl: GOOGLE_REDIRECT_URI,
            });

            if (result.type === 'success' && result.authentication) {
                return result.authentication;
            }
            return null;
        } catch (error) {
            console.error('Google auth error:', error);
            return null;
        }
    }

    static async createFolderIfNotExists(accessToken, folderName) {
        try {
            // Check if folder exists
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            const searchData = await searchResponse.json();

            if (searchData.files && searchData.files.length > 0) {
                return searchData.files[0].id; // Return existing folder ID
            }

            // Create new folder
            const createResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [COMPLAINTS_FOLDER_ID || 'root'], // Use custom folder or root
                    }),
                }
            );

            const folderData = await createResponse.json();
            return folderData.id;
        } catch (error) {
            console.error('Folder creation error:', error);
            return COMPLAINTS_FOLDER_ID || 'root'; // Fallback to root or predefined folder
        }
    }

    static async uploadToDrive(uri, filename, accessToken, userEmail) {
        try {
            // Create folder for user or use general complaints folder
            const folderName = `Fixora_Complaints_${userEmail || 'anonymous'}`;
            const folderId = await this.createFolderIfNotExists(accessToken, folderName);

            // Convert image to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Create metadata
            const metadata = {
                name: filename,
                mimeType: this.getMimeType(uri),
                parents: [folderId],
            };

            // Create form data
            const formData = new FormData();
            formData.append('metadata', JSON.stringify(metadata), {
                type: 'application/json',
            });
            formData.append('file', blob, {
                type: this.getMimeType(uri),
                name: filename,
            });

            // Upload to Google Drive
            const uploadResponse = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: formData,
                }
            );

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.text();
                throw new Error(`Drive upload failed: ${uploadResponse.status} - ${errorData}`);
            }

            const fileData = await uploadResponse.json();

            // Make file publicly readable
            await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        role: 'reader',
                        type: 'anyone',
                    }),
                }
            );

            // Return direct download link
            return `https://drive.google.com/uc?export=download&id=${fileData.id}`;

        } catch (error) {
            console.error('Drive upload error:', error);
            throw error;
        }
    }

    static getMimeType(uri) {
        const extension = uri.split('.').pop().toLowerCase();
        switch (extension) {
            case 'png': return 'image/png';
            case 'gif': return 'image/gif';
            case 'bmp': return 'image/bmp';
            case 'webp': return 'image/webp';
            default: return 'image/jpeg';
        }
    }

    static async revokeAccess(accessToken) {
        try {
            await fetch(
                `https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`,
                { method: 'POST' }
            );
            await AsyncStorage.removeItem('google_access_token');
        } catch (error) {
            console.error('Revoke error:', error);
        }
    }
}