const Order = require('../mongo/order.model');
const Product = require('../mongo/product.model');
const logger = require('../utils/logger')(module);

const toJson = (order) => (order ? order.toJSON() : null);

const normalizeItems = (items = []) =>
	items.map((item) => ({
		productId: item.productId,
		variantIndex: item.variantIndex !== undefined ? Number(item.variantIndex) : undefined,
		name: item.name,
		quantity: item.quantity,
		unitPrice: item.unitPrice,
		totalPrice:
			item.totalPrice !== undefined ? item.totalPrice : Number(item.quantity) * Number(item.unitPrice),
		isFavourite: item.isFavourite ?? false,
	}));

const calculateTotalAmount = (items = []) =>
	items.reduce((sum, item) => sum + Number(item.totalPrice ?? item.quantity * item.unitPrice), 0);

const parseListFilters = (query = {}) => {
	const filters = {};

	if (query.status) {
		filters.status = query.status;
	}

	if (query.paymentStatus) {
		filters.paymentStatus = query.paymentStatus;
	}

	if (query.customerEmail) {
		filters.customerEmail = query.customerEmail.toLowerCase();
	}

	if (query.customerPhone) {
		filters.customerPhone = query.customerPhone;
	}

	if (query.external_id) {
		filters.external_id = query.external_id;
	}

	if (query.deliveryType) {
		filters.deliveryType = query.deliveryType;
	}

	if (query.paymentType) {
		filters.paymentType = query.paymentType;
	}

	// Date filter by order createdAt
	if (query.dateFrom) {
		const from = query.dateFrom instanceof Date ? query.dateFrom : new Date(query.dateFrom);
		from.setUTCHours(0, 0, 0, 0);
		filters.createdAt = filters.createdAt || {};
		filters.createdAt.$gte = from;
	}
	if (query.dateTo) {
		const to = query.dateTo instanceof Date ? query.dateTo : new Date(query.dateTo);
		to.setUTCHours(23, 59, 59, 999);
		filters.createdAt = filters.createdAt || {};
		filters.createdAt.$lte = to;
	}

	return filters;
};

const createOrder = async (req, res) => {
	try {
		// Validate items and get variant information
		const validatedItems = [];
		for (const item of req.body.items) {
			const product = await Product.findById(item.productId);
			
			if (!product) {
				return res.status(400).json({
					message: `Product with ID ${item.productId} not found`,
				});
			}

			// Check if variant is selected
			let variant = null;
			let finalPrice = product.price;
			let finalStock = product.stock;
			let itemName = product.name?.en || product.name?.ru || product.name?.uz || 'Product';
			let imageUrl = product.imageUrl || null;

			if (item.variantIndex !== undefined && item.variantIndex !== null) {
				const variantIndex = Number(item.variantIndex);
				
				if (!product.variants || !Array.isArray(product.variants)) {
					return res.status(400).json({
						message: `Product ${item.productId} does not have variants`,
					});
				}

				if (variantIndex < 0 || variantIndex >= product.variants.length) {
					return res.status(400).json({
						message: `Invalid variantIndex ${variantIndex}. Product has ${product.variants.length} variants (0-${product.variants.length - 1})`,
					});
				}

				variant = product.variants[variantIndex];
				
				// Use variant price if available, otherwise use base price
				finalPrice = variant.price !== undefined && variant.price !== null ? variant.price : product.price;
				
				// Use variant stock
				finalStock = variant.stock !== undefined ? variant.stock : 0;
				
				// Use variant imageUrl if available, otherwise use product imageUrl
				imageUrl = variant.imageUrl || product.imageUrl || null;
				
				// Build item name with variant name
				const variantName = variant.name?.en || variant.name?.ru || variant.name?.uz || '';
				if (variantName) {
					itemName = `${itemName} - ${variantName}`;
				}
			}

			// Check stock availability
			if (finalStock < item.quantity) {
				return res.status(400).json({
					message: `Insufficient stock. Available: ${finalStock}, Requested: ${item.quantity}`,
				});
			}

			// Use provided unitPrice or calculate from variant/base price
			const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : finalPrice;
			const totalPrice = item.totalPrice !== undefined 
				? Number(item.totalPrice) 
				: Number(item.quantity) * unitPrice;

			validatedItems.push({
				productId: item.productId,
				variantIndex: item.variantIndex !== undefined ? Number(item.variantIndex) : undefined,
				name: item.name || itemName,
				quantity: Number(item.quantity),
				unitPrice,
				totalPrice,
				isFavourite: item.isFavourite ?? false,
				imageUrl: item.imageUrl || imageUrl || null,
			});
		}

		const orderPayload = {
			customerName: req.body.customerName,
			customerEmail: req.body.customerEmail,
			customerPhone: req.user?.phoneNumber || req.body.customerPhone,
			shippingAddress: req.body.shippingAddress,
			items: validatedItems,
			status: req.body.status || 'pending',
			paymentStatus: req.body.paymentStatus || 'unpaid',
			notifyPromotions: req.body.notifyPromotions ?? false,
			deliveryType: req.body.deliveryType,
			sendDate: req.body.sendDate,
			paymentType: req.body.paymentType,
			notes: req.body.notes,
			totalAmount: calculateTotalAmount(validatedItems),
		};

		const order = await Order.create(orderPayload);
		return res.status(201).json({ data: toJson(order) });
	} catch (error) {
		logger.error('Failed to create order', { error });
		return res.status(500).json({
			message: 'Unable to create order. Please try again later.',
		});
	}
};

