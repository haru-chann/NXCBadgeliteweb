export const isNFCSupported = (): boolean => {
  return 'NDEFReader' in window;
};

export const startNFCScan = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isNFCSupported()) {
      reject(new Error("NFC is not supported on this device"));
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      
      ndef.scan().then(() => {
        ndef.addEventListener("reading", (event: any) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            if (record.recordType === "url") {
              const profileUrl = decoder.decode(record.data);
              resolve(profileUrl);
              return;
            } else if (record.recordType === "text") {
              // Fallback for legacy text records
              const tagId = decoder.decode(record.data);
              resolve(tagId);
              return;
            }
          }
          reject(new Error("No valid NFC data found"));
        });
      }).catch((error: any) => {
        reject(new Error(`NFC scan failed: ${error.message}`));
      });
    } catch (error) {
      reject(new Error("Failed to initialize NFC scanner"));
    }
  });
};

export const writeNFCTag = (profileUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isNFCSupported()) {
      reject(new Error("NFC is not supported on this device"));
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      
      ndef.write({
        records: [{ recordType: "url", data: profileUrl }]
      }).then(() => {
        resolve();
      }).catch((error: any) => {
        reject(new Error(`NFC write failed: ${error.message}`));
      });
    } catch (error) {
      reject(new Error("Failed to initialize NFC writer"));
    }
  });
};
