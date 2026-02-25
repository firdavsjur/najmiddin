const express = require('express');
const router = express.Router();

const {
	addSavedProduct,
	removeSavedProduct,
	getSavedProducts,
} = require('../../controllers/userController');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../validators');
const { param } = require('express-validator');
const { Types } = require('mongoose');

const validateProductIdParam = param('productId').custom((value) => {
	if (!Types.ObjectId.isValid(value)) {
		throw new Error('Invalid product id');
	}
	return true;
});

/**
 * @swagger
 * /api/user/saved-products:
 *   get:
 *     summary: Get all saved products (Authenticated User)
 *     description: Returns all products saved by the authenticated user
 *     tags: [User - Saved Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Saved products retrieved successfully"
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, getSavedProducts);

/**
 * @swagger
 * /api/user/saved-products/{productId}:
 *   post:
 *     summary: Add product to saved list (Authenticated User)
 *     description: Adds a product to the authenticated user's saved products list
 *     tags: [User - Saved Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to add to saved list
 *     responses:
 *       200:
 *         description: Product added to saved list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product added to saved list successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Product already in saved list or validation error
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
 *       404:
 *         description: Product or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:productId', authenticate, validateProductIdParam, validate, addSavedProduct);

/**
 * @swagger
 * /api/user/saved-products/{productId}:
 *   delete:
 *     summary: Remove product from saved list (Authenticated User)
 *     description: Removes a product from the authenticated user's saved products list
 *     tags: [User - Saved Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to remove from saved list
 *     responses:
 *       200:
 *         description: Product removed from saved list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product removed from saved list successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Product not in saved list or validation error
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:productId', authenticate, validateProductIdParam, validate, removeSavedProduct);

module.exports = router;

