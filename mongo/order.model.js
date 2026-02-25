const { Schema, model, Types } = require('mongoose');

const orderItemSchema = new Schema(
	{
		productId: {
			type: Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		variantIndex: {
			type: Number,
			min: 0,
			description: 'Index of the selected variant in product.variants array (optional, for products with variants)',
		},
		name: {
			type: String,
			trim: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		unitPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},
		isFavourite: {
			type: Boolean,
			default: false,
		},
		imageUrl: {
			type: String,
			trim: true,
			description: 'Product or variant image URL',
		},
	},
	{ _id: false }
);

const orderSchema = new Schema(
	{
		external_id: {
			type: String,
			required: true,
			unique: true,
		},
		customerName: {
			type: String,
			required: true,
			trim: true,
		},
		customerEmail: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		customerPhone: {
			type: String,
			required: true,
			trim: true,
		},
		notifyPromotions: {
			// Оповещать о новых скидках, акциях и распродажах
			type: Boolean,
			default: false,
		},
		deliveryType: {
			// Самовывоз, Доставка курьером, BTS
			type: String,
			enum: ['pickup', 'courier', 'bts'],
			required: true,
		},
		sendDate: {
			// дата отправки
			type: Date,
			required: false,
		},
		paymentType: {
			type: String,
			enum: ['cash', 'card'],
			required: true,
		},
		shippingAddress: {
			type: String,
			required: true,
			trim: true,
		},
		items: {
			type: [orderItemSchema],
			validate: [(arr) => arr.length > 0, 'Order must contain at least one item'],
		},
		status: {
			type: String,
			enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
			default: 'pending',
		},
		paymentStatus: {
			type: String,
			enum: ['unpaid', 'paid', 'refunded'],
			default: 'unpaid',
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		notes: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Generate 6-digit random external_id if not set
orderSchema.pre('validate', async function (next) {
	if (this.external_id) {
		return next();
	}

	try {
		let id;
		let exists = true;

		while (exists) {
			id = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
			// Check uniqueness
			// eslint-disable-next-line no-await-in-loop
			exists = await this.constructor.exists({ external_id: id });
		}

		this.external_id = id;
		return next();
	} catch (err) {
		return next(err);
	}
});

orderSchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret._id;
		return ret;
	},
});

module.exports = model('Order', orderSchema);

