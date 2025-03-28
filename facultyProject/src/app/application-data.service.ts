import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { application, preference } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationDataService {
  apiUrl = 'http://localhost:5001/get_applications'
  apiUrl_update = 'http://localhost:5001/applications'
  apiUrl_pref = 'http://localhost:5001/savepref'
  apiUrl_pref_past = 'http://localhost:5001/preferences'
  apiUrl_alloc = 'http://localhost:5001/Allocations'
  constructor(private http: HttpClient) { }

  getApplications(id : number): Observable<application[]> {
      return this.http.get<application[]>(`${this.apiUrl}/${id}`).pipe(
        map((data: any[]) =>
          data.map((application) => ({
            application_id : application.application_id,
            name : application.name,
            cgpa : application.cgpa,
            roll_no : application.roll_no,
            status : application.status,
            bio : application.bio,
            department : application.dept_name,
            application_date : application.application_date,
            documents : application.documents
          }) as application)
        )
      );
    }

    updateApplicationStatus(applicationId: number, newStatus: string): Observable<any> {
      // console.log("status ---- ",newStatus);
      return this.http.patch(`${this.apiUrl_update}/${applicationId}`, { status: newStatus });
    }

    savePreferences(preferences: any[]): Observable<any> {
      return this.http.post(this.apiUrl_pref, { preferences });
    }

    getAllocations(id : number): Observable<application[]>{
      return this.http.get<application[]>(`${this.apiUrl_alloc}/${id}`).pipe(
        map((data: any[]) =>
          data.map((application) => ({
            application_id : application.application_id,
            name : application.name,
            cgpa : application.cgpa,
            roll_no : application.roll_no,
            status : application.status,
            bio : application.bio,
            department : application.dept_name,
            application_date : application.application_date,
          }) as application)
        )
      );
    }
getPref(id : number):Observable<preference[]>{
  return this.http.get<preference[]>(`${this.apiUrl_pref_past}/${id}`).pipe(
    map((data: any[]) =>
      data.map((pref) => ({
        name : pref.name,
        rank : pref.rank
      }) as preference)
    )
  );
}

    }




