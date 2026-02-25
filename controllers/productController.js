const Product = require('../mongo/product.model');
const Category = require('../mongo/category.model');
const { Types } = require('mongoose');
const logger = require('../utils/logger')(module);

const toJson = (product) => (product ? product.toJSON() : null);

const generateSlug = (name) => {
	if (!name) return '';
	
	// Handle object with multiple languages (use English as default, fallback to first available)
	let nameStr = '';
	if (typeof name === 'object' && name !== null) {
		nameStr = name.en || name.ru || name.uz || '';
	} else if (typeof name === 'string') {
		nameStr = name;
	}
	
	if (!nameStr) return '';
	
	return nameStr
		.toString()
		.trim()
		.toLowerCase()
		.replace(/[\s\_]+/g, '-') // spaces/underscores -> dash
		.replace(/[^a-z0-9\-]/g, '') // remove non-alphanumeric/dash
		.replace(/\-+/g, '-') // collapse multiple dashes
		.replace(/^\-+|\-+$/g, ''); // trim dashes
};

const parseListFilters = (query) => {
	const filters = {};

	if (typeof query.isActive === 'boolean') {
		filters.isActive = query.isActive;
	}

	return filters;
};

const validateProductAttributes = async (categories, attributes) => {
	if (!categories || categories.length === 0) {
		// If no categories, attributes are optional
		return { valid: true };
	}

	// Convert to plain object if it's a Mongoose Map or other type
	if (!attributes || (typeof attributes !== 'object' && !Array.isArray(attributes))) {
		attributes = {};
	}
	
	// Convert Map to object if needed
	if (attributes && typeof attributes.toObject === 'function') {
		attributes = attributes.toObject();
	}
	
	if (!attributes || Object.keys(attributes).length === 0) {
		attributes = {};
	}

	// Get all categories with their filters
	const categoryIds = categories.filter((id) => {
		return Types.ObjectId.isValid(id);
	});

	if (categoryIds.length === 0) {
		return { valid: true };
	}

	const categoryDocs = await Category.find({ _id: { $in: categoryIds } });
	
	if (categoryDocs.length === 0) {
		return { valid: true };
	}

	// Helper function to get all language versions of a filter name
	const getFilterNames = (filter) => {
		if (!filter.name || typeof filter.name !== 'object') {
			return [];
		}
		const names = [];
		if (filter.name.en) names.push(filter.name.en.trim());
		if (filter.name.ru) names.push(filter.name.ru.trim());
		if (filter.name.uz) names.push(filter.name.uz.trim());
		return names;
	};

	// Helper function to get the primary filter name (use English as default, fallback to first available)
	const getPrimaryFilterName = (filter) => {
		if (!filter.name || typeof filter.name !== 'object') {
			return '';
		}
		return filter.name.en?.trim() || filter.name.ru?.trim() || filter.name.uz?.trim() || '';
	};

	// Collect all filters from all categories
	const allFilters = [];
	categoryDocs.forEach((category) => {
		if (category.filters && Array.isArray(category.filters)) {
			allFilters.push(...category.filters);
		}
	});

	// Remove duplicate filters by name (keep the first one)
	// Use English name for comparison, or first available language
	const uniqueFilters = [];
	const seenNames = new Set();
	allFilters.forEach((filter) => {
		const primaryName = getPrimaryFilterName(filter).toLowerCase();
		if (primaryName && !seenNames.has(primaryName)) {
			seenNames.add(primaryName);
			uniqueFilters.push(filter);
		}
	});

	// Validate attributes against filters
	const errors = [];

	for (const filter of uniqueFilters) {
		const filterNames = getFilterNames(filter);
		const primaryName = getPrimaryFilterName(filter);
		
		// Find attribute value by checking all language versions of the filter name
		let attributeValue = undefined;
		let matchedKey = null;
		
		for (const filterName of filterNames) {
			if (attributes[filterName] !== undefined) {
				attributeValue = attributes[filterName];
				matchedKey = filterName;
				break;
			}
		}

		// Check required filters
		if (filter.required && (attributeValue === undefined || attributeValue === null || attributeValue === '')) {
			errors.push(`Required attribute '${primaryName}' (or one of: ${filterNames.join(', ')}) is missing`);
			continue;
		}

		// Skip validation if attribute is not provided and not required
		if (attributeValue === undefined || attributeValue === null || attributeValue === '') {
			continue;
		}

		// Validate type
		if (filter.type === 'string' && typeof attributeValue !== 'string') {
			errors.push(`Attribute '${matchedKey || primaryName}' must be a string`);
			continue;
		}

		if (filter.type === 'number' && typeof attributeValue !== 'number') {
			errors.push(`Attribute '${matchedKey || primaryName}' must be a number`);
			continue;
		}

		if (filter.type === 'boolean' && typeof attributeValue !== 'boolean') {
			errors.push(`Attribute '${matchedKey || primaryName}' must be a boolean`);
			continue;
		}

		// Validate select options
		if (filter.type === 'select') {
			if (!Array.isArray(filter.options) || filter.options.length === 0) {
				errors.push(`Filter '${primaryName}' of type 'select' must have options defined`);
				continue;
			}

			// Check if the value is in the options
			// Options are objects with name.en, name.ru, name.uz, so we need to check all
			const valueStr = String(attributeValue).toLowerCase().trim();
			let isValidOption = false;
			const validOptionValues = [];
			
			for (const option of filter.options) {
				if (option && option.name) {
					if (option.name.en) {
						const optStr = String(option.name.en).toLowerCase().trim();
						validOptionValues.push(option.name.en);
						if (optStr === valueStr) isValidOption = true;
					}
					if (option.name.ru) {
						const optStr = String(option.name.ru).toLowerCase().trim();
						validOptionValues.push(option.name.ru);
						if (optStr === valueStr) isValidOption = true;
					}
					if (option.name.uz) {
						const optStr = String(option.name.uz).toLowerCase().trim();
						validOptionValues.push(option.name.uz);
						if (optStr === valueStr) isValidOption = true;
					}
				}
			}
			
			if (!isValidOption) {
				errors.push(
					`Attribute '${matchedKey || primaryName}' value '${attributeValue}' is not valid. Valid options: ${validOptionValues.join(', ')}`
				);
			}
		}
	}

	// Check for extra attributes that don't belong to any filter
	// Collect all valid filter names (all language versions)
	const allValidFilterNames = new Set();
	uniqueFilters.forEach((filter) => {
		const filterNames = getFilterNames(filter);
		filterNames.forEach((name) => {
			if (name) {
				allValidFilterNames.add(name.toLowerCase());
			}
		});
	});
	
	const attributeKeys = Object.keys(attributes || {});
	
	for (const attrKey of attributeKeys) {
		if (!allValidFilterNames.has(attrKey.toLowerCase())) {
			errors.push(`Attribute '${attrKey}' does not match any filter in the product's categories`);
		}
	}

	if (errors.length > 0) {
		return { valid: false, errors };
	}

	return { valid: true };
};

