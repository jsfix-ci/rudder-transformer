const fs = require("fs");
const path = require("path");
const { TRANSFORMER_METRIC } = require("../v0/util/constant");
const { getWorkflowEngine } = require("../cdk/v2/handler");

const integration = "pinterest_tag";
const name = "Pinterest Conversion API";

const procWorkflowEnginePromise = getWorkflowEngine(
  integration,
  TRANSFORMER_METRIC.ERROR_AT.PROC
);
const rtWorkflowEnginePromise = getWorkflowEngine(
  integration,
  TRANSFORMER_METRIC.ERROR_AT.RT
);

describe(`${name} Tests`, () => {
  describe("Processor Tests", () => {
    const inputDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_input.json`)
    );
    const outputDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_output.json`)
    );
    const inputData = JSON.parse(inputDataFile);
    const expectedData = JSON.parse(outputDataFile);
    inputData.forEach((input, index) => {
      it(`${name} - payload: ${index}`, async () => {
        const expected = expectedData[index];
        try {
          const procWorkflowEngine = await procWorkflowEnginePromise;
          const result = await procWorkflowEngine.execute(input);
          expect(result.output).toEqual(expected);
        } catch (error) {
          expect(error.message).toEqual(expected.error);
        }
      });
    });
  });

  describe("Router Tests", () => {
    // Router Test Data
    const inputRouterDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_router_input.json`)
    );

    const inputRouterErrorDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_router_error_input.json`)
    );

    const outputRouterBatchDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_router_batch_output.json`)
    );
    const outputRouterDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_router_output.json`)
    );
    const outputRouterErrorDataFile = fs.readFileSync(
      path.resolve(__dirname, `./data/${integration}_router_error_output.json`)
    );
    const inputRouterData = JSON.parse(inputRouterDataFile);
    const inputRouterErrorData = JSON.parse(inputRouterErrorDataFile);

    const expectedRouterBatchData = JSON.parse(outputRouterBatchDataFile);
    const expectedRouterData = JSON.parse(outputRouterDataFile);
    const expectedRouterErrorData = JSON.parse(outputRouterErrorDataFile);

    it("Payload with error input", async () => {
      const rtWorkflowEngine = await rtWorkflowEnginePromise;
      const result = await rtWorkflowEngine.execute(inputRouterErrorData);
      expect(result.output).toEqual(expectedRouterErrorData);
    });

    it("Payload with Default Batch size", async () => {
      const rtWorkflowEngine = await rtWorkflowEnginePromise;
      const result = await rtWorkflowEngine.execute(inputRouterData);
      expect(result.output).toEqual(expectedRouterData);
    });
    it("Payload with Batch size 3", async () => {
      const rtWorkflowEngine = await rtWorkflowEnginePromise;
      const result = await rtWorkflowEngine.execute(inputRouterData, {
        MAX_BATCH_SIZE: 3
      });
      expect(result.output).toEqual(expectedRouterBatchData);
    });
  });
});
