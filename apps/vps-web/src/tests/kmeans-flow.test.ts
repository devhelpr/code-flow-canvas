/**
 * @vitest-environment node
 **/
import { expect, test, vi } from 'vitest';
import { flow } from './flows/kmeans-flow';
import { FlowEngine } from '../app/flow-engine/flow-engine';

describe('kmeans flow', () => {
  test('runs kmeans flow', async () => {
    const flowEngine = new FlowEngine();
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
