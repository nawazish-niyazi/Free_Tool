const UsageLog = require('../models/UsageLog');

/**
 * Logs a platform event for admin analytics
 * @param {string} event - The type of event (e.g., 'QR_GENERATE')
 * @param {object} metadata - Extra info (optional)
 * @param {string} userId - User ID who triggered it (optional)
 */
const logEvent = async (event, metadata = {}, userId = null) => {
    try {
        await UsageLog.create({
            event,
            metadata,
            userId
        });
    } catch (err) {
        console.error('Logging Error:', err);
    }
};

module.exports = logEvent;
