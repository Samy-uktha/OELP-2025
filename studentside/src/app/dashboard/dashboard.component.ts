import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InputService } from '../input.service';
import { CommonModule } from '@angular/common';
import { ProjectdataService } from '../projectdata.service';
import { Dept, Student, Project } from '../interfaces';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  roll: string = '';
  name: string = '';
  branchCode: string = '';
  yearCode: string = '';
  degreeCode: string = '';
  // roll: string = '';
  branch: Dept = Dept.CE;
  year: string='';
  sem: string='';
  degree: string='';
  cgpa: number=0;

  selectedTab: string = 'all';


  allProjects: Project[] = [];
  eligibleProjects: Project[] = [];
  applied: string[] = [];

  selectedProject: string | null = null; // Stores the currently expanded project

  constructor(
    private route: ActivatedRoute, 
    private dataService: InputService, 
    private projectService: ProjectdataService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {

    const storedStudent = localStorage.getItem('student');
  if (storedStudent) {
    const studentData: Student = JSON.parse(storedStudent);
    
    this.name = studentData.name;
    this.roll = studentData.roll;
    this.branch = studentData.branch;
    this.year = studentData.year.toString();
    this.degree = studentData.degree;
    this.cgpa = studentData.cgpa;
    this.applied = studentData.applied || [];
  } else {
    console.error("No student data found in localStorage");
  }

  console.log("received student", storedStudent)
  // Fetch projects
  this.allProjects = this.projectService.getAllProjects();
  this.eligibleProjects = this.projectService.getEligibleProjects({
    name: this.name,
    roll: this.roll,
    branch: this.branch,
    degree: this.degree,
    year: Number(this.year),
    cgpa: this.cgpa,
    applied: this.applied,
  });
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleProject(projectName: string) {
    this.selectedProject = this.selectedProject === projectName ? null : projectName;
  }

  get eligibleProjectDetails(): Project[] {
    return this.allProjects.filter(p =>
      this.eligibleProjects.some(ep => ep.name === p.name)
    );
  }

  applyForProject(projectName: string, event: Event) {
    event.stopPropagation();

    if (!this.applied.includes(projectName)) {
      this.applied.push(projectName);
  
      // Update localStorage immediately for UI consistency
      const storedStudent = localStorage.getItem('student');
      if (storedStudent) {
        const studentData: Student = JSON.parse(storedStudent);
        studentData.applied = this.applied;
        localStorage.setItem('student', JSON.stringify(studentData));
      }
  
      // Send update request to Flask backend
      fetch('http://127.0.0.1:5000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll: this.roll,
          projectName: projectName
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to apply for project');
        }
        return response.json();
      })
      .then(updatedProjects => {
        console.log('Project applied successfully', updatedProjects);
    
        // Update local applied projects list immediately
        this.applied = updatedProjects;
    
        // Trigger UI update
        this.cdRef.detectChanges();
      })
      .catch(error => {
        console.error('Error applying for project:', error);
      });
    }
  }


  removeProject(projectName: string) {
    console.log("Removing project for roll:", this.roll, "Project:", projectName);

    // Remove from local applied list
    this.applied = this.applied.filter(p => p !== projectName);
  
    // Update localStorage
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const studentData: Student = JSON.parse(storedStudent);
      studentData.applied = this.applied;
      localStorage.setItem('student', JSON.stringify(studentData));
    }
  
    // Send delete request to Flask backend
    fetch('http://127.0.0.1:5000/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roll: this.roll,
        projectName: projectName
      })
    })
    .then(response => {
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error('Failed to remove project');
      }
      return response.json();
    })
    .then(updatedProjects => {
      console.log('Project removed successfully', updatedProjects);
      this.applied = updatedProjects;  // Update UI after successful response
      this.cdRef.detectChanges();
    })
    .catch(error => {
      console.error('Error removing project:', error);
    });
  }
  
  
}
  