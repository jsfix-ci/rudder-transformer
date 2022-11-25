const { httpGET, httpPOST } = require("../../../adapters/network");
const {
  getDynamicMeta,
  processAxiosResponse
} = require("../../../adapters/utils/networkUtils");
const { isHttpStatusSuccess } = require("../../util/index");
const { TRANSFORMER_METRIC } = require("../../util/constant");
const { ApiError } = require("../../util/errors");

/**
 * The error codes that are generated by Marketo are present in the mentioned link:
 * https://developers.marketo.com/rest-api/error-codes/
 */

const MARKETO_RETRYABLE_CODES = ["601", "602", "604", "611"];
const MARKETO_ABORTABLE_CODES = [
  "600",
  "603",
  "605",
  "609",
  "610",
  "612",
  "1006",
  "1013",
  "1004",
  "1001"
];
const MARKETO_THROTTLED_CODES = ["502", "606", "607", "608", "615"];
const { DESTINATION } = require("./config");
const logger = require("../../../logger");

// handles marketo application level failures
const marketoApplicationErrorHandler = (
  marketoResponse,
  sourceMessage,
  destination
) => {
  const { response } = marketoResponse;
  const { errors } = response;
  if (errors && MARKETO_ABORTABLE_CODES.indexOf(errors[0].code) > -1) {
    throw new ApiError(
      `Request Failed for ${destination}, ${errors[0].message} (Aborted).${sourceMessage}`,
      400,
      {
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.SCOPE,
        meta: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.META.ABORTABLE
      },
      marketoResponse,
      undefined, // represents authErrorCategory
      destination
    );
  } else if (errors && MARKETO_THROTTLED_CODES.indexOf(errors[0].code) > -1) {
    throw new ApiError(
      `Request Failed for ${destination}, ${errors[0].message} (Throttled).${sourceMessage}`,
      429,
      {
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.SCOPE,
        meta: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.META.THROTTLED
      },
      marketoResponse,
      undefined,
      destination
    );
  } else if (errors && MARKETO_RETRYABLE_CODES.indexOf(errors[0].code) > -1) {
    throw new ApiError(
      `Request Failed for ${destination}, ${errors[0].message} (Retryable).${sourceMessage}`,
      500,
      {
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.SCOPE,
        meta: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.META.RETRYABLE
      },
      marketoResponse,
      undefined,
      destination
    );
  }
};

const marketoResponseHandler = (
  destResponse,
  sourceMessage,
  stage,
  rudderJobMetadata,
  authCache,
  destination = DESTINATION
) => {
  const { status, response } = destResponse;
  // if the responsee from destination is not a success case build an explicit error
  if (!isHttpStatusSuccess(status)) {
    throw new ApiError(
      `[${destination} Response Handler] - Request failed  with status: ${status}`,
      status,
      {
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.API.SCOPE,
        meta: getDynamicMeta(status)
      },
      destResponse,
      undefined,
      DESTINATION
    );
  }
  if (isHttpStatusSuccess(status)) {
    // for authentication requests
    if (response && response.access_token && response.expires_in) {
      return response;
    }
    // marketo application level success
    if (response && response.success) {
      return response;
    }
    // marketo application level failure
    if (response && !response.success) {
      // checking for invalid/expired token errors and evicting cache in that case
      // rudderJobMetadata contains some destination info which is being used to evict the cache
      if (response.errors && rudderJobMetadata?.destInfo) {
        const { authKey } = rudderJobMetadata.destInfo;
        if (
          authCache &&
          authKey &&
          response.errors.some(errorObj => {
            return errorObj.code === "601" || errorObj.code === "602";
          })
        ) {
          logger.info(
            `${destination} Cache token evicting due to invalid/expired access_token for destinationId (${authKey})`
          );
          authCache.del(authKey);
        }
      }
      marketoApplicationErrorHandler(destResponse, sourceMessage, destination);
    }
  }
  // More readable error message
  let message = `Error occurred ${sourceMessage}`;
  if (response.errors.length > 0 && response.errors[0].message) {
    message += ` -> ${response.errors[0].message}`;
  }
  // Marketo sent us some failure which is not handled
  throw new ApiError(message, 400, null, destResponse);
};

/**
 *
 * @param {*} url
 * @param {*} options
 * @returns { response, status }
 */
const sendGetRequest = async (url, options) => {
  const clientResponse = await httpGET(url, options);
  const processedResponse = processAxiosResponse(clientResponse);
  return processedResponse;
};

/**
 *
 * @param {*} url
 * @param {*} options
 * @returns { response, status }
 */
const sendPostRequest = async (url, data, options) => {
  const clientResponse = await httpPOST(url, data, options);
  const processedResponse = processAxiosResponse(clientResponse);
  return processedResponse;
};

const getResponseHandlerData = (
  clientResponse,
  lookupMessage,
  formattedDestination,
  authCache
) => {
  return marketoResponseHandler(
    clientResponse,
    lookupMessage,
    TRANSFORMER_METRIC.TRANSFORMER_STAGE.TRANSFORM,
    { destInfo: { authKey: formattedDestination.ID } },
    authCache
  );
};

module.exports = {
  marketoResponseHandler,
  sendGetRequest,
  sendPostRequest,
  getResponseHandlerData
};
