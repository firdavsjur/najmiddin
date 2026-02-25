const Minio = require('minio');
const logger = require('../utils/logger')(module);

// MinIO configuration from environment variables (minio.najm.uz, public bucket)
const minioConfig = {
	endPoint: process.env.MINIO_ENDPOINT || 'minio.najm.uz',
	port: parseInt(process.env.MINIO_PORT || '443', 10),
	useSSL: process.env.MINIO_USE_SSL !== 'false',
	accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
	secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

// Create MinIO client
const minioClient = new Minio.Client(minioConfig);

// Barcha fayllar minio.najm.uz dagi "public" bucketiga yuklanadi (type bo'yicha path: products/, banners/, categories/)
const BUCKETS = {
	PUBLIC: 'public',
};

/**
 * Initialize MinIO buckets if they don't exist
 * @returns {Promise<void>}
 */
const initializeBuckets = async () => {
	try {
		const bucketName = BUCKETS.PUBLIC;
		const exists = await minioClient.bucketExists(bucketName);
		if (!exists) {
			await minioClient.makeBucket(bucketName, 'us-east-1');
			logger.info(`Created MinIO bucket: ${bucketName}`);
		} else {
			logger.info(`MinIO bucket already exists: ${bucketName}`);
		}
	} catch (error) {
		logger.error('Failed to initialize MinIO buckets', { error });
		throw error;
	}
};

/**
 * Upload file to MinIO
 * @param {string} bucketName - Name of the bucket
 * @param {string} objectName - Name of the object/file
 * @param {Buffer} buffer - File buffer
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - URL of the uploaded file
 */
const uploadFile = async (bucketName, objectName, buffer, contentType) => {
	try {
		await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
			'Content-Type': contentType,
		});

		// Generate public URL (adjust based on your MinIO setup)
		const protocol = minioConfig.useSSL ? 'https' : 'http';
		const port = minioConfig.port === 80 || minioConfig.port === 443 ? '' : `:${minioConfig.port}`;
		const url = `${protocol}://${minioConfig.endPoint}${port}/${bucketName}/${objectName}`;

		logger.info(`File uploaded to MinIO: ${bucketName}/${objectName}`);
		return url;
	} catch (error) {
		logger.error('Failed to upload file to MinIO', { error, bucketName, objectName });
		throw error;
	}
};

/**
 * Delete file from MinIO
 * @param {string} bucketName - Name of the bucket
 * @param {string} objectName - Name of the object/file
 * @returns {Promise<void>}
 */
const deleteFile = async (bucketName, objectName) => {
	try {
		await minioClient.removeObject(bucketName, objectName);
		logger.info(`File deleted from MinIO: ${bucketName}/${objectName}`);
	} catch (error) {
		logger.error('Failed to delete file from MinIO', { error, bucketName, objectName });
		throw error;
	}
};

/**
 * Generate unique file name
 * @param {string} originalName - Original file name
 * @param {string} prefix - Optional prefix for the file name
 * @returns {string} - Unique file name
 */
const generateFileName = (originalName, prefix = '') => {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const extension = originalName.split('.').pop();
	const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
	const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
	const prefixPart = prefix ? `${prefix}_` : '';
	return `${prefixPart}${sanitizedName}_${timestamp}_${randomString}.${extension}`;
};

module.exports = {
	minioClient,
	BUCKETS,
	initializeBuckets,
	uploadFile,
	deleteFile,
	generateFileName,
};

