import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

/**
 * Delete a file from the uploads directory
 * @param {string} fileUrl - URL path of the file (e.g., /uploads/filename.ext)
 */
export const deleteFile = (fileUrl) => {
    if (!fileUrl) return;

    try {
        // Handle full URLs or relative paths
        let filename = fileUrl;
        if (fileUrl.startsWith('http')) {
            filename = fileUrl.split('/uploads/').pop();
        } else if (fileUrl.startsWith('/uploads/')) {
            filename = fileUrl.replace('/uploads/', '');
        } else {
            // Assume it's just the filename if no prefix
            filename = fileUrl;
        }

        // Avoid directory traversal or empty filenames
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return;
        }

        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted file:', filename);
        }
    } catch (error) {
        console.error('Error deleting file:', fileUrl, error.message);
    }
};

/**
 * Delete all files associated with a course (thumbnail and content files)
 * @param {Object} course - The course object
 */
export const deleteCourseFiles = (course) => {
    if (!course) return;

    // Delete thumbnail
    if (course.thumbnail) {
        deleteFile(course.thumbnail);
    }

    // Delete content files
    if (course.contents && Array.isArray(course.contents)) {
        course.contents.forEach(content => {
            if (content.data) {
                // Check for fileUrl
                if (content.data.fileUrl) {
                    deleteFile(content.data.fileUrl);
                }

                // Check for url if it's an uploaded file
                if (content.data.url && content.data.isUploaded) {
                    deleteFile(content.data.url);
                }

                // Check specifically for documentUrl if exists (legacy or specific use)
                if (content.data.documentUrl) {
                    deleteFile(content.data.documentUrl);
                }
            }
        });
    }
};

/**
 * Delete user avatar
 * @param {Object} user - The user object
 */
export const deleteUserFiles = (user) => {
    if (!user) return;

    if (user.avatar) {
        deleteFile(user.avatar);
    }
};

export default { deleteFile, deleteCourseFiles, deleteUserFiles };
