import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FacultydataService } from '../facultydata.service';
import { faculty } from '../models';
import { ApplicationComponent } from "../application/application.component";
import { ProjectComponent } from "../project/project.component";
import { ProfileComponent } from "../profile/profile.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [ApplicationComponent, ProjectComponent, ProfileComponent, CommonModule],
  templateUrl: './faculty-dashboard.component.html',
  styleUrl: './faculty-dashboard.component.css'
})
export class FacultyDashboardComponent {
  userId: number | null = null;
  faculty : faculty = {} as faculty;
  showprofile : boolean = true;
  selectedTab = 'profile'; // Default selected tab
  tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'projects', label: 'Projects' },
    { key: 'applications', label: 'Applications' }
  ];
  

  constructor(private router: Router, private facservice : FacultydataService) {
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
  
  
      
  
    }
  

