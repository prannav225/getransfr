type EventCallback = (detail: any) => void;

class EventBus {
    emit(event: string, detail: any) {
        const customEvent = new CustomEvent(event, { detail });
        window.dispatchEvent(customEvent);
    }

    on(event: string, callback: EventCallback) {
        const handler = (e: Event) => callback((e as CustomEvent).detail);
        window.addEventListener(event, handler);
        return () => window.removeEventListener(event, handler);
    }
}

export const eventBus = new EventBus();

// Specific event constants
export const EVENTS = {
    FILE_TRANSFER_REQUEST: 'file-transfer-request',
    FILE_TRANSFER_ERROR: 'file-transfer-error',
    FILE_TRANSFER_COMPLETE: 'file-transfer-complete',
    TEXT_TRANSFER_REQUEST: 'text-transfer-request',
    TRANSFER_CANCEL: 'file-transfer-cancel',
};
