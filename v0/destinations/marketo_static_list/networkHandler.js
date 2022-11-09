const { TRANSFORMER_METRIC } = require("../../util/constant");
const { marketoResponseHandler } = require("./util");
const {
  proxyRequest,
  prepareProxyRequest
} = require("../../../adapters/network");
const v0Utils = require("../../util");
const {
  processAxiosResponse
} = require("../../../adapters/utils/networkUtils");

// eslint-disable-next-line no-unused-vars
const responseHandler = (destinationResponse, destType) => {
  const message = `[Marketo Static List Response Handler] - Request Processed Successfully`;
  const { status } = destinationResponse;
  const authCache = v0Utils.getDestAuthCacheInstance(destType);
  // check for marketo application level failures
  marketoResponseHandler(
    destinationResponse,
    "during Marketo Response Handling",
    TRANSFORMER_METRIC.TRANSFORMER_STAGE.RESPONSE_TRANSFORM,
    destinationResponse?.rudderJobMetadata,
    authCache
  );
  // else successfully return status, message and original destination response
  return {
    status,
    message,
    destinationResponse
  };
};

class networkHandler {
  constructor() {
    this.responseHandler = responseHandler;
    this.proxy = proxyRequest;
    this.prepareProxy = prepareProxyRequest;
    this.processAxiosResponse = processAxiosResponse;
  }
}

module.exports = {
  networkHandler
};