const getOrders = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		const orders = await Order.find(filters).sort({ createdAt: -1 });
		return res.json({ data: orders.map(toJson) });
	} catch (error) {
		logger.error('Failed to fetch orders', { error });
		return res.status(500).json({
			message: 'Unable to retrieve orders. Please try again later.',
		});
	}
};

const getOrderById = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		// If user is authenticated and not admin, check if order belongs to user
		if (req.user && req.user.role !== 'admin') {
			if (order.customerPhone !== req.user.phoneNumber) {
				return res.status(403).json({ message: 'Access denied. This order does not belong to you.' });
			}
		}

		return res.json({ data: toJson(order) });
	} catch (error) {
		logger.error('Failed to fetch order', { error });
		return res.status(500).json({
			message: 'Unable to retrieve order. Please try again later.',
		});
	}
};

const getOrderByExternalId = async (req, res) => {
	try {
		const order = await Order.findOne({ external_id: req.params.external_id });

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		// If user is authenticated and not admin, check if order belongs to user
		if (req.user && req.user.role !== 'admin') {
			if (order.customerPhone !== req.user.phoneNumber) {
				return res.status(403).json({ message: 'Access denied. This order does not belong to you.' });
			}
		}

		return res.json({ data: toJson(order) });
	} catch (error) {
		logger.error('Failed to fetch order by external_id', { error });
		return res.status(500).json({
			message: 'Unable to retrieve order. Please try again later.',
		});
	}
};

const updateOrder = async (req, res) => {
	try {
		const updatePayload = { ...req.body };

		if (req.body.items) {
			updatePayload.items = normalizeItems(req.body.items);
			updatePayload.totalAmount = calculateTotalAmount(updatePayload.items);
		}

		if (req.body.customerEmail) {
			updatePayload.customerEmail = req.body.customerEmail.toLowerCase();
		}

		const order = await Order.findByIdAndUpdate(req.params.id, updatePayload, {
			new: true,
			runValidators: true,
		});

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		return res.json({ data: toJson(order) });
	} catch (error) {
		logger.error('Failed to update order', { error });
		return res.status(500).json({
			message: 'Unable to update order. Please try again later.',
		});
	}
};

const deleteOrder = async (req, res) => {
	try {
		const order = await Order.findByIdAndDelete(req.params.id);

		if (!order) {
			return res.status(404).json({ message: 'Order not found' });
		}

		return res.status(200).json({ message: 'Order deleted successfully' });
	} catch (error) {
		logger.error('Failed to delete order', { error });
		return res.status(500).json({
			message: 'Unable to delete order. Please try again later.',
		});
	}
};

module.exports = {
	createOrder,
	getOrders,
	getOrderById,
	getOrderByExternalId,
	updateOrder,
	deleteOrder,
};

