import { EventEmitter } from "events";
import type { ServiceEventType } from "@/schemas/event.schema";

class AppEventEmitter extends EventEmitter {
  emitServiceEvent(serviceName: string, event: ServiceEventType) {
    this.emit(`${serviceName}:${event.action}`, event);
  }
}

export const appEvents = new AppEventEmitter();
