const { Schema, model } = require('mongoose');

const productSchema = new Schema(
	{
		name: {
			en: {
				type: String,
				required: true,
				trim: true,
			},
			ru: {
				type: String,
				required: true,
				trim: true,
			},
			uz: {
				type: String,
				required: true,
				trim: true,
			},
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		description: {
			en: {
				type: String,
				trim: true,
			},
			ru: {
				type: String,
				trim: true,
			},
			uz: {
				type: String,
				trim: true,
			},
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		imageUrl: {
			type: String,
			trim: true,
		},
		stock: {
			type: Number,
			default: 0,
			min: 0,
		},
		categories: {
			type: [String],
			default: [],
		},
		attributes: {
			type: Schema.Types.Mixed,
			default: {},
		},
		variants: {
			type: [
				{
					name: {
						en: {
							type: String,
							trim: true,
						},
						ru: {
							type: String,
							trim: true,
						},
						uz: {
							type: String,
							trim: true,
						},
					},
					color: {
						type: String,
						trim: true,
						description: 'Color hex code (e.g., #FF0000)',
					},
					imageUrl: {
						type: String,
						trim: true,
					},
					price: {
						type: Number,
						min: 0,
						description: 'Variant price (optional, uses base price if not provided)',
					},
					stock: {
						type: Number,
						default: 0,
						min: 0,
					},
					sku: {
						type: String,
						trim: true,
						description: 'Stock Keeping Unit (optional)',
					},
				},
			],
			default: [],
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

productSchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret.__v;
		delete ret._id;
		return ret;
	},
});

module.exports = model('Product', productSchema);

