import { expect, test } from 'vitest';
import { flow } from './flows/test-flow';
import { FlowEngine } from '../app/flow-engine/flow-engine';
describe('run-flow', () => {
  test('runs basic flow', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run();
    expect(result).toBe(1234);
  });

  test('runs basic flow and processes input', async () => {
    const flowEngine = new FlowEngine();
    flowEngine.initialize(flow.flows.flow.nodes);
    const result = await flowEngine.run(2);
    expect(result).toBe(1236);
  });
});