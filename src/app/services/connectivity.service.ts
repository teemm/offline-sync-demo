import { Injectable, signal, PLATFORM_ID, inject, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _online = signal<boolean>(this.isBrowser ? navigator.onLine : true);
  readonly online = this._online.asReadonly();

  constructor() {
    if (this.isBrowser) {
      const onlineHandler = () => this._online.set(true);
      const offlineHandler = () => this._online.set(false);

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
      });
    }
  }
}
