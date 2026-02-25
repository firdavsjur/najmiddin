const mongoose = require('mongoose');
const logger = require('../utils/logger')(module);

const parseInteger = (value, fallback) => {
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

const getConnectionOptions = () => {
	const options = {
		maxPoolSize: parseInteger(process.env.MONGO_MAX_POOL_SIZE, 10),
		serverSelectionTimeoutMS: parseInteger(
			process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
			5000
		),
	};

	if (process.env.MONGO_DB_NAME) {
		options.dbName = process.env.MONGO_DB_NAME;
	}

	return options;
};

let isEventHandlersAttached = false;

const attachConnectionLogging = () => {
	if (isEventHandlersAttached) {
		return;
	}

	isEventHandlersAttached = true;

	mongoose.connection.on('connected', () => {
		logger.info('MongoDB connection established');
	});

	mongoose.connection.on('error', (error) => {
		logger.error('MongoDB connection error', { error });
	});

	mongoose.connection.on('disconnected', () => {
		logger.warn('MongoDB connection lost');
	});
};

/**
 * Connect to MongoDB using mongoose.
 * Resolves immediately if a connection is already established or in progress.
 * @returns {Promise<mongoose.Connection | null>}
 */
const connectMongo = async () => {
	const { readyState } = mongoose.connection;
	if (readyState === 1 || readyState === 2) {
		return mongoose.connection;
	}

	const mongoUri = process.env.MONGO_URI;

	if (!mongoUri) {
		logger.warn(
			'MONGO_URI is not defined. Skipping MongoDB connection. Set the variable to enable MongoDB.'
		);
		return null;
	}

	try {
		attachConnectionLogging();
		await mongoose.connect(mongoUri, getConnectionOptions());
		return mongoose.connection;
	} catch (error) {
		logger.error('Failed to connect to MongoDB', { error });
		throw error;
	}
};

/**
 * Gracefully close the MongoDB connection
 * @returns {Promise<void>}
 */
const disconnectMongo = async () => {
	if (mongoose.connection.readyState === 0) {
		return;
	}

	try {
		await mongoose.disconnect();
		logger.info('MongoDB connection closed');
	} catch (error) {
		logger.error('Error while closing MongoDB connection', { error });
	}
};

module.exports = {
	connectMongo,
	disconnectMongo,
};

