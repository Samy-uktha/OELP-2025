import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputService {
  private data: { [key: string]: any } = {}; // Object to store key-value pairs

  // Method to store data by key
  setData(key: string, value: any): void {
    this.data[key] = value;
  }

  // Method to retrieve data by key
  getData(key: string): any {
    return this.data[key];
  }

  // Method to clear specific data by key
  clearData(key: string): void {
    delete this.data[key];
  }

  // Clear all data
  clearAll(): void {
    this.data = {};
  }
}
