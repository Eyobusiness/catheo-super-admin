import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly activeRequestsCount = signal<number>(0);

  public readonly isLoading = computed<boolean>(() => this.activeRequestsCount() > 0);

  /**
   * Increments active loading operations.
   */
  public start(): void {
    this.activeRequestsCount.update((count) => count + 1);
  }

  /**
   * Decrements active loading operations.
   */
  public stop(): void {
    this.activeRequestsCount.update((count) => Math.max(0, count - 1));
  }

  /**
   * Resets loading state immediately.
   */
  public reset(): void {
    this.activeRequestsCount.set(0);
  }
}
