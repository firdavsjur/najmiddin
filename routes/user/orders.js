const express = require('express');
const router = express.Router();

const { createOrder, getOrderById, getOrders, getOrderByExternalId } = require('../../controllers/orderController');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	createOrderRules,
	orderIdParamRules,
	listOrderQueryRules,
	externalIdParamRules,
} = require('../../validators/orderValidators');

/**
 * @swagger
 * /api/user/orders:
 *   post:
 *     summary: Create a new order (Authenticated User)
 *     tags: [User - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - customerEmail
 *               - shippingAddress
 *               - customerPhone
 *               - deliveryType
 *               - paymentType
 *               - items
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Customer name
 *                 example: "John Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer email address
 *                 example: "john@example.com"
 *               customerPhone:
 *                 type: string
 *                 description: Customer phone number
 *                 example: "+998901234567"
 *               shippingAddress:
 *                 type: string
 *                 description: Shipping address
 *                 example: "123 Main St, City, Country"
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: Product ID
 *                       example: "507f1f77bcf86cd799439011"
 *                     variantIndex:
 *                       type: integer
 *                       minimum: 0
 *                       description: "Index of the selected variant in product.variants array (optional, for products with variants). Example: 0 for first variant, 1 for second, etc."
 *                       example: 3
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity of the product
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Unit price of the product
 *                       example: 99.99
 *                     totalPrice:
 *                       type: number
 *                       minimum: 0
 *                       description: Total price for this item (optional, calculated if not provided)
 *                       example: 199.98
 *                     isFavourite:
 *                       type: boolean
 *                       description: Whether this product is marked as favourite by the user
 *                       example: true
 *               notifyPromotions:
 *                 type: boolean
 *                 description: "Оповещать о новых скидках, акциях и распродажах"
 *                 example: true
 *               deliveryType:
 *                 type: string
 *                 enum: [pickup, courier, bts]
 *                 description: Delivery type (Самовывоз, Доставка курьером, BTS)
 *                 example: "courier"
 *               sendDate:
 *                 type: string
 *                 format: date-time
 *                 description: Дата отправки
 *                 example: "2025-12-31T10:00:00.000Z"
 *               paymentType:
 *                 type: string
 *                 enum: [cash, card]
 *                 description: Payment type
 *                 example: "cash"
 *               notes:
 *                 type: string
 *                 description: Additional order notes
 *                 example: "Please handle with care"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
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
 */
router.post('/', authenticate, createOrderRules, validate, createOrder);

/**
 * @swagger
 * /api/user/orders:
 *   get:
 *     summary: Get user's orders (Authenticated User)
 *     description: Returns orders filtered by the authenticated user's phone number
 *     tags: [User - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [unpaid, paid, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: deliveryType
 *         schema:
 *           type: string
 *           enum: [pickup, courier, bts]
 *         description: Filter by delivery type
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *           enum: [cash, card]
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Orders retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, listOrderQueryRules, validate, (req, res, next) => {
	// Filter orders by user's phone number
	req.query.customerPhone = req.user.phoneNumber;
	next();
}, getOrders);

/**
 * @swagger
 * /api/user/orders/external/{external_id}:
 *   get:
 *     summary: Get user's order by external_id (Authenticated User)
 *     description: Returns order details if it belongs to the authenticated user
 *     tags: [User - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 6-digit external order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Order does not belong to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
	'/external/:external_id',
	authenticate,
	externalIdParamRules,
	validate,
	(req, res, next) => {
		// getOrderByExternalId already checks ownership using req.user
		next();
	},
	getOrderByExternalId
);

/**
 * @swagger
 * /api/user/orders/{id}:
 *   get:
 *     summary: Get user's order by ID (Authenticated User)
 *     description: Returns order details if it belongs to the authenticated user
 *     tags: [User - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Order does not belong to the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, orderIdParamRules, validate, getOrderById);

module.exports = router;

