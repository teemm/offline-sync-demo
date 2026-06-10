import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ConnectivityService } from './connectivity.service';
import { OfflineStorageService } from './offline-storage.service';
import { OfflineRecord } from '../models/offline-record.model';

export type SyncStatus = 'idle' | 'syncing' | 'completed';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly connectivity = inject(ConnectivityService);
  private readonly storage = inject(OfflineStorageService);
  private readonly destroyRef = inject(DestroyRef);

  private isSyncing = false;

  readonly syncStatus = signal<SyncStatus>('idle');
  readonly currentIndex = signal<number>(0);
  readonly totalCount = signal<number>(0);
  readonly currentRecord = signal<OfflineRecord | null>(null);

  constructor() {
    this.connectivity.online$
      .pipe(
        filter((online) => online),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.sync();
      });
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;

    const records = await this.storage.getRecords();
    const pendingRecords = records.filter((r) => r.status === 'pending' || r.status === 'syncing');

    if (pendingRecords.length === 0) return;

    this.isSyncing = true;
    this.syncStatus.set('syncing');
    this.totalCount.set(pendingRecords.length);

    for (let i = 0; i < pendingRecords.length; i++) {
      const record = pendingRecords[i];
      this.currentIndex.set(i + 1);
      this.currentRecord.set(record);

      // Update status to syncing
      record.status = 'syncing';
      await this.storage.updateRecord(record);

      // Simulated API call
      console.log('Record ready for save', record);
      await this.delay(1000);

      // Remove after successful sync
      await this.storage.removeRecord(record.id);
    }

    this.syncStatus.set('completed');
    this.currentRecord.set(null);
    this.isSyncing = false;

    // Reset to idle after a brief display of completion
    setTimeout(() => {
      if (this.syncStatus() === 'completed') {
        this.syncStatus.set('idle');
        this.currentIndex.set(0);
        this.totalCount.set(0);
      }
    }, 2000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
