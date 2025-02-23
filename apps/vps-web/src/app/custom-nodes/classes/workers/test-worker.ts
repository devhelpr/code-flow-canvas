/// <reference lib="webworker" />

// Worker context type declaration
declare const self: DedicatedWorkerGlobalScope;

// Message event handler
self.addEventListener('message', (event: MessageEvent) => {
  const { data } = event;

  // Example computation
  const result = processData(data);

  // Send the result back to the main thread
  self.postMessage({
    type: 'computation-result',
    payload: result,
  });
});

// Example processing function
function processData(data: any) {
  // Simulate some computation
  const startTime = Date.now();

  // Simple example: if data is a number, double it
  // If it's a string, reverse it
  let result;
  if (typeof data === 'number') {
    result = data * 2;
  } else if (typeof data === 'string') {
    result = data.split('').reverse().join('');
  } else {
    result = data;
  }

  // Add processing time to result
  return {
    originalData: data,
    processedData: result,
    processingTime: Date.now() - startTime,
  };
}

// Error handling
self.addEventListener('error', (error) => {
  console.log('Worker error:', error.message);
  self.postMessage({
    type: 'error',
    payload: error.message,
  });
});

export {}; // Add export to make this a module
