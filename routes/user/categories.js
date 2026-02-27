const express = require('express');
const router = express.Router();

const { getCategories, getCategoryById, getCategoriesWithProducts } = require('../../controllers/categoryController');
const { optionalAuthenticate } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	categoryIdParamRules,
	listCategoryQueryRules,
} = require('../../validators/categoryValidators');

/**
 * @swagger
 * /api/user/categories/with-products:
 *   get:
 *     summary: Get all active categories with their products (Public/User)
 *     tags: [User - Categories]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 'Filter by active status (default: true for users)'
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter for products
 *         example: 100
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter for products
 *         example: 1000
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price-asc, price-desc, name-asc, name-desc, with_discount]
 *         description: Sort products by price, name, or put discounted first (with_discount = stock > 0 first)
 *         example: price-asc
 *     responses:
 *       200:
 *         description: List of categories with their products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Categories with products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           products:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Product'
 *                             description: Products belonging to this category
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/with-products', optionalAuthenticate, listCategoryQueryRules, validate, (req, res, next) => {
	// For users, only show active categories by default
	if (req.query.isActive === undefined) {
		req.query.isActive = 'true';
	}
	next();
}, getCategoriesWithProducts);

/**
 * @swagger
 * /api/user/categories:
 *   get:
 *     summary: Get all active categories (Public/User)
 *     tags: [User - Categories]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 'Filter by active status (default: true for users)'
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Categories retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listCategoryQueryRules, validate, (req, res, next) => {
	// For users, only show active categories by default
	if (req.query.isActive === undefined) {
		req.query.isActive = 'true';
	}
	next();
}, getCategories);

/**
 * @swagger
 * /api/user/categories/{id}:
 *   get:
 *     summary: Get a category by ID (Public/User)
 *     tags: [User - Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', categoryIdParamRules, validate, getCategoryById);

module.exports = router;

