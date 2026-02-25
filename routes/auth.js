const express = require('express');
const router = express.Router();

const { sendOtp, verifyOtp } = require('../controllers/authController');
const { validate } = require('../validators');
const { sendOtpRules, verifyOtpRules } = require('../validators/authValidators');
const { registerUserRules } = require('../validators/userValidators');

/**
 * @swagger
 * /api/auth/otp/send:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +1234567890)
 *                 example: "+1234567890"
 *               meta:
 *                 type: object
 *                 description: Optional metadata to store with the OTP request
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 userExists:
 *                   type: boolean
 *                   description: Whether the user already exists in the database
 *                   example: true
 *                 meta:
 *                   type: object
 *                   properties:
 *                     expiresInMinutes:
 *                       type: integer
 *                     resendIntervalSeconds:
 *                       type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests - resend cooldown active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/otp/send', sendOtpRules, validate, sendOtp);

/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +1234567890)
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 description: n-digit OTP code
 *                 example: "n"
 *               name:
 *                 type: string
 *                 description: User name (optional, for registration)
 *                 example: "John Doe"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 description: User birthday in ISO 8601 format (optional, for registration)
 *                 example: "1990-01-15"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                     token:
 *                       type: string
 *                       description: Session token (placeholder for JWT integration)
 *                     meta:
 *                       type: object
 *       400:
 *         description: Invalid OTP or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Maximum verification attempts exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/otp/verify', verifyOtpRules, registerUserRules, validate, verifyOtp);

module.exports = router;

