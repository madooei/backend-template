import { appEvents } from "./event-emitter";
import type { ServiceEventType } from "@/schemas/event.schema";
import { v4 as uuidv4 } from "uuid";

export abstract class BaseService {
  constructor(protected serviceName: string) {}

  protected emitEvent<T>(
    action: ServiceEventType["action"],
    data: T,
    options?: {
      id?: string;
      user?: { userId: string; [key: string]: unknown };
    },
  ) {
    const eventUser = options?.user
      ? {
          id: options.user.userId,
          ...options.user,
        }
      : undefined;

    appEvents.emitServiceEvent(this.serviceName, {
      id: options?.id || uuidv4(),
      action,
      data,
      user: eventUser,
      timestamp: new Date(),
      resourceType: this.serviceName,
    });
  }
}
