const Banner = require('../mongo/banner.model');
const logger = require('../utils/logger')(module);

const toJson = (banner) => (banner ? banner.toJSON() : null);

const parseListFilters = (query) => {
	const filters = {};

	if (typeof query.isActive === 'boolean') {
		filters.isActive = query.isActive;
	}

	return filters;
};

const createBanner = async (req, res) => {
	try {
		const banner = await Banner.create(req.body);
		return res.status(201).json({ data: toJson(banner) });
	} catch (error) {
		logger.error('Failed to create banner', { error });
		return res.status(500).json({
			message: 'Unable to create banner. Please try again later.',
		});
	}
};

const getBanners = async (req, res) => {
	try {
		const filters = parseListFilters(req.query);
		const banners = await Banner.find(filters).sort({ order: 1, createdAt: -1 });
		return res.json({ data: banners.map(toJson) });
	} catch (error) {
		logger.error('Failed to fetch banners', { error });
		return res.status(500).json({
			message: 'Unable to retrieve banners. Please try again later.',
		});
	}
};

const getBannerById = async (req, res) => {
	try {
		const banner = await Banner.findById(req.params.id);

		if (!banner) {
			return res.status(404).json({ message: 'Banner not found' });
		}

		return res.json({ data: toJson(banner) });
	} catch (error) {
		logger.error('Failed to fetch banner', { error });
		return res.status(500).json({
			message: 'Unable to retrieve banner. Please try again later.',
		});
	}
};

const updateBanner = async (req, res) => {
	try {
		const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!banner) {
			return res.status(404).json({ message: 'Banner not found' });
		}

		return res.json({ data: toJson(banner) });
	} catch (error) {
		logger.error('Failed to update banner', { error });
		return res.status(500).json({
			message: 'Unable to update banner. Please try again later.',
		});
	}
};

const deleteBanner = async (req, res) => {
	try {
		const banner = await Banner.findByIdAndDelete(req.params.id);

		if (!banner) {
			return res.status(404).json({ message: 'Banner not found' });
		}

		return res.status(200).json({ message: 'Banner deleted successfully' });
	} catch (error) {
		logger.error('Failed to delete banner', { error });
		return res.status(500).json({
			message: 'Unable to delete banner. Please try again later.',
		});
	}
};

module.exports = {
	createBanner,
	getBanners,
	getBannerById,
	updateBanner,
	deleteBanner,
};

