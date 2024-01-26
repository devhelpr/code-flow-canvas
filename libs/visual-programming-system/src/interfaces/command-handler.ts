export interface ICommandHandler {
  execute: (
    //commandRegistry: Map<string, ICommandHandler<T>>,
    command: string,
    data: any
  ) => void;
}
