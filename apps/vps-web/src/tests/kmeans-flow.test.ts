/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/kmeans-flow';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';

describe('kmeans flow', () => {
  test('runs kmeans flow', async () => {
    const flowEngine = new RuntimeFlowEngine();
    const outputs: Record<string, any> = {};
    flowEngine.canvasApp.setOnNodeMessage((key: string, inputValue: string) => {
      console.log('output', key, inputValue);
      outputs[key] = inputValue;
    });

    flowEngine.initialize(flow.flows.flow.nodes);
    await flowEngine.run();
    console.log('outputs', outputs);
    expect(outputs['output'].clusters.length).toBe(5);
    expect(outputs['output'].centroids.length).toBe(5);
  });
});