const createProduct = async (req, res) => {
	try {
		// Ensure slug is set from name if not provided
		if (!req.body.slug && req.body.name) {
			req.body.slug = generateSlug(req.body.name);
		}

		// Validate attributes against category filters
		const validation = await validateProductAttributes(req.body.categories, req.body.attributes);
		
		if (!validation.valid) {
			return res.status(400).json({
				message: 'Product attributes validation failed',
				errors: validation.errors,
			});
		}

		const product = await Product.create(req.body);
		return res.status(201).json({ data: toJson(product) });
	} catch (error) {
		// Handle duplicate slug or other unique index errors
		if (error && error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
			return res.status(400).json({
				message: 'Product slug must be unique',
			});
		}

		logger.error('Failed to create product', { error });
		return res.status(500).json({
			message: 'Unable to create product. Please try again later.',
		});
	}
};

const getProducts = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		const products = await Product.find(filters).sort({ createdAt: -1 });
		return res.json({ data: products.map(toJson) });
	} catch (error) {
		logger.error('Failed to fetch products', { error });
		return res.status(500).json({
			message: 'Unable to retrieve products. Please try again later.',
		});
	}
};

const getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		return res.json({ data: toJson(product) });
	} catch (error) {
		logger.error('Failed to fetch product', { error });
		return res.status(500).json({
			message: 'Unable to retrieve product. Please try again later.',
		});
	}
};

