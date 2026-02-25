const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Node Marketplace Backend API',
			version: '1.1.0',
			description:
				'Online marketplace backend with dedicated user and admin APIs. Offers OTP-based authentication, JWT-protected routes, catalog, banner, and order management.',
			contact: {
				name: 'API Support',
			},
		},
		servers: [
			{
				url: `https://api.najm.uz`,
				description: 'Development server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description:
						'Enter JWT token obtained after OTP verification. Format: `Bearer your.jwt.token`.',
				},
			},
			schemas: {
				Banner: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'Unique identifier for the banner',
						},
						title: {
							type: 'string',
							description: 'Banner title',
						},
						description: {
							type: 'string',
							description: 'Banner description',
						},
						imageUrl: {
							type: 'string',
							format: 'uri',
							description: 'URL of the banner image',
						},
						linkUrl: {
							type: 'string',
							format: 'uri',
							description: 'URL the banner links to',
						},
						isActive: {
							type: 'boolean',
							description: 'Whether the banner is currently active',
						},
						order: {
							type: 'integer',
							description: 'Display order of the banner',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				Product: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'Unique identifier for the product',
						},
						name: {
							type: 'object',
							description: 'Product name in multiple languages',
							properties: {
								en: {
									type: 'string',
									description: 'Product name in English',
									example: 'Laptop',
								},
								ru: {
									type: 'string',
									description: 'Product name in Russian',
									example: 'Ноутбук',
								},
								uz: {
									type: 'string',
									description: 'Product name in Uzbek',
									example: 'Noutbuk',
								},
							},
							required: ['en', 'ru', 'uz'],
						},
						description: {
							type: 'object',
							description: 'Product description in multiple languages',
							properties: {
								en: {
									type: 'string',
									description: 'Product description in English',
									example: 'High-performance laptop',
								},
								ru: {
									type: 'string',
									description: 'Product description in Russian',
									example: 'Высокопроизводительный ноутбук',
								},
								uz: {
									type: 'string',
									description: 'Product description in Uzbek',
									example: 'Yuqori samarali noutbuk',
								},
							},
						},
						price: {
							type: 'number',
							description: 'Product price',
						},
						imageUrl: {
							type: 'string',
							format: 'uri',
							description: 'URL of the product image',
						},
						stock: {
							type: 'integer',
							description: 'Available stock quantity',
						},
						categories: {
							type: 'array',
							items: {
								type: 'string',
							},
							description: 'Array of category IDs',
						},
						attributes: {
							type: 'object',
							additionalProperties: {
								oneOf: [
									{ type: 'string' },
									{ type: 'number' },
									{ type: 'boolean' },
								],
							},
							description: 'Product attributes that match category filters. Keys must match filter names from the product\'s categories.',
							example: {
								Brand: 'Apple',
								Color: 'Black',
								Warranty: 12,
							},
						},
						variants: {
							type: 'array',
							description: 'Product variants (e.g., different colors)',
							items: {
								type: 'object',
								properties: {
									name: {
										type: 'object',
										description: 'Variant name in multiple languages',
										properties: {
											en: {
												type: 'string',
												description: 'Variant name in English',
												example: 'Black',
											},
											ru: {
												type: 'string',
												description: 'Variant name in Russian',
												example: 'Черный',
											},
											uz: {
												type: 'string',
												description: 'Variant name in Uzbek',
												example: 'Qora',
											},
										},
									},
									color: {
										type: 'string',
										description: 'Color hex code',
										example: '#000000',
									},
									imageUrl: {
										type: 'string',
										format: 'uri',
										description: 'Variant image URL',
									},
									price: {
										type: 'number',
										minimum: 0,
										description: 'Variant price (optional, uses base price if not provided)',
									},
									stock: {
										type: 'integer',
										minimum: 0,
										description: 'Variant stock quantity',
									},
									sku: {
										type: 'string',
										description: 'Stock Keeping Unit',
									},
								},
							},
						},
						isActive: {
							type: 'boolean',
							description: 'Whether the product is currently active',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				Category: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'Unique identifier for the category',
						},
						name: {
							type: 'object',
							description: 'Category name in multiple languages',
							properties: {
								en: {
									type: 'string',
									description: 'Category name in English',
									example: 'Electronics',
								},
								ru: {
									type: 'string',
									description: 'Category name in Russian',
									example: 'Электроника',
								},
								uz: {
									type: 'string',
									description: 'Category name in Uzbek',
									example: 'Elektronika',
								},
							},
							required: ['en', 'ru', 'uz'],
						},
						slug: {
							type: 'string',
							description: 'URL-friendly category identifier',
						},
						description: {
							type: 'object',
							description: 'Category description in multiple languages',
							properties: {
								en: {
									type: 'string',
									description: 'Category description in English',
									example: 'Electronic devices and gadgets',
								},
								ru: {
									type: 'string',
									description: 'Category description in Russian',
									example: 'Электронные устройства и гаджеты',
								},
								uz: {
									type: 'string',
									description: 'Category description in Uzbek',
									example: 'Elektron qurilmalar va gadjetlar',
								},
							},
						},
						filters: {
							type: 'array',
							description: 'Dynamic filters for products in this category',
							items: {
								type: 'object',
								properties: {
									name: {
										type: 'object',
										description: 'Filter name in multiple languages (must be unique within category)',
										properties: {
											en: {
												type: 'string',
												description: 'Filter name in English',
												example: 'Brand',
											},
											ru: {
												type: 'string',
												description: 'Filter name in Russian',
												example: 'Бренд',
											},
											uz: {
												type: 'string',
												description: 'Filter name in Uzbek',
												example: 'Brend',
											},
										},
										required: ['en', 'ru', 'uz'],
									},
									type: {
										type: 'string',
										enum: ['string', 'number', 'boolean', 'select'],
										description: 'Filter type',
										example: 'select',
									},
									options: {
										type: 'array',
										description: 'Available options for select type filters (required for select type)',
										items: {
											type: 'object',
											properties: {
												name: {
													type: 'object',
													description: 'Option name in multiple languages',
													properties: {
														en: {
															type: 'string',
															description: 'Option name in English',
															example: 'Samsung',
														},
														ru: {
															type: 'string',
															description: 'Option name in Russian',
															example: 'Самсунг',
														},
														uz: {
															type: 'string',
															description: 'Option name in Uzbek',
															example: 'Samsung',
														},
													},
													required: ['en', 'ru', 'uz'],
												},
												color: {
													type: 'string',
													description: 'Option color (hex code or color name)',
													example: '#FF0000',
												},
												photo_url: {
													type: 'string',
													format: 'uri',
													description: 'URL of the option photo/image',
													example: 'https://example.com/samsung.jpg',
												},
											},
											required: ['name'],
										},
										example: [
											{
												name: {
													en: 'Samsung',
													ru: 'Самсунг',
													uz: 'Samsung',
												},
												color: '#000000',
												photo_url: 'https://example.com/samsung.jpg',
											},
											{
												name: {
													en: 'Apple',
													ru: 'Эпл',
													uz: 'Apple',
												},
												color: '#FFFFFF',
												photo_url: 'https://example.com/apple.jpg',
											},
										],
									},
									required: {
										type: 'boolean',
										description: 'Whether this filter is required for products in this category',
										example: true,
									},
								},
								required: ['name', 'type'],
							},
							example: [
								{
									name: {
										en: 'Brand',
										ru: 'Бренд',
										uz: 'Brend',
									},
									type: 'select',
									options: [
										{
											name: {
												en: 'Samsung',
												ru: 'Самсунг',
												uz: 'Samsung',
											},
											color: '#000000',
											photo_url: 'https://example.com/samsung.jpg',
										},
										{
											name: {
												en: 'Apple',
												ru: 'Эпл',
												uz: 'Apple',
											},
											color: '#FFFFFF',
											photo_url: 'https://example.com/apple.jpg',
										},
									],
									required: true,
								},
								{
									name: {
										en: 'Color',
										ru: 'Цвет',
										uz: 'Rang',
									},
									type: 'select',
									options: [
										{
											name: {
												en: 'Black',
												ru: 'Чёрный',
												uz: 'Qora',
											},
											color: '#000000',
											photo_url: 'https://example.com/black.jpg',
										},
										{
											name: {
												en: 'White',
												ru: 'Белый',
												uz: 'Oq',
											},
											color: '#FFFFFF',
											photo_url: 'https://example.com/white.jpg',
										},
									],
									required: false,
								},
							],
						},
						isActive: {
							type: 'boolean',
							description: 'Whether the category is currently active',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
						},
					},
				},
				User: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'Unique identifier for the user',
						},
						phoneNumber: {
							type: 'string',
							description: 'User phone number in E.164 format',
						},
						name: {
							type: 'string',
							description: 'User name',
						},
						birthday: {
							type: 'string',
							format: 'date',
							description: 'User birthday',
						},
						email: {
							type: 'string',
							format: 'email',
							description: 'User email address',
						},
						address: {
							type: 'string',
							description: 'User address',
						},
						role: {
							type: 'string',
							enum: ['user', 'admin'],
							description: 'User role',
						},
						isActive: {
							type: 'boolean',
							description: 'Whether the user account is active',
						},
						meta: {
							type: 'object',
							description: 'Additional metadata',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
							description: 'User creation timestamp',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
							description: 'User last update timestamp',
						},
					},
				},
				Order: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							description: 'Unique identifier for the order',
						},
						customerName: {
							type: 'string',
							description: 'Customer name',
						},
						customerEmail: {
							type: 'string',
							format: 'email',
							description: 'Customer email address',
						},
						customerPhone: {
							type: 'string',
							description: 'Customer phone number',
						},
						shippingAddress: {
							type: 'string',
							description: 'Shipping address',
						},
						items: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									productId: {
										type: 'string',
										description: 'Product ID',
									},
									variantIndex: {
										type: 'integer',
										minimum: 0,
										description: 'Index of the selected variant in product.variants array (optional, for products with variants)',
									},
									name: {
										type: 'string',
										description: 'Product name',
									},
									quantity: {
										type: 'integer',
										minimum: 1,
										description: 'Quantity of the product',
									},
									unitPrice: {
										type: 'number',
										minimum: 0,
										description: 'Unit price of the product',
									},
									totalPrice: {
										type: 'number',
										minimum: 0,
										description: 'Total price for this item',
									},
									isFavourite: {
										type: 'boolean',
										description: 'Whether this product is marked as favourite by the user',
									},
									imageUrl: {
										type: 'string',
										format: 'uri',
										description: 'Product or variant image URL',
									},
								},
							},
							description: 'Order items',
						},
						totalAmount: {
							type: 'number',
							minimum: 0,
							description: 'Total order amount',
						},
						status: {
							type: 'string',
							enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
							description: 'Order status',
						},
						paymentStatus: {
							type: 'string',
							enum: ['unpaid', 'paid', 'refunded'],
							description: 'Payment status',
						},
						notes: {
							type: 'string',
							description: 'Additional order notes',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
							description: 'Order creation timestamp',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
							description: 'Order last update timestamp',
						},
					},
				},
				Error: {
					type: 'object',
					properties: {
						message: {
							type: 'string',
							description: 'Error message',
						},
						errors: {
							type: 'array',
							items: {
								type: 'object',
							},
							description: 'Detailed error information',
						},
					},
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	apis: ['./routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

