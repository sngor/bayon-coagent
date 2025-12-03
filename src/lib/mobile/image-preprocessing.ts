/**
 * Image Preprocessing and Optimization for Mobile Capture
 * 
 * This module provides utilities for preprocessing and optimizing images
 * captured on mobile devices before sending them to AI analysis.
 * 
 * Features:
 * - Image compression
 * - Format conversion
 * - Resolution optimization
 * - EXIF data handling
 * - Base64 encoding
 */

/**
 * Image preprocessing options
 */
export interface ImagePreprocessingOptions {
    /** Maximum width in pixels (default: 1920) */
    maxWidth?: number;

    /** Maximum height in pixels (default: 1920) */
    maxHeight?: number;

    /** JPEG quality (0-1, default: 0.85) */
    quality?: number;

    /** Target format (default: 'jpeg') */
    format?: 'jpeg' | 'png' | 'webp';

    /** Whether to strip EXIF data (default: true) */
    stripExif?: boolean;

    /** Whether to auto-orient based on EXIF (default: true) */
    autoOrient?: boolean;
}

/**
 * Default preprocessing options optimized for AI analysis
 */
const DEFAULT_OPTIONS: Required<ImagePreprocessingOptions> = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
    format: 'jpeg',
    stripExif: true,
    autoOrient: true,
};

/**
 * Preprocesses an image file for AI analysis
 * 
 * @param file - Image file to preprocess
 * @param options - Preprocessing options
 * @returns Base64 encoded image data and format
 */
export async function preprocessImage(
    file: File,
    options: ImagePreprocessingOptions = {}
): Promise<{ data: string; format: 'jpeg' | 'png' | 'webp' | 'gif' }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Load image
    const img = await loadImage(file);

    // Calculate dimensions maintaining aspect ratio
    const { width, height } = calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth,
        opts.maxHeight
    );

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Draw image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with specified format and quality
    const blob = await canvasToBlob(canvas, opts.format, opts.quality);

    // Convert to base64
    const base64 = await blobToBase64(blob);

    // Remove data URL prefix to get just the base64 data
    const base64Data = base64.split(',')[1];

    return {
        data: base64Data,
        format: opts.format === 'webp' ? 'webp' : opts.format === 'png' ? 'png' : 'jpeg',
    };
}

/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Calculates optimal dimensions maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if larger than max dimensions
    if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const ratio = Math.min(widthRatio, heightRatio);

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    return { width, height };
}

/**
 * Converts canvas to blob with specified format and quality
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'png' | 'webp',
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Converts blob to base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read blob'));
        };

        reader.readAsDataURL(blob);
    });
}

/**
 * Estimates the size of base64 encoded image data in bytes
 */
export function estimateBase64Size(base64Data: string): number {
    // Base64 encoding increases size by ~33%
    // Remove padding characters for accurate calculation
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.ceil((base64Data.length * 3) / 4) - padding;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validates image file type
 */
export function isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
}

/**
 * Validates image file size (default max: 10MB)
 */
export function isValidImageSize(file: File, maxSizeBytes: number = 10 * 1024 * 1024): boolean {
    return file.size <= maxSizeBytes;
}

/**
 * Comprehensive image validation
 */
export interface ImageValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateImage(
    file: File,
    maxSizeBytes: number = 10 * 1024 * 1024
): ImageValidationResult {
    const errors: string[] = [];

    if (!isValidImageType(file)) {
        errors.push('Invalid image type. Please use JPEG, PNG, WebP, or GIF.');
    }

    if (!isValidImageSize(file, maxSizeBytes)) {
        errors.push(`Image size exceeds ${formatFileSize(maxSizeBytes)}. Please use a smaller image.`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
