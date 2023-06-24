import { Flow } from '@devhelpr/visual-programming-system';
import { type } from 'os';
import { NodeInfo } from '../types/node-info';

const getNewId = () => {
  return crypto.randomUUID();
};
const defaultflowId = '00000000-0000-0000-0000-000000000000';

let defaultFlow = '';
let defaultFlowTitle = 'Example flow';
let _flowName = 'flow';

interface ITransaction {
  flowId: string;
  flow: Flow<NodeInfo>;
  name: string;
}

let isProcessing = false;
const transactions: ITransaction[] = [];

function storeTransaction(store: IDBObjectStore, transaction: ITransaction) {
  const objectRequest = store.put(
    {
      flow: transaction?.flow,
      flowId: transaction?.flowId,
      name: transaction?.name,
    },
    transaction?.flowId
  );

  objectRequest.onerror = function (event) {
    console.log('handleTransactions error', event);
  };

  objectRequest.onsuccess = function (event) {
    if (objectRequest.result) {
      isProcessing = false;
      handleTransactions();
    } else {
      console.log('handleTransactions error in  onsuccess', event);
    }
  };
}

function handleTransactions() {
  console.log(
    'handleTransactions',
    isProcessing,
    transactions.length,
    database
  );

  if (!isProcessing && transactions.length > 0 && database) {
    isProcessing = true;
    const transaction = transactions.shift();
    if (!transaction) {
      console.log('No transaction in handleTransactions');
      return;
    }
    const tx = database.transaction([flowStoreName], 'readwrite');
    const store = tx.objectStore(flowStoreName);

    const getRequest = store.get(transaction?.flowId);

    getRequest.onerror = function (event) {
      storeTransaction(store, transaction);
    };

    getRequest.onsuccess = function (event) {
      if (getRequest.result) {
        transaction.name = getRequest.result.name;
      }
      storeTransaction(store, transaction);
    };
  }
}

function exampleFlow() {
  if (defaultFlow !== '') {
    return defaultFlow;
  }

  return `{}`;
}

function saveFlow(flowId: string, flow: Flow<NodeInfo>) {
  return new Promise((resolve, reject) => {
    console.log('Saving flow', flowId, flow);

    transactions.push({
      flowId,
      flow,
      name: `Flow ${flowId}`,
    });
    console.log('Saving flow', transactions);
    handleTransactions();
    resolve(true);
  });
}

function getFlows() {
  console.log('getFlows');
  return new Promise<any>((resolve, reject) => {
    if (!database) {
      reject('No database');
      return;
    }

    const transaction = database.transaction([flowStoreName]);
    const objectStore = transaction.objectStore(flowStoreName);
    const objectRequest = objectStore.getAll();

    objectRequest.onerror = function (event) {
      reject(Error('Error text'));
    };

    objectRequest.onsuccess = function (event) {
      if (objectRequest.result) {
        console.log('getall', objectRequest.result);
        if (objectRequest.result.length > 0) {
          resolve(
            objectRequest.result.map((item) => {
              return {
                name: item.name,
                id: item.flowId,
              };
            })
          );
        } else {
          resolve([
            {
              id: defaultflowId,
              name: defaultFlowTitle,
            },
          ]);
        }
      } else reject(Error('object not found'));
    };
    /*
    var flowAsString = localStorage.getItem('flow-' + flowId);
    if (flowAsString) {
      resolve(JSON.parse(flowAsString));
    }
    resolve(JSON.parse(getDefaultFlow()));
    */
  });
} /*
  var flowsAsString = localStorage.getItem('flows');
  if (flowsAsString) {
    return JSON.parse(flowsAsString);
  }
  return getDefaultFlows();
}
*/

function getDefaultFlow() {
  return exampleFlow();
}

