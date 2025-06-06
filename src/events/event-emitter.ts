import { EventEmitter } from "events";

export interface ServiceEvent<T = unknown> {
  action: "created" | "updated" | "deleted";
  data: T;
  id?: string | number;
  user?: { id: string; [key: string]: unknown };
  visibility?: "public" | "private" | "team";
  ownerId?: string;
  timestamp: Date;
}

class AppEventEmitter extends EventEmitter {
  emitServiceEvent<T>(serviceName: string, event: ServiceEvent<T>) {
    this.emit(`${serviceName}:${event.action}`, event);
  }
}

export const appEvents = new AppEventEmitter();
