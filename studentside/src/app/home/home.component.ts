import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { projectService } from '../project.service';
import { Dept, Student, Project } from '../interfaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'home.component.html',
})
export class HomeComponent implements OnInit {
  roll: string = '';
  name: string = '';
  branch: Dept = Dept.CE;
  year: string = '';
  degree: string = '';
  cgpa: number = 0;
  applied: string[] = [];

  selectedTab: string = 'all';
  allProjects: Project[] = [];
  eligibleProjects: Project[] = [];
  selectedProject: string | null = null; // Stores the currently expanded project

  constructor(
    private route: ActivatedRoute,
    private projectService: projectService,
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
      this.applied = Array.isArray(studentData.applied) ? studentData.applied : [];
    } else {
      console.error('No student data found in localStorage');
    }

    console.log('Received student:', storedStudent);
    
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


  toggleDescription(projectName: string) {
    this.selectedProject = this.selectedProject === projectName ? null : projectName;
}


  toggleProject(projectName: string) {
    this.selectedProject = this.selectedProject === projectName ? null : projectName;
  }

  applyForProject(projectName: string, event: Event) {
    event.stopPropagation();

    if (!Array.isArray(this.applied)) {

      this.applied = []; 
    }


    if (!this.applied.includes(projectName)) {
      this.applied.push(projectName);

      // Update localStorage immediately
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
      .then(response => response.json())
      .then(updatedProjects => {
        console.log('Project applied successfully', updatedProjects);
        this.applied = Array.isArray(updatedProjects) ? updatedProjects : [];
        this.cdRef.detectChanges();
      })
      .catch(error => console.error('Error applying for project:', error));
    }
  }

  removeProject(projectName: string) {
    console.log('Removing project for roll:', this.roll, 'Project:', projectName);

    if (!Array.isArray(this.applied)) {

      this.applied = []; 
    }


    this.applied = this.applied.filter(p => p !== projectName);

    // Update localStorage
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const studentData = JSON.parse(storedStudent);
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
    .then(response => response.json())
    .then(updatedProjects => {
      console.log('Project removed successfully', updatedProjects);
      this.applied = Array.isArray(updatedProjects) ? updatedProjects : [];
      this.cdRef.detectChanges();
    })
    .catch(error => console.error('Error removing project:', error));
  }
}
