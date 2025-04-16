import { Component } from '@angular/core';
import { Preference, StepState } from '../models';
import { StudentProjectService } from '../student-project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galeshapley-stud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeshapley-stud.component.html',
  styleUrl: './galeshapley-stud.component.css'
})
export class GaleshapleyStudComponent {

  studP: Preference[] = [];
  projP: Preference[] = [];
  projPref: { [key: string]: string[] } = {};
  studPref: { [key: string]: string[] } = {};
  pData: { [key: string]: { assigned: string[]; capacity: number } } = {};
  studentAssignments: { [key: string]: string } = {};
  steps: StepState[] = [];
  currentStep = 0;

  constructor(private service: StudentProjectService) {}

  ngOnInit() {
    this.service.getStudpref().subscribe({
      next: (AppData) => {
        this.studP = AppData || [];
        this.studPref = this.buildStudentProjectMap(this.studP);
        this.tryRunGaleShapley();
      },
      error: (error) => {
        console.error('Error fetching student preferences:', error);
        alert('Failed to load student preferences.');
      }
    });

    this.service.getProjectpref().subscribe({
      next: async (AppData) => {
        this.projP = AppData || [];
        this.projPref = this.buildProjectStudentMap(this.projP);
        const projectTitles = Object.keys(this.projPref);
        await this.fetchAllProjectSlots(projectTitles);
        this.tryRunGaleShapley();
      },
      error: (error) => {
        console.error('Error fetching project preferences:', error);
        alert('Failed to load project preferences.');
      }
    });
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  tryRunGaleShapley() {
    if (
      this.studPref &&
      this.projPref &&
      Object.keys(this.studPref).length > 0 &&
      Object.keys(this.projPref).length > 0 &&
      Object.keys(this.pData).length === Object.keys(this.projPref).length
    ) {
      this.runGaleShapley();
    }
  }

  runGaleShapley() {
    const remainingStudentPref = JSON.parse(JSON.stringify(this.studPref));
    let unassignedStudents = new Set(Object.keys(remainingStudentPref));

    let stepsCount = 0;
    const maxSteps = 1000;

    while (unassignedStudents.size > 0 && stepsCount++ < maxSteps) {
      let student = Array.from(unassignedStudents)[0];
      let prefs = remainingStudentPref[student];

      if (!prefs || prefs.length === 0) {
        unassignedStudents.delete(student);
        continue;
      }

      const project = prefs.shift();
      let message = `Student ${student} proposes to Project ${project}. `;

      if (!this.pData[project]) {
        message += 'Invalid project.';
        continue;
      }

      let projectData = this.pData[project];

      if (projectData.assigned.length < projectData.capacity) {
        projectData.assigned.push(student);
        this.studentAssignments[student] = project;
        unassignedStudents.delete(student);
        message += `Accepted.`;
      } else {
        let facultyPref = this.projPref[project];
        let currentStudents = projectData.assigned;
        let worstStudent = currentStudents.reduce((a, b) =>
          facultyPref.indexOf(a) > facultyPref.indexOf(b) ? a : b
        );

        if (facultyPref.indexOf(student) < facultyPref.indexOf(worstStudent)) {
          projectData.assigned = currentStudents.filter(s => s !== worstStudent);
          projectData.assigned.push(student);
          this.studentAssignments[student] = project;
          delete this.studentAssignments[worstStudent];
          unassignedStudents.delete(student);
          unassignedStudents.add(worstStudent);
          message += `Accepted, replaced ${worstStudent}.`;
        } else {
          message += `Rejected.`;
        }
      }

      this.steps.push({
        message,
        assignments: JSON.parse(JSON.stringify(this.studentAssignments)),
        studentPref: JSON.parse(JSON.stringify(remainingStudentPref)),
        projectState: JSON.parse(JSON.stringify(this.pData))
      });
    }
  }

  buildStudentProjectMap(preferences: Preference[]): { [key: string]: string[] } {
    const studentMap: { [key: string]: any[] } = {};

    preferences.forEach(pref => {
      const name = pref.student;
      if (!studentMap[name]) {
        studentMap[name] = [];
      }
      studentMap[name].push(pref);
    });

    Object.keys(studentMap).forEach(name => {
      studentMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
      studentMap[name] = studentMap[name].map(entry => entry.project);
    });
    return studentMap;
  }

  buildProjectStudentMap(preferences: Preference[]): { [key: string]: string[] } {
    const projectMap: { [key: string]: any[] } = {};

    preferences.forEach(pref => {
      const name = pref.project;
      if (!projectMap[name]) {
        projectMap[name] = [];
      }
      if (!this.pData[name]) {
        this.service.getAvailableSlots(name).subscribe({
          next: (AppData) => {
            this.pData[name] = {
              capacity: AppData,
              assigned: []
            };
          },
          error: (error) => {
            console.error('Error fetching slots:', error);
            alert('Failed to load slots.');
          }
        });
      }
      projectMap[name].push(pref);
    });

    Object.keys(projectMap).forEach(name => {
      projectMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
      projectMap[name] = projectMap[name].map(entry => entry.student);
    });
    return projectMap;
  }

  fetchAllProjectSlots(projects: string[]): Promise<void> {
    const slotRequests = projects.map(title =>
      this.service.getAvailableSlots(title).toPromise().then(slots => {
        this.pData[title] = {
          capacity: slots || 0,
          assigned: []
        };
      })
    );

    return Promise.all(slotRequests).then(() => {});
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

}
