import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InputService } from '../input.service';
import { CommonModule } from '@angular/common';
import { ProjectdataService } from '../projectdata.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  rollNumber: string = '';
  name: string = '';
  branchCode: string = '';
  yearCode: string = '';
  degreeCode: string = '';
  roll: string = '';
  branch: string = '';
  year: string='';
  sem: string='';
  degree: string='';

  selectedTab: string = 'all';

  // allProjects: string[] = ['Project A', 'Project B', 'Project C', 'Project D'];
  // eligibleProjects: string[] = ['Project A', 'Project C'];
  // appliedProjects: string[] = ['Project B'];
  allProjects: { name: string, professor: string, branch: string[], year: number[], description: string }[] = [];
  eligibleProjects: string[] = [];
  appliedProjects: string[] = [];

  selectedProject: string | null = null; // Stores the currently expanded project

  constructor(private route: ActivatedRoute, private dataService: InputService, private projectService: ProjectdataService ) {}

  ngOnInit() {
    this.name = this.dataService.getData('name');
    this.rollNumber = this.dataService.getData('rollNumber');
    this.branch = this.dataService.getData('branch');
    this.year = this.dataService.getData('year');
    this.degree = this.dataService.getData('degree');
    this.sem = this.dataService.getData('semester');
    this.roll = this.dataService.getData('roll');


    const studentInfo = {
      branch: this.branch,
      degree: this.degree,
      year: 2025-parseInt(this.year),
      cgpa: 9.5  // Fetch actual CGPA dynamically if available
      // completedCourses: ['DSA'] // Fetch actual completed courses dynamically if available
    };
    console.log(studentInfo)
    this.allProjects = this.projectService.getAllProjects();
    this.eligibleProjects = this.projectService.getEligibleProjects(studentInfo);
    console.log("eligible",this.eligibleProjects)
    this.appliedProjects = this.projectService.getAppliedProjects();
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleProject(projectName: string) {
    this.selectedProject = this.selectedProject === projectName ? null : projectName;
  }



}
