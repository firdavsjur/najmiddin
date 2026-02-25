const fetch = require('cross-fetch');
const logger = require('./logger')(module);

/**
 * Send SMS via the PlayMobile API.
 * Mirrors the Go implementation: builds the request body, applies basic auth,
 * and fails fast on network/HTTP errors.
 *
 * @param {object} params
 * @param {string} params.text - SMS text content.
 * @param {string} params.phoneNumber - Recipient phone number.
 * @param {string} [params.id] - Optional message id.
 * @param {string} [params.login=process.env.PLAYMOBILE_LOGIN] - PlayMobile username.
 * @param {string} [params.password=process.env.PLAYMOBILE_PASSWORD] - PlayMobile password.
 * @param {string} [params.nickname] - Overrides originator when provided.
 * @param {string} [params.playMobileUrl=process.env.PLAYMOBILE_URL] - Endpoint URL.
 * @param {string} [params.playMobileOriginator=process.env.PLAYMOBILE_ORIGINATOR] - Default originator.
 * @returns {Promise<boolean>} Resolves true when the SMS is accepted by PlayMobile.
 */
async function sendWithPlayMobile({
	text,
	phoneNumber,
	id,
	login = process.env.PLAYMOBILE_LOGIN,
	password = process.env.PLAYMOBILE_PASSWORD,
	playMobileUrl = process.env.PLAYMOBILE_URL,
	playMobileOriginator = process.env.PLAYMOBILE_ORIGINATOR,
}) {
	logger.info(`sendWithPlayMobile => ${phoneNumber}`);

	if (!playMobileUrl) {
		throw new Error('PlayMobile URL is not configured');
	}

	if (!login || !password) {
		throw new Error('PlayMobile credentials are not configured');
	}
	if (!phoneNumber) {
		throw new Error('Recipient phone number is required');
	}

	if (!text) {
		throw new Error('SMS text is required');
	}

	const originator = playMobileOriginator;

	const body = {
		messages: [
			{
				'recipient': phoneNumber,
				'message-id': id,
				'sms': {
					'originator': originator,
					'content': { 'text': text },
				},
			},
		],
	};

	console.log(`body: `,JSON.stringify(body))
	let response;
	try {
		response = await fetch(playMobileUrl, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
        console.log(`response: ${response}`);
	} catch (err) {
		logger.error('error while sending request to PlayMobile', { err });
		throw err;
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		logger.error('PlayMobile responded with an error', {
			status: response.status,
			body: errorText,
		});
		throw new Error(`error while sending sms: ${response.status}`);
	}


	return true;
}

module.exports = {
	sendWithPlayMobile,
};

