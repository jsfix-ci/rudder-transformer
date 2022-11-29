const { get } = require("lodash");
const {
  getFieldValueFromMessage,
  getHashFromArray,
  constructPayload,
  flattenMultilevelPayload
} = require("../../util");
const {
  identifySourceKeys,
  fileConfigCategories,
  mappingConfig,
  DESTINATION
} = require("./config");
const { TRANSFORMER_METRIC } = require("../../util/constant");
const ErrorBuilder = require("../../util/error");

/**
 * Returns the remaining keys from traits
 * @param {*} traits
 * @param {*} sourceKeys
 * @returns
 */
const getIdentifyTraits = message => {
  const traits = getFieldValueFromMessage(message, "traits");
  const contextTraits = get(message, "context.traits");
  return { ...traits, ...contextTraits };
};

/**
 * Returns the remaining keys from traits
 * Remaining keys : keys which is not included in webapp configuration mapping and not included in source-dest keys file
 * @param {*} traits
 * @param {*} sourceKeys
 * @returns
 */
const getRemainingAttributes = (traits, sourceKeys) => {
  const properties = {};
  const keys = Object.keys(traits);
  keys.forEach(key => {
    if (!sourceKeys.includes(key)) {
      properties[key] = traits[key];
    }
  });
  return properties;
};

/**
 * Returns the customAttributes (user, company and event custom attributes) + remaining attributes
 * Remaining attributes : keys which is not included in webapp configuration mapping and not included in source-dest keys file
 * @param {*} attributesMap
 * @param {*} properties
 * @param {*} excludeKeys
 * @returns
 */
const getAttributes = (attributesMap, properties, excludeKeys) => {
  const sourceKeys = excludeKeys;
  const data = {};
  const attributesMapKeys = Object.keys(attributesMap);

  attributesMapKeys.forEach(key => {
    if (properties[key]) {
      const destinationAttributeName = attributesMap[key];
      data[destinationAttributeName] = properties[key];
      sourceKeys.push(key);
    }
  });

  const remainingAttributes = getRemainingAttributes(properties, sourceKeys);
  return { ...data, ...remainingAttributes };
};

const buildIdentifyPayload = (message, Config) => {
  const traits = getIdentifyTraits(message);
  if (!traits) {
    throw new ErrorBuilder()
      .setMessage("Traits not Provided")
      .setStatus(400)
      .setStatTags({
        destType: DESTINATION,
        stage: TRANSFORMER_METRIC.TRANSFORMER_STAGE.TRANSFORM,
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.TRANSFORMATION.SCOPE,
        meta: TRANSFORMER_METRIC.MEASUREMENT_TYPE.TRANSFORMATION.META.BAD_PARAM
      })
      .build();
  }
  const configPayload = constructPayload(
    message,
    mappingConfig[fileConfigCategories.IDENTIFY.name]
  );
  const { persistIqAttributesMapping } = Config;
  const persistIqAttributesMap = getHashFromArray(
    persistIqAttributesMapping,
    "from",
    "to",
    false
  );
  const customPersistIqAttributes = flattenMultilevelPayload(
    getAttributes(persistIqAttributesMap, traits, identifySourceKeys)
  );
  return { ...configPayload, ...customPersistIqAttributes };
};
module.exports = { getIdentifyTraits, buildIdentifyPayload };
