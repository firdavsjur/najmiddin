const express = require('express');
const router = express.Router();

const { getCurrentUser, updateCurrentUser } = require('../../controllers/userController');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../validators');
const { updateCurrentUserRules } = require('../../validators/userValidators');

/**
 * @swagger
 * /api/user/users/me:
 *   get:
 *     summary: Get current user's profile (Authenticated User)
 *     description: Returns the authenticated user's profile information
 *     tags: [User - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User profile retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @swagger
 * /api/user/users/me:
 *   put:
 *     summary: Update current user's profile (Authenticated User)
 *     description: Update only name and birthday fields. Other fields are ignored.
 *     tags: [User - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name
 *                 example: "John Doe"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: User birthday in ISO 8601 format
 *                 example: "1990-01-15"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/me', authenticate, updateCurrentUserRules, validate, updateCurrentUser);

module.exports = router;

