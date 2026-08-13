import { TransferHistoryItem } from "@/components/modals/TransferHistoryModal";

export const addToHistory = (item: Omit<TransferHistoryItem, "id" | "timestamp">) => {
  try {
    const saved = localStorage.getItem("transfer_history");
    const history: TransferHistoryItem[] = saved ? JSON.parse(saved) : [];
    
    const newItem: TransferHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    history.unshift(newItem); // put latest at top
    localStorage.setItem("transfer_history", JSON.stringify(history));
    
    // Dispatch custom event to trigger React re-renders across the app
    window.dispatchEvent(new Event("transfer_history_updated"));
  } catch (e) {
    console.error("Failed to add to history", e);
  }
};
