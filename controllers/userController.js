const User = require('../mongo/user.model');
const Product = require('../mongo/product.model');
const SavedProduct = require('../mongo/savedProduct.model');
const logger = require('../utils/logger')(module);

const toJson = (user) => {
	if (!user) return null;
	const json = user.toJSON();
	// Remove sensitive data if needed
	return json;
};

const parseListFilters = (query) => {
	const filters = {};

	if (typeof query.isActive === 'boolean') {
		filters.isActive = query.isActive;
	}

	if (query.role) {
		filters.role = query.role;
	}

	if (query.phoneNumber) {
		const escaped = String(query.phoneNumber).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		filters.phoneNumber = { $regex: escaped };
	}

	return filters;
};

const createUser = async (req, res) => {
	try {
		const user = await User.create(req.body);
		return res.status(201).json({ data: toJson(user) });
	} catch (error) {
		logger.error('Failed to create user', { error });
		if (error.code === 11000) {
			return res.status(400).json({
				message: 'User with this phone number already exists.',
			});
		}
		return res.status(500).json({
			message: 'Unable to create user. Please try again later.',
		});
	}
};

const getUsers = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		const users = await User.find(filters).sort({ createdAt: -1 });
		return res.json({ data: users.map(toJson) });
	} catch (error) {
		logger.error('Failed to fetch users', { error });
		return res.status(500).json({
			message: 'Unable to retrieve users. Please try again later.',
		});
	}
};

const getUserById = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({ data: toJson(user) });
	} catch (error) {
		logger.error('Failed to fetch user', { error });
		return res.status(500).json({
			message: 'Unable to retrieve user. Please try again later.',
		});
	}
};

const updateUser = async (req, res) => {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({ data: toJson(user) });
	} catch (error) {
		logger.error('Failed to update user', { error });
		if (error.code === 11000) {
			return res.status(400).json({
				message: 'User with this phone number already exists.',
			});
		}
		return res.status(500).json({
			message: 'Unable to update user. Please try again later.',
		});
	}
};

const deleteUser = async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.status(200).json({ message: 'User deleted successfully' });
	} catch (error) {
		logger.error('Failed to delete user', { error });
		return res.status(500).json({
			message: 'Unable to delete user. Please try again later.',
		});
	}
};

// Get current user's profile
const getCurrentUser = async (req, res) => {
	try {
		const user = await User.findOne({ phoneNumber: req.user.phoneNumber });

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({ data: toJson(user) });
	} catch (error) {
		logger.error('Failed to fetch current user', { error });
		return res.status(500).json({
			message: 'Unable to retrieve user profile. Please try again later.',
		});
	}
};

// Update current user's profile (only name and birthday)
const updateCurrentUser = async (req, res) => {
	try {
		const updateData = {};
		if (req.body.name !== undefined) {
			updateData.name = req.body.name;
		}
		if (req.body.birthday !== undefined) {
			updateData.birthday = req.body.birthday;
		}

		const user = await User.findOneAndUpdate(
			{ phoneNumber: req.user.phoneNumber },
			updateData,
			{
				new: true,
				runValidators: true,
			}
		);

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.json({ data: toJson(user) });
	} catch (error) {
		logger.error('Failed to update current user', { error });
		return res.status(500).json({
			message: 'Unable to update user profile. Please try again later.',
		});
	}
};

// Add product to saved list
const addSavedProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		// Check if product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		// Get user
		const user = await User.findOne({ phoneNumber: req.user.phoneNumber });
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Check if product is already saved
		const existingSavedProduct = await SavedProduct.findOne({
			userId: user._id,
			productId: productId,
		});

		if (existingSavedProduct) {
			return res.status(400).json({ message: 'Product is already in saved list' });
		}

		// Create saved product record
		const savedProduct = await SavedProduct.create({
			userId: user._id,
			productId: productId,
		});

		return res.status(201).json({
			message: 'Product added to saved list successfully',
			data: savedProduct.toJSON(),
		});
	} catch (error) {
		logger.error('Failed to add saved product', { error });
		if (error.code === 11000) {
			return res.status(400).json({
				message: 'Product is already in saved list',
			});
		}
		return res.status(500).json({
			message: 'Unable to add product to saved list. Please try again later.',
		});
	}
};

// Remove product from saved list
const removeSavedProduct = async (req, res) => {
	try {
		const { productId } = req.params;

		// Get user
		const user = await User.findOne({ phoneNumber: req.user.phoneNumber });
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Find and delete saved product
		const savedProduct = await SavedProduct.findOneAndDelete({
			userId: user._id,
			productId: productId,
		});

		if (!savedProduct) {
			return res.status(404).json({ message: 'Product is not in saved list' });
		}

		return res.status(200).json({
			message: 'Product removed from saved list successfully',
		});
	} catch (error) {
		logger.error('Failed to remove saved product', { error });
		return res.status(500).json({
			message: 'Unable to remove product from saved list. Please try again later.',
		});
	}
};

// Get all saved products
const getSavedProducts = async (req, res) => {
	try {
		const user = await User.findOne({ phoneNumber: req.user.phoneNumber });

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Get all saved products for this user with populated product data
		const savedProducts = await SavedProduct.find({ userId: user._id })
			.populate('productId')
			.sort({ createdAt: -1 });

		// Filter out inactive products for non-admin users and handle deleted products
		const productsJson = savedProducts
			.map((savedProduct) => {
				const product = savedProduct.productId;
				if (!product) return null; // Handle deleted products
				if (req.user.role !== 'admin' && !product.isActive) {
					return null; // Filter inactive products for non-admin users
				}
				return product.toJSON ? product.toJSON() : product;
			})
			.filter(Boolean);

		return res.json({
			data: productsJson,
		});
	} catch (error) {
		logger.error('Failed to fetch saved products', { error });
		return res.status(500).json({
			message: 'Unable to retrieve saved products. Please try again later.',
		});
	}
};

module.exports = {
	createUser,
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	getCurrentUser,
	updateCurrentUser,
	addSavedProduct,
	removeSavedProduct,
	getSavedProducts,
};
