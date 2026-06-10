export interface OfflineRecord {
  id: string;
  firstName: string;
  lastName: string;
  note: string;
  createdAt: number;
  status: 'pending' | 'syncing';
}
