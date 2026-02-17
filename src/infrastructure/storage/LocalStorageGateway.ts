import type { StorageLike } from "./StorageLike";

export class LocalStorageGateway implements StorageLike {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}
