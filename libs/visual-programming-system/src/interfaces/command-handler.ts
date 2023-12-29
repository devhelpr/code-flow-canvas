export interface CommandHandler {
  execute: (command: string, data: any) => void;
}
