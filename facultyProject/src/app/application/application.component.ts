import { Component, input, Input, OnInit, SimpleChanges } from '@angular/core';
import { application, project, Priority } from '../models';
import { CommonModule } from '@angular/common';
import { ApplicationDataService } from '../application-data.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';
import { PreferenceComponent } from '../preference/preference.component';
import { HttpClient } from '@angular/common/http';
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-application',
  standalone: true,
  imports: [
    CommonModule,
    NgxPaginationModule,
    FormsModule,
    PreferenceComponent,
    DragDropModule,
  ],
  templateUrl: './application.component.html',
  styleUrl: './application.component.css',
})
export class ApplicationComponent {
  @Input() projectselected: project = {} as project;
  @Input() faculty_id: number | undefined;
  proposalPhase: boolean = false;
  @Input() applicationPhase: boolean = false;
  @Input() preferencesPhase: boolean = false;
  @Input() allocationPhase: boolean = false;

  applications: application[] = [] as application[];
  allocations: application[] = [] as application[];
  selectedApplication: application = {} as application;
  showApp: boolean = false;
  pref: boolean = false;
  preferenceOptions: number[] = [];
  page: number = 1;
  bostonAllocations: any[] = [];
  isBoston: boolean = false;

  // priorities = [
  //   { label: 'Department Match', value: 'department' },
  //   { label: 'Year Eligibility', value: 'year' },
  //   { label: 'Prerequisite Courses Completion', value: 'prereq' },
  //   { label: 'CGPA', value: 'cgpa'},
  // ];

  priorities: Priority[] = [
    { key: 'year', value:'year', label: 'Year Eligibility'},
    { key: 'department',  value:'department', label: 'Department Match'  },
    { key: 'prereq', value: 'prereq' , label: 'Prerequisite Courses Completion'},
    { key: 'cgpa',  value: 'cgpa', label: 'CGPA'  }
  ];
  removedPriorities: Priority[] = []

