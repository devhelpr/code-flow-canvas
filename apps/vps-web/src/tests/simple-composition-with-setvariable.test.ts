/**
 * @vitest-environment node
 **/
import { expect, test } from 'vitest';
import { RuntimeFlowEngine } from '@devhelpr/web-flow-executor';
import { flow } from './flows/simple-composition-with-setvariable';

describe('simple composition with setvariable', () => {
  test('runs simple-composition-with-setvariable flow with input', async () => {
    const flowEngine = new RuntimeFlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    expect(result).toBe(10);
  });
});
