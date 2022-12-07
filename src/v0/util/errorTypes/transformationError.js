const tags = require("../tags");
const { BaseError } = require("./base");

class TransformationError extends BaseError {
  constructor(message, statusCode = 400, destResponse, authErrCategory) {
    const finalStatTags = {
      [tags.TAG_NAMES.ERROR_CATEGORY]: tags.ERROR_CATEGORIES.TRANSFORMATION
    };

    super(message, statusCode, finalStatTags, destResponse, authErrCategory);
  }
}

module.exports = TransformationError;
