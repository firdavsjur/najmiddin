const { Schema, model } = require('mongoose');

const otpSchema = new Schema(
	{
		phoneNumber: {
			type: String,
			required: true,
			index: true,
			unique: true,
		},
		otpHash: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		lastSentAt: {
			type: Date,
			required: true,
		},
		attempts: {
			type: Number,
			default: 0,
			min: 0,
		},
		meta: {
			type: Schema.Types.Mixed,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.set('toJSON', {
	transform(_doc, ret) {
		ret.id = ret._id.toString();
		delete ret._id;
		delete ret.otpHash;
		return ret;
	},
});

module.exports = model('OtpRequest', otpSchema);

