/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/map-flow';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('map flow', () => {
  test('runs map flow', async () => {
    const flowEngine = new RuntimeFlowEngine();
    const outputs: Record<string, any> = {};
    flowEngine.canvasApp.setOnNodeMessage((key: string, inputValue: string) => {
      console.log('output', key, inputValue);
      outputs[key] = inputValue;
    });

    flowEngine.initialize(flow.flows.flow.nodes);
    await flowEngine.run();
    expect(outputs['test'].length).toBe(10);
    expect(outputs['test']).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
