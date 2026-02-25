const express = require('express');
const router = express.Router();

const { getBanners, getBannerById } = require('../../controllers/bannerController');
const { validate } = require('../../validators');
const {
	bannerIdParamRules,
	listBannerQueryRules,
} = require('../../validators/bannerValidators');

/**
 * @swagger
 * /api/user/banners:
 *   get:
 *     summary: Get all active banners (Public/User)
 *     tags: [User - Banners]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 'Filter by active status (default: true for users)'
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
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listBannerQueryRules, validate, (req, res, next) => {
	// For users, only show active banners by default
	if (req.query.isActive === undefined) {
		req.query.isActive = 'true';
	}
	next();
}, getBanners);

/**
 * @swagger
 * /api/user/banners/{id}:
 *   get:
 *     summary: Get a banner by ID (Public/User)
 *     tags: [User - Banners]
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
 *       400:
 *         description: Validation error
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

module.exports = router;

