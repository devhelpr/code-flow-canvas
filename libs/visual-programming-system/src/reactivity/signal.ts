export interface ISignalSubscription {
  execute?: () => void;
  executeWithValue?: (value: string) => void;
  dependencies?: Set<Set<ISignalSubscription>>;
}

export interface NamedSignal {
  name: string;
  subscription: ISignalSubscription;
}

let registeredEffect: undefined | (() => void) = undefined;
const effectStack: any[] = [];

function subscribe(
  runningEffect: ISignalSubscription,
  subscriptions: Set<ISignalSubscription>
) {
  subscriptions.add(runningEffect);
  runningEffect.dependencies?.add(subscriptions);
}

export const createSignal = <T>(value: T): [() => T, (v: T) => void] => {
  // if a createSignal is called within an effect ... then an infinite loop will occur
  // how to prevent this?

  const subscriptions = new Set<ISignalSubscription>();
  let internalValue: T = value;
  // if (registeredEffect) {
  //   registeredEffect();
  // }
  return [
    () => {
      // read/getter/accessor implementation for signal
      const runningEffect = effectStack[effectStack.length - 1];
      // if there's an effect on the the top of the stack, subscribe it to the signal
      if (runningEffect) {
        subscribe(runningEffect, subscriptions);
      }
      return internalValue;
    },
    (v: T) => {
      // write/setter implementation for signal
      internalValue = v;
      for (const subscription of [...subscriptions]) {
        if (subscription.execute) {
          subscription.execute();
        }
      }
      return;
    },
  ];
};

const namedSubscriptions = new Map<string, NamedSignal[]>();

function subscribeByName(
  name: string,
  runningEffect: ISignalSubscription
  //namedSubscriptions: Set<NamedSignal>
) {
  if (!namedSubscriptions.has(name)) {
    namedSubscriptions.set(name, []);
  }
  const namedSubscription = namedSubscriptions.get(name);
  namedSubscription?.push({
    name,
    subscription: runningEffect,
  });
  if (namedSubscription) {
    namedSubscriptions.set(name, namedSubscription);
  }
  console.log('namedSubscriptions', name, namedSubscriptions.get(name));

  // const dependencies = Array.from(namedSubscriptions)
  //   .filter((s) => s.name === name)
  //   .map((item) => {
  //     return item.subscription;
  //   });
  // runningEffect.dependencies?.add(new Set(dependencies));
}

export const trackNamedSignal = (
  name: string,
  tracker: (value: string) => void
) => {
  subscribeByName(name, {
    executeWithValue: tracker,
  });
};

// export const createNamedSignal = (
//   name: string,
//   value: string
// ): [() => string, (v: string) => void] => {
//   let internalValue: string = value;
//   // if (registeredEffect) {
//   //   registeredEffect();
//   // }
//   return [
//     () => {
//       // read/getter/accessor implementation for signal
//       const runningEffect = effectStack[effectStack.length - 1];
//       // if there's an effect on the the top of the stack, subscribe it to the signal
//       if (runningEffect) {
//         subscribeByName(name, runningEffect, namedSubscriptions);
//       }
//       return internalValue;
//     },
//     (v: string) => {
//       // write/setter implementation for signal
//       internalValue = v;
//       console.log('namedSubscriptions', namedSubscriptions);
//       for (const subscription of [...namedSubscriptions]) {
//         // execute the effect
//         if (
//           subscription.name === name &&
//           subscription.subscription.executeWithValue
//         ) {
//           subscription.subscription.executeWithValue(internalValue);
//         }
//       }
//       return;
//     },
//   ];
// };

export const destroyNamedSignal = (name: string) => {
  namedSubscriptions.delete(name);
};

function cleanupEffectsDependencies(runningEffect: ISignalSubscription) {
  if (!runningEffect.dependencies) {
    return;
  }
  for (const dependency of runningEffect.dependencies) {
    dependency.delete(runningEffect);
  }
  runningEffect.dependencies.clear();
}

export const createEffect = (fn: () => void) => {
  const execute = () => {
    cleanupEffectsDependencies(runningEffect);
    //console.log('execute', runningEffect);
    effectStack.push(runningEffect);
    try {
      fn();
    } finally {
      effectStack.pop();
    }
  };
  const runningEffect: ISignalSubscription = {
    execute,
    dependencies: new Set(),
  };

  if (!registeredEffect) {
    registeredEffect = fn;
  }
  execute();
};

export const updateNamedSignal = (name: string, value: string) => {
  const subscribtions = namedSubscriptions.get(name);
  console.log('subscribtions', name, subscribtions);
  subscribtions?.forEach((s) => {
    if (s.name === name) {
      s.subscription.executeWithValue?.(value);
    }
  });
};
