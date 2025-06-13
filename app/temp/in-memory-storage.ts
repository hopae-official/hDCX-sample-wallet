class InMemoryStorage {
  private store = new Map<string, string>();

  async getItem(key: string) {
    return this.store.get(key) || null;
  }

  async setItem(key: string, value: string) {
    console.log("setItem", key, value);
    this.store.set(key, value);
  }

  async removeItem(key: string) {
    this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }

  async keys() {
    return Array.from(this.store.keys());
  }
}

export { InMemoryStorage };
