"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizerService = void 0;
exports.createImageOptimizer = createImageOptimizer;
const sharp_1 = __importDefault(require("sharp"));
const constants_1 = require("./constants");
const client_1 = require("@/aws/s3/client");
class ImageOptimizerService {
    async optimizeImages(images, platform, listingId, userId) {
        const limits = constants_1.PLATFORM_LIMITS[platform];
        const maxImages = limits.maxImages;
        const imagesToOptimize = images.slice(0, maxImages);
        const optimizedImages = [];
        const MAX_CONCURRENT = 3;
        for (let i = 0; i < imagesToOptimize.length; i += MAX_CONCURRENT) {
            const batch = imagesToOptimize.slice(i, i + MAX_CONCURRENT);
            const batchResults = await Promise.allSettled(batch.map((url, index) => this.optimizeImage(url, platform, listingId, userId, i + index)));
            for (const result of batchResults) {
                if (result.status === "fulfilled" && result.value) {
                    optimizedImages.push(result.value);
                }
                else if (result.status === "rejected") {
                    console.error(`Image optimization failed: ${result.reason}`);
                }
            }
        }
        return optimizedImages;
    }
    async optimizeImage(originalUrl, platform, listingId, userId, imageIndex) {
        try {
            const limits = constants_1.PLATFORM_LIMITS[platform];
            const imageKey = this.extractS3Key(originalUrl);
            const imageBuffer = await (0, client_1.downloadFile)(imageKey);
            const metadata = await (0, sharp_1.default)(imageBuffer).metadata();
            const targetDimensions = this.selectDimensions(platform, metadata.width || 0, metadata.height || 0);
            const optimizedBuffer = await this.processImage(imageBuffer, targetDimensions.width, targetDimensions.height, limits.maxFileSize);
            const optimizedKey = this.generateOptimizedKey(userId, listingId, platform, imageIndex);
            const optimizedUrl = await (0, client_1.uploadFile)(optimizedKey, optimizedBuffer, "image/jpeg");
            const finalSize = optimizedBuffer.length;
            return {
                originalUrl,
                optimizedUrl,
                width: targetDimensions.width,
                height: targetDimensions.height,
                fileSize: finalSize,
            };
        }
        catch (error) {
            console.error(`Failed to optimize image ${originalUrl}:`, error);
            throw error;
        }
    }
    selectDimensions(platform, originalWidth, originalHeight) {
        const limits = constants_1.PLATFORM_LIMITS[platform];
        const dimensions = limits.imageDimensions;
        if (dimensions.length > 1) {
            const originalAspectRatio = originalWidth / originalHeight;
            if (platform === "instagram") {
                if (originalAspectRatio < 1) {
                    return dimensions[1];
                }
                return dimensions[0];
            }
        }
        return dimensions[0];
    }
    async processImage(buffer, targetWidth, targetHeight, maxFileSize) {
        let quality = 90;
        let optimizedBuffer;
        optimizedBuffer = await (0, sharp_1.default)(buffer)
            .resize(targetWidth, targetHeight, {
            fit: "cover",
            position: "center",
        })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        while (optimizedBuffer.length > maxFileSize && quality > 60) {
            quality -= 5;
            optimizedBuffer = await (0, sharp_1.default)(buffer)
                .resize(targetWidth, targetHeight, {
                fit: "cover",
                position: "center",
            })
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        }
        if (optimizedBuffer.length > maxFileSize) {
            throw new Error(`Unable to compress image below ${maxFileSize} bytes. Final size: ${optimizedBuffer.length} bytes`);
        }
        return optimizedBuffer;
    }
    extractS3Key(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const parts = pathname.split("/").filter((p) => p);
            if (urlObj.hostname.startsWith("s3.") ||
                urlObj.hostname.includes("localhost")) {
                return parts.slice(1).join("/");
            }
            return parts.join("/");
        }
        catch (error) {
            return url;
        }
    }
    generateOptimizedKey(userId, listingId, platform, imageIndex) {
        const platformPath = constants_1.S3_IMAGE_PATHS[platform];
        return `listings/${userId}/${listingId}/${platformPath}/photo${imageIndex}.jpg`;
    }
}
exports.ImageOptimizerService = ImageOptimizerService;
function createImageOptimizer() {
    return new ImageOptimizerService();
}
