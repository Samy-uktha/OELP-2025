import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {Pdf,projApplication,project,Student,preference,facultypreference,} from '../interfaces';
import { StudentService } from '../student.service';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApplicationDataService } from '../application-data.service';
import {CdkDragDrop,moveItemInArray,DragDropModule,} from '@angular/cdk/drag-drop';
import { PhaseComponent } from '../phase/phase.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, PhaseComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  userId: number;
  student: Student = {} as Student;
  selected_Project: project = {} as project;
  application: projApplication = {} as projApplication;
  selectedTab: string = 'all';
  applied: any[] = [];
  allProjects: project[] = [];
  eligibleProjects: project[] = [];
  availableProjects: project[] = [];
  selectedProject: string | null = null;
  showProj: boolean = false;
  selectedFiles: Pdf[] = [];
  tempDocName = '';
  tempDocUrl = '';
  encodedName = '';
  applicationsData: {
    [projectId: number]: {
      bio: string;
      files: { name: string; url: string }[];
    };
  } = {};

  isEditingPreferences = false; 

  currentPhase: any = null;
  proposalPhase: boolean = false;
  applicationPhase: boolean = false;
  preferencesPhase: boolean = false;
  allocationPhase: boolean = false;


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
  }


  toggleEditing() {
    if (this.isEditingPreferences) {
      // Reset order if canceled
      this.getStudentPreferences();
    }
    this.isEditingPreferences = !this.isEditingPreferences;
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.applied, event.previousIndex, event.currentIndex);
    // this.savePreferences(); // optionally auto-save or wait for user to click "Save"
  }

  constructor(
    private router: Router,
    private service: StudentService,
    private projservice: ProjectService,
    private http: HttpClient,
    private appservice: ApplicationDataService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.userId = navigation?.extras.state?.['userId'] || null;
    console.log('Received User ID:', this.userId);
  }

  ngOnInit() {
    if (!this.userId) {
      console.error('User ID is missing. Redirecting to login.');
      alert('User session expired. Please log in again.');
      this.router.navigate(['/login']); // Redirect to login page
      return;
    }

    // Fetch student data
    this.service.getStudent(this.userId).subscribe({
      next: (Data) => {
        this.student = Data;
        console.log('Fetched student data:', this.student);
        console.log('student.applied', this.student.applied);
        if (this.student.applied) {
          this.update_applications(this.student.applied);
          this.updateAvailableProjects();
        }
        if (this.student.rollNumber) {
          this.encodedName = btoa(this.student.name);
          this.getStudentPreferences();
          // this.getStudentRank();
        }
        // Check if projects are already fetched before filtering eligible ones
        if (this.allProjects.length > 0) {
          this.updateEligibleProjects();
        }
      },
      error: (error) => {
        console.error('Error fetching student data:', error);
        alert('Failed to load student data. Please try again.');
      },
    });

    // Fetch project data
    this.projservice.getProjects().subscribe({
      next: (data) => {
        this.allProjects = data;
        // console.log('Fetched projects data:', this.allProjects);

        // Check if student data is already fetched before filtering eligible ones
        if (this.student.year) {
          this.updateEligibleProjects();
        }
        this.updateAvailableProjects();
      },
      error: (error) => {
        console.error('Error fetching projects data:', error);
        alert('Failed to load projects data. Please try again.');
      },
    });

    //  this.getStudentPreferences();
  }


  getStudentPreferences() {
    if (!this.student.rollNumber) {
      console.error('User ID is missing. Cannot fetch preferences.');
      return;
    }

    this.appservice.getPreferences(this.student.rollNumber).subscribe({
      next: (preferences: preference[]) => {
        console.log('Fetched preferences:', preferences);

        let orderedPreferences = preferences
          .sort((a, b) => a.rank - b.rank)
          .map((pref) => {
            const project = this.allProjects.find(
              (p) => p.project_id === pref.project_id
            );
            return project ? project.title : null;
          })
          .filter((title): title is string => title !== null);

        // Append newly applied projects that aren't in preferences
        this.applied.forEach((appliedProject) => {
          if (!orderedPreferences.includes(appliedProject)) {
            orderedPreferences.push(appliedProject);
          }
        });

        this.applied = orderedPreferences;
      },
      error: (err) => console.error('Error fetching preferences:', err),
    });
  }



  savePreferences() {
    if (!this.applied || this.applied.length === 0) return;

    // Convert applied project titles to IDs and ensure they are ordered correctly
    const preferences = this.applied
      .map((title, index) => {
        const project = this.allProjects.find((proj) => proj.title === title);
        return project
          ? {
              student_id: this.student.rollNumber,
              project_id: project.project_id,
              preference_rank: index + 1,
            }
          : null;
      })
      .filter(
        (
          pref
        ): pref is {
          student_id: number;
          project_id: number;
          preference_rank: number;
        } => pref !== null
      );

    console.log('preferences sent', preferences);

    this.appservice.savePreferences(preferences).subscribe({
      next: () => {
        alert('Preferences saved successfully!');
        this.isEditingPreferences = false;
      },
      error: (err) => {
        console.error('Error saving preferences:', err);
        alert('Failed to save preferences. Try again.');
      },
    });
  }



  updateEligibleProjects() {
    if (!this.student || !this.allProjects.length) {
      console.warn(
        'Cannot filter eligible projects: student or projects data missing.'
      );
      return;
    }

    this.eligibleProjects = this.allProjects.filter(
      (project) =>
        project.min_year <= this.student.year &&
        project.department?.some(
          (dept) => dept.dept_name === this.student.branch
        )
    );

    console.log('Eligible Projects:', this.eligibleProjects);
  }

  updateAvailableProjects() {
    if (this.allProjects.length > 0) {
      // Log the applied projects to verify they are correct
      console.log('Applied projects:', this.applied);

      this.availableProjects = this.allProjects.filter((project) => {
        const isApplied = this.applied.includes(project.title);
        if (isApplied) {
          console.log(`Skipping applied project: ${project.title}`);
        }
        return !isApplied;
      });

      console.log('Available projects:', this.availableProjects);
    }
  }

  update_applications(applications: projApplication[] | undefined) {
    if (!applications || applications.length === 0) {
      console.warn('No applications found for the student.');
      return;
    }

    this.applied = applications.map((a) => a.title); // Efficient array mapping
    console.log('Updated applied projects:', this.applied);
  }

  applyForProject(project: project, event: Event) {
    event.stopPropagation(); // Prevents event bubbling if inside another clickable element

    if (!this.userId) {
      alert('User ID is missing. Please log in again.');
      return;
    }
    this.application.docs = this.selectedFiles;

    // Create the application payload
    const applicationData = {
      studentId: this.userId, // Ensure this is set when user logs in
      projectTitle: project.title,
    };
    this.application.project_id = project.project_id;
    this.application.title = project.title;
    this.application.bio =
      this.applicationsData[this.selected_Project.project_id].bio;
    this.application.docs =
      this.applicationsData[this.selected_Project.project_id].files;

    // Call the backend service to apply
    this.projservice
      .applyProject(this.application, this.student.rollNumber)
      .subscribe({
        next: (response) => {
          console.log('Application Successful:', response);
          alert('Successfully applied for the project!');

          // Update applied projects list
          this.applied.push(this.application.title);
        },
        error: (error) => {
          console.error('Application failed:', error);
          alert('Failed to apply for the project. Try again later.');
        },
      });
  }

  apply(project: project, event: Event) {
    this.showProj = true;
    this.selected_Project = project;
    if (!this.applicationsData[project.project_id]) {
      this.applicationsData[project.project_id] = { bio: '', files: [] };
      if (this.applied.includes(this.selected_Project.title)) {
        const appl = this.student.applied?.find(
          (app) => app.project_id === this.selected_Project.project_id
        );
        if (appl) {
          console.log('appl --- ', appl);
          this.viewApplication(project.title);
          this.application = appl;
          this.applicationsData[project.project_id].bio = appl?.bio;
          this.applicationsData[project.project_id].files = appl?.docs;
        }
      }
    }
  }
  removeProject(projectName: string) {
    const projectIndex = this.allProjects.findIndex(
      (project) => project.title === projectName
    );
    const removproj = this.allProjects[projectIndex];
    this.projservice
      .removeApp(removproj.project_id, this.student.rollNumber)
      .subscribe({
        next: (response) => {
          console.log('Application removed successfully', response);
          alert('Application deleted successfully');
          // Optionally, refresh the list of applications
          // this.fetchApplications();
          const index = this.applied.indexOf(projectName);
          if (index !== -1) {
            this.applied.splice(index, 1);
          }
        },
        error: (error) => {
          console.error('Error deleting application:', error);
          alert('Failed to delete application');
        },
      });
  }

  viewApplication(projectName: string) {
    this.showProj = true;
    const project = this.allProjects.find((p) => p.title === projectName);

    if (project) {
      this.selected_Project = project;

      if (!this.applicationsData[project.project_id]) {
        this.applicationsData[project.project_id] = { bio: '', files: [] };
      }

      // If already applied, retrieve stored bio and documents
      if (this.applied.includes(project.title)) {
        const appl = this.student.applied?.find(
          (app) => app.project_id === project.project_id
        );
        if (appl) {
          this.application = appl;
          this.applicationsData[project.project_id].bio = appl.bio;
          this.applicationsData[project.project_id].files = appl.docs;
        }
      }

      console.log('appl', this.application);

      // Fetch faculty-assigned rank for this project
      this.appservice
        .getStudentRank(this.student.rollNumber, project.project_id)
        .subscribe({
          next: (data) => {
            this.application.facultypreference = data.rank; // Store rank in selected project
            console.log(
              `Rank for project ${project.title}:`,
              this.application.facultypreference
            );
          },
          error: (err) => {
            console.error('Error fetching rank:', err);
            this.application.facultypreference = 0; // Default if error occurs
          },
        });
    } else {
      console.error('Project not found!');
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleProject(projectName: string) {
    this.selectedProject =
      this.selectedProject === projectName ? null : projectName;
  }

  back() {
    this.showProj = false;
  }

  addDocument(docName: string, docUrl: string): void {
    if (docName && docUrl) {
      this.applicationsData[this.selected_Project.project_id].files?.push({
        name: docName,
        url: docUrl,
      });
      this.tempDocName = '';
      this.tempDocUrl = '';
    } else {
      alert('Please provide both document name and URL.');
    }
  }

  onFilesSelected(event: any, projectId: number) {
    const files = event.target.files;
    if (!files.length) return;

    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);

      this.http
        .post<{ name: string; url: string }>(
          'http://localhost:5001/upload',
          formData
        )
        .subscribe(
          (response) => {
            if (!this.applicationsData[projectId]) {
              this.applicationsData[projectId] = { bio: '', files: [] };
            }
            this.applicationsData[projectId].files.push(response);
          },
          (error) => {
            console.error('Upload failed', error);
          }
        );
    }
  }

  removeFile(projectId: number, fileIndex: number) {
    this.applicationsData[projectId].files.splice(fileIndex, 1);
  }

  getBadgeClass() {
    switch (this.application.status.toLowerCase()) {
      case 'accepted':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  logout(): void {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      console.log('Logout confirmed. Proceeding with logout...');
      // 1. Perform actual logout logic (clear tokens, call backend, etc.)
      localStorage.removeItem('authToken'); // Example: Replace 'authToken'
      sessionStorage.clear(); // Example
      // this.authService.logout(); // Example if using a service

      // 2. Redirect to the login page
      this.router.navigate(['/login']); // **Ensure '/login' is your correct login route**
    } else {
      console.log('Logout cancelled by user.');
    }
  }
}
