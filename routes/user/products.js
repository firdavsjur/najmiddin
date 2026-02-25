const express = require('express');
const router = express.Router();

const { getProducts, getProductById, getProductBySlug, searchProducts } = require('../../controllers/productController');
const { validate } = require('../../validators');
const {
	productIdParamRules,
	listProductQueryRules,
	searchProductQueryRules,
} = require('../../validators/productValidators');
/**
 * @swagger
 * /api/user/products/search:
 *   get:
 *     summary: Search products by name or description (Public/User)
 *     tags: [User - Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query to match against product name or description
 *         example: "laptop"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 'Filter by active status (default: true for users)'
 *       - in: query
 *         name: discounted
 *         schema:
 *           type: boolean
 *         description: 'If true, sort so discounted products (stock > 0) come first, then non-discounted'
 *     responses:
 *       200:
 *         description: List of matching products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', searchProductQueryRules, validate, (req, res, next) => {
	// For users, only show active products by default
	if (req.query.isActive === undefined) {
		req.query.isActive = 'true';
	}
	next();
}, searchProducts);

/**
 * @swagger
 * /api/user/products/slug/{slug}:
 *   get:
 *     summary: Get a product by slug (Public/User)
 *     tags: [User - Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', getProductBySlug);

/**
 * @swagger
 * /api/user/products:
 *   get:
 *     summary: Get all active products (Public/User)
 *     tags: [User - Products]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 'Filter by active status (default: true for users)'
 *       - in: query
 *         name: discounted
 *         schema:
 *           type: boolean
 *         description: 'If true, sort so discounted products (stock > 0) come first, then non-discounted'
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listProductQueryRules, validate, (req, res, next) => {
	// For users, only show active products by default
	if (req.query.isActive === undefined) {
		req.query.isActive = 'true';
	}
	next();
}, getProducts);

/**
 * @swagger
 * /api/user/products/{id}:
 *   get:
 *     summary: Get a product by ID (Public/User)
 *     tags: [User - Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', productIdParamRules, validate, getProductById);

module.exports = router;

