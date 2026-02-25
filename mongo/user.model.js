const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		phoneNumber: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		name: {
			type: String,
			trim: true,
		},
		birthday: {
			type: Date,
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
		},
		address: {
			type: String,
			trim: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		meta: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

