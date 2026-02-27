const { body, param, query } = require('express-validator');
const { Types } = require('mongoose');

const validateObjectIdParam = (paramName = 'id') =>
	param(paramName).custom((value) => {
		if (!Types.ObjectId.isValid(value)) {
			throw new Error('Invalid category id');
		}
		return true;
	});

const validateMultilingualField = (fieldName, isRequired = true) => {
	return body(fieldName)
		.custom((value) => {
			if (!value) {
				if (isRequired) {
					throw new Error(`${fieldName} is required`);
				}
				return true;
			}
			
			if (typeof value !== 'object' || Array.isArray(value)) {
				throw new Error(`${fieldName} must be an object with en, ru, uz properties`);
			}
			
			const requiredLanguages = ['en', 'ru', 'uz'];
			for (const lang of requiredLanguages) {
				if (!value[lang] || typeof value[lang] !== 'string' || !value[lang].trim()) {
					throw new Error(`${fieldName}.${lang} is required and must be a non-empty string`);
				}
			}
			
			return true;
		});
};

const filtersValidator = body('filters')
	.optional()
	.isArray()
	.withMessage('filters must be an array')
	.bail()
	.custom((filters) => {
		if (!Array.isArray(filters)) return false;
		
		for (const filter of filters) {
			if (!filter.name || typeof filter.name !== 'object' || Array.isArray(filter.name)) {
				throw new Error('Each filter must have a name object with en, ru, uz properties');
			}
			
			const requiredLanguages = ['en', 'ru', 'uz'];
			for (const lang of requiredLanguages) {
				if (!filter.name[lang] || typeof filter.name[lang] !== 'string' || !filter.name[lang].trim()) {
					throw new Error(`Filter name.${lang} is required and must be a non-empty string`);
				}
			}
			
			const validTypes = ['string', 'number', 'boolean', 'select'];
			if (!filter.type || !validTypes.includes(filter.type)) {
				throw new Error(`Filter type must be one of: ${validTypes.join(', ')}`);
			}
			
			if (filter.type === 'select') {
				if (!Array.isArray(filter.options) || filter.options.length === 0) {
					throw new Error('Select type filters must have at least one option');
				}
				
				// Validate each option has multilingual name plus color/photo_url
				for (const option of filter.options) {
					if (!option || typeof option !== 'object' || Array.isArray(option)) {
						throw new Error('Each option must be an object with name, color, and photo_url properties');
					}
					
					if (!option.name || typeof option.name !== 'object' || Array.isArray(option.name)) {
						throw new Error('Option name must be an object with en, ru, uz properties');
					}

					const requiredLanguages = ['en', 'ru', 'uz'];
					for (const lang of requiredLanguages) {
						if (!option.name[lang] || typeof option.name[lang] !== 'string' || !option.name[lang].trim()) {
							throw new Error(`Option name.${lang} is required and must be a non-empty string`);
						}
					}
					
					if (option.color !== undefined && typeof option.color !== 'string') {
						throw new Error('Option color must be a string');
					}
					
					if (option.photo_url !== undefined && typeof option.photo_url !== 'string') {
						throw new Error('Option photo_url must be a string');
					}
				}
			}
			
			if (filter.required !== undefined && typeof filter.required !== 'boolean') {
				throw new Error('Filter required field must be boolean');
			}
		}
		
		// Check for duplicate filter names (using en name for uniqueness check)
		const names = filters.map(f => f.name?.en?.trim().toLowerCase()).filter(Boolean);
		if (new Set(names).size !== names.length) {
			throw new Error('Filter names must be unique');
		}
		
		return true;
	});

const createCategoryRules = [
	validateMultilingualField('name', true),
	body('slug')
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Slug is required')
		.toLowerCase()
		.matches(/^[a-z0-9-]+$/)
		.withMessage('Slug can only contain lowercase letters, numbers, and dashes'),
	validateMultilingualField('description', false),
	filtersValidator,
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

const updateCategoryRules = [
	validateObjectIdParam(),
	body('name')
		.optional()
		.custom((value) => {
			if (!value) return true;
			if (typeof value !== 'object' || Array.isArray(value)) {
				throw new Error('name must be an object with en, ru, uz properties');
			}
			const requiredLanguages = ['en', 'ru', 'uz'];
			for (const lang of requiredLanguages) {
				if (!value[lang] || typeof value[lang] !== 'string' || !value[lang].trim()) {
					throw new Error(`name.${lang} is required and must be a non-empty string`);
				}
			}
			return true;
		}),
	body('slug')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Slug cannot be empty')
		.toLowerCase()
		.matches(/^[a-z0-9-]+$/)
		.withMessage('Slug can only contain lowercase letters, numbers, and dashes'),
	body('description')
		.optional()
		.custom((value) => {
			if (!value) return true;
			if (typeof value !== 'object' || Array.isArray(value)) {
				throw new Error('description must be an object with en, ru, uz properties');
			}
			const requiredLanguages = ['en', 'ru', 'uz'];
			for (const lang of requiredLanguages) {
				if (value[lang] !== undefined && (typeof value[lang] !== 'string' || !value[lang].trim())) {
					throw new Error(`description.${lang} must be a non-empty string if provided`);
				}
			}
			return true;
		}),
	filtersValidator,
	body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
];

const categoryIdParamRules = [validateObjectIdParam()];

const listCategoryQueryRules = [
	query('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
	query('slug')
		.optional()
		.isString()
		.trim()
		.toLowerCase()
		.matches(/^[a-z0-9-]+$/)
		.withMessage('slug filter can only contain lowercase letters, numbers, and dashes'),
	query('sortBy')
		.optional()
		.isString()
		.trim()
		.isIn(['price-asc', 'price-desc', 'name-asc', 'name-desc', 'with_discount'])
		.withMessage('sortBy must be one of: price-asc, price-desc, name-asc, name-desc, with_discount'),
];

module.exports = {
	createCategoryRules,
	updateCategoryRules,
	categoryIdParamRules,
	listCategoryQueryRules,
};

