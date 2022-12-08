const get = require("get-value");
const { EventType } = require("../../../constants");
const { CONFIG_CATEGORIES, MAPPING_CONFIG, baseEndpoint } = require("./config");
const {
  constructPayload,
  getHashFromArray,
  defaultPostRequestConfig,
  defaultRequestConfig,
  removeUndefinedAndNullValues,
  flattenJson,
  getSuccessRespEvents,
  getErrorRespEvents,
  isAppleFamily
} = require("../../util");
const {
  InstrumentationError,
  TransformationError,
  ConfigurationError
} = require("../../util/errorTypes");

const rejectParams = ["revenue", "currency"];

function responseBuilderSimple(message, category, destination) {
  const payload = constructPayload(message, MAPPING_CONFIG[category.name]);
  const { appToken, customMappings, environment } = destination.Config;
  const platform = get(message, "context.device.type");
  const id = get(message, "context.device.id");
  if (typeof platform !== "string" || !platform || !id) {
    throw new InstrumentationError("Device type/id  not present");
  }
  if (platform.toLowerCase() === "android") {
    delete payload.idfv;
    delete payload.idfa;
  } else if (isAppleFamily(platform)) {
    delete payload.android_id;
    delete payload.gps_adid;
  } else {
    throw new InstrumentationError("Device type not valid");
  }
  if (payload.revenue) {
    payload.currency = message.properties.currency || "USD";
  }
  const hashMap = getHashFromArray(customMappings, "from", "to", false);
  if (payload && message.event && hashMap[message.event]) {
    const response = defaultRequestConfig();
    response.headers = {
      Accept: "*/*"
    };

    const partnerParamsKeysMap = getHashFromArray(
      destination?.Config?.partnerParamsKeys
    );
    if (partnerParamsKeysMap) {
      payload.partner_params = {};
      Object.keys(partnerParamsKeysMap).forEach(key => {
        if (message.properties[key]) {
          payload.partner_params[
            partnerParamsKeysMap[key]
          ] = message.properties[key].toString();
        }
      });
    }
    if (Object.keys(payload.partner_params).length === 0) {
      payload.partner_params = null;
    }

    if (payload.callback_params) {
      rejectParams.forEach(rejectParam => {
        delete payload.callback_params[rejectParam];
      });
      payload.callback_params = JSON.stringify(
        flattenJson(payload.callback_params)
      );
    } else {
      payload.callback_params = null;
    }

    response.endpoint = baseEndpoint;
    response.method = defaultPostRequestConfig.requestMethod;
    response.userId = message.anonymousId;
    payload.s2s = 1;
    payload.app_token = appToken;
    payload.event_token = hashMap[message.event];
    payload.environment = environment ? "production" : "sandbox";
    response.params = removeUndefinedAndNullValues(payload);
    return response;
  }
  // fail-safety for developer error
  if (!message.event || !hashMap[message.event]) {
    throw new ConfigurationError("No event token mapped for this event");
  } else {
    throw new TransformationError("Payload could not be constructed");
  }
}

const processEvent = (message, destination) => {
  if (!message.type) {
    throw new InstrumentationError(
      "Message Type is not present. Aborting message."
    );
  }
  const messageType = message.type.toLowerCase();
  let category;
  switch (messageType) {
    case EventType.TRACK:
      category = CONFIG_CATEGORIES.TRACK;
      break;
    default:
      throw new InstrumentationError("Message type not supported");
  }

  // build the response
  return responseBuilderSimple(message, category, destination);
};

const process = event => {
  return processEvent(event.message, event.destination);
};
const processRouterDest = async inputs => {
  if (!Array.isArray(inputs) || inputs.length <= 0) {
    const respEvents = getErrorRespEvents(null, 400, "Invalid event array");
    return [respEvents];
  }

  const respList = await Promise.all(
    inputs.map(async input => {
      try {
        if (input.message.statusCode) {
          // already transformed event
          return getSuccessRespEvents(
            input.message,
            [input.metadata],
            input.destination
          );
        }
        // if not transformed
        return getSuccessRespEvents(
          await process(input),
          [input.metadata],
          input.destination
        );
      } catch (error) {
        return getErrorRespEvents(
          [input.metadata],
          error?.response?.status || error?.code || 400,
          error.message || "Error occurred while processing payload."
        );
      }
    })
  );
  return respList;
};

module.exports = { process, processRouterDest };
