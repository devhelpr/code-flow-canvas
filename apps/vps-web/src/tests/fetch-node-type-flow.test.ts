/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/test-fetch-flow';
import { FlowEngine } from '../app/flow-engine/flow-engine';

const createFetchResponse = (data: any) => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
  });
};
describe('fetch node-tytpe flow', () => {
  test('runs flow', async () => {
    const apiResponse = {
      name: 'Cyclops Rick',
    };

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(createFetchResponse(apiResponse));

    const flowEngine = new FlowEngine();
    const outputs: Record<string, any> = {};
    flowEngine.canvasApp.setOnNodeMessage((key: string, inputValue: string) => {
      console.log('output', inputValue);
      outputs[key] = inputValue;
    });

    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    console.log('result', result, outputs);
    expect(outputs['test'].name).toBe('Cyclops Rick');
  });
});
