const { getMappingConfig } = require("../../util");

const BASE_URL = "https://subDomainName.mautic.net/api";

// const MAX_BATCH_SIZE = 200;

const ConfigCategories = {
  IDENTIFY: {
    type: "identify",
    name: "MauticIdentifyConfig",
    method: "POST"
  }
  // GROUP: {
  //     type: "group",
  //     name: "MauticGroupConfig",
  //     method: "POST"
  //   }
};
const mappingConfig = getMappingConfig(ConfigCategories, __dirname);
module.exports = {
  BASE_URL,
  mappingConfig,
  ConfigCategories
};
