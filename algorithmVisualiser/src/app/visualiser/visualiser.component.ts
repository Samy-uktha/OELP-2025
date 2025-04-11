import { Component } from '@angular/core';
import { StepState } from '../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visualiser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visualiser.component.html',
  styleUrl: './visualiser.component.css'
})
export class VisualiserComponent {

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
  

  studentPref: { [key: string]: number[] } = {
    '1': [101, 102],
    '2': [101, 103],
    '3': [102, 103],
    '4': [101, 103],
    '5' : [102, 101, 103]
  };

  facultyPref: { [key: string]: string[] } = {
    '101': ['1','4', '2', '5'],
    '102': ['1', '3', '5'],
    '103': ['4', '1', '3', '2', '5']
  };

  projectData: { [key: string]: { assigned: string[]; capacity: number } } = {
    '101': { assigned: [], capacity: 2 },
    '102': { assigned: [], capacity: 1 },
    '103': { assigned: [], capacity: 2 }
  };

  studentAssignments: { [key: string]: number } = {};
  steps: StepState[] = [] as StepState[];
  currentStep = 0;

  constructor() {
    this.runLecturerSPA();
  }

  runLecturerSPA() {
    const remainingStudentPref = JSON.parse(JSON.stringify(this.studentPref));

    const projectHasFreeSlot = () => {
      return Object.keys(this.facultyPref).some(pid => {
        const project = this.projectData[pid];
        return (
          project.assigned.length < project.capacity &&
          this.facultyPref[pid].some(sid => remainingStudentPref[sid]?.includes(Number(pid)))
        );
      });
    };

    let stepsCount = 0;
    const maxSteps = 1000;

    while (projectHasFreeSlot() && stepsCount++ < maxSteps) {
      for (let project_id of Object.keys(this.facultyPref)) {
        let project = this.projectData[project_id];
        if (project.assigned.length >= project.capacity) continue;

        let prefList = this.facultyPref[project_id];
        for (let student_id of prefList) {
          if (!remainingStudentPref[student_id]?.includes(Number(project_id))) continue;

          if (project.assigned.includes(student_id)) continue; // already assigned to this project

          let message = '';
          if (this.studentAssignments[student_id]) {
            let oldProject = this.studentAssignments[student_id];
            this.projectData[oldProject].assigned = this.projectData[oldProject].assigned.filter(s => s !== student_id);
            message += `Student ${student_id} reassigned from Project ${oldProject} to ${project_id}. `;
          } else {
            message += `Student ${student_id} assigned to Project ${project_id}. `;
          }

          project.assigned.push(student_id);
          this.studentAssignments[student_id] = Number(project_id);

          let idx = remainingStudentPref[student_id].indexOf(Number(project_id));
          if (idx !== -1) {
            let removed = remainingStudentPref[student_id].splice(idx + 1);
            message += `Removed successors from Student ${student_id}'s list: [${removed.join(', ')}].`;
          }

          this.steps.push({
            message,
            assignments: JSON.parse(JSON.stringify(this.studentAssignments)),
            studentPref: JSON.parse(JSON.stringify(remainingStudentPref)),
            projectState: JSON.parse(JSON.stringify(this.projectData))
          });

          break;
        }
      }
    }
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }
}
