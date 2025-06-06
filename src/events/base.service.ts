import { appEvents } from "./event-emitter";
import type { ServiceEvent } from "./event-emitter";

export abstract class BaseService {
  constructor(protected serviceName: string) {}

  protected emitEvent<T>(
    action: ServiceEvent<T>["action"],
    data: T,
    options?: {
      id?: string | number;
      user?: { id: string; [key: string]: unknown };
      visibility?: "public" | "private" | "team";
      ownerId?: string;
    },
  ) {
    appEvents.emitServiceEvent(this.serviceName, {
      action,
      data,
      timestamp: new Date(),
      ...options,
    });
  }
}
