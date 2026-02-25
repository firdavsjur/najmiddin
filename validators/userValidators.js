const { body, param, query } = require('express-validator');
const { Types } = require('mongoose');

const validateObjectIdParam = (paramName = 'id') =>
	param(paramName).custom((value) => {
		if (!Types.ObjectId.isValid(value)) {
			throw new Error('Invalid user id');
		}
		return true;
	});

const createUserRules = [
	body('phoneNumber')
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Phone number is required')
		.matches(/^\+?[1-9]\d{1,14}$/)
		.withMessage('Phone number must be in E.164 format'),
	body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
	body('birthday')
		.optional()
		.isISO8601()
		.withMessage('Birthday must be a valid date (ISO 8601 format)')
		.toDate(),
	body('email')
		.optional()
		.isEmail()
		.withMessage('Email must be a valid email address')
		.normalizeEmail(),
	body('address').optional({ checkFalsy: true }).isString().trim(),
	body('role')
		.optional()
		.isIn(['user', 'admin'])
		.withMessage('Role must be either "user" or "admin"'),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

const updateUserRules = [
	validateObjectIdParam(),
	body('phoneNumber')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Phone number cannot be empty')
		.matches(/^\+?[1-9]\d{1,14}$/)
		.withMessage('Phone number must be in E.164 format'),
	body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
	body('birthday')
		.optional()
		.isISO8601()
		.withMessage('Birthday must be a valid date (ISO 8601 format)')
		.toDate(),
	body('email')
		.optional()
		.isEmail()
		.withMessage('Email must be a valid email address')
		.normalizeEmail(),
	body('address').optional({ checkFalsy: true }).isString().trim(),
	body('role')
		.optional()
		.isIn(['user', 'admin'])
		.withMessage('Role must be either "user" or "admin"'),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

const userIdParamRules = [validateObjectIdParam()];

const listUserQueryRules = [
	query('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	query('role').optional().isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin"'),
	query('phoneNumber').optional().isString().trim(),
];

// For user profile update (only name and birthday)
const updateCurrentUserRules = [
	body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
	body('birthday')
		.optional()
		.isISO8601()
		.withMessage('Birthday must be a valid date (ISO 8601 format)')
		.toDate(),
];

// For registration (only name and birthday)
const registerUserRules = [
	body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
	body('birthday')
		.optional()
		.isISO8601()
		.withMessage('Birthday must be a valid date (ISO 8601 format)')
		.toDate(),
];

module.exports = {
	createUserRules,
	updateUserRules,
	userIdParamRules,
	listUserQueryRules,
	updateCurrentUserRules,
	registerUserRules,
};

