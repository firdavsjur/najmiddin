const express = require('express');
const router = express.Router();

const {
	createOrder,
	getOrders,
	getOrderById,
	getOrderByExternalId,
	updateOrder,
	deleteOrder,
} = require('../../controllers/orderController');

const { authenticate, isAdmin } = require('../../middleware/auth');
const { validate } = require('../../validators');
const {
	createOrderRules,
	updateOrderRules,
	orderIdParamRules,
	listOrderQueryRules,
	externalIdParamRules,
} = require('../../validators/orderValidators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin - Orders]
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
 *         name: customerEmail
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by customer email
 *       - in: query
 *         name: customerPhone
 *         schema:
 *           type: string
 *         description: Filter by customer phone number
 *       - in: query
 *         name: external_id
 *         schema:
 *           type: string
 *           pattern: '^\d{6}$'
 *         description: Filter by 6-digit external order ID
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
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *           example: '2025-01-01T00:00:00.000Z'
 *         description: Filter orders from this date (ISO8601 or YYYY-MM-DD, inclusive start of day UTC)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *           example: '2025-01-31T23:59:59.999Z'
 *         description: Filter orders up to this date (ISO8601 or YYYY-MM-DD, inclusive end of day UTC)
 *     responses:
 *       200:
 *         description: List of orders
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listOrderQueryRules, validate, getOrders);

/**
 * @swagger
 * /api/admin/orders/external/{external_id}:
 *   get:
 *     summary: Get an order by external_id (Admin only)
 *     tags: [Admin - Orders]
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
 *         description: Forbidden - Admin access required
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
router.get('/external/:external_id', externalIdParamRules, validate, getOrderByExternalId);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get an order by ID (Admin only)
 *     tags: [Admin - Orders]
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
 *         description: Forbidden - Admin access required
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
router.get('/:id', orderIdParamRules, validate, getOrderById);

/**
 * @swagger
 * /api/admin/orders:
 *   post:
 *     summary: Create a new order (Admin only)
 *     tags: [Admin - Orders]
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
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: Order status
 *                 example: "pending"
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, paid, refunded]
 *                 description: Payment status
 *                 example: "unpaid"
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createOrderRules, validate, createOrder);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   put:
 *     summary: Update an order (Admin only)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: Order status
 *                 example: "processing"
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, paid, refunded]
 *                 description: Payment status
 *                 example: "paid"
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
 *                 example: "Order shipped via express delivery"
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order updated successfully"
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.put('/:id', updateOrderRules, validate, updateOrder);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   delete:
 *     summary: Delete an order (Admin only)
 *     tags: [Admin - Orders]
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
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order deleted successfully"
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
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', orderIdParamRules, validate, deleteOrder);

module.exports = router;

