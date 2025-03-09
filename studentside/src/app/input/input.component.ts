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
  roll: string = '';
  cgpa: number = 0;
  isNewStudent: boolean = false;  // Flag for new students
  errorMessage: string = '';

  constructor(private router: Router, private studentService: StudentService, private http: HttpClient) {}

  // Extract details from roll number
  extractStudentDetails(roll: string) {
    const branchCode = roll.substring(0, 2);
    const yearCode = roll.substring(2, 4);
    const degreeCode = roll.substring(4, 6);
    // const roll = roll.substring(6, 9);

    return {
      branch: this.getBranch(branchCode),
      year: 2025 -  Number('20' + yearCode), // Ensure year is a number
      degree: this.getDegree(degreeCode),
      // sem: Number(this.getSem(yearCode)),
      roll,
    };
  }

  // Check if the student exists when roll number is entered
  checkStudent() {
    if (this.roll.length === 9) {
      this.studentService.getStudent(this.roll).subscribe(
        (student) => {
          if (student.name === this.name) {
            this.isNewStudent = false;
            this.cgpa = student.cgpa;
            this.errorMessage = '';
          } else {
            this.errorMessage = 'Incorrect name or roll number.';
          }
        },
        (error) => {
          if (error.status === 404) {
            this.isNewStudent = true; // New student detected
            this.cgpa = 0;
            this.errorMessage = '';
          } else {
            this.errorMessage = 'Error checking student data.';
          }
        }
      );
    }
  }

  // Form submission handling
  onSubmit(form: any) {
    if (!form.valid) return;

    const details = this.extractStudentDetails(this.roll);

    // Check if student exists
    this.studentService.getStudent(this.roll).subscribe(
      (student) => {
        if (student && student.name === this.name) {
          // Existing student login
          this.storeStudentData(student);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Incorrect name or roll number.';
        }
      },
      (error) => {
        if (error.status === 404) {
          // Student not found → New student registration
          this.isNewStudent = true;
          this.registerNewStudent(details);
        } else {
          this.errorMessage = 'An error occurred while logging in.';
        }
      }
    );
  }
  
  registerNewStudent(details: {branch: Dept, degree: string, roll: string, year: number}) {
    if (!this.name || !this.roll || !this.cgpa) {
      this.errorMessage = 'Please enter all details.';
      return;
    }
  
    const newStudent: Student = {
      name: this.name,
      roll: this.roll,
      cgpa: this.cgpa,
      branch: details.branch,
      degree: details.degree,
      year: details.year,
      // sem: details.sem,
      applied: [], // Initialize applied projects as empty array
    };

    console.log("registering new student",newStudent)
  
    this.studentService.registerStudent(newStudent).subscribe(
      (response) => {
        alert(response.message);
        this.storeStudentData(newStudent);
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.errorMessage = error.error?.message || 'Registration failed.';
      }
    );
  }
  
  
  // Store student details in InputService
  private storeStudentData(student: Student) {
    console.log("storing student data", student)

    localStorage.setItem('student', JSON.stringify({
      name: student.name,
      roll: student.roll,
      branch: student.branch,
      year: student.year,
      degree: student.degree,
      // semester: student.sem,
      cgpa: student.cgpa,
      applied: student.applied || []
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


