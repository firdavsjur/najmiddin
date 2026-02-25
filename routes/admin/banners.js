const express = require('express');
const router = express.Router();

const {
	createBanner,
	getBanners,
	getBannerById,
	updateBanner,
	deleteBanner,
} = require('../../controllers/bannerController');

const { authenticate, isAdmin } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	createBannerRules,
	updateBannerRules,
	bannerIdParamRules,
	listBannerQueryRules,
} = require('../../validators/bannerValidators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/banners:
 *   get:
 *     summary: Get all banners (Admin only)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of banners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banners retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Banner'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listBannerQueryRules, validate, getBanners);

/**
 * @swagger
 * /api/admin/banners/{id}:
 *   get:
 *     summary: Get a banner by ID (Admin only)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', bannerIdParamRules, validate, getBannerById);

/**
 * @swagger
 * /api/admin/banners:
 *   post:
 *     summary: Create a new banner (Admin only)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *                 description: Banner title
 *                 example: "Summer Sale"
 *               description:
 *                 type: string
 *                 description: Banner description
 *                 example: "Get up to 50% off on all items"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Banner image URL
 *                 example: "https://example.com/banner.jpg"
 *               linkUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL the banner links to
 *                 example: "https://example.com/sale"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the banner is active
 *                 example: true
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Display order of the banner
 *                 example: 1
 *     responses:
 *       201:
 *         description: Banner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createBannerRules, validate, createBanner);

/**
 * @swagger
 * /api/admin/banners/{id}:
 *   put:
 *     summary: Update a banner (Admin only)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Banner title
 *                 example: "Summer Sale"
 *               description:
 *                 type: string
 *                 description: Banner description
 *                 example: "Get up to 50% off on all items"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Banner image URL
 *                 example: "https://example.com/banner.jpg"
 *               linkUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL the banner links to
 *                 example: "https://example.com/sale"
 *               isActive:
 *                 type: boolean
 *                 description: Whether the banner is active
 *                 example: true
 *               order:
 *                 type: integer
 *                 minimum: 0
 *                 description: Display order of the banner
 *                 example: 1
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Banner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateBannerRules, validate, updateBanner);

/**
 * @swagger
 * /api/admin/banners/{id}:
 *   delete:
 *     summary: Delete a banner (Admin only)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Banner deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Banner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', bannerIdParamRules, validate, deleteBanner);

module.exports = router;

