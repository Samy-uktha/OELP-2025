import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { application } from './models';

@Injectable({
  providedIn: 'root'
})
export class ApplicationDataService {
  apiUrl = 'http://localhost:5001/get_applications'
  apiUrl_update = 'http://localhost:5001/applications'
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

    }


