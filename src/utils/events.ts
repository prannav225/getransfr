type EventCallback = (detail: any) => void;

class EventBus {
    emit(event: string, detail?: any) {
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

// Standardized Event Names
export const EVENTS = {
    // UI/Signaling
    FILE_TRANSFER_REQUEST: 'file-transfer-request',
    TEXT_TRANSFER_REQUEST: 'text-transfer-request',
    FILE_TRANSFER_ERROR: 'file-transfer-error',
    FILE_TRANSFER_COMPLETE: 'file-transfer-complete',
    
    // Core Transfer Events (Receiver)
    FILE_TRANSFER_START: 'file-transfer-start',
    FILE_TRANSFER_PROGRESS: 'file-transfer-progress',
    
    // Core Transfer Events (Sender)
    TRANSFER_STATS_UPDATE: 'transfer-stats-update',
    
    // Control
    TRANSFER_CANCEL: 'file-transfer-cancel',
    // New features
    CLIPBOARD_RICH: 'clipboard-rich',
    CONFLICT_REQUEST: 'conflict-request',
};
