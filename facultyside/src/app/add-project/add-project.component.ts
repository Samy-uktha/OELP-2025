import { Component, Input, Output ,EventEmitter } from '@angular/core';
import { Course, Faculty, Project, Dept } from '../interfaces';
import { ProjectDataService } from '../project-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.css'
})
export class AddProjectComponent {

  // editableProject : Project = {} as Project;

  editableProject: Project = {
    projectId: 0,
    facultyId: 0,
    title: '',
    description: '',
    eligibilityCriteria: {
      requiredCourses: [],
      minCgpa: 0,
      departments: [],
      minSemester: 1
    },
    slotsAvailable: 1,
    studentsPerTeam: 1
  };
  
  // project : Project = {} as Project;
  @Input() faculty : Faculty = {} as Faculty;
  courses : Course[] = [] as Course[];
  searchQuery: string = '';

  @Output() project = new EventEmitter<Project>();
  @Output() addproj = new EventEmitter<boolean>();

constructor(private service : ProjectDataService){}
//   dept_e = {
//     CS : "Computer Science",
//     DS : "Data Science",
//     EE :"Electrical Engineering",
//     ME : "Mechanical Engineering",
//     CE :"Civil Engineering",
// };
  availableDepartments: string[] = Object.values(Dept); // Convert enum to array of values
  filteredCourses: Course[] = [];

  // editableProject = { ...this.project }; 
  ngOnInit(): void {
    // this.editableProject = this.project;
    this.service.getCourses().subscribe(
{
        next: (data) => {
          this.courses = data;
          console.log("All Applications:", data);}
        }
    );
  }

  saveChanges() {
    this.project.emit (this.editableProject );
    this.addproj.emit(false);
    //then integrate it with the backend to save this new data in the database.
  }

  cancelChanges() {
    this.addproj.emit(false);
  }

  toggleDepartment(dept: string, event: any) {
      if (event.target.checked) {
        if (dept === 'Computer Science')
           this.editableProject.eligibilityCriteria.departments.push(Dept.CS);
        if (dept === "Data Science")
          this.editableProject.eligibilityCriteria.departments.push(Dept.DS);
        if (dept === "Electrical Engineering")
          this.editableProject.eligibilityCriteria.departments.push(Dept.EE);
        if (dept == "Mechanical Engineering")
          this.editableProject.eligibilityCriteria.departments.push(Dept.ME);
        if (dept == "Civil Engineering")
          this.editableProject.eligibilityCriteria.departments.push(Dept.CE);
      } else {
        this.editableProject.eligibilityCriteria.departments =
          this.editableProject.eligibilityCriteria.departments.filter(d => d !== dept);
      }
    }

  


    searchCourses() {
      if (this.searchQuery.trim() === '') {
        this.filteredCourses = [];
        return;
      }
      this.filteredCourses = this.courses.filter(course =>
        course.courseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    
    addCourse(course: Course) {
      if (!this.editableProject.eligibilityCriteria.requiredCourses.some(c => c.courseCode === course.courseCode)) {
        this.editableProject.eligibilityCriteria.requiredCourses.push(course);
      }
      this.searchQuery = '';  // Clear search box
      this.filteredCourses = []; // Hide search results
    }
    
    removeCourse(course: Course) {
      this.editableProject.eligibilityCriteria.requiredCourses = 
        this.editableProject.eligibilityCriteria.requiredCourses.filter(c => c.courseCode !== course.courseCode);
    }
    
  
}
