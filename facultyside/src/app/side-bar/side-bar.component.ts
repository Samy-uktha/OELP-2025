import { Component, Input } from '@angular/core';
import { Faculty, projApplication, Project, Status } from '../interfaces';
import { ProjectDataService } from '../project-data.service';
import { Application } from 'express';
import { CommonModule } from '@angular/common';
import { ApplicationOpenComponent } from "../application-open/application-open.component";

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, ApplicationOpenComponent],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent  {

@Input() faculty : Faculty = {} as Faculty;
@Input() projects : Project[] = [] ;

applications_all : projApplication[] = [] ;
applicationsByProject : projApplication[] = [] ;
selectedProjectId : number = 0;

selectedApplication : projApplication = {} as projApplication;

forfac : projApplication[] = [] ;
selectedStatus: Status = Status.PENDING;
filteredApplications: projApplication[] = [];

showapp = false;

status = Status;



constructor(private service : ProjectDataService){}

ngOnInit(): void {
  this.service.getApplications().subscribe({
    next: (data) => {
      this.applications_all = data;
      console.log("All Applications:", data);
      
    },
    error: (err) => console.error("Error fetching applications:", err),
  });
  this.getApplications();
}


getApplications() {
  if (!this.faculty || !this.faculty.facultyId) {
    console.warn("Faculty data is missing.");
    return;
  }

  const facultyProjects = this.projects.filter(
    (project) => project.facultyId === this.faculty.facultyId
  );

  const facultyProjectIds = facultyProjects.map((project) => project.projectId);

  this.forfac = this.applications_all.filter((application) =>
    facultyProjectIds.includes(application.projectId)
  );

  console.log("Filtered Applications for Faculty:", this.forfac);
}


getProjectTitle(projectId: number): string {
  const project = this.projects.find(proj => proj.projectId === projectId);
  return project ? project.title : "Unknown Project";
}

filterApplicationsByProject(projectId: number) {
  this.selectedProjectId = projectId;
  this.applicationsByProject = this.forfac.filter(
    (app) => app.projectId === projectId
  );
}

selectApplication(application : projApplication){
  this.selectedApplication = application;
  this.showapp = true;
}






}
