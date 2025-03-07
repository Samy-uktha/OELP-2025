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
  appliedProjects: string[] = [];

  selectedProject: string | null = null; // Stores the currently expanded project

  constructor(private route: ActivatedRoute, private dataService: InputService, private projectService: ProjectdataService ) {}

  ngOnInit() {
    // this.name = this.dataService.getData('name');
    // this.roll = this.dataService.getData('roll');
    // this.branch = this.dataService.getData('branch') as Dept;
    // this.year = this.dataService.getData('year');
    // this.degree = this.dataService.getData('degree');
    // this.sem = this.dataService.getData('semester');
    // this.roll = this.dataService.getData('roll');
    // this.cgpa = this.dataService.getData('cgpa');


    // const studentInfo: Student = {
    //   name: this.name,
    //   roll: this.roll,
    //   branch: this.branch,
    //   degree: this.degree,
    //   year: Number(2025-parseInt(this.year)),
    //   cgpa: this.cgpa,
    //   applied: [],
    // };
    // console.log(studentInfo)
    // this.allProjects = this.projectService.getAllProjects();
    // this.eligibleProjects = this.projectService.getEligibleProjects(studentInfo);
    // console.log("eligible",this.eligibleProjects)
    // this.appliedProjects = this.projectService.getAppliedProjects();

    const storedStudent = localStorage.getItem('student');
  if (storedStudent) {
    const studentData: Student = JSON.parse(storedStudent);
    
    this.name = studentData.name;
    this.roll = studentData.roll;
    this.branch = studentData.branch;
    this.year = studentData.year.toString();
    this.degree = studentData.degree;
    this.cgpa = studentData.cgpa;
    this.appliedProjects = studentData.applied || [];
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
    applied: this.appliedProjects,
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

}
