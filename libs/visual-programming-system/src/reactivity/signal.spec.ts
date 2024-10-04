/**
 * @vitest-environment node
 **/
import { expect, test } from 'vitest';

import {
  createNamedSignal,
  createSignal,
  trackNamedSignal,
  trackNamedSignals,
} from './signal';

describe('Signal', () => {
  test('should create a signal', () => {
    const [getSignal, setSignal] = createSignal<string>('initial value');
    expect(getSignal()).toBe('initial value');
    setSignal('new value');
    expect(getSignal()).toBe('new value');
  });
});

describe('Named signals', () => {
  test('should create a named signal', () => {
    const namedSignal = createNamedSignal<string>('test');
    expect(namedSignal.getValue()).toBeUndefined();
    namedSignal.setValue('test value');
    expect(namedSignal.getValue()).toBe('test value');
  });

  test('should received update to named signal', async () => {
    function testTrackNamedSignal() {
      return new Promise<void>((resolve) => {
        trackNamedSignal('test', (value) => {
          expect(value).toBe('test value');
          resolve();
        });
        const namedSignal = createNamedSignal<string>('test');
        expect(namedSignal.getValue()).toBeUndefined();
        namedSignal.setValue('test value');
        expect(namedSignal.getValue()).toBe('test value');
      });
    }
    await testTrackNamedSignal();
  });

  test('should received update to named signal and name when tracking multiple signals', async () => {
    function testTrackNamedSignal() {
      return new Promise<void>((resolve) => {
        const namedSignal2 = createNamedSignal<string>('test2');
        const namedSignal = createNamedSignal<string>('test');
        trackNamedSignals(['test', 'test2'], (name) => {
          if (name === namedSignal.name) {
            expect(namedSignal.value).toBe('test value');
            expect(namedSignal2.value).toBe(undefined);
          } else {
            expect(name).toBe('test2');
            expect(namedSignal.value).toBe('test value');
            expect(namedSignal2.value).toBe('test value2');
            resolve();
          }
        });

        expect(namedSignal.getValue()).toBeUndefined();
        namedSignal.setValue('test value');

        namedSignal2.setValue('test value2');

        expect(namedSignal.getValue()).toBe('test value');
        expect(namedSignal2.getValue()).toBe('test value2');
      });
    }
    await testTrackNamedSignal();
  });

  test('should creating a signal with the same name should throw an error', () => {
    createNamedSignal<string>('test');
    expect(() => createNamedSignal<string>('test')).toThrow(
      'Signal with name test already exists'
    );
  });

  test('should track named number signal', () => {
    const namedSignal = createNamedSignal<number>('test');
    trackNamedSignal<number>('test', (value) => {
      expect(value).toBe(2);
    });
    namedSignal.setValue(2);
    expect(namedSignal.value).toBe(2);
    expect(namedSignal.getValue()).toBe(2);
  });
});
