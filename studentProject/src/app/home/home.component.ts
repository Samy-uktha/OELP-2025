import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Pdf, projApplication, project, Student } from '../interfaces';
import { StudentService } from '../student.service';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../project.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
userId : number ;
student : Student = {} as Student;
selected_Project : project = {} as project;
application : projApplication = {} as projApplication;
selectedTab: string = 'all';
applied : any[] = [];
  allProjects: project[] = [];
  eligibleProjects: project[] = [];
  selectedProject: string | null = null; 
  showProj : boolean = false;
  selectedFiles : Pdf[] = [];
  tempDocName = '';
  tempDocUrl ='';
  applicationsData: { [projectId: number]: { bio: string; files: { name: string; url: string }[] } } = {};


  constructor(private router: Router, private service : StudentService, private projservice : ProjectService, private http : HttpClient) {
    const navigation = this.router.getCurrentNavigation();
    this.userId = navigation?.extras.state?.['userId'] || null;
    console.log('Received User ID:', this.userId);
  }

  ngOnInit() {
    // Fetch student data
    this.service.getStudent(this.userId).subscribe({
      next: (Data) => {
        this.student = Data;
        console.log("Fetched student data:", this.student);
  
        if (this.student.applied) {
          this.update_applications(this.student.applied);
        }
  
        // Check if projects are already fetched before filtering eligible ones
        if (this.allProjects.length > 0) {
          this.updateeligibleProjects();
        }
      },
      error: (error) => {
        console.error('Error fetching student data:', error);
        alert('Failed to load student data. Please try again.');
      }
    });
  
    // Fetch project data
    this.projservice.getProjects().subscribe({
      next: (data) => {
        this.allProjects = data;
        console.log("Fetched projects data:", this.allProjects);
  
        // Check if student data is already fetched before filtering eligible ones
        if (this.student.semester) {
          this.updateeligibleProjects();
        }
      },
      error: (error) => {
        console.error('Error fetching projects data:', error);
        alert('Failed to load projects data. Please try again.');
      }
    });
  }
  
  addDocument(docName: string, docUrl: string): void {
    if (docName && docUrl) {
      this.applicationsData[this.selected_Project.project_id].files?.push({ name: docName, url: docUrl });
      this.tempDocName = '';
      this.tempDocUrl= '';
    } else {
      alert('Please provide both document name and URL.');
    }
  }
  
  onFilesSelected(event: any, projectId: number) {
    const files = event.target.files;
    if (!files.length) return;

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      this.http.post<{ name: string; url: string }>("http://localhost:5001/upload", formData).subscribe(
        (response) => {
          if (!this.applicationsData[projectId]) {
            this.applicationsData[projectId] = { bio: "", files: [] };
          }
          this.applicationsData[projectId].files.push(response);
        },
        (error) => {
          console.error("Upload failed", error);
        }
      );
    }
  }
  

  removeFile(projectId: number, fileIndex: number) {
    this.applicationsData[projectId].files.splice(fileIndex, 1);
  }

  updateeligibleProjects() {
    if (!this.student || !this.allProjects.length) {
      console.warn("Cannot filter eligible projects: student or projects data missing.");
      return;
    }
  
    this.eligibleProjects = this.allProjects.filter(project => 
      project.min_sem <= this.student.semester && 
      project.department?.some(dept => dept.dept_name === this.student.branch)
    );
  
    console.log("Eligible Projects:", this.eligibleProjects);
  }
  

  update_applications(applications: projApplication[] | undefined) {
    if (!applications || applications.length === 0) {
      console.warn("No applications found for the student.");
      return;
    }

    this.applied = applications.map(a => a.title); // Efficient array mapping
    console.log("Updated applied projects:", this.applied);
  }


  applyForProject(project : project, event: Event) {
    event.stopPropagation(); // Prevents event bubbling if inside another clickable element
  
    if (!this.userId) {
      alert('User ID is missing. Please log in again.');
      return;
    }
    this.application.docs = this.selectedFiles;

  
    // Create the application payload
    const applicationData = {
      studentId: this.userId, // Ensure this is set when user logs in
      projectTitle: project.title
    };
    this.application.project_id = project.project_id;
    this.application.title = project.title;
    this.application.bio = this.applicationsData[this.selected_Project.project_id].bio;
    this.application.docs = this.applicationsData[this.selected_Project.project_id].files;
    
    // Call the backend service to apply
    this.projservice.applyProject(this.application, this.student.rollNumber).subscribe({
      next: (response) => {
        console.log('Application Successful:', response);
        alert('Successfully applied for the project!');
  
        // Update applied projects list
        this.applied.push(this.application.title);
      },
      error: (error) => {
        console.error('Application failed:', error);
        alert('Failed to apply for the project. Try again later.');
      }
    });
  }
  
  apply(project : project, event: Event){
    this.showProj = true;
    this.selected_Project = project;
    if (!this.applicationsData[project.project_id]) {
      this.applicationsData[project.project_id] = { bio: '', files: [] };
      if (this.applied.includes(this.selected_Project.title)){
        const appl = this.student.applied?.find((app) => app.project_id === this.selected_Project.project_id);
        if (appl){
          console.log("appl --- ",appl);
         this.application = appl;
        this.applicationsData[project.project_id].bio =   appl?.bio;
        this.applicationsData[project.project_id].files = appl?.docs;
        }
      }
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleProject(projectName: string) {
    this.selectedProject = this.selectedProject === projectName ? null : projectName;
  }

  back(){
    this.showProj = false;
  }


  removeProject(projectName : string){
    const projectIndex = this.allProjects.findIndex(project => project.title === projectName);
    const removproj = this.allProjects[projectIndex];
    this.projservice.removeApp(removproj.project_id, this.student.rollNumber).subscribe({next: (response) => {
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
    },});


  }
  getBadgeClass(){
    switch (this.application.status.toLowerCase()) {
      case 'approved': return 'badge bg-success';
      case 'pending': return 'badge bg-warning text-dark';
      case 'rejected': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }



}
