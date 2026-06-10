import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, IDBPDatabase } from 'idb';
import { OfflineRecord } from '../models/offline-record.model';

const DB_NAME = 'offline-demo-db';
const STORE_NAME = 'records';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor() {
    if (this.isBrowser) {
      this.dbPromise = this.initDb();
    }
  }

  private initDb(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async addRecord(record: OfflineRecord): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put(STORE_NAME, record);
  }

  async getRecords(): Promise<OfflineRecord[]> {
    if (!this.dbPromise) return [];
    const db = await this.dbPromise;
    return db.getAll(STORE_NAME);
  }

  async updateRecord(record: OfflineRecord): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.put(STORE_NAME, record);
  }

  async removeRecord(id: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async clearRecords(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}
