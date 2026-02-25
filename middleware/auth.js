const typedefs = require('../typedefs');
const logger = require('../utils/logger')(module);
const { verifyJWT } = require('../utils/token');
const User = require('../mongo/user.model');

/**
 * Middleware to verify JWT token and authenticate user 🔐
 * @param {typedefs.Req} req - The request object from the client
 * @param {typedefs.Res} res - The response object to send back to the client
 * @param {typedefs.Next} next - The function to call the next middleware
 */
const authenticate = async (req, res, next) => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				message: 'Authentication required. Please provide a valid token.',
			});
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// Verify the token
		const decoded = verifyJWT(token);

		// Load user from database
		const user = await User.findOne({ phoneNumber: decoded.id });

		if (!user) {
			return res.status(401).json({
				message: 'User not found. Please register again.',
			});
		}

		if (!user.isActive) {
			return res.status(403).json({
				message: 'Account is inactive. Please contact support.',
			});
		}

		// Attach user info to request object
		req.user = {
			phoneNumber: user.phoneNumber,
			id: user._id.toString(),
			role: user.role,
			user: user,
		};

		next();
	} catch (error) {
		logger.error('Authentication failed', { error });
		return res.status(401).json({
			message: 'Invalid or expired token. Please login again.',
		});
	}
};

/**
 * Middleware to check if user is admin
 * Note: This is a simple check. In production, you should store user roles in database
 * @param {typedefs.Req} req - The request object from the client
 * @param {typedefs.Res} res - The response object to send back to the client
 * @param {typedefs.Next} next - The function to call the next middleware
 */
const isAdmin = async (req, res, next) => {
	try {
		// First authenticate the user
		if (!req.user) {
			return res.status(401).json({
				message: 'Authentication required.',
			});
		}

		// Check if user is admin from database
		if (req.user.role !== 'admin') {
			// Fallback: Check if user phone number is in admin list (for backward compatibility)
			const adminCreds = process.env.ADMIN_CREDS
				? JSON.parse(process.env.ADMIN_CREDS)
				: {};

			const isAdminUser = Object.keys(adminCreds).some(
				(adminPhone) => adminPhone === req.user.phoneNumber
			);

			if (!isAdminUser) {
				return res.status(403).json({
					message: 'Access denied. Admin privileges required.',
				});
			}
		}

		next();
	} catch (error) {
		logger.error('Admin check failed', { error });
		return res.status(500).json({
			message: 'Server error while checking admin access.',
		});
	}
};

/**
 * Optional authentication middleware - doesn't fail if token is missing
 * Sets req.user if token is valid, otherwise continues without setting req.user
 * @param {typedefs.Req} req - The request object from the client
 * @param {typedefs.Res} res - The response object to send back to the client
 * @param {typedefs.Next} next - The function to call the next middleware
 */
const optionalAuthenticate = async (req, res, next) => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			// No token provided, continue without authentication
			return next();
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix

		// Verify the token
		const decoded = verifyJWT(token);

		// Load user from database
		const user = await User.findOne({ phoneNumber: decoded.id });

		if (user && user.isActive) {
			// Attach user info to request object if user exists and is active
			req.user = {
				phoneNumber: user.phoneNumber,
				id: user._id.toString(),
				role: user.role,
				user: user,
			};
		}

		next();
	} catch (error) {
		// If token is invalid, just continue without setting req.user
		logger.warn('Optional authentication failed, continuing without user', { error });
		next();
	}
};

module.exports = {
	authenticate,
	isAdmin,
	optionalAuthenticate,
};

