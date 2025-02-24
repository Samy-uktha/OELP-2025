import { Component } from '@angular/core';
import { ProjectDataService } from '../project-data.service';
import { Faculty, projApplication, Project, Student } from '../interfaces';
import { NgbNav, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { ProjectManagementComponent } from "../project-management/project-management.component";
import { SideBarComponent } from "../side-bar/side-bar.component";
import { ProfileComponent } from "../profile/profile.component";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgbNavModule, ProjectManagementComponent, SideBarComponent, ProfileComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  projects : Project[] = [];
  applications : projApplication[] = [];
  students : Student[] = [];
  faculty : Faculty = {} as Faculty;
  selectedProject : Project | undefined;
  // showTables : boolean = true;
  // showApplications : boolean = false;
  isProfile : boolean = false;
  selectedTab = 'profile'; // Default selected tab
  new_project : Project = {} as Project;

  tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'projects', label: 'Projects' },
    { key: 'applications', label: 'Applications' }
  ];

  constructor (private service : ProjectDataService){}

  ngOnInit() : void{

    this.getData();
    // console.log(this.applications);
    
  }

  getData(){
    const facultyData = JSON.parse(localStorage.getItem('faculty') || '{}');
    this.faculty = facultyData;
    console.log(facultyData);

    this.service.getStudents().subscribe(
      {
        next : data => {
          this.students = data;
          console.log(data);
        }
      },
  
    );

    this.service.getProjects().subscribe({
      next: (data) => {
        //to filter projects where facultyId matches the logged-in faculty's ID
        this.projects = data.filter((project: any) => project.facultyId === this.faculty?.facultyId);
        console.log(this.projects);
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
      }
    });

    this.service.getApplications().subscribe(
      {
        next : data => {
          this.applications = data;
          console.log(data);
        }
      },
  
    );


  }

  // selectProject(project : Project){
  //   this.selectedProject = project;
  // }

  // trackProjectById(index: number, project: any): number {
  //   return project.projectId;
  // }

  getnew(event : Project){
   this.new_project = event;
   this.new_project.facultyId = this.faculty.facultyId;
   this.projects.push(this.new_project);
  }


}
