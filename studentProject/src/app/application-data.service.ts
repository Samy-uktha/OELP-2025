import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { preference } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApplicationDataService {
  private apiUrl_pref = 'http://localhost:5001/savepref';
  private apiUrl_pref_past = 'http://localhost:5001/preferences';

  constructor(private http: HttpClient) {}

  // Fetch student's saved preferences
  getPref(id: number): Observable<preference[]> {
    return this.http.get<preference[]>(`${this.apiUrl_pref_past}/${id}`);
  }

  // Save updated preferences to database
  savePreferences(studentId: number, preferences: preference[]): Observable<any> {
    return this.http.post(this.apiUrl_pref, { studentId, preferences });
  }
  
}

