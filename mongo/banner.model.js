const { Schema, model } = require('mongoose');

const bannerSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		imageUrl: {
			type: String,
			required: true,
			trim: true,
		},
		linkUrl: {
			type: String,
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		order: {
			type: Number,
			default: 0,
			min: 0,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

bannerSchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret._id;
		return ret;
	},
});

module.exports = model('Banner', bannerSchema);

