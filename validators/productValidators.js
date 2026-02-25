const { body, param, query } = require('express-validator');
const { Types } = require('mongoose');

const validateObjectIdParam = (paramName = 'id') =>
	param(paramName).custom((value) => {
		if (!Types.ObjectId.isValid(value)) {
			throw new Error('Invalid product id');
		}
		return true;
	});

const categoriesValidator = body('categories')
	.optional()
	.isArray()
	.withMessage('categories must be an array of strings')
	.bail()
	.custom((arr) => {
		if (!Array.isArray(arr)) {
			return false;
		}
		return arr.every((item) => {
			if (typeof item !== 'string' || !item.trim().length) {
				return false;
			}
			// Validate that each category ID is a valid ObjectId
			return Types.ObjectId.isValid(item.trim());
		});
	})
	.withMessage('categories must contain valid ObjectId strings')
	.customSanitizer((arr) => arr.map((item) => item.trim()));

const attributesValidator = body('attributes')
	.optional()
	.isObject()
	.withMessage('attributes must be an object')
	.bail()
	.custom((attributes) => {
		if (typeof attributes !== 'object' || Array.isArray(attributes)) {
			throw new Error('attributes must be an object');
		}
		
		// Validate attribute values
		for (const [key, value] of Object.entries(attributes)) {
			if (!key || typeof key !== 'string' || !key.trim()) {
				throw new Error('Attribute keys must be non-empty strings');
			}
			
			// Value can be string, number, or boolean
			const validTypes = ['string', 'number', 'boolean'];
			const valueType = typeof value;
			if (!validTypes.includes(valueType)) {
				throw new Error(`Attribute values must be string, number, or boolean. Found: ${valueType}`);
			}
		}
		
		return true;
	});

const nameValidator = body('name')
	.isObject()
	.withMessage('Name must be an object with en, ru, uz properties')
	.bail()
	.custom((name) => {
		if (!name || typeof name !== 'object' || Array.isArray(name)) {
			throw new Error('Name must be an object');
		}
		if (!name.en || typeof name.en !== 'string' || !name.en.trim()) {
			throw new Error('Name.en is required and must be a non-empty string');
		}
		if (!name.ru || typeof name.ru !== 'string' || !name.ru.trim()) {
			throw new Error('Name.ru is required and must be a non-empty string');
		}
		if (!name.uz || typeof name.uz !== 'string' || !name.uz.trim()) {
			throw new Error('Name.uz is required and must be a non-empty string');
		}
		return true;
	})
	.customSanitizer((name) => {
		if (name && typeof name === 'object') {
			return {
				en: name.en ? String(name.en).trim() : '',
				ru: name.ru ? String(name.ru).trim() : '',
				uz: name.uz ? String(name.uz).trim() : '',
			};
		}
		return name;
	});

const descriptionValidator = body('description')
	.optional({ checkFalsy: true })
	.isObject()
	.withMessage('Description must be an object with en, ru, uz properties')
	.bail()
	.custom((description) => {
		if (description && typeof description === 'object' && !Array.isArray(description)) {
			// All fields are optional, but if provided, they must be strings
			if (description.en !== undefined && typeof description.en !== 'string') {
				throw new Error('Description.en must be a string');
			}
			if (description.ru !== undefined && typeof description.ru !== 'string') {
				throw new Error('Description.ru must be a string');
			}
			if (description.uz !== undefined && typeof description.uz !== 'string') {
				throw new Error('Description.uz must be a string');
			}
		}
		return true;
	})
	.customSanitizer((description) => {
		if (description && typeof description === 'object' && !Array.isArray(description)) {
			return {
				en: description.en ? String(description.en).trim() : '',
				ru: description.ru ? String(description.ru).trim() : '',
				uz: description.uz ? String(description.uz).trim() : '',
			};
		}
		return description;
	});

