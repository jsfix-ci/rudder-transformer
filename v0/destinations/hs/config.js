const { getMappingConfig } = require("../../util");

const BASE_ENDPOINT = "https://api.hubapi.com";

const CONTACT_PROPERTY_MAP_ENDPOINT = `${BASE_ENDPOINT}/properties/v1/contacts/properties`;

/*
 * Legacy API
 */
// Identify
const IDENTIFY_CREATE_NEW_CONTACT = `${BASE_ENDPOINT}/contacts/v1/contact`;
const IDENTIFY_CREATE_UPDATE_CONTACT = `${BASE_ENDPOINT}/contacts/v1/contact/createOrUpdate/email/:contact_email`;

// Identify Batch
const BATCH_CONTACT_ENDPOINT = `${BASE_ENDPOINT}/contacts/v1/contact/batch/`;
const MAX_BATCH_SIZE = 1000;

// Track
const TRACK_ENDPOINT = "https://track.hubspot.com/v1/event";

/*
 * NEW API
 */
// Identify
const IDENTIFY_CRM_SEARCH_CONTACT = `${BASE_ENDPOINT}/crm/v3/objects/contacts/search`;
const IDENTIFY_CRM_SEARCH_ALL_OBJECTS = `${BASE_ENDPOINT}/crm/v3/objects/:objectType/search`;
const IDENTIFY_CRM_CREATE_NEW_CONTACT = `${BASE_ENDPOINT}/crm/v3/objects/contacts`;
const IDENTIFY_CRM_UPDATE_NEW_CONTACT = `${BASE_ENDPOINT}/crm/v3/objects/contacts/:contactId`;

// Identify Batch
const BATCH_IDENTIFY_CRM_CREATE_NEW_CONTACT = `${BASE_ENDPOINT}/crm/v3/objects/contacts/batch/create`;
const BATCH_IDENTIFY_CRM_UPDATE_NEW_CONTACT = `${BASE_ENDPOINT}/crm/v3/objects/contacts/batch/update`;
// Ref - https://developers.hubspot.com/docs/api/crm/contacts#endpoint?spec=GET-/crm/v3/objects/contacts
const MAX_BATCH_SIZE_CRM_CONTACT = 10;

// Track
const TRACK_CRM_ENDPOINT = `${BASE_ENDPOINT}/events/v3/send`;

/* CRM Custom Objects */
const CRM_CREATE_CUSTOM_OBJECTS = `${BASE_ENDPOINT}/crm/v3/objects/:objectType`;

// Batch for custom Objects
const BATCH_CREATE_CUSTOM_OBJECTS = `${BASE_ENDPOINT}/crm/v3/objects/:objectType/batch/create`;

/* CRM Association v3 */
const CRM_ASSOCIATION_V3 = `${BASE_ENDPOINT}/crm/v3/associations/:fromObjectType/:toObjectType/batch/create`;

// Ref - https://developers.hubspot.com/docs/api/crm/understanding-the-crm
const MAX_BATCH_SIZE_CRM_OBJECT = 100;

const ConfigCategory = {
  COMMON: {
    name: "HSCommonConfig"
  },
  TRACK: {
    name: "HSTrackConfig"
  },
  TRACK_PROPERTIES: {
    name: "HSTrackPropertiesConfig"
  }
};

const mappingConfig = getMappingConfig(ConfigCategory, __dirname);
const hsCommonConfigJson = mappingConfig[ConfigCategory.COMMON.name];

module.exports = {
  BASE_ENDPOINT,
  CONTACT_PROPERTY_MAP_ENDPOINT,
  TRACK_ENDPOINT,
  IDENTIFY_CREATE_UPDATE_CONTACT,
  IDENTIFY_CREATE_NEW_CONTACT,
  BATCH_CONTACT_ENDPOINT,
  MAX_BATCH_SIZE,
  IDENTIFY_CRM_SEARCH_CONTACT,
  IDENTIFY_CRM_SEARCH_ALL_OBJECTS,
  IDENTIFY_CRM_CREATE_NEW_CONTACT,
  IDENTIFY_CRM_UPDATE_NEW_CONTACT,
  BATCH_IDENTIFY_CRM_CREATE_NEW_CONTACT,
  BATCH_IDENTIFY_CRM_UPDATE_NEW_CONTACT,
  MAX_BATCH_SIZE_CRM_CONTACT,
  TRACK_CRM_ENDPOINT,
  CRM_CREATE_CUSTOM_OBJECTS,
  BATCH_CREATE_CUSTOM_OBJECTS,
  CRM_ASSOCIATION_V3,
  MAX_BATCH_SIZE_CRM_OBJECT,
  ConfigCategory,
  mappingConfig,
  hsCommonConfigJson
};
