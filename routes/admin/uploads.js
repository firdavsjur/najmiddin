const express = require('express');
const router = express.Router();

const {
	upload,
	handleMulterError,
	uploadFileHandler,
	uploadMultipleFilesHandler,
	deleteUploadedFile,
} = require('../../controllers/uploadController');
const { authenticate, isAdmin } = require('../../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/uploads:
 *   post:
 *     summary: Upload a file (image or video) for product, banner, or category (Admin only)
 *     tags: [Admin - Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "File to upload (images: JPEG, PNG, GIF, WebP or videos: MP4, MPEG, MOV, AVI, WebM, WMV, max 100MB)"
 *               type:
 *                 type: string
 *                 enum: [product, banner, category]
 *                 description: Type of upload (product, banner, or category)
 *                 example: "product"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: URL of the uploaded file
 *                     fileName:
 *                       type: string
 *                       description: Name of the uploaded file
 *                     bucket:
 *                       type: string
 *                       example: "products"
 *                     type:
 *                       type: string
 *                       example: "product"
 *                     fileType:
 *                       type: string
 *                       enum: [image, video]
 *                       description: Type of file (image or video)
 *                     mimeType:
 *                       type: string
 *                       example: "image/jpeg"
 *                     size:
 *                       type: integer
 *                       description: File size in bytes
 *       400:
 *         description: Validation error or no file provided
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('file'), handleMulterError, uploadFileHandler);

/**
 * @swagger
 * /api/admin/uploads/multiple:
 *   post:
 *     summary: Upload multiple files (images or videos) for product, banner, or category (Admin only)
 *     tags: [Admin - Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - type
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Files to upload (images: JPEG, PNG, GIF, WebP or videos: MP4, MPEG, MOV, AVI, WebM, WMV, max 100MB each, up to 10 files)"
 *               type:
 *                 type: string
 *                 enum: [product, banner, category]
 *                 description: Type of upload (product, banner, or category)
 *                 example: "product"
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Files uploaded successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         format: uri
 *                       fileName:
 *                         type: string
 *                       bucket:
 *                         type: string
 *                       type:
 *                         type: string
 *                       fileType:
 *                         type: string
 *                         enum: [image, video]
 *                       mimeType:
 *                         type: string
 *                       size:
 *                         type: integer
 *       400:
 *         description: Validation error or no files provided
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/multiple', upload.array('files', 10), handleMulterError, uploadMultipleFilesHandler);

/**
 * @swagger
 * /api/admin/uploads/delete:
 *   delete:
 *     summary: Delete an uploaded file from MinIO (Admin only)
 *     tags: [Admin - Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bucket
 *               - fileName
 *             properties:
 *               bucket:
 *                 type: string
 *                 enum: [products, banners, categories]
 *                 description: Name of the bucket
 *                 example: "products"
 *               fileName:
 *                 type: string
 *                 description: Name of the file to delete
 *                 example: "product_file_1234567890_abc123.jpg"
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File deleted successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.delete('/delete', deleteUploadedFile);

module.exports = router;
