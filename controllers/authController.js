const OtpRequest = require('../mongo/otp.model');
const User = require('../mongo/user.model');
const logger = require('../utils/logger')(module);
const {
	getConfig,
	generateNumericOtp,
	hashOtp,
	isResendAllowed,
} = require('../utils/otp');
const { sendWithPlayMobile } = require('../utils/sms');
const { getJWT } = require('../utils/token');

const normalizePhoneNumber = (phoneNumber) =>
	phoneNumber.trim().replace(/\s+/g, '').replace(/-/g, '');

const sendOtp = async (req, res) => {
	const config = getConfig();
	const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);

	try {
		const existingRequest = await OtpRequest.findOne({ phoneNumber: normalizedPhone });

		if (
			existingRequest &&
			!isResendAllowed(existingRequest.lastSentAt, config.resendIntervalSeconds)
		) {
			const retryAfter =
				config.resendIntervalSeconds -
				Math.floor((Date.now() - existingRequest.lastSentAt.getTime()) / 1000);
			return res.status(429).json({
				message: `OTP already sent. Please wait ${Math.max(retryAfter, 0)} seconds before requesting again.`,
			});
		}

		const otp = generateNumericOtp(config.length);
		const otpHash = hashOtp(otp, normalizedPhone);
		const now = new Date();
		const expiresAt = new Date(now.getTime() + config.expiryMinutes * 60 * 1000);

		// Check if user exists in database
		const userExists = await User.findOne({ phoneNumber: normalizedPhone });

		await OtpRequest.findOneAndUpdate(
			{ phoneNumber: normalizedPhone },
			{
				otpHash,
				expiresAt,
				lastSentAt: now,
				attempts: 0,
				meta: req.body.meta || {},
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		logger.info(`Generated OTP for phoneNumber=${normalizedPhone}`, {
			phoneNumber: normalizedPhone,
			otp,
			userExists: !!userExists,
		});

		try {

			const text = `Код для авторизации на сайте najm.uz - ${otp}`;
			await sendWithPlayMobile({
				text,
				phoneNumber: normalizeforPaymobile(normalizedPhone),
				id: `otp-${Date.now()}`,
			});
		} catch (smsError) {
			logger.error('Failed to send OTP via SMS', { smsError, phoneNumber: normalizedPhone });
			return res.status(500).json({
				message: 'Failed to send OTP. Please try again later.',
			});
		}

		return res.status(200).json({
			message: 'OTP sent successfully',
			userExists: !!userExists,
			meta: {
				expiresInMinutes: config.expiryMinutes,
				resendIntervalSeconds: config.resendIntervalSeconds,
			},
		});
	} catch (error) {
		logger.error('Failed to process OTP send request', { error });
		return res.status(500).json({
			message: 'Unable to process OTP request. Please try again later.',
		});
	}
};

const verifyOtp = async (req, res) => {
	const config = getConfig();
	const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);
	const providedOtp = req.body.otp;

	try {
		const otpRecord = await OtpRequest.findOne({ phoneNumber: normalizedPhone });

		if (!otpRecord) {
			return res.status(400).json({ message: 'OTP not found or already verified' });
		}

		if (otpRecord.expiresAt.getTime() < Date.now()) {
			await OtpRequest.deleteOne({ _id: otpRecord._id });
			return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
		}

		if (otpRecord.attempts >= config.maxAttempts) {
			await OtpRequest.deleteOne({ _id: otpRecord._id });
			return res
				.status(429)
				.json({ message: 'Maximum verification attempts exceeded. Please request a new OTP.' });
		}

		const otpHash = hashOtp(providedOtp, normalizedPhone);

		if (otpHash !== otpRecord.otpHash) {
			otpRecord.attempts += 1;
			await otpRecord.save();

			const attemptsLeft = config.maxAttempts - otpRecord.attempts;

			return res.status(400).json({
				message:
					attemptsLeft > 0
						? `Invalid OTP. You have ${attemptsLeft} attempt(s) remaining.`
						: 'Invalid OTP. Maximum attempts reached. Please request a new code.',
			});
		}

		await OtpRequest.deleteOne({ _id: otpRecord._id });

		// Create or update user profile
		let user = await User.findOne({ phoneNumber: normalizedPhone });
		
		if (!user) {
			// Create new user with name and birthday if provided
			const userData = {
				phoneNumber: normalizedPhone,
				role: 'user',
			};
			
			// Add name and birthday if provided in request body
			if (req.body.name) {
				userData.name = req.body.name.trim();
			}
			if (req.body.birthday) {
				userData.birthday = new Date(req.body.birthday);
			}
			
			user = await User.create(userData);
			logger.info(`New user created: ${normalizedPhone}`);
		} else {
			// Update existing user with name and birthday if provided
			const updateData = {};
			if (req.body.name) {
				updateData.name = req.body.name.trim();
			}
			if (req.body.birthday) {
				updateData.birthday = new Date(req.body.birthday);
			}
			
			if (Object.keys(updateData).length > 0) {
				user = await User.findByIdAndUpdate(user._id, updateData, { new: true });
				logger.info(`User profile updated: ${normalizedPhone}`);
			}
		}

		// Generate JWT token with phone number as payload
		const jwtToken = getJWT(normalizedPhone);

		return res.status(200).json({
			message: 'OTP verified successfully',
			data: {
				phoneNumber: normalizedPhone,
				token: jwtToken,
				meta: otpRecord.meta || {},
			},
		});
	} catch (error) {
		logger.error('Failed to verify OTP', { error });
		return res.status(500).json({
			message: 'Unable to verify OTP. Please try again later.',
		});
	}
};

module.exports = {
	sendOtp,
	verifyOtp,
};


function normalizeforPaymobile(phoneNumber) {
	return phoneNumber.replace('+', '');
}