import { v4 as uuid } from 'uuid';

export const hasIndexedDB = () => {
    if (!window.indexedDB) return false;
    else return true;
};

export const addDataToIndexedDB = async (data, dbName, tableName) => {
    if (!hasIndexedDB()) throw new Error('There is no indexedDB in this browser');
    let db = null;
    const version = (await window.indexedDB.databases()).find(database => database.name === dbName)?.value;
    const req = window.indexedDB.open(dbName, version ? version + 1 : 1);

    req.onerror = event => {
        throw new Error('Open request is failed');
    };

    req.onsuccess = event => {
        db = event.target.result;
    };

    req.onupgradeneeded = event => {
        db = event.target.result;
        const transaction = event.target.transaction;

        let objectStore = null;
        try {
            objectStore = transaction.objectStore(tableName);
        } catch (e) {
            const os = db.createObjectStore(tableName, {keyPath: 'key'});
            objectStore = transaction.objectStore(tableName);
        }

        objectStore.transaction.oncomplete = event => {
            const keyOfIndexedDB = uuid();
            const tokenListObjectStore = db.transaction(tableName, "readwrite").objectStore(tableName);
            tokenListObjectStore.add({
                ...data,
                key: keyOfIndexedDB,
            });
            return keyOfIndexedDB;
        };
    };
};

export const getDataFromIndexedDB = (key, dbName, tableName) => new Promise (async (resolve, reject) => {
    if (!hasIndexedDB()) return reject({
        success: false,
        payload: new Error('There is no indexedDB in this browser'),
    });

    let db = null;
    const version = (await window.indexedDB.databases()).find(database => database.name === dbName)?.value;
    const req = window.indexedDB.open(dbName, version || 1);

    req.onerror = event => {
        return reject({
            success: false,
            payload: new Error('Open request is failed'),
        });
    };

    req.onsuccess = event => {
        db = event.target.result;
        const transaction = db.transaction([tableName]);
        const objectStore = transaction.objectStore(tableName);
        
        const req2 = objectStore.get(key);

        req2.onerror = event => {
            return reject({
                success: false,
                payload: new Error('Transaction request is failed'),
            });
        };

        req2.onsuccess = event => {
            return resolve({
                success: true,
                payload: event.target.result,
            });
        };
    };
});