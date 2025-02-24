import { Component, Input, input, NgModule } from '@angular/core';
import { Dept, Project, Course, Faculty } from '../interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { ProjectDataService } from '../project-data.service';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent {

  @Input() project : Project = {} as Project;
  @Input()  faculty: Faculty = {} as Faculty;
  isEditing: boolean = false;
  dept_e = Dept;
  courses : Course[] = [] as Course[];
  searchQuery: string = '';
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

  editableProject = { ...this.project }; 
  ngOnInit(): void {
    this.editableProject = this.project;
    this.service.getCourses().subscribe(
{
        next: (data) => {
          this.courses = data;
          console.log("All Applications:", data);}
        }
    );
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.editableProject = { ...this.project }; 
    }
  }

  saveChanges() {
    this.project = { ...this.editableProject };
    this.isEditing = false;
    //then integrate it with the backend to save this new data in the database.
  }

  cancelChanges() {
    this.editableProject = { ...this.project }; 
    this.isEditing = false;
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
    this.searchQuery = '';
    this.filteredCourses = [];
  }

  removeCourse(course: Course) {
    this.editableProject.eligibilityCriteria.requiredCourses = 
      this.editableProject.eligibilityCriteria.requiredCourses.filter(c => c.courseCode !== course.courseCode);
  }

  
}
