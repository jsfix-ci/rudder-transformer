/* eslint-disable no-nested-ternary */
const { EventType } = require("../../../constants");
const {
  isEmptyObject,
  constructPayload,
  defaultRequestConfig,
  extractCustomFields,
  defaultPutRequestConfig,
  removeUndefinedAndNullValues,
  defaultPostRequestConfig,
  getHashFromArray,
  getFieldValueFromMessage,
  getValueFromMessage,
  CustomError,
  simpleProcessRouterDest,
  getIntegrationsObj
} = require("../../util");
const {
  renameCustomFields,
  objectExists,
  createAccount,
  updateAccount,
  formatEventProps
} = require("./util");
const {
  ENDPOINTS,
  USER_EXCLUSION_FIELDS,
  ACCOUNT_EXCLUSION_FIELDS,
  trackMapping,
  groupMapping,
  identifyMapping
} = require("./config");

/**
 * Create/Update a User with user attributes
 */
const identifyResponseBuilder = async (message, { Config }) => {
  const userId = getFieldValueFromMessage(message, "userId");
  if (!userId) {
    throw new CustomError(
      "userId or anonymousId is required for identify",
      400
    );
  }

  const response = defaultRequestConfig();
  response.headers = {
    "X-APTRINSIC-API-KEY": Config.apiKey,
    "Content-Type": "application/json"
  };

  const { success: isPresent } = await objectExists(userId, Config, "user");

  let payload = constructPayload(message, identifyMapping);
  const name = getValueFromMessage(message, [
    "traits.name",
    "context.traits.name"
  ]);
  if (name && typeof name === "string") {
    const [fName, lName] = name.split(" ");
    payload.firstName = fName;
    payload.lastName = lName;
  }
  let customAttributes = {};
  customAttributes = extractCustomFields(
    message,
    customAttributes,
    ["traits", "context.traits"],
    USER_EXCLUSION_FIELDS
  );

  const userCustomFieldsMap = getHashFromArray(
    Config.userAttributeMap,
    "from",
    "to",
    false
  );
  customAttributes = renameCustomFields(customAttributes, userCustomFieldsMap);
  payload = {
    ...payload,
    customAttributes,
    propertyKeys: [Config.productTagKey],
    type: "USER"
  };

  if (isPresent) {
    // update user
    response.method = defaultPutRequestConfig.requestMethod;
    response.endpoint = `${ENDPOINTS.USERS_ENDPOINT}/${userId}`;
    response.body.JSON = removeUndefinedAndNullValues(payload);
    return response;
  }

  // create new user
  payload.identifyId = userId;
  response.method = defaultPostRequestConfig.requestMethod;
  response.endpoint = ENDPOINTS.USERS_ENDPOINT;
  response.body.JSON = removeUndefinedAndNullValues(payload);
  return response;
};

/**
 * Updated group call with less number of API calls.
 * Pros: Will make atleast 2 API call and at most 3 API calls
 * Cons: There might be some unwanted accounts
 */
const newGroupResponseBuilder = async (message, { Config }) => {
  const userId = getFieldValueFromMessage(message, "userId");
  if (!userId) {
    throw new CustomError("userId or anonymousId is required for group", 400);
  }

  const groupId = getFieldValueFromMessage(message, "groupId");
  if (!groupId) {
    throw new CustomError("groupId is required for group", 400);
  }

  let payload = constructPayload(message, groupMapping);
  let customAttributes = {};
  customAttributes = extractCustomFields(
    message,
    customAttributes,
    ["traits"],
    ACCOUNT_EXCLUSION_FIELDS
  );

  const accountFieldsMap = getHashFromArray(
    Config.accountAttributeMap,
    "from",
    "to",
    false
  );
  customAttributes = renameCustomFields(customAttributes, accountFieldsMap);
  payload = {
    ...payload,
    customAttributes: !isEmptyObject(customAttributes)
      ? customAttributes
      : null,
    propertyKeys: [Config.productTagKey]
  };
  payload = removeUndefinedAndNullValues(payload);

  // update account
  const { success: updateSuccess, err } = await updateAccount(
    groupId,
    payload,
    Config
  );
  // will not throw error if it is due to unavailable accounts
  if (!updateSuccess && err === null) {
    // create account
    payload.id = groupId;
    const { success: createSuccess, error } = await createAccount(
      payload,
      Config
    );
    if (!createSuccess) {
      throw new CustomError(
        `failed to create account for group: ${error}`,
        400
      );
    }
  }
  // throwing error only when it is not due to unavailable contacts
  if (err) {
    throw new CustomError(`failed to update account for group: ${err}`, 400);
  }

  // add accountId to user object
  const response = defaultRequestConfig();
  response.method = defaultPutRequestConfig.requestMethod;
  response.headers = {
    "X-APTRINSIC-API-KEY": Config.apiKey,
    "Content-Type": "application/json"
  };
  response.endpoint = `${ENDPOINTS.USERS_ENDPOINT}/${userId}`;
  response.body.JSON = {
    accountId: groupId
  };
  return response;
};

