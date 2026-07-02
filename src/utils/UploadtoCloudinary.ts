import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Yahan hum function ko 'export' kar rahe hain taake dusri files isay use kar sakein
export const uploadFileToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: 'fyp_submissions' },
      (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result.secure_url);
      }
    );
    Readable.from(file.buffer).pipe(upload);
  });
};