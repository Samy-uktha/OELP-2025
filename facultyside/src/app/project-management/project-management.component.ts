import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Project, Faculty } from '../interfaces';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonModule } from '@angular/common';
import { ProjectComponent } from "../project/project.component";
import { AddProjectComponent } from "../add-project/add-project.component";

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [NgxPaginationModule, CommonModule, ProjectComponent, AddProjectComponent],
  templateUrl: './project-management.component.html',
  styleUrl: './project-management.component.css'
})
export class ProjectManagementComponent {
@Input() projects: Project[] = {} as Project[];
@Input()  faculty: Faculty = {} as Faculty;

 @Output() newproject = new EventEmitter<Project>();

 

 showProj : boolean = false;
 addproj : boolean = false;
 selectedProject : Project = {} as Project;
 newProject : Project = {} as Project;

 page: number = 1;

 selectProject(project : Project){
  this.selectedProject = project;
  this.showProj = true;
}

AddProj(){
  this.addproj = true;
  console.log(this.newProject);
}

back(event : boolean){
  this.addproj = event;
}

addedproj(event : Project){
  this.newProject = event;
  this.newproject.emit(this.newProject);
}



 


}