  weightSets:  { [key: number]: number[] } = {
    4: [10, 20, 30, 40],
    3: [10, 30, 60],
    2: [30, 70],
    1: [100]
  };

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.priorities, event.previousIndex, event.currentIndex);
    console.log('New Order:', this.priorities);
  }
  removePriority(index: number) {
    // this.priorities.splice(index, 1);
    const removed = this.priorities.splice(index, 1)[0];
    this.removedPriorities.push(removed);
  }
  addPriority(item: any) {
    this.priorities.push(item);
    this.removedPriorities = this.removedPriorities.filter(p => p.key !== item.key);
  }
  get prioritiesWithWeights() {
    const length = this.priorities.length;
    const weights = this.weightSets[length]?.slice().reverse() || [];

    return this.priorities.map((priority, index) => ({
      ...priority,
      weight: weights[index] ?? 0
    }));
  }
  

  isUpdating = false;

  currentAllocationType: string = '';

  constructor(
    private service: ApplicationDataService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    console.log("phases are",this.applicationPhase, this.preferencesPhase, this.allocationPhase)
    setTimeout(() => {
      if (this.projectselected?.project_id) {
        this.fetchApplications();
        this.fetchAllocations();
        this.showApp = false;
        // this.fetchBostonAllocations();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (changes['projectselected'] && this.projectselected?.project_id) {
        this.fetchApplications();
        this.fetchAllocations();
        this.showApp = false;
        // this.fetchBostonAllocations();s
      }
    }, 100);
  }

  fetchApplications() {
    this.isBoston = false;
    if (!this.projectselected?.project_id) {
      console.error('Project not selected.');
      alert('Please select a project first.');
      return;
    }

    this.service.getApplications(this.projectselected.project_id).subscribe({
      next: (AppData) => {
        console.log('Raw API Response:', AppData);
        this.applications = AppData || [];
        console.log('Applications:', this.applications);
      },
      error: (error) => {
        console.error('Error fetching applications:', error);
        alert('Failed to load applications. Please try again.');
      },
    });
  }

  fetchAllocations() {
    this.isBoston = false;
    this.currentAllocationType = 'Student Preferred, Gale Shapley';
    if (!this.projectselected?.project_id) return;

    this.service.getAllocations(this.projectselected.project_id).subscribe({
      next: (AppData) => {
        this.allocations = AppData || [];
        console.log('Allocations:', this.allocations);
      },
      error: (error) => {
        console.error('Error fetching allocations:', error);
        alert('Failed to load allocations. Please try again.');
      },
    });
  }

  fetchBostonAllocations() {
    this.isBoston = true;
    this.currentAllocationType = 'Boston';
    if (!this.projectselected?.project_id) return;

    this.service
      .getBostonAllocations(this.projectselected.project_id)
      .subscribe({
        next: (AppData) => {
          this.bostonAllocations = AppData || [];
          console.log('Boston Allocations:', this.bostonAllocations);
        },
        error: (error) => {
          console.error('Error fetching Boston allocations:', error);
          alert(
            'Failed to load Boston Mechanism allocations. Please try again.'
          );
        },
      });
  }

  generateBostonAllocations() {
    // const priorities = {
    //   first: this.priorities[0].value,
    //   second: this.priorities[1].value,
    //   third: this.priorities[2].value,
    //   fourth: this.priorities[3].value
    // };

    // const weightSets:  { [key: number]: number[] } = {
    //   4: [10, 20, 30, 40],
    //   3: [10, 30, 60],
    //   2: [30, 70],
    //   1: [100]
    // };

    const weights: { [key: string]: number } = {};
    const currentWeights = this.weightSets[this.priorities.length] || [];

    this.priorities.forEach((criterion, index) => {
      weights[criterion.key] = currentWeights[index] || 0;
    });
    const priorities = Object.entries(weights).map(([key, value]) => ({key,value}));

    this.http
      .post('http://localhost:5001/Allocations_boston', { priorities })
      .subscribe({
        next: () => {
          alert('Boston allocations generated successfully!');
          this.fetchBostonAllocations(); // Refresh table
        },
        error: (error) => {
          console.error('Error generating allocations:', error);
          alert('Failed to generate Boston allocations.');
        },
      });
  }

  generatePreferenceOptions() {
    this.preferenceOptions = Array.from(
      { length: this.applications.length },
      (_, i) => i + 1
    );
  }

  setPreference(application: application) {}

  fetchAllocations_facpropose() {
    this.isBoston = false;
    this.currentAllocationType = 'Faculty Preferred, Gale Shapley';
    if (!this.projectselected?.project_id) return;

    this.service
      .getAllocations_facpropose(this.projectselected.project_id)
      .subscribe({
        next: (AppData) => {
          this.allocations = AppData || [];
          console.log('Allocations_facpropose:', this.allocations);
        },
        error: (error) => {
          console.error('Error fetching allocations:', error);
          alert('Failed to load allocations. Please try again.');
        },
      });
  }

  fetchAllocations_SPAlecturer() {
    this.isBoston = false;
    this.currentAllocationType = 'SPA lecturer allocations';
    if (!this.projectselected?.project_id) return;

    this.service
      .getAllocations_SPAlecturer(this.projectselected.project_id)
      .subscribe({
        next: (AppData) => {
          this.allocations = AppData || [];
          console.log('Allocations_facpropose:', this.allocations);
        },
        error: (error) => {
          console.error('Error fetching allocations:', error);
          alert('Failed to load allocations. Please try again.');
        },
      });
  }

  fetchAllocations_SPAstudent() {
    this.isBoston = false;
    this.currentAllocationType = 'SPA student allocations';
    if (!this.projectselected?.project_id) return;

    this.service
      .getAllocations_SPAstudent(this.projectselected.project_id)
      .subscribe({
        next: (AppData) => {
          this.allocations = AppData || [];
          console.log('Allocations_facpropose:', this.allocations);
        },
        error: (error) => {
          console.error('Error fetching allocations:', error);
          alert('Failed to load allocations. Please try again.');
        },
      });
  }

  selectApplication(application: application) {
    this.selectedApplication = application;
    this.showApp = true;
  }

  updateApplicationStatus(applicationId: number, newStatus: string) {
    if (
      !confirm(
        `Are you sure you want to ${newStatus.toLowerCase()} this application?`
      )
    ) {
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
      },
    });
  }

  back() {
    this.showApp = false;
  }

  setpreferencce() {
    this.pref = true;
  }

  nopref(event: boolean) {
    this.pref = event;
  }
}
