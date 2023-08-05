export const ThumbType = {
  Start: 'Start',
  End: 'End',
  ControlPoint: 'ControlPoint',
  TopLeft: 'TopLeft',
  TopRight: 'TopRight',
  BottomLeft: 'BottomLeft',
  BottomRight: 'BottomRight',
  StartConnectorRight: 'StartConnectorRight',
  EndConnectorLeft: 'EndConnectorLeft',
  StartConnectorLeft: 'StartConnectorLeft',
  EndConnectorRight: 'EndConnectorRight',
  StartConnectorTop: 'StartConnectorTop',
  EndConnectorTop: 'EndConnectorTop',
  StartConnectorBottom: 'StartConnectorBottom',
  EndConnectorBottom: 'EndConnectorBottom',
  StartConnectorCenter: 'StartConnectorCenter',
  EndConnectorCenter: 'EndConnectorCenter',
  Center: 'Center',
} as const;

export type ThumbType = (typeof ThumbType)[keyof typeof ThumbType];
