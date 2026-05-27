import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {
  async emitEvent(event, payload) {
    console.log(`[SubscriptionEvent] ${event}`, JSON.stringify(payload, (key, val) =>
      typeof val === 'object' && val !== null && key !== 'passwordHash' ? val : undefined
    ));
    this.emit(event, payload);
  }
}

export const notificationService = new NotificationService();
