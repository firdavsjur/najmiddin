const multer = require('multer');
const logger = require('../utils/logger')(module);
const { uploadFile, deleteFile, BUCKETS, generateFileName } = require('../config/minio');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter to accept images, videos, and GIFs
const fileFilter = (req, file, cb) => {
	const allowedMimeTypes = [
		// Images
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
		// Videos
		'video/mp4',
		'video/mpeg',
		'video/quicktime',
		'video/x-msvideo',
		'video/webm',
		'video/x-ms-wmv',
	];
	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, AVI, WebM, WMV) are allowed.'
			),
			false
		);
	}
};

// Configure multer with larger file size limit for videos
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB limit (increased for videos)
	},
});

/**
 * Error handling middleware for multer errors
 */
const handleMulterError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				message: 'File too large. Maximum file size is 100MB.',
			});
		}
		if (err.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({
				message: 'Too many files. Maximum allowed files is 10.',
			});
		}
		return res.status(400).json({
			message: `Upload error: ${err.message}`,
		});
	}
	if (err) {
		return res.status(400).json({
			message: err.message || 'File upload error',
		});
	}
	next();
};

/**
 * General upload function - handles single file upload
 * Supports: product, banner, category types
 * Accepts: images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, AVI, WebM, WMV)
 */
const uploadFileHandler = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				message: 'No file uploaded. Please provide a file.',
			});
		}

		// Get type from request body or query (product, banner, category)
		const type = req.body.type || req.query.type || 'product';
		const validTypes = ['product', 'banner', 'category'];
		
		if (!validTypes.includes(type.toLowerCase())) {
			return res.status(400).json({
				message: `Invalid type. Allowed types: ${validTypes.join(', ')}`,
			});
		}

		const bucket = BUCKETS.PUBLIC;
		const fileName = generateFileName(req.file.originalname, type);
		const objectKey = `${type.toLowerCase()}/${fileName}`;
		const fileUrl = await uploadFile(bucket, objectKey, req.file.buffer, req.file.mimetype);

		// Determine file type (image or video)
		const isVideo = req.file.mimetype.startsWith('video/');
		const fileType = isVideo ? 'video' : 'image';

		return res.status(200).json({
			message: 'File uploaded successfully',
			data: {
				url: fileUrl,
				fileName: objectKey,
				bucket,
				type: type.toLowerCase(),
				fileType,
				mimeType: req.file.mimetype,
				size: req.file.size,
			},
		});
	} catch (error) {
		logger.error('Failed to upload file', { error });
		return res.status(500).json({
			message: 'Failed to upload file. Please try again later.',
		});
	}
};

/**
 * General upload function for multiple files
 * Supports: product, banner, category types
 */
const uploadMultipleFilesHandler = async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				message: 'No files uploaded. Please provide files.',
			});
		}

		// Get type from request body or query
		const type = req.body.type || req.query.type || 'product';
		const validTypes = ['product', 'banner', 'category'];
		
		if (!validTypes.includes(type.toLowerCase())) {
			return res.status(400).json({
				message: `Invalid type. Allowed types: ${validTypes.join(', ')}`,
			});
		}

		const bucket = BUCKETS.PUBLIC;

		const uploadPromises = req.files.map(async (file) => {
			const fileName = generateFileName(file.originalname, type);
			const objectKey = `${type.toLowerCase()}/${fileName}`;
			const fileUrl = await uploadFile(bucket, objectKey, file.buffer, file.mimetype);
			const isVideo = file.mimetype.startsWith('video/');
			const fileType = isVideo ? 'video' : 'image';

			return {
				url: fileUrl,
				fileName: objectKey,
				bucket,
				type: type.toLowerCase(),
				fileType,
				mimeType: file.mimetype,
				size: file.size,
			};
		});

		const uploadedFiles = await Promise.all(uploadPromises);

		return res.status(200).json({
			message: 'Files uploaded successfully',
			data: uploadedFiles,
		});
	} catch (error) {
		logger.error('Failed to upload files', { error });
		return res.status(500).json({
			message: 'Failed to upload files. Please try again later.',
		});
	}
};

/**
 * Delete file from MinIO
 */
const deleteUploadedFile = async (req, res) => {
	try {
		const { bucket, fileName } = req.body;

		if (!bucket || !fileName) {
			return res.status(400).json({
				message: 'Bucket name and file name are required.',
			});
		}

		// Validate bucket name (faqat public)
		if (bucket !== BUCKETS.PUBLIC) {
			return res.status(400).json({
				message: `Invalid bucket name. Allowed bucket: ${BUCKETS.PUBLIC}`,
			});
		}

		await deleteFile(bucket, fileName);

		return res.status(200).json({
			message: 'File deleted successfully',
		});
	} catch (error) {
		logger.error('Failed to delete file', { error });
		return res.status(500).json({
			message: 'Failed to delete file. Please try again later.',
		});
	}
};

module.exports = {
	upload,
	handleMulterError,
	uploadFileHandler,
	uploadMultipleFilesHandler,
	deleteUploadedFile,
};

