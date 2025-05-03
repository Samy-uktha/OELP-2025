import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FacultydataService } from '../facultydata.service';
import { faculty, project } from '../models';
import { ApplicationComponent } from "../application/application.component";
import { ProjectComponent } from "../project/project.component";
import { ProfileComponent } from "../profile/profile.component";
import { CommonModule } from '@angular/common';
import { ProjectsService } from '../projects.service';
import { application } from 'express';
import { PreferenceComponent } from "../preference/preference.component";
import { PhaseComponent } from '../phase/phase.component';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [ApplicationComponent, ProjectComponent, ProfileComponent, CommonModule, PreferenceComponent, PhaseComponent],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.css'
})
export class FacultyDashboardComponent {
  userId: number | null = null;
  faculty : faculty = {} as faculty;
  showprofile : boolean = true;
  selectedTab = 'profile'; // Default selected tab
  showDropdown: boolean = false;
  selectedApplication: project | undefined;
  projects : project[] = [] as project[];
  currentPhase: any = null;
  proposalPhase: boolean = false;
  applicationPhase: boolean = false;
  preferencesPhase: boolean = false;
  allocationPhase: boolean = false;
  

  tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'projects', label: 'Projects' },
    { key: 'applications', label: 'Applications' },
    {key : 'application selection', label: 'Appselect'}
  ];
  

  constructor(private router: Router, private facservice : FacultydataService, private projservice : ProjectsService) {
    const navigation = this.router.getCurrentNavigation();
    this.userId = navigation?.extras.state?.['userId'] || null;
    console.log('Received User ID:', this.userId);
  }

  ngOnInit(): void {
    if (!this.userId) {
      console.error("No User ID found! Redirecting to login...");
      this.router.navigate(['/login']); // Redirect to login if no userId is found
      return;
    }
  
    this.facservice.getFaculty(this.userId).subscribe({
      next: (facultyData) => {
        this.faculty = facultyData;
        console.log(this.faculty);
      },
      error: (error) => {
        console.error('Error fetching faculty data:', error);
        alert('Failed to load faculty data. Please try again.');
      }
    });
    
  
  }

  onPhaseChanged(phase: any) {
    this.currentPhase = phase;
    console.log('Current Phase:', phase);
    if (phase.phase_number == 1) {
      this.proposalPhase = true
    }
    if (phase.phase_number == 2) {
      this.applicationPhase = true
    }
    if (phase.phase_number == 3) {
      this.preferencesPhase = true
    }
    if (phase.phase_number == 4) {
      this.allocationPhase = true
    }
    else {

    }
  
    // // Example logic: disable tab if not Phase 3
    // if (phase?.phase_number !== 3) {
    //   // this.disablePreferenceTab = true;
    // } else {
    //   // this.disablePreferenceTab = false;
    // }
  }

  toggleApplications(){
    this.projservice.getProjects(this.faculty.faculty_id).subscribe({
      next: (projects) => {
        this.projects = projects;
        console.log(projects);
      },
      error : (error) => {
        console.error('Error fetching projects data:', error);
        alert('Failed to load projects data. Please try again.');
      }
      }); 
    this.selectedTab = 'applications';
    this.showDropdown = true;
  }

  selectApplication(project: project) {
    this.selectedApplication = project;
    // console.log("hiiiiiiiiii",project);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.selectedApplication = undefined;
    this.showDropdown = false;
  }


  logout(): void {
    // Ask for confirmation using the browser's confirm dialog
    const confirmation = window.confirm("Are you sure you want to log out?");

    // Proceed only if the user clicked "OK" (confirmation is true)
    if (confirmation) {
      console.log('Logout confirmed. Proceeding with logout...');

      // Example clearing local storage directly (use with caution, prefer AuthService)
      localStorage.removeItem('authToken'); // Replace 'authToken' with your actual token key
      sessionStorage.clear(); // Or clear sessionStorage if used

      // 2. Redirect to the login page
      this.router.navigate(['/login']);

    } else {
      // User clicked "Cancel", do nothing
      console.log('Logout cancelled by user.');
    }
  }
    }
  