function getFlow(flowId: string) {
  return new Promise<Flow<NodeInfo>>((resolve, reject) => {
    if (!database) {
      reject('No database');
      return;
    }

    const transaction = database.transaction([flowStoreName]);
    const objectStore = transaction.objectStore(flowStoreName);
    const objectRequest = objectStore.get(flowId);

    objectRequest.onerror = function (event) {
      reject(Error('Error text'));
    };

    objectRequest.onsuccess = function (event) {
      if (objectRequest.result) {
        _flowName = objectRequest.result.name;
        resolve(objectRequest.result.flow as unknown as Flow<NodeInfo>);
      } else {
        const flow = JSON.parse(getDefaultFlow()) as unknown as Flow<NodeInfo>;
        transactions.push({
          flowId: flow.id,
          flow: flow,
          name: defaultFlowTitle,
        });

        _flowName = defaultFlowTitle;

        resolve(JSON.parse(getDefaultFlow()).flow as unknown as Flow<NodeInfo>);
      }
    };
    /*
    var flowAsString = localStorage.getItem('flow-' + flowId);
    if (flowAsString) {
      resolve(JSON.parse(flowAsString));
    }
    resolve(JSON.parse(getDefaultFlow()));
    */
  });
}

function addFlow(name: string, flow: Flow<NodeInfo>) {
  return new Promise((resolve, reject) => {
    if (!database) {
      reject();
      return;
    }
    const tx = database.transaction([flowStoreName], 'readwrite');
    const store = tx.objectStore(flowStoreName);

    const flowId = getNewId();

    const objectRequest = store.put(
      {
        flow: flow,
        flowId: flowId,
        name: name,
      },
      flowId
    );

    objectRequest.onerror = function (event) {
      console.log('handleTransactions error', event);
    };

    objectRequest.onsuccess = function (event) {
      if (objectRequest.result) {
        isProcessing = false;
        resolve({ id: flowId });
      } else {
        reject();
      }
    };
  });
}

function setFlowName(flowId: string, flowName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!database) {
      reject('No database');
      return;
    }

    const transaction = database.transaction([flowStoreName], 'readwrite');
    const objectStore = transaction.objectStore(flowStoreName);
    const objectRequest = objectStore.get(flowId);

    objectRequest.onerror = function (event) {
      reject(Error('Error text'));
    };

    objectRequest.onsuccess = function (event) {
      if (objectRequest.result) {
        const putObjectRequest = objectStore.put(
          {
            flow: objectRequest.result.flow,
            flowId: flowId,
            name: flowName,
          },
          flowId
        );

        putObjectRequest.onerror = function (event) {
          console.log('handleTransactions error', event);
        };

        putObjectRequest.onsuccess = function (event) {
          _flowName = flowName;
          if (putObjectRequest.result) {
            resolve(flowId);
          } else {
            reject();
          }
        };
      } else {
        reject(Error('Flow not found'));
      }
    };
  });
}

function getFlowName() {
  return _flowName;
}

export const setDefaultFlowTitle = (title: string) => {
  defaultFlowTitle = title;
};

export const setDefaultFlow = (id: string, flow: any[]) => {
  defaultFlow = JSON.stringify({
    flow: flow,
    name: id,
    flowType: 'playground',
    id: id,
  });
};

export const flowrunnerIndexedDbStorageProvider = {
  getFlows: getFlows,
  getFlow: getFlow,
  saveFlow: saveFlow,
  addFlow: addFlow,
  isReadOnly: false,
  setFlowName: setFlowName,
  getFlowName: getFlowName,
};

export type FlowrunnerIndexedDbStorageProvider =
  typeof flowrunnerIndexedDbStorageProvider;

let database: IDBDatabase | null = null;

const flowStoreDBName = 'flowrunner-flow-store';
const flowStoreName = 'flowStore';

export const createIndexedDBStorageProvider = () => {
  return new Promise<FlowrunnerIndexedDbStorageProvider>((resolve, reject) => {
    const idb = window.indexedDB;

    const dbRequest = idb.open(flowStoreDBName, 1);

    if (!dbRequest) {
      reject(new Error('createIndexedDBStorageProvider failed'));
    }

    dbRequest.onupgradeneeded = function (event) {
      if (!event || !event.target || !(event.target as any).result) {
        reject(new Error('No event target'));
      }

      database = (event.target as any).result as IDBDatabase;
      database.createObjectStore(flowStoreName, {
        autoIncrement: true,
      });
    };

    dbRequest.onsuccess = (event) => {
      if (!event || !event.target || !(event.target as any).result) {
        reject(new Error('No event target'));
      }
      database = (event.target as any).result as IDBDatabase;

      resolve(flowrunnerIndexedDbStorageProvider);
    };

    dbRequest.onerror = (event) => {
      reject();
    };
  });
};
