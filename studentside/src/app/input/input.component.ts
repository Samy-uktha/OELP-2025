import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputService } from '../input.service';
import { StudentService } from '../student.service';
import { Dept, Student } from '../interfaces';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
})
export class InputComponent {
  name: string = '';
  rollNumber: string = '';
  cgpa: number = 0;
  isNewStudent: boolean = false;  // Flag for new students
  errorMessage: string = '';

  constructor(private router: Router, private studentService: StudentService, private http: HttpClient) {}

  // Check if the student exists when roll number is entered
  // checkStudent() {
  //   if (this.rollNumber.length === 9) {
  //     this.studentService.getStudent(this.rollNumber).subscribe(
  //       (student) => {
  //         if (student.name === this.name) {
  //           this.isNewStudent = false;
  //           this.errorMessage = '';
  //         } else {
  //           this.errorMessage = 'Incorrect name or roll number.';
  //         }
  //       },
  //       (error) => {
  //         if (error.status === 404) {
  //           this.isNewStudent = true; // New student detected
  //           this.errorMessage = '';
  //         } else {
  //           this.errorMessage = 'Error checking student data.';
  //         }
  //       }
  //     );
  //   }
  // }

  // Form submission handling
  onSubmit(form: any) {
    if (!form.valid) return;
  
    const branchCode = this.rollNumber.substring(0, 2);
    const yearCode = this.rollNumber.substring(2, 4);
    const degreeCode = this.rollNumber.substring(4, 6);
    const roll = this.rollNumber.substring(6, 9);
  
    const branch: Dept = this.getBranch(branchCode);
    const year = '20' + yearCode;
    const degree = this.getDegree(degreeCode);
    const sem = this.getSem(yearCode);
  
    // Check if student exists
    this.studentService.getStudent(this.rollNumber).subscribe(
      (student) => {
        if (student && student.name === this.name) {
          // Existing student login
          this.storeStudentData(student, branch, year, degree, roll, sem);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Incorrect name or roll number.';
        }
      },
      (error) => {
        if (error.status === 404) {
          // Student not found → New student registration
          this.isNewStudent = true;
          this.registerNewStudent(branch, year, degree, roll, sem);
        } else {
          this.errorMessage = 'An error occurred while logging in.';
        }
      }
    );
  }
  
  registerNewStudent(branch: Dept, year: string, degree: string, roll: string, sem: string) {
    if (!this.name || !this.rollNumber || !this.cgpa) {
      this.errorMessage = 'Please enter all details.';
      return;
    }
  
    this.studentService.registerStudent(this.name, this.rollNumber, this.cgpa).subscribe(
      (response) => {
        alert(response.message);
        const newStudent: Student = {
          name: this.name,
          roll: this.rollNumber,
          cgpa: this.cgpa,
          applied: [],
          branch: branch,
          degree: degree,
          year: Number(year),
        };
        this.storeStudentData(newStudent, branch, year, degree, roll, sem);
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.errorMessage = error.error.message || 'Registration failed.';
      }
    );
  }
  
  // Store student details in InputService
  private storeStudentData(student: Student, branch: Dept, year: string, degree: string, roll: string, sem: string) {
    localStorage.setItem('student', JSON.stringify({
      name: student.name,
      rollNumber: student.roll,
      branch: branch,
      year: year,
      degree: degree,
      roll: roll,
      semester: sem,
      cgpa: student.cgpa,
      appliedProjects: student.applied || []
    }));
  }

  // Mapping functions for branch, degree, and semester
  public getBranch(code: string): Dept {
    const branchMap: { [key: string]: Dept } = {
      '10': Dept.CE,
      '11': Dept.CS,
      '12': Dept.EE,
      '13': Dept.ME,
      '14': Dept.DS
    };
    return branchMap[code] || Dept.CE;  // Default to CE if not found
  }

  public getDegree(code: string): string {
    const degreeMap: { [key: string]: string } = {
      '01': 'BTech',
      '02': 'MTech',
      '03': 'MS',
      '04': 'PhD',
    };
    return degreeMap[code] || 'Undefined';
  }

  public getSem(code: string): string {
    const semMap: { [key: string]: string } = {
      '21': '8',
      '22': '6',
      '23': '4',
      '24': '3',
    };
    return semMap[code] || 'Undefined';
  }
}
