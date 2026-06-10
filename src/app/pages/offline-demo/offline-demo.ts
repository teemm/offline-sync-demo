import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { SyncService } from '../../services/sync.service';
import { OfflineRecord } from '../../models/offline-record.model';

@Component({
  selector: 'app-offline-demo',
  imports: [ReactiveFormsModule],
  templateUrl: './offline-demo.html',
  styleUrl: './offline-demo.scss',
})
export class OfflineDemoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  readonly connectivity = inject(ConnectivityService);
  private readonly storage = inject(OfflineStorageService);
  readonly sync = inject(SyncService);

  readonly records = signal<OfflineRecord[]>([]);
  readonly message = signal<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    note: ['', Validators.required],
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRecords();
    }
  }

  async loadRecords(): Promise<void> {
    const records = await this.storage.getRecords();
    this.records.set(records);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    const { firstName, lastName, note } = this.form.getRawValue();
    const record: OfflineRecord = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      note,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Always save to IndexedDB first
    await this.storage.addRecord(record);
    await this.loadRecords();

    if (this.connectivity.online()) {
      this.showMessage('Record saved. Syncing...', 'success');
      await this.sync.sync();
      await this.loadRecords();
    } else {
      this.showMessage('Record queued for sync when online.', 'info');
    }

    this.form.reset();
  }

  async addFakeRecords(): Promise<void> {
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
    const notes = ['Follow up required', 'High priority', 'Pending review', 'Urgent', 'Low priority'];

    for (let i = 0; i < 5; i++) {
      const record: OfflineRecord = {
        id: crypto.randomUUID(),
        firstName: firstNames[i],
        lastName: lastNames[i],
        note: notes[i],
        createdAt: Date.now() + i,
        status: 'pending',
      };
      await this.storage.addRecord(record);
    }
    await this.loadRecords();
    this.showMessage('5 fake records added to queue.', 'info');
  }

  async generateRandomRecord(): Promise<void> {
    const firstNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Emma', 'Ava', 'Sophia', 'Mia'];
    const lastNames = ['Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen'];
    const notes = ['New lead', 'Callback scheduled', 'Demo requested', 'Contract sent', 'Awaiting response'];

    const record: OfflineRecord = {
      id: crypto.randomUUID(),
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      note: notes[Math.floor(Math.random() * notes.length)],
      createdAt: Date.now(),
      status: 'pending',
    };
    await this.storage.addRecord(record);
    await this.loadRecords();
    this.showMessage('Random record generated.', 'info');
  }

  async forceSync(): Promise<void> {
    await this.sync.sync();
    await this.loadRecords();
  }

  async clearQueue(): Promise<void> {
    await this.storage.clearRecords();
    await this.loadRecords();
    this.showMessage('Queue cleared.', 'warning');
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  private showMessage(text: string, type: 'success' | 'info' | 'warning'): void {
    this.message.set({ text, type });
    setTimeout(() => this.message.set(null), 3000);
  }
}