/**
 * Associates a User with an Account.
 */
const groupResponseBuilder = async (message, { Config }) => {
  const userId = getFieldValueFromMessage(message, "userId");
  if (!userId) {
    throw new CustomError("userId or anonymousId is required for group", 400);
  }

  const { success: isPresent, err: e } = await objectExists(
    userId,
    Config,
    "user"
  );
  if (!isPresent) {
    throw new CustomError(`aborting group call: ${e}`, 400);
  }

  const groupId = getFieldValueFromMessage(message, "groupId");
  if (!groupId) {
    throw new CustomError("groupId is required for group", 400);
  }

  const { success: accountIsPresent } = await objectExists(
    groupId,
    Config,
    "account"
  );

  let payload = constructPayload(message, groupMapping);
  let customAttributes = {};
  customAttributes = extractCustomFields(
    message,
    customAttributes,
    ["traits"],
    ACCOUNT_EXCLUSION_FIELDS
  );

  const accountFieldsMap = getHashFromArray(
    Config.accountAttributeMap,
    "from",
    "to",
    false
  );
  customAttributes = renameCustomFields(customAttributes, accountFieldsMap);
  payload = {
    ...payload,
    customAttributes: !isEmptyObject(customAttributes)
      ? customAttributes
      : null,
    propertyKeys: [Config.productTagKey]
  };
  payload = removeUndefinedAndNullValues(payload);

  if (accountIsPresent) {
    // update account
    const { success: updateSuccess, err } = await updateAccount(
      groupId,
      payload,
      Config
    );
    if (!updateSuccess) {
      throw new CustomError(`failed to update account for group: ${err}`, 400);
    }
  } else {
    // create account
    payload.id = groupId;
    const { success: createSuccess, err } = await createAccount(
      payload,
      Config
    );
    if (!createSuccess) {
      throw new CustomError(`failed to create account for group: ${err}`, 400);
    }
  }

  // add accountId to user object
  const response = defaultRequestConfig();
  response.method = defaultPutRequestConfig.requestMethod;
  response.headers = {
    "X-APTRINSIC-API-KEY": Config.apiKey,
    "Content-Type": "application/json"
  };
  response.endpoint = `${ENDPOINTS.USERS_ENDPOINT}/${userId}`;
  response.body.JSON = {
    accountId: groupId
  };
  return response;
};

/**
 * Creates Custom Events
 * API Ref:
 * https://gainsightpx.docs.apiary.io/#reference/custom-events/v1eventscustom/create-custom-event
 */
const trackResponseBuilder = (message, { Config }) => {
  let payload = constructPayload(message, trackMapping);

  // Global Context in payload overrides the one from Web app
  let globalContext = getValueFromMessage(message, "properties.globalContext");

  if (!globalContext || isEmptyObject(globalContext)) {
    globalContext = getHashFromArray(
      Config.globalContextMap,
      "from",
      "to",
      false
    );
  }

  if (payload.attributes && payload.attributes.globalContext) {
    delete payload.attributes.globalContext;
  }

  payload = {
    ...payload,
    attributes: formatEventProps(payload.attributes),
    propertyKey: Config.productTagKey,
    userType: "USER",
    globalContext: !isEmptyObject(globalContext) ? globalContext : null
  };

  const response = defaultRequestConfig();
  response.method = defaultPostRequestConfig.requestMethod;
  response.body.JSON = removeUndefinedAndNullValues(payload);
  response.headers = {
    "X-APTRINSIC-API-KEY": Config.apiKey,
    "Content-Type": "application/json"
  };
  response.endpoint = ENDPOINTS.CUSTOM_EVENTS_ENDPOINT;
  return response;
};

/**
 * Processing Single event
 */
const process = async event => {
  const { message, destination } = event;
  if (!message.type) {
    throw new CustomError(
      "Message Type is not present. Aborting message.",
      400
    );
  }

  const { apiKey, productTagKey } = destination.Config;
  if (!apiKey) {
    throw new CustomError("Invalid API Key. Aborting message.", 400);
  }

  if (!productTagKey) {
    throw new CustomError("product tag key is required", 400);
  }

  const messageType = message.type.toLowerCase();

  // vairable used for less API calls in group
  const limitAPIForGroup = getIntegrationsObj(message, "gainsight_px")
    ?.limitAPIForGroup;

  let response;
  switch (messageType) {
    case EventType.IDENTIFY:
      response = await identifyResponseBuilder(message, destination);
      break;
    case EventType.TRACK:
      response = trackResponseBuilder(message, destination);
      break;
    case EventType.GROUP:
      if (limitAPIForGroup) {
        response = await newGroupResponseBuilder(message, destination);
      } else {
        response = await groupResponseBuilder(message, destination);
      }
      break;
    default:
      throw new CustomError(`message type ${messageType} not supported`, 400);
  }
  return response;
};

const processRouterDest = async inputs => {
  const respList = await simpleProcessRouterDest(
    inputs,
    "GAINSIGHT_PX",
    process
  );
  return respList;
};

module.exports = { process, processRouterDest };
