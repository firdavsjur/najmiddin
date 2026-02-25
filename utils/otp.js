const crypto = require('crypto');

const DEFAULT_OTP_LENGTH = 4;
const DEFAULT_EXPIRY_MINUTES = 5;
const DEFAULT_RESEND_INTERVAL_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 5;

const getConfig = () => ({
	length: Number(process.env.OTP_LENGTH) || DEFAULT_OTP_LENGTH,
	expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || DEFAULT_EXPIRY_MINUTES,
	resendIntervalSeconds:
		Number(process.env.OTP_RESEND_INTERVAL_SECONDS) || DEFAULT_RESEND_INTERVAL_SECONDS,
	maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || DEFAULT_MAX_ATTEMPTS,
});

const generateNumericOtp = (length) => {
	const max = 10 ** length;
	const otp = Math.floor(Math.random() * max)
		.toString()
		.padStart(length, '0');
	return otp;
};

const hashOtp = (otp, salt = '') => {
	return crypto.createHash('sha256').update(`${otp}${salt}`).digest('hex');
};

const isResendAllowed = (lastSentAt, intervalSeconds) => {
	if (!lastSentAt) {
		return true;
	}

	const now = Date.now();
	const elapsed = (now - new Date(lastSentAt).getTime()) / 1000;
	return elapsed >= intervalSeconds;
};

module.exports = {
	getConfig,
	generateNumericOtp,
	hashOtp,
	isResendAllowed,
};

