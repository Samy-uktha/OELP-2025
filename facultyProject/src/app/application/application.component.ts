import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { application, project } from '../models';
import { CommonModule } from '@angular/common';
import { ApplicationDataService } from '../application-data.service';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './application.component.html',
  styleUrl: './application.component.css'
})
export class ApplicationComponent {
  @Input() projectselected : project  = {} as project;
  applications : application[] = [] as application[];
  selectedApplication : application = {} as application;
  showApp : boolean = false;

  page: number = 1;

  isUpdating = false;
  constructor (private service : ApplicationDataService){}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projectselected'] && this.projectselected) {
      this.fetchApplications();
    }
  }

  fetchApplications(){
    this.service.getApplications(this.projectselected.project_id).subscribe({
      next: (AppData) => {
        this.applications = AppData;
        console.log('Projects:', this.applications);
      },
      error: (error) => {
        console.error('Error fetching Applications:', error);
        alert('Failed to load faculty applications. Please try again.');
      }
    });
  }

  selectApplication(application : application){
this.selectedApplication = application;
this.showApp = true;
  }

  updateApplicationStatus(applicationId: number, newStatus: string) {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this application?`)) {
      return; // User canceled the action
    }
    this.isUpdating = true;
    this.service.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: (response) => {
        console.log('Application status updated:', response);
        this.selectedApplication.status = newStatus;
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Failed to update application status. Please try again.');
        this.isUpdating = false;
      }
    });
  }

  back(){
    this.showApp = false;
  }

}
