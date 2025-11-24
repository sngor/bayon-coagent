"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3Client = getS3Client;
exports.resetS3Client = resetS3Client;
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.getPresignedUrl = getPresignedUrl;
exports.getPresignedDownloadUrl = getPresignedDownloadUrl;
exports.getPresignedUploadUrl = getPresignedUploadUrl;
exports.deleteFile = deleteFile;
exports.listFiles = listFiles;
exports.listFilesDetailed = listFilesDetailed;
exports.fileExists = fileExists;
exports.copyFile = copyFile;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = require("../config");
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;
const PART_SIZE = 5 * 1024 * 1024;
let s3Client = null;
function getS3Client() {
    if (!s3Client) {
        const config = (0, config_1.getConfig)();
        const credentials = (0, config_1.getAWSCredentials)();
        s3Client = new client_s3_1.S3Client({
            region: config.region,
            endpoint: config.s3.endpoint,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
            forcePathStyle: config.environment === 'local',
        });
    }
    return s3Client;
}
function resetS3Client() {
    s3Client = null;
}
async function uploadFile(key, file, contentType, metadata) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    let buffer;
    if (file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    }
    else {
        buffer = file;
    }
    if (buffer.length > MULTIPART_THRESHOLD) {
        return uploadFileMultipart(key, buffer, contentType, metadata);
    }
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
    });
    await client.send(command);
    if (config.s3.endpoint) {
        return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
    }
    return `https://${config.s3.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}
async function uploadFileMultipart(key, buffer, contentType, metadata) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const createCommand = new client_s3_1.CreateMultipartUploadCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        ContentType: contentType,
        Metadata: metadata,
    });
    const { UploadId } = await client.send(createCommand);
    if (!UploadId) {
        throw new Error('Failed to initiate multipart upload');
    }
    try {
        const parts = [];
        const numParts = Math.ceil(buffer.length / PART_SIZE);
        for (let i = 0; i < numParts; i++) {
            const start = i * PART_SIZE;
            const end = Math.min(start + PART_SIZE, buffer.length);
            const partBuffer = buffer.slice(start, end);
            const uploadPartCommand = new client_s3_1.UploadPartCommand({
                Bucket: config.s3.bucketName,
                Key: key,
                UploadId,
                PartNumber: i + 1,
                Body: partBuffer,
            });
            const { ETag } = await client.send(uploadPartCommand);
            if (ETag) {
                parts.push({ ETag, PartNumber: i + 1 });
            }
        }
        const completeCommand = new client_s3_1.CompleteMultipartUploadCommand({
            Bucket: config.s3.bucketName,
            Key: key,
            UploadId,
            MultipartUpload: { Parts: parts },
        });
        await client.send(completeCommand);
        if (config.s3.endpoint) {
            return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
        }
        return `https://${config.s3.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
    }
    catch (error) {
        const abortCommand = new client_s3_1.AbortMultipartUploadCommand({
            Bucket: config.s3.bucketName,
            Key: key,
            UploadId,
        });
        await client.send(abortCommand);
        throw error;
    }
}
async function downloadFile(key) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) {
        throw new Error(`File not found: ${key}`);
    }
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
async function getPresignedUrl(key, expiresIn = 3600) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn });
    return url;
}
async function getPresignedDownloadUrl(key, filename, expiresIn = 3600) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn });
    return url;
}
async function getPresignedUploadUrl(key, contentType, expiresIn = 3600) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        ContentType: contentType,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn });
    return url;
}
async function deleteFile(key) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
    });
    await client.send(command);
}
async function listFiles(prefix = '', maxKeys = 1000) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: config.s3.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
    });
    const response = await client.send(command);
    if (!response.Contents) {
        return [];
    }
    return response.Contents.map((item) => item.Key).filter((key) => key !== undefined);
}
async function listFilesDetailed(prefix = '', maxKeys = 1000) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: config.s3.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
    });
    const response = await client.send(command);
    if (!response.Contents) {
        return [];
    }
    return response.Contents.filter((item) => item.Key !== undefined).map((item) => ({
        key: item.Key,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag || '',
    }));
}
async function fileExists(key) {
    try {
        const config = (0, config_1.getConfig)();
        const client = getS3Client();
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config.s3.bucketName,
            Key: key,
        });
        await client.send(command);
        return true;
    }
    catch (error) {
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}
async function copyFile(sourceKey, destinationKey) {
    const config = (0, config_1.getConfig)();
    const client = getS3Client();
    const command = new client_s3_1.PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: destinationKey,
        CopySource: `${config.s3.bucketName}/${sourceKey}`,
    });
    await client.send(command);
}
