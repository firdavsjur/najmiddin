const { Schema, model } = require('mongoose');

const savedProductSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
			index: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Ensure unique combination of user and product
savedProductSchema.index({ userId: 1, productId: 1 }, { unique: true });

savedProductSchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret._id;
		return ret;
	},
});

module.exports = model('SavedProduct', savedProductSchema);

