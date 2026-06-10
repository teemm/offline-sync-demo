import { Injectable, signal, PLATFORM_ID, inject, OnDestroy, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _online = signal<boolean>(this.isBrowser ? navigator.onLine : true);
  private readonly _online$ = new BehaviorSubject<boolean>(this._online());

  readonly online = this._online.asReadonly();
  readonly online$: Observable<boolean> = this._online$.asObservable();

  private onlineHandler = () => this.ngZone.run(() => this.updateStatus(true));
  private offlineHandler = () => this.ngZone.run(() => this.updateStatus(false));

  constructor() {
    if (this.isBrowser) {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  private updateStatus(online: boolean): void {
    this._online.set(online);
    this._online$.next(online);
  }
}
