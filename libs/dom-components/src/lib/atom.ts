import { BaseComponent } from "./base-component";

export interface Atom<T> {
  getValue: () => T | undefined;
  setValue: (value: T) => void;
  subscribe: (callback: (value: T) => void) => void;
  subscribeComponent: (component: BaseComponent) => void;
}

export const createAtom = <T>(initial?: T): Atom<T> => {
  const callbacks: ((value: unknown) => void)[] = [];

  let atomValue: T | undefined = initial;
  return {
    getValue: (): T | undefined => atomValue,
    setValue: (value: T) => {
      atomValue = value;
      callbacks.forEach((callback) => {
        callback(value);
      });
    },
    subscribe: (callback: (value: T) => void) => {
      callbacks.push(callback as (value: unknown) => void);
    },
    subscribeComponent: (component: BaseComponent) => {
      callbacks.push((_value) => {
        component.render();
      });
    },
  };
};

export const createDerivedAtom = <T>(
  dependencies: Atom<T>[],
  getValue: () => string
) => {
  return {
    getValue,
    subscribe: (callback: (value: string) => void) => {
      dependencies.forEach((atom) => {
        atom.subscribe((_value) => {
          callback(getValue());
        });
      });
    },
  };
};
