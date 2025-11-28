/**
 * AWS S3 Storage Module
 * 
 * Exports all S3 storage operations
 */

export {
  getS3Client,
  resetS3Client,
  uploadFile,
  downloadFile,
  getPresignedUrl,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  deleteFile,
  listFiles,
  listFilesDetailed,
  fileExists,
  copyFile,
} from './client';

export {
  getTestimonialPhotoKey,
  getTestimonialFolderPrefix,
  uploadTestimonialPhoto,
  deleteTestimonialPhoto,
  deleteAllTestimonialPhotos,
  testimonialPhotoExists,
} from './testimonial-storage';