const updateProduct = async (req, res) => {
	try {
		// Get existing product to merge categories if needed
		const existingProduct = await Product.findById(req.params.id);
		
		if (!existingProduct) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Merge categories - use new categories if provided, otherwise keep existing
		const categories = req.body.categories !== undefined 
			? req.body.categories 
			: existingProduct.categories;

		// Merge attributes - use new attributes if provided, otherwise keep existing
		// Convert Mongoose Map to plain object if needed
		const existingAttributes = existingProduct.attributes && existingProduct.attributes.toObject 
			? existingProduct.attributes.toObject() 
			: existingProduct.attributes || {};
		
		const attributes = req.body.attributes !== undefined
			? { ...existingAttributes, ...req.body.attributes }
			: existingAttributes;

		// Merge name - use new name fields if provided, otherwise keep existing
		const existingName = existingProduct.name && typeof existingProduct.name === 'object'
			? existingProduct.name
			: { en: existingProduct.name || '', ru: existingProduct.name || '', uz: existingProduct.name || '' };
		
		const name = req.body.name !== undefined
			? { ...existingName, ...req.body.name }
			: existingName;

		// Merge description - use new description fields if provided, otherwise keep existing
		const existingDescription = existingProduct.description && typeof existingProduct.description === 'object'
			? existingProduct.description
			: { en: existingProduct.description || '', ru: existingProduct.description || '', uz: existingProduct.description || '' };
		
		const description = req.body.description !== undefined
			? { ...existingDescription, ...req.body.description }
			: existingDescription;

		// If name is updated (or slug explicitly provided), update slug accordingly
		if (!req.body.slug) {
			req.body.slug = generateSlug(name);
		}

		// Prepare update data
		const updateData = {
			...req.body,
			name,
			description,
			attributes,
		};

		// Validate attributes against category filters
		const validation = await validateProductAttributes(categories, attributes);
		
		if (!validation.valid) {
			return res.status(400).json({
				message: 'Product attributes validation failed',
				errors: validation.errors,
			});
		}

		// Update product with merged data
		const product = await Product.findByIdAndUpdate(
			req.params.id,
			updateData,
			{
				new: true,
				runValidators: true,
			}
		);

		return res.json({ data: toJson(product) });
	} catch (error) {
		// Handle duplicate slug or other unique index errors
		if (error && error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
			return res.status(400).json({
				message: 'Product slug must be unique',
			});
		}

		logger.error('Failed to update product', { error });
		return res.status(500).json({
			message: 'Unable to update product. Please try again later.',
		});
	}
};

const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		return res.status(200).json({ message: 'Product deleted successfully' });
	} catch (error) {
		logger.error('Failed to delete product', { error });
		return res.status(500).json({
			message: 'Unable to delete product. Please try again later.',
		});
	}
};

const getProductBySlug = async (req, res) => {
	try {
		const product = await Product.findOne({ slug: req.params.slug });

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		return res.json({ data: toJson(product) });
	} catch (error) {
		logger.error('Failed to fetch product by slug', { error });
		return res.status(500).json({
			message: 'Unable to retrieve product. Please try again later.',
		});
	}
};

const searchProducts = async (req, res) => {
	try {
		const { q, isActive } = req.query;
		const searchQuery = q.trim();
		const filters = {};

		// Build search filter - search in name and description (all languages)
		filters.$or = [
			{ 'name.en': { $regex: searchQuery, $options: 'i' } },
			{ 'name.ru': { $regex: searchQuery, $options: 'i' } },
			{ 'name.uz': { $regex: searchQuery, $options: 'i' } },
			{ 'description.en': { $regex: searchQuery, $options: 'i' } },
			{ 'description.ru': { $regex: searchQuery, $options: 'i' } },
			{ 'description.uz': { $regex: searchQuery, $options: 'i' } },
		];

		// Apply isActive filter if provided (handle both boolean and string)
		if (isActive !== undefined) {
			if (typeof isActive === 'boolean') {
				filters.isActive = isActive;
			} else if (typeof isActive === 'string') {
				filters.isActive = isActive === 'true';
			}
		}

		const products = await Product.find(filters).sort({ createdAt: -1 });
		return res.json({ data: products.map(toJson) });
	} catch (error) {
		logger.error('Failed to search products', { error });
		return res.status(500).json({
			message: 'Unable to search products. Please try again later.',
		});
	}
};

module.exports = {
	createProduct,
	getProducts,
	getProductById,
	getProductBySlug,
	updateProduct,
	deleteProduct,
	searchProducts,
	validateProductAttributes, // Export for testing
};

