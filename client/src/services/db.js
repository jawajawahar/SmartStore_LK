const DB_NAME = "SmartStorePOS";
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error("IndexedDB Open Error:", e.target.error);
      reject(e.target.error);
    };

    request.onsuccess = (e) => {
      resolve(e.target.result);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "_id" });
      }

      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "_id" });
      }

      if (!db.objectStoreNames.contains("pending_sales")) {
        db.createObjectStore("pending_sales", { keyPath: "_id" });
      }
    };
  });
};

// Generic helper to open transaction and store
const getStore = async (storeName, mode = "readonly") => {
  const db = await initDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

export const saveProducts = async (products) => {
  const store = await getStore("products", "readwrite");
  return new Promise((resolve, reject) => {
    // Clear old ones first to ensure freshness
    const clearRequest = store.clear();
    clearRequest.onerror = (e) => reject(e.target.error);

    clearRequest.onsuccess = () => {
      if (!products || products.length === 0) {
        resolve();
        return;
      }
      let count = 0;
      products.forEach((p) => {
        const req = store.put(p);
        req.onsuccess = () => {
          count++;
          if (count === products.length) resolve();
        };
        req.onerror = (e) => reject(e.target.error);
      });
    };
  });
};

export const getProducts = async () => {
  const store = await getStore("products", "readonly");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
};

export const saveCustomers = async (customers) => {
  const store = await getStore("customers", "readwrite");
  return new Promise((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onerror = (e) => reject(e.target.error);

    clearRequest.onsuccess = () => {
      if (!customers || customers.length === 0) {
        resolve();
        return;
      }
      let count = 0;
      customers.forEach((c) => {
        const req = store.put(c);
        req.onsuccess = () => {
          count++;
          if (count === customers.length) resolve();
        };
        req.onerror = (e) => reject(e.target.error);
      });
    };
  });
};

export const getCustomers = async () => {
  const store = await getStore("customers", "readonly");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
};

export const savePendingSale = async (sale) => {
  const store = await getStore("pending_sales", "readwrite");
  return new Promise((resolve, reject) => {
    const req = store.put(sale);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
};

export const getPendingSales = async () => {
  const store = await getStore("pending_sales", "readonly");
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
};

export const deletePendingSale = async (id) => {
  const store = await getStore("pending_sales", "readwrite");
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
};
