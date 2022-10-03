const path = require("path");
const fs = require("fs");
const {
  WorkflowExecutionError,
  WorkflowEngineError
} = require("rudder-workflow-engine");
const { logger } = require("handlebars");
const { TRANSFORMER_METRIC } = require("../../v0/util/constant");
const ErrorBuilder = require("../../v0/util/error");

const CDK_V2_ROOT_DIR = __dirname;

function getWorkflowPath(
  destDir,
  flowType = TRANSFORMER_METRIC.ERROR_AT.UNKNOWN
) {
  // The values are of array type to support aliases
  const flowTypeMap = {
    // Didn't add any prefix as processor transformation is the default
    [TRANSFORMER_METRIC.ERROR_AT.PROC]: ["workflow.yaml", "procWorkflow.yaml"],
    [TRANSFORMER_METRIC.ERROR_AT.RT]: ["rtWorkflow.yaml"],
    // Note: intentionally avoided the `proxy` term here
    [TRANSFORMER_METRIC.ERROR_AT.PROXY]: ["dataDeliveryWorkflow.yaml"],
    [TRANSFORMER_METRIC.ERROR_AT.BATCH]: ["batchWorkflow.yaml"]
  };

  const workflowFilenames = flowTypeMap[flowType];
  // Find the first workflow file that exists
  const files = fs.readdirSync(destDir);
  const matchedFilename = workflowFilenames?.find(filename =>
    files.includes(filename)
  );
  if (matchedFilename) {
    return path.join(destDir, matchedFilename);
  }

  throw new ErrorBuilder()
    .setMessage("Unable to identify the workflow file. Invalid flow type input")
    .setStatus(400)
    .build();
}

function getRootPathForDestination(destName) {
  // TODO: Resolve the CDK v2 destination directory
  // path from the root directory
  return path.join(CDK_V2_ROOT_DIR, destName);
}

function getPlatformBindingsPaths() {
  const allowedExts = [".js"];
  const bindingsPaths = [];
  const bindingsDir = path.join(CDK_V2_ROOT_DIR, "bindings");
  const files = fs.readdirSync(bindingsDir);
  files.forEach(fileName => {
    const { name, ext } = path.parse(fileName);
    if (allowedExts.includes(ext.toLowerCase())) {
      bindingsPaths.push(path.join(bindingsDir, name));
    }
  });
  return bindingsPaths;
}

function getErrorInfo(err) {
  // Handle various CDK error types
  let errorInfo = err;
  if (err instanceof WorkflowExecutionError) {
    logger.error(
      "Error occurred during workflow step execution: ",
      err.stepName
    );
    errorInfo = {
      message: err.message,
      status: err.status,
      destinationResponse: err.error?.destinationResponse,
      statTags: err.error?.statTags,
      authErrorCategory: err.error?.authErrorCategory
    };
    // TODO: Add a special stat tag to bump the priority of the error
  } else if (err instanceof WorkflowEngineError) {
    logger.error("Error occurred during workflow step: ", err.stepName);
    errorInfo = {
      message: err.message,
      status: err.status,
      statTags: {
        stage: TRANSFORMER_METRIC.TRANSFORMER_STAGE.TRANSFORM,
        scope: TRANSFORMER_METRIC.MEASUREMENT_TYPE.CDK.SCOPE
      }
    };
  }
  return errorInfo;
}

module.exports = {
  getRootPathForDestination,
  getWorkflowPath,
  getPlatformBindingsPaths,
  getErrorInfo
};
