import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  getStudent(rollNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${rollNumber}`);
  }

  registerStudent(student: Student): Observable<{ message: string }>{
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`,student);
  }

  applyForProject(rollNumber: string, project: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, { rollNumber, project });
  }
}



