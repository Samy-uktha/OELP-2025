import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InputService } from '../input.service';
import { CommonModule } from '@angular/common';
import { ProjectdataService } from '../projectdata.service';
import { Dept, Student, Project } from '../interfaces';

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
  branch: Dept = Dept.CE;
  year: string='';
  sem: string='';
  degree: string='';
  cgpa: number=0;

  selectedTab: string = 'all';


  allProjects: Project[] = [];
  eligibleProjects: Project[] = [];
  appliedProjects: string[] = [];

  selectedProject: string | null = null; // Stores the currently expanded project

  constructor(private route: ActivatedRoute, private dataService: InputService, private projectService: ProjectdataService ) {}

  ngOnInit() {
    this.name = this.dataService.getData('name');
    this.rollNumber = this.dataService.getData('rollNumber');
    this.branch = this.dataService.getData('branch') as Dept;
    this.year = this.dataService.getData('year');
    this.degree = this.dataService.getData('degree');
    this.sem = this.dataService.getData('semester');
    this.roll = this.dataService.getData('roll');
    this.cgpa = this.dataService.getData('cgpa');


    const studentInfo: Student = {
      name: this.name,
      roll: this.rollNumber,
      branch: this.branch,
      degree: this.degree,
      year: Number(2025-parseInt(this.year)),
      cgpa: this.cgpa,
      applied: [],
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

  get eligibleProjectDetails(): Project[] {
    return this.allProjects.filter(p =>
      this.eligibleProjects.some(ep => ep.name === p.name)
    );
  }

}
