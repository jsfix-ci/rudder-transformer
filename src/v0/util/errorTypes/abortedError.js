const tags = require("../tags");
const { BaseError } = require("./base");

class AbortedError extends BaseError {
  constructor(message, statusCode = 400, destResponse, authErrCategory) {
    const finalStatTags = {
      [tags.TAG_NAMES.ERROR_CATEGORY]: tags.ERROR_CATEGORIES.NETWORK,
      [tags.TAG_NAMES.ERROR_TYPE]: tags.ERROR_TYPES.ABORTED
    };

    super(message, statusCode, finalStatTags, destResponse, authErrCategory);
  }
}

module.exports = AbortedError;