const variantsValidator = body('variants')
	.optional()
	.isArray()
	.withMessage('Variants must be an array')
	.bail()
	.custom((variants) => {
		if (!Array.isArray(variants)) {
			throw new Error('Variants must be an array');
		}
		
		for (const variant of variants) {
			if (!variant || typeof variant !== 'object') {
				throw new Error('Each variant must be an object');
			}
			
			// Validate variant name (optional but if provided, must be object with en, ru, uz)
			if (variant.name !== undefined) {
				if (typeof variant.name !== 'object' || Array.isArray(variant.name)) {
					throw new Error('Variant name must be an object with en, ru, uz properties');
				}
				if (variant.name.en !== undefined && typeof variant.name.en !== 'string') {
					throw new Error('Variant name.en must be a string');
				}
				if (variant.name.ru !== undefined && typeof variant.name.ru !== 'string') {
					throw new Error('Variant name.ru must be a string');
				}
				if (variant.name.uz !== undefined && typeof variant.name.uz !== 'string') {
					throw new Error('Variant name.uz must be a string');
				}
			}
			
			// Validate price (optional)
			if (variant.price !== undefined && (typeof variant.price !== 'number' || variant.price < 0)) {
				throw new Error('Variant price must be a non-negative number');
			}
			
			// Validate stock (optional)
			if (variant.stock !== undefined && (typeof variant.stock !== 'number' || variant.stock < 0)) {
				throw new Error('Variant stock must be a non-negative number');
			}
			
			// Validate imageUrl (optional)
			if (variant.imageUrl !== undefined && typeof variant.imageUrl !== 'string') {
				throw new Error('Variant imageUrl must be a string');
			}
			
			// Validate color (optional)
			if (variant.color !== undefined && typeof variant.color !== 'string') {
				throw new Error('Variant color must be a string');
			}
			
			// Validate sku (optional)
			if (variant.sku !== undefined && typeof variant.sku !== 'string') {
				throw new Error('Variant sku must be a string');
			}
		}
		
		return true;
	});

const createProductRules = [
	nameValidator,
	descriptionValidator,
	body('price').isFloat({ min: 0 }).withMessage('Price must be greater than or equal to 0').toFloat(),
	body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image URL must be valid'),
	body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer').toInt(),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	categoriesValidator,
	attributesValidator,
	variantsValidator,
];

const updateNameValidator = body('name')
	.optional()
	.isObject()
	.withMessage('Name must be an object with en, ru, uz properties')
	.bail()
	.custom((name) => {
		if (name && typeof name === 'object' && !Array.isArray(name)) {
			// All fields are optional for update, but if provided, they must be non-empty strings
			if (name.en !== undefined) {
				if (typeof name.en !== 'string' || !name.en.trim()) {
					throw new Error('Name.en must be a non-empty string');
				}
			}
			if (name.ru !== undefined) {
				if (typeof name.ru !== 'string' || !name.ru.trim()) {
					throw new Error('Name.ru must be a non-empty string');
				}
			}
			if (name.uz !== undefined) {
				if (typeof name.uz !== 'string' || !name.uz.trim()) {
					throw new Error('Name.uz must be a non-empty string');
				}
			}
		}
		return true;
	})
	.customSanitizer((name) => {
		if (name && typeof name === 'object' && !Array.isArray(name)) {
			const sanitized = {};
			if (name.en !== undefined) sanitized.en = String(name.en).trim();
			if (name.ru !== undefined) sanitized.ru = String(name.ru).trim();
			if (name.uz !== undefined) sanitized.uz = String(name.uz).trim();
			return sanitized;
		}
		return name;
	});

const updateProductRules = [
	validateObjectIdParam(),
	updateNameValidator,
	descriptionValidator,
	body('price')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Price must be greater than or equal to 0')
		.toFloat(),
	body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Image URL must be valid'),
	body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer').toInt(),
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	categoriesValidator,
	attributesValidator,
	variantsValidator,
];

const productIdParamRules = [validateObjectIdParam()];

const listProductQueryRules = [
	query('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

const searchProductQueryRules = [
	query('q')
		.notEmpty()
		.withMessage('Search query is required')
		.isString()
		.trim()
		.isLength({ min: 3 })
		.withMessage('Search query must be at least 3 character long'),
	query('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

module.exports = {
	createProductRules,
	updateProductRules,
	productIdParamRules,
	listProductQueryRules,
	searchProductQueryRules,
};

