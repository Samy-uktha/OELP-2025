import { Component } from '@angular/core';
import { Preference, StepState } from '../models';
import { StudentProjectService } from '../student-project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galeshapley-fac',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeshapley-fac.component.html',
  styleUrl: './galeshapley-fac.component.css'
})
export class GaleshapleyFacComponent {
  showdesc : boolean = false;
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
      this.runFacultyProposing();
    }
  }

  runFacultyProposing() {
    const remainingProjPref = JSON.parse(JSON.stringify(this.projPref));
    let projectQuota = JSON.parse(JSON.stringify(this.pData));
    let stepsCount = 0;
    const maxSteps = 1000;

    while (stepsCount++ < maxSteps) {
      let progress = false;
      for (let project of Object.keys(remainingProjPref)) {
        const capacity = this.pData[project].capacity;
        if (projectQuota[project].assigned.length >= capacity) continue;

        const nextStudent = remainingProjPref[project].shift();
        if (!nextStudent) continue;

        let message = `Project ${project} proposes to Student ${nextStudent}. `;
        progress = true;

        const currentAssignment = this.studentAssignments[nextStudent];

        if (!currentAssignment) {
          projectQuota[project].assigned.push(nextStudent);
          this.studentAssignments[nextStudent] = project;
          message += `Accepted.`;
        } else {
          const studentPref = this.studPref[nextStudent];
          if (studentPref.indexOf(project) < studentPref.indexOf(currentAssignment)) {
            const oldProject = currentAssignment;
            projectQuota[oldProject].assigned = projectQuota[oldProject].assigned.filter((s: any) => s !== nextStudent);
            projectQuota[project].assigned.push(nextStudent);
            this.studentAssignments[nextStudent] = project;
            message += `Accepted, replaced ${oldProject}.`;
          } else {
            message += `Rejected.`;
          }
        }

        this.steps.push({
          message,
          assignments: JSON.parse(JSON.stringify(this.studentAssignments)),
          studentPref: JSON.parse(JSON.stringify(this.studPref)),
          projectState: JSON.parse(JSON.stringify(projectQuota))
        });
      }

      if (!progress) break;
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

  descshow(){
    this.showdesc = !this.showdesc;
  }
  
}
