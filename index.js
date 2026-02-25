// Load environment variables from a .env file
require('dotenv-flow').config();

// Import the Express.js framework to create a web server
const express = require('express');
const app = express();

// Import middleware for security and logging
const cors = require('cors'); // Allows cross-origin requests
const helmet = require('helmet'); // Adds security headers
const swaggerUi = require('swagger-ui-express'); // Swagger UI for API documentation
const swaggerSpec = require('./config/swagger'); // Swagger configuration
const logger = require('./utils/logger')(module); // Custom logging utility
const { connectMongo, disconnectMongo } = require('./config/mongoose');
const { initializeBuckets } = require('./config/minio');
// Admin routes
const adminProductRoutes = require('./routes/admin/products');
const adminOrderRoutes = require('./routes/admin/orders');
const adminCategoryRoutes = require('./routes/admin/categories');
const adminBannerRoutes = require('./routes/admin/banners');
const adminUserRoutes = require('./routes/admin/users');
const adminUploadRoutes = require('./routes/admin/uploads');

// User/Public routes
const userProductRoutes = require('./routes/user/products');
const userOrderRoutes = require('./routes/user/orders');
const userCategoryRoutes = require('./routes/user/categories');
const userBannerRoutes = require('./routes/user/banners');
const userUserRoutes = require('./routes/user/users');
const userSavedProductRoutes = require('./routes/user/saved-products');

// Auth routes
const authRoutes = require('./routes/auth');

// Configure Express to parse JSON and URL-encoded data
app.use(express.json()); // Automatically parses JSON data
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// Enable Cross-Origin Resource Sharing (CORS) for handling requests from different domains
app.use(cors());

// Use Helmet to set various HTTP headers for security
app.use(helmet());

// Disable the "X-Powered-By" header to prevent disclosing server technology
app.disable('x-powered-by');

// Swagger API documentation (spec is built at startup from route JSDoc — no external url, so server always shows current code)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
	explorer: true,
}));

// Public/User routes (no authentication required for viewing)
app.use('/api/user/products', userProductRoutes);
app.use('/api/user/categories', userCategoryRoutes);
app.use('/api/user/banners', userBannerRoutes);

// Authenticated User routes
app.use('/api/user/orders', userOrderRoutes);
app.use('/api/user/users', userUserRoutes);
app.use('/api/user/saved-products', userSavedProductRoutes);

// Admin routes (require authentication + admin role)
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/uploads', adminUploadRoutes);

// Auth routes (OTP authentication)
app.use('/api/auth', authRoutes);

app.get('/health', async (req, res) => {
	try {
		// ping mongodb
		const mongoose = require('mongoose');
		await mongoose.connection.db.command({ ping: 1 });
		res.json({ ok: true });
	} catch (err) {
		res.status(503).json({ ok: false });
	}
});

// Catch-all route for unhandled requests, responds with a simple message
// app.use((_req, res) => {
// 	return res.status(200).send('Back-end for');
// });

// Get the port number from environment variables or default to 5000
const port = process.env.PORT || 5001;

const startServer = async () => {
	try {
		await connectMongo();
		
		// Initialize MinIO buckets
		try {
			await initializeBuckets();
			logger.info('MinIO buckets initialized successfully');
		} catch (minioError) {
			logger.warn('Failed to initialize MinIO buckets. File uploads may not work.', { minioError });
		}

		const server = app.listen(port, () => {
			logger.info(`App Listening on port ${port}`);
		});
		console.log(`App Listening on port ${port}`);

		const shutdown = async (signal) => {
			logger.warn(`${signal} received. Shutting down gracefully.`);

			server.close(async (error) => {
				if (error) {
					logger.error('Error while closing HTTP server', { error });
					process.exitCode = 1;
				}

				await disconnectMongo();
				process.exit();
			});
		};

		['SIGTERM', 'SIGINT'].forEach((signal) => {
			process.once(signal, () => {
				shutdown(signal);
			});
		});

		process.on('unhandledRejection', (reason) => {
			logger.error('Unhandled promise rejection', { error: reason });
		});

		process.on('uncaughtException', (error) => {
			logger.error('Uncaught exception encountered', { 
				error: {
					message: error.message,
					stack: error.stack,
					name: error.name
				}
			});
			console.error('Uncaught Exception:', error);
		});
	} catch (error) {
		logger.error('Failed to start application', { error });
		process.exit(1);
	}
};

startServer();
