const Category = require('../mongo/category.model');
const Product = require('../mongo/product.model');
const SavedProduct = require('../mongo/savedProduct.model');
const User = require('../mongo/user.model');
const { Types } = require('mongoose');
const logger = require('../utils/logger')(module);

const toJson = (category) => (category ? category.toJSON() : null);

const parseListFilters = (query) => {
	const filters = {};

	if (typeof query.isActive === 'boolean') {
		filters.isActive = query.isActive;
	}

	if (query.slug) {
		filters.slug = query.slug.toLowerCase();
	}

	return filters;
};

const createCategory = async (req, res) => {
	try {
		const category = await Category.create(req.body);
		return res.status(201).json({ data: toJson(category) });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: 'Slug already exists' });
		}

		logger.error('Failed to create category', { error });
		return res.status(500).json({
			message: 'Unable to create category. Please try again later.',
		});
	}
};

const getCategories = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		const categories = await Category.find(filters).sort({ 'name.en': 1 });
		return res.json({ data: categories.map(toJson) });
	} catch (error) {
		logger.error('Failed to fetch categories', { error });
		return res.status(500).json({
			message: 'Unable to retrieve categories. Please try again later.',
		});
	}
};

const getCategoryById = async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);

		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		return res.json({ data: toJson(category) });
	} catch (error) {
		logger.error('Failed to fetch category', { error });
		return res.status(500).json({
			message: 'Unable to retrieve category. Please try again later.',
		});
	}
};

const updateCategory = async (req, res) => {
	try {
		const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		return res.json({ data: toJson(category) });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: 'Slug already exists' });
		}

		logger.error('Failed to update category', { error });
		return res.status(500).json({
			message: 'Unable to update category. Please try again later.',
		});
	}
};

const deleteCategory = async (req, res) => {
	try {
		const category = await Category.findByIdAndDelete(req.params.id);

		if (!category) {
			return res.status(404).json({ message: 'Category not found' });
		}

		return res.status(200).json({ message: 'Category deleted successfully' });
	} catch (error) {
		logger.error('Failed to delete category', { error });
		return res.status(500).json({
			message: 'Unable to delete category. Please try again later.',
		});
	}
};

const getCategoriesWithProducts = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		// For users, only show active categories by default
		if (filters.isActive === undefined && !req.user) {
			filters.isActive = true;
		}

		const categories = await Category.find(filters).sort({ 'name.en': 1 });
		
		// Get all active products (or all if admin)
		const productFilters = {};
		if (!req.user || req.user.role !== 'admin') {
			productFilters.isActive = true;
		}

		// Parse product attribute filters from query parameters
		// Exclude known query parameters (isActive, slug, minPrice, maxPrice, sortBy)
		const knownParams = ['isActive', 'slug', 'minPrice', 'maxPrice', 'sortBy'];
		const attributeFilters = {};
		
		Object.keys(req.query).forEach((key) => {
			if (!knownParams.includes(key) && req.query[key] !== undefined && req.query[key] !== '') {
				// Build MongoDB query for attributes field
				// attributes.brand = "samsung" format
				attributeFilters[`attributes.${key}`] = req.query[key];
			}
		});

		// Add price filtering if provided
		if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
			productFilters.price = {};
			if (req.query.minPrice !== undefined) {
				productFilters.price.$gte = Number(req.query.minPrice);
			}
			if (req.query.maxPrice !== undefined) {
				productFilters.price.$lte = Number(req.query.maxPrice);
			}
		}

		// Merge product filters with attribute filters
		const finalProductFilters = { ...productFilters, ...attributeFilters };

		const products = await Product.find(finalProductFilters);

		// Get user's saved products if user is authenticated
		let savedProductIds = [];
		if (req.user && req.user.phoneNumber) {
			try {
				// Get user from database to ensure we have the correct _id
				const user = await User.findOne({ phoneNumber: req.user.phoneNumber });
				if (user) {
					const savedProducts = await SavedProduct.find({ userId: user._id });
					savedProductIds = savedProducts.map((sp) => sp.productId.toString());
				}
			} catch (error) {
				logger.warn('Failed to fetch saved products for user', { error, phoneNumber: req.user.phoneNumber });
			}
		}

		// Parse sortBy parameter
		let sortFunction = null;
		if (req.query.sortBy) {
			const sortBy = req.query.sortBy.toLowerCase().replace(/-/g, '_');
			if (sortBy === 'price_asc') {
				sortFunction = (a, b) => (a.price || 0) - (b.price || 0);
			} else if (sortBy === 'price_desc') {
				sortFunction = (a, b) => (b.price || 0) - (a.price || 0);
			} else if (sortBy === 'name_asc') {
				sortFunction = (a, b) => {
					const nameA = a.name?.en || a.name?.ru || a.name?.uz || '';
					const nameB = b.name?.en || b.name?.ru || b.name?.uz || '';
					return nameA.localeCompare(nameB);
				};
			} else if (sortBy === 'name_desc') {
				sortFunction = (a, b) => {
					const nameA = a.name?.en || a.name?.ru || a.name?.uz || '';
					const nameB = b.name?.en || b.name?.ru || b.name?.uz || '';
					return nameB.localeCompare(nameA);
				};
			} else if (sortBy === 'with_discount') {
				// Skidkali (stock > 0) birinchi, keyin skidkasiz
				sortFunction = (a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
			}
		}

		// Map categories with their products
		const categoriesWithProducts = categories.map((category) => {
			const categoryJson = toJson(category);
			// Find products that have this category ID in their categories array
			let categoryProducts = products
				.filter((product) => {
					return product.categories && product.categories.includes(category._id.toString());
				})
				.map((product) => {
					const productJson = toJson(product);
					// Add isFavourite field if user is authenticated
					if (req.user && req.user.id) {
						productJson.isFavourite = savedProductIds.includes(product._id.toString());
					} else {
						productJson.isFavourite = false;
					}
					return productJson;
				});

			// Apply sorting if specified
			if (sortFunction) {
				categoryProducts = categoryProducts.sort(sortFunction);
			}

			return {
				...categoryJson,
				products: categoryProducts,
			};
		});

		return res.json({ data: categoriesWithProducts });
	} catch (error) {
		logger.error('Failed to fetch categories with products', { error });
		return res.status(500).json({
			message: 'Unable to retrieve categories with products. Please try again later.',
		});
	}
};

module.exports = {
	createCategory,
	getCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
	getCategoriesWithProducts,
};

