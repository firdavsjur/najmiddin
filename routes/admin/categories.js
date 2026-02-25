const express = require('express');
const router = express.Router();

const {
	createCategory,
	getCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
	getCategoriesWithProducts,
} = require('../../controllers/categoryController');

const { authenticate, isAdmin } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	createCategoryRules,
	updateCategoryRules,
	categoryIdParamRules,
	listCategoryQueryRules,
} = require('../../validators/categoryValidators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
router.get('/', listCategoryQueryRules, validate, getCategories);

/**
 * @swagger
 * /api/admin/categories/with-products:
 *   get:
 *     summary: Get all categories with their products (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *           enum: [price-asc, price-desc, name-asc, name-desc]
 *         description: Sort products by price or name (ascending or descending)
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
router.get('/with-products', listCategoryQueryRules, validate, getCategoriesWithProducts);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   get:
 *     summary: Get a category by ID (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', categoryIdParamRules, validate, getCategoryById);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: object
 *                 description: Category name in multiple languages
 *                 required:
 *                   - en
 *                   - ru
 *                   - uz
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Category name in English
 *                     example: "Electronics"
 *                   ru:
 *                     type: string
 *                     description: Category name in Russian
 *                     example: "Электроника"
 *                   uz:
 *                     type: string
 *                     description: Category name in Uzbek
 *                     example: "Elektronika"
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: URL-friendly category identifier (lowercase letters, numbers, and dashes only)
 *                 example: "electronics"
 *               description:
 *                 type: object
 *                 description: Category description in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Category description in English
 *                     example: "Electronic devices and gadgets"
 *                   ru:
 *                     type: string
 *                     description: Category description in Russian
 *                     example: "Электронные устройства и гаджеты"
 *                   uz:
 *                     type: string
 *                     description: Category description in Uzbek
 *                     example: "Elektron qurilmalar va gadjetlar"
 *               filters:
 *                 type: array
 *                 description: Dynamic filters for products in this category
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: object
 *                       description: Filter name in multiple languages (must be unique within category)
 *                       required:
 *                         - en
 *                         - ru
 *                         - uz
 *                       properties:
 *                         en:
 *                           type: string
 *                           description: Filter name in English
 *                           example: "Brand"
 *                         ru:
 *                           type: string
 *                           description: Filter name in Russian
 *                           example: "Бренд"
 *                         uz:
 *                           type: string
 *                           description: Filter name in Uzbek
 *                           example: "Brend"
 *                     type:
 *                       type: string
 *                       enum: [string, number, boolean, select]
 *                       description: Filter type
 *                       example: "select"
 *                     options:
 *                       type: array
 *                       description: Available options for select type filters (required for select type)
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: object
 *                             description: Option name in multiple languages
 *                             required:
 *                               - en
 *                               - ru
 *                               - uz
 *                             properties:
 *                               en:
 *                                 type: string
 *                                 description: Option name in English
 *                                 example: "Samsung"
 *                               ru:
 *                                 type: string
 *                                 description: Option name in Russian
 *                                 example: "Самсунг"
 *                               uz:
 *                                 type: string
 *                                 description: Option name in Uzbek
 *                                 example: "Samsung"
 *                           color:
 *                             type: string
 *                             description: Option color (hex code or color name)
 *                             example: "#000000"
 *                           photo_url:
 *                             type: string
 *                             format: uri
 *                             description: URL of the option photo/image
 *                             example: "https://example.com/samsung.jpg"
 *                     required:
 *                       type: boolean
 *                       description: Whether this filter is required for products
 *                       example: true
 *                 example:
 *                   - name:
 *                       en: "Brand"
 *                       ru: "Бренд"
 *                       uz: "Brend"
 *                     type: "select"
 *                     options:
 *                       - name:
 *                           en: "Samsung"
 *                           ru: "Самсунг"
 *                           uz: "Samsung"
 *                         color: "#000000"
 *                         photo_url: "https://example.com/samsung.jpg"
 *                       - name:
 *                           en: "Apple"
 *                           ru: "Эпл"
 *                           uz: "Apple"
 *                         color: "#FFFFFF"
 *                         photo_url: "https://example.com/apple.jpg"
 *                     required: true
 *                   - name:
 *                       en: "Color"
 *                       ru: "Цвет"
 *                       uz: "Rang"
 *                     type: "select"
 *                     options:
 *                       - name:
 *                           en: "Black"
 *                           ru: "Чёрный"
 *                           uz: "Qora"
 *                         color: "#000000"
 *                         photo_url: "https://example.com/black.jpg"
 *                       - name:
 *                           en: "White"
 *                           ru: "Белый"
 *                           uz: "Oq"
 *                         color: "#FFFFFF"
 *                         photo_url: "https://example.com/white.jpg"
 *                     required: false
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 example: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
router.post('/', createCategoryRules, validate, createCategory);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     summary: Update a category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 description: Category name in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Category name in English
 *                     example: "Electronics"
 *                   ru:
 *                     type: string
 *                     description: Category name in Russian
 *                     example: "Электроника"
 *                   uz:
 *                     type: string
 *                     description: Category name in Uzbek
 *                     example: "Elektronika"
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: URL-friendly category identifier (lowercase letters, numbers, and dashes only)
 *                 example: "electronics"
 *               description:
 *                 type: object
 *                 description: Category description in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Category description in English
 *                     example: "Electronic devices and gadgets"
 *                   ru:
 *                     type: string
 *                     description: Category description in Russian
 *                     example: "Электронные устройства и гаджеты"
 *                   uz:
 *                     type: string
 *                     description: Category description in Uzbek
 *                     example: "Elektron qurilmalar va gadjetlar"
 *               filters:
 *                 type: array
 *                 description: Dynamic filters for products in this category
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: object
 *                       description: Filter name in multiple languages (must be unique within category)
 *                       properties:
 *                         en:
 *                           type: string
 *                           description: Filter name in English
 *                           example: "Brand"
 *                         ru:
 *                           type: string
 *                           description: Filter name in Russian
 *                           example: "Бренд"
 *                         uz:
 *                           type: string
 *                           description: Filter name in Uzbek
 *                           example: "Brend"
 *                     type:
 *                       type: string
 *                       enum: [string, number, boolean, select]
 *                       description: Filter type
 *                       example: "select"
 *                     options:
 *                       type: array
 *                       description: Available options for select type filters (required for select type)
 *                       items:
 *                         type: object
 *                         required:
 *                           - name
 *                         properties:
 *                           name:
 *                             type: object
 *                             description: Option name in multiple languages
 *                             properties:
 *                               en:
 *                                 type: string
 *                                 description: Option name in English
 *                                 example: "Samsung"
 *                               ru:
 *                                 type: string
 *                                 description: Option name in Russian
 *                                 example: "Самсунг"
 *                               uz:
 *                                 type: string
 *                                 description: Option name in Uzbek
 *                                 example: "Samsung"
 *                           color:
 *                             type: string
 *                             description: Option color (hex code or color name)
 *                             example: "#000000"
 *                           photo_url:
 *                             type: string
 *                             format: uri
 *                             description: URL of the option photo/image
 *                             example: "https://example.com/samsung.jpg"
 *                     required:
 *                       type: boolean
 *                       description: Whether this filter is required for products
 *                       example: true
 *                 example:
 *                   - name:
 *                       en: "Brand"
 *                       ru: "Бренд"
 *                       uz: "Brend"
 *                     type: "select"
 *                     options:
 *                       - name:
 *                           en: "Samsung"
 *                           ru: "Самсунг"
 *                           uz: "Samsung"
 *                         color: "#000000"
 *                         photo_url: "https://example.com/samsung.jpg"
 *                       - name:
 *                           en: "Apple"
 *                           ru: "Эпл"
 *                           uz: "Apple"
 *                         color: "#FFFFFF"
 *                         photo_url: "https://example.com/apple.jpg"
 *                     required: true
 *                   - name:
 *                       en: "Color"
 *                       ru: "Цвет"
 *                       uz: "Rang"
 *                     type: "select"
 *                     options:
 *                       - name:
 *                           en: "Black"
 *                           ru: "Чёрный"
 *                           uz: "Qora"
 *                         color: "#000000"
 *                         photo_url: "https://example.com/black.jpg"
 *                       - name:
 *                           en: "White"
 *                           ru: "Белый"
 *                           uz: "Oq"
 *                         color: "#FFFFFF"
 *                         photo_url: "https://example.com/white.jpg"
 *                     required: false
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateCategoryRules, validate, updateCategory);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', categoryIdParamRules, validate, deleteCategory);

module.exports = router;

