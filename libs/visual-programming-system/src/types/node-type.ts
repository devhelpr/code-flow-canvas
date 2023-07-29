export const NodeType = {
  Shape: 'Shape', // ShapeNode
  Connection: 'Connection', // Connection
  Connector: 'Connector', // Thumb on a ShapeNode which can be connected to a Connection
  ConnectionController: 'ConnectionController', // Thumb on a connection for controlling the curve and (re)connecting the start and endpoints
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];
