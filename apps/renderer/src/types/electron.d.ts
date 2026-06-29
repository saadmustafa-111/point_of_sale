export {};

declare global {
  type PrintReceiptPayload = {
    html: string;
    printerName?: string;
    silent?: boolean;
    width?: '58mm' | '80mm' | 'a4';
    copies?: number;
  };

  type PrinterSettings = {
    defaultPrinter: string;
    silentPrint: boolean;
    autoPrint: boolean;
  };

  type PrinterInfo = {
    name: string;
    displayName?: string;
    description?: string;
    isDefault?: boolean;
    status?: number;
  };

  type ElectronPOSApi = {
    getApiUrl: () => Promise<string | null>;
    printReceipt: (payload: PrintReceiptPayload | string, options?: { silent?: boolean; deviceName?: string; printerName?: string; width?: '58mm' | '80mm' | 'a4'; copies?: number }) => Promise<{ success: boolean; error?: string; reason?: string }>;
    getPrinters: () => Promise<PrinterInfo[]>;
    getPrinterSettings: () => Promise<PrinterSettings>;
    setPrinterSettings: (settings: PrinterSettings) => Promise<PrinterSettings>;
    printTestPage: (payload: Omit<PrintReceiptPayload, 'html'>) => Promise<{ success: boolean; error?: string }>;
    platform: string;
  };

  interface Window {
    electron?: ElectronPOSApi;
    electronAPI?: ElectronPOSApi;
  }
}
