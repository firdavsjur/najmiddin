const { body, param, query } = require('express-validator');
const { Types } = require('mongoose');

const validateObjectIdParam = (paramName = 'id') =>
	param(paramName).custom((value) => {
		if (!Types.ObjectId.isValid(value)) {
			throw new Error('Invalid banner id');
		}
		return true;
	});

const booleanQuery = (field) =>
	query(field)
		.optional()
		.isBoolean()
		.withMessage(`${field} must be boolean`)
		.toBoolean();

const createBannerRules = [
	body('title').isString().trim().notEmpty().withMessage('Title is required'),
	body('description').optional({ checkFalsy: true }).isString().trim(),
	body('imageUrl').isURL().withMessage('Image URL must be a valid URL'),
	body('linkUrl').optional({ checkFalsy: true }).isURL().withMessage('Link URL must be a valid URL'),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	body('order').optional().isInt({ min: 0 }).withMessage('order must be a positive integer').toInt(),
];

const updateBannerRules = [
	validateObjectIdParam(),
	body('title').optional().isString().trim().notEmpty().withMessage('Title cannot be empty'),
	body('description').optional({ checkFalsy: true }).isString().trim(),
	body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
	body('linkUrl').optional({ checkFalsy: true }).isURL().withMessage('Link URL must be a valid URL'),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	body('order').optional().isInt({ min: 0 }).withMessage('order must be a positive integer').toInt(),
];

const bannerIdParamRules = [validateObjectIdParam()];

const listBannerQueryRules = [booleanQuery('isActive')];

module.exports = {
	createBannerRules,
	updateBannerRules,
	bannerIdParamRules,
	listBannerQueryRules,
};

