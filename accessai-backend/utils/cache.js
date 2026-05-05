/**
 * FILE: utils/cache.js
 * 1. WHAT: node-cache setup.
 * 2. WHY: Cache AI responses to save costs.
 * 3. HOW: Used in aiController.js.
 */
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 });
module.exports = cache;
