const { body } = require('express-validator');
const { getConfig } = require('../utils/otp');

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const { length: OTP_LENGTH } = getConfig();

const sendOtpRules = [
	body('phoneNumber')
		.isString()
		.trim()
		.matches(PHONE_REGEX)
		.withMessage('phoneNumber must be in E.164 format (e.g. +1234567890)'),
	body('meta')
		.optional()
		.isObject()
		.withMessage('meta must be a JSON object'),
];

const verifyOtpRules = [
	body('phoneNumber')
		.isString()
		.trim()
		.matches(PHONE_REGEX)
		.withMessage('phoneNumber must be in E.164 format (e.g. +1234567890)'),
	body('otp')
		.isString()
		.trim()
		.isLength({ min: OTP_LENGTH, max: OTP_LENGTH })
		.withMessage(`otp must be a ${OTP_LENGTH}-digit code`)
		.matches(/^\d+$/)
		.withMessage('otp must contain only digits'),
];

module.exports = {
	sendOtpRules,
	verifyOtpRules,
};

