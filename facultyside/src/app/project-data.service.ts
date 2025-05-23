import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Student,Project, projApplication, Status, Faculty, Dept, Course  } from './interfaces';
import { HttpClient} from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ProjectDataService {
  
  constructor(private http : HttpClient) { }
  private apiUrl = 'http://localhost:5001';
  private courses: Course[] = [
    {
      courseId : 1,
      courseName : "Data Structures and algorithms",
      courseCode : "CS2025",
      credits : 3,


    },
    {
      courseId : 2,
      courseName : "Introduction to AI",
      courseCode : "DS2025",
      credits : 4,


    },
    {
      courseId : 3,
      courseName : "Machine Learning",
      courseCode : "DS4235",
      credits : 5,


    },
    {
      courseId : 4,
      courseName : "Probability and Statistics",
      courseCode : "MT1025",
      credits : 3,


    },

  ]

  private students: Student[] = [
    {
      studentId: "S101",
      name: "Alice Johnson",
      rollNumber: "CSE2201",
      branch: Dept.DS,
      semester: 4,
      cgpa: 3.8,
      completedCourses: []
    },
    {
      studentId: "S102",
      name: "Bob Williams",
      rollNumber: "DS2202",
      branch: Dept.DS,
      semester: 5,
      cgpa: 3.6,
      completedCourses: []
    }
  ];

  private facultyMembers: Faculty[] = [
    {
      facultyId: 201,
      name: "Dr. Emily Smith",
      password : "emily201",
      email: "emily.smith@university.edu",
      department: Dept.CS
    },
    {
      facultyId: 202,
      name: "Dr. James Brown",
      password : "James202",
      email: "james.brown@university.edu",
      department: Dept.DS
    }
  ];

  private projects: Project[] = [
    {
      projectId: 301,
      facultyId: 201,
      title: "AI-Powered Chatbot",
      description: "Develop a chatbot using NLP techniques and deep learning.",
      eligibilityCriteria: {
        requiredCourses: [],
        minCgpa: 3.5,
        departments: [Dept.CS, Dept.DS],
        minSemester: 4
      },
      slotsAvailable: 2,
      studentsPerTeam: 3
    },
    {
      projectId: 302,
      facultyId: 202,
      title: "Blockchain-Based Voting System",
      description: "A secure and transparent voting system leveraging blockchain technology.",
      eligibilityCriteria: {
        requiredCourses: [],
        minCgpa: 3.7,
        departments: [Dept.CS, Dept.EE],
        minSemester: 5
      },
      slotsAvailable: 3,
      studentsPerTeam: 2
    }
  ];

  private applications: projApplication[] = [
    {
      applicationId: 401,
      students: [this.students[0]],
      projectId: 301,
      status: Status.PENDING,
      docs: [{ name: "Resume_Alice.pdf", url: "https://example.com/resume_alice.pdf" }],
      timestamp: new Date("2025-02-10T10:30:00Z"),
      facultyComments: undefined
    },
    {
      applicationId: 402,
      students: [this.students[1]],
      projectId: 302,
      status: Status.APPROVED,
      docs: [{ name: "Resume_Bob.pdf", url: "https://example.com/resume_bob.pdf" }],
      timestamp: new Date("2025-02-11T12:45:00Z"),
      facultyComments: "Strong application, approved."
    }
  ];

  // Service methods to return mock data as observables
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/students`);
  }

  getFaculty(): Observable<Faculty[]> {
    return of(this.facultyMembers);
  }

  getProjects(): Observable<Project[]> {
    return of(this.projects);
  }

  getApplications(): Observable<projApplication[]> {
    return of(this.applications);
  }

  getStudentCourses(studentId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/students/${studentId}/courses`);
  }

  getCourses() : Observable<Course[]>{
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }
}
