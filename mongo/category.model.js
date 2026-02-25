const { Schema, model } = require('mongoose');

const optionSchema = new Schema(
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
		color: {
			type: String,
			trim: true,
		},
		photo_url: {
			type: String,
			trim: true,
		},
	},
	{ _id: false }
);

const filterSchema = new Schema(
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
		type: {
			type: String,
			enum: ['string', 'number', 'boolean', 'select'],
			required: true,
			default: 'string',
		},
		options: {
			type: [optionSchema],
			default: [],
		},
		required: {
			type: Boolean,
			default: false,
		},
	},
	{ _id: false }
);

const categorySchema = new Schema(
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
			trim: true,
			lowercase: true,
			unique: true,
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
		filters: {
			type: [filterSchema],
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

categorySchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret._id;
		return ret;
	},
});

module.exports = model('Category', categorySchema);

