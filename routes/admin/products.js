const express = require('express');
const router = express.Router();

const {
	createProduct,
	getProducts,
	getProductById,
	getProductBySlug,
	updateProduct,
	deleteProduct,
	searchProducts,
} = require('../../controllers/productController');

const { authenticate, isAdmin } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	createProductRules,
	updateProductRules,
	productIdParamRules,
	listProductQueryRules,
	searchProductQueryRules,
} = require('../../validators/productValidators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/products/search:
 *   get:
 *     summary: Search products by name or description (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Filter by active status
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
router.get('/search', searchProductQueryRules, validate, searchProducts);

/**
 * @swagger
 * /api/admin/products/slug/{slug}:
 *   get:
 *     summary: Get a product by slug (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/slug/:slug', getProductBySlug);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (Admin only)
 *     tags: [Admin - Products]
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
router.get('/', listProductQueryRules, validate, getProducts);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     summary: Get a product by ID (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', productIdParamRules, validate, getProductById);

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Admin - Products]
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
 *               - price
 *             properties:
 *               name:
 *                 type: object
 *                 description: Product name in multiple languages
 *                 required:
 *                   - en
 *                   - ru
 *                   - uz
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Product name in English
 *                     example: "Laptop"
 *                   ru:
 *                     type: string
 *                     description: Product name in Russian
 *                     example: "Ноутбук"
 *                   uz:
 *                     type: string
 *                     description: Product name in Uzbek
 *                     example: "Noutbuk"
 *               description:
 *                 type: object
 *                 description: Product description in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Product description in English
 *                     example: "High-performance laptop"
 *                   ru:
 *                     type: string
 *                     description: Product description in Russian
 *                     example: "Высокопроизводительный ноутбук"
 *                   uz:
 *                     type: string
 *                     description: Product description in Uzbek
 *                     example: "Yuqori samarali noutbuk"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *                 example: 999.99
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *                 example: "https://example.com/image.jpg"
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 50
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs
 *                 example: ["507f1f77bcf86cd799439011"]
 *               attributes:
 *                 type: object
 *                 description: Product attributes that match category filters. Keys must match filter names from the product's categories.
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                     - type: boolean
 *                 example:
 *                   Brand: "Apple"
 *                   Color: "Black"
 *                   Warranty: 12
 *               variants:
 *                 type: array
 *                 description: Product variants (e.g., different colors)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: object
 *                       description: Variant name in multiple languages
 *                       properties:
 *                         en:
 *                           type: string
 *                           example: "Black"
 *                         ru:
 *                           type: string
 *                           example: "Черный"
 *                         uz:
 *                           type: string
 *                           example: "Qora"
 *                     color:
 *                       type: string
 *                       description: Color hex code
 *                       example: "#000000"
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: Variant image URL
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Variant price (optional, uses base price if not provided)
 *                     stock:
 *                       type: integer
 *                       minimum: 0
 *                       description: Variant stock quantity
 *                     sku:
 *                       type: string
 *                       description: Stock Keeping Unit
 *                 example:
 *                   - name:
 *                       en: "Black"
 *                       ru: "Черный"
 *                       uz: "Qora"
 *                     color: "#000000"
 *                     imageUrl: "https://example.com/black.jpg"
 *                     stock: 10
 *                   - name:
 *                       en: "White"
 *                       ru: "Белый"
 *                       uz: "Oq"
 *                     color: "#FFFFFF"
 *                     imageUrl: "https://example.com/white.jpg"
 *                     stock: 5
 *               isActive:
 *                 type: boolean
 *                 description: Whether the product is active
 *                 example: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
router.post('/', createProductRules, validate, createProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: Update a product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 description: Product name in multiple languages (all fields optional for update)
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Product name in English
 *                     example: "Laptop"
 *                   ru:
 *                     type: string
 *                     description: Product name in Russian
 *                     example: "Ноутбук"
 *                   uz:
 *                     type: string
 *                     description: Product name in Uzbek
 *                     example: "Noutbuk"
 *               description:
 *                 type: object
 *                 description: Product description in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: Product description in English
 *                     example: "High-performance laptop"
 *                   ru:
 *                     type: string
 *                     description: Product description in Russian
 *                     example: "Высокопроизводительный ноутбук"
 *                   uz:
 *                     type: string
 *                     description: Product description in Uzbek
 *                     example: "Yuqori samarali noutbuk"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *                 example: 999.99
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *                 example: "https://example.com/image.jpg"
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity
 *                 example: 50
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs
 *                 example: ["507f1f77bcf86cd799439011"]
 *               attributes:
 *                 type: object
 *                 description: Product attributes that match category filters. Keys must match filter names from the product's categories.
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *                     - type: boolean
 *                 example:
 *                   Brand: "Apple"
 *                   Color: "Black"
 *                   Warranty: 12
 *               variants:
 *                 type: array
 *                 description: Product variants (e.g., different colors)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: object
 *                       description: Variant name in multiple languages
 *                       properties:
 *                         en:
 *                           type: string
 *                           example: "Black"
 *                         ru:
 *                           type: string
 *                           example: "Черный"
 *                         uz:
 *                           type: string
 *                           example: "Qora"
 *                     color:
 *                       type: string
 *                       description: Color hex code
 *                       example: "#000000"
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: Variant image URL
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Variant price (optional, uses base price if not provided)
 *                     stock:
 *                       type: integer
 *                       minimum: 0
 *                       description: Variant stock quantity
 *                     sku:
 *                       type: string
 *                       description: Stock Keeping Unit
 *                 example:
 *                   - name:
 *                       en: "Black"
 *                       ru: "Черный"
 *                       uz: "Qora"
 *                     color: "#000000"
 *                     imageUrl: "https://example.com/black.jpg"
 *                     stock: 10
 *               isActive:
 *                 type: boolean
 *                 description: Whether the product is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateProductRules, validate, updateProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
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
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', productIdParamRules, validate, deleteProduct);

module.exports = router;

