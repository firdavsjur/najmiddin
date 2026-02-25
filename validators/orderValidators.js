const { body, param, query } = require('express-validator');
const { Types } = require('mongoose');

const validateObjectIdParam = (paramName = 'id') =>
	param(paramName).custom((value) => {
		if (!Types.ObjectId.isValid(value)) {
			throw new Error('Invalid order id');
		}
		return true;
	});

const orderItemRules = body('items')
	.isArray({ min: 1 })
	.withMessage('items must be an array with at least one entry')
	.bail()
	.custom((items) => {
		if (
			!items.every((item) => {
				if (!item || typeof item !== 'object') {
					return false;
				}
				const { productId, variantIndex, quantity, unitPrice, totalPrice, isFavourite } = item;
				if (!Types.ObjectId.isValid(productId)) {
					return false;
				}
				if (variantIndex !== undefined && (!Number.isFinite(Number(variantIndex)) || Number(variantIndex) < 0)) {
					return false;
				}
				if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
					return false;
				}
				if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) {
					return false;
				}
				if (totalPrice !== undefined && (!Number.isFinite(Number(totalPrice)) || Number(totalPrice) < 0)) {
					return false;
				}
				if (isFavourite !== undefined && typeof isFavourite !== 'boolean') {
					return false;
				}
				return true;
			})
		) {
			throw new Error(
				'Each item must include a valid productId, quantity >= 1, unitPrice >= 0, optional variantIndex >= 0, optional totalPrice >= 0, and optional isFavourite boolean'
			);
		}
		return true;
	})
		.customSanitizer((items) =>
			items.map((item) => ({
				...item,
				productId: item.productId,
				variantIndex: item.variantIndex !== undefined ? Number(item.variantIndex) : undefined,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: item.totalPrice !== undefined ? Number(item.totalPrice) : undefined,
				isFavourite: item.isFavourite === undefined ? false : Boolean(item.isFavourite),
			}))
		);

const createOrderRules = [
	body('customerName').isString().trim().notEmpty().withMessage('customerName is required'),
	body('customerEmail').isEmail().withMessage('customerEmail must be a valid email').normalizeEmail(),
	body('customerPhone')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('customerPhone cannot be empty'),
	body('shippingAddress').isString().trim().notEmpty().withMessage('shippingAddress is required'),
	orderItemRules,
	body('notifyPromotions')
		.optional()
		.isBoolean()
		.withMessage('notifyPromotions must be a boolean')
		.toBoolean(),
	body('deliveryType')
		.isIn(['pickup', 'courier', 'bts'])
		.withMessage('deliveryType must be one of: pickup, courier, bts'),
	body('sendDate')
		.optional()
		.isISO8601()
		.withMessage('sendDate must be a valid ISO8601 date')
		.toDate(),
	body('paymentType')
		.isIn(['cash', 'card'])
		.withMessage('paymentType must be one of: cash, card'),
	body('status')
		.optional()
		.isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
		.withMessage('Invalid status value'),
	body('paymentStatus')
		.optional()
		.isIn(['unpaid', 'paid', 'refunded'])
		.withMessage('Invalid paymentStatus value'),
	body('notes').optional({ checkFalsy: true }).isString().trim(),
];

const updateOrderRules = [
	validateObjectIdParam(),
	body('customerName').optional().isString().trim().notEmpty().withMessage('customerName cannot be empty'),
	body('customerEmail').optional().isEmail().withMessage('customerEmail must be a valid email').normalizeEmail(),
	body('customerPhone')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('customerPhone cannot be empty'),
	body('shippingAddress')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('shippingAddress cannot be empty'),
	body('items')
		.optional()
		.isArray({ min: 1 })
		.withMessage('items must be an array with at least one entry')
		.bail()
		.custom((items) => {
			if (
				!items.every((item) => {
					if (!item || typeof item !== 'object') {
						return false;
					}
					const { productId, quantity, unitPrice, totalPrice } = item;
					if (!Types.ObjectId.isValid(productId)) {
						return false;
					}
					if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
						return false;
					}
					if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) {
						return false;
					}
					if (
						totalPrice !== undefined &&
						(!Number.isFinite(Number(totalPrice)) || Number(totalPrice) < 0)
					) {
						return false;
					}
					return true;
				})
			) {
				throw new Error(
					'Each item must include a valid productId, quantity >= 1, unitPrice >= 0, and optional totalPrice >= 0'
				);
			}
			return true;
		})
		.customSanitizer((items) =>
			items.map((item) => ({
				...item,
				productId: item.productId,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				totalPrice: item.totalPrice !== undefined ? Number(item.totalPrice) : undefined,
			}))
		),
	body('status')
		.optional()
		.isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
		.withMessage('Invalid status value'),
	body('paymentStatus')
		.optional()
		.isIn(['unpaid', 'paid', 'refunded'])
		.withMessage('Invalid paymentStatus value'),
	body('notes').optional({ checkFalsy: true }).isString().trim(),
	body('notifyPromotions')
		.optional()
		.isBoolean()
		.withMessage('notifyPromotions must be a boolean')
		.toBoolean(),
	body('deliveryType')
		.optional()
		.isIn(['pickup', 'courier', 'bts'])
		.withMessage('deliveryType must be one of: pickup, courier, bts'),
	body('sendDate')
		.optional()
		.isISO8601()
		.withMessage('sendDate must be a valid ISO8601 date')
		.toDate(),
	body('paymentType')
		.optional()
		.isIn(['cash', 'card'])
		.withMessage('paymentType must be one of: cash, card'),
];

const orderIdParamRules = [validateObjectIdParam()];

const externalIdParamRules = [
	param('external_id')
		.isString()
		.trim()
		.isLength({ min: 6, max: 6 })
		.withMessage('external_id must be a 6-digit string')
		.matches(/^\d{6}$/)
		.withMessage('external_id must contain only digits'),
];

const listOrderQueryRules = [
	query('status')
		.optional()
		.isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
		.withMessage('Invalid status filter'),
	query('paymentStatus')
		.optional()
		.isIn(['unpaid', 'paid', 'refunded'])
		.withMessage('Invalid paymentStatus filter'),
	query('customerEmail').optional().isEmail().withMessage('customerEmail filter must be a valid email'),
];

module.exports = {
	createOrderRules,
	updateOrderRules,
	orderIdParamRules,
	listOrderQueryRules,
	externalIdParamRules,
};

