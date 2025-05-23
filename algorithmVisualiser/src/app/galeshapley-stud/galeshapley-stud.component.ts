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
  showdesc : boolean = false;
  studP: Preference[] = [];
  projP: Preference[] = [];
  projPref: { [key: string]: string[] } = {};
  studPref: { [key: string]: string[] } = {};
  pData: { [key: string]: { assigned: string[]; capacity: number } } = {};
  studentAssignments: { [key: string]: string } = {};
  steps: StepState[] = [];
  currentStep = 0;
  isLoading = true; // Added loading flag

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
        this.isLoading = false;
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

    const originalStudPref = this.studPref;

    const studentProposalIndex: { [studentId: string]: number } = {};
    Object.keys(originalStudPref).forEach(student => studentProposalIndex[student] = 0);

    
    let unassignedStudents = new Set<string>(Object.keys(originalStudPref));

    
    const currentStudentAssignments: { [studentId: string]: string | null } = {};
    Object.keys(originalStudPref).forEach(student => currentStudentAssignments[student] = null);

   
    for (const pid in this.pData) this.pData[pid].assigned = [];

    this.steps = [];
    let stepsCount = 0;
    const totalPreferences = Object.values(originalStudPref).reduce((sum, list) => sum + list.length, 0);
    const maxSteps = Math.max(1000, totalPreferences * 2);

    
    while (unassignedStudents.size > 0 && stepsCount++ < maxSteps) {
        const student = Array.from(unassignedStudents)[0]; 

        const prefs = originalStudPref[student] || [];
        const proposalIndex = studentProposalIndex[student];

        if (proposalIndex >= prefs.length) {
            unassignedStudents.delete(student);
            const message = `Student ${student} has no more projects. Remains unassigned.`;
          
            this.steps.push(this.createStepStateForVisualizer(message, currentStudentAssignments, originalStudPref, this.pData));
            continue;
        }

        const projectStringId = prefs[proposalIndex]; // Get project ID (string)
        let message = `Student ${student} (pref #${proposalIndex + 1}) proposes to P${projectStringId}. `;

        const currentProjectData = this.pData[projectStringId];
        const facultyPref = this.projPref[projectStringId] || [];

       
        if (!currentProjectData) {
            message += `Project ${projectStringId} invalid. Proposal ignored.`;
            studentProposalIndex[student]++; 
        } else if (currentProjectData.assigned.length < currentProjectData.capacity) {
          
            message += `P${projectStringId} has space (${currentProjectData.assigned.length}/${currentProjectData.capacity}). Accepts S${student}.`;

            
            const previousAssignmentProjectStringId = currentStudentAssignments[student];
            if(previousAssignmentProjectStringId !== null && this.pData[previousAssignmentProjectStringId]) {
                this.pData[previousAssignmentProjectStringId].assigned = this.pData[previousAssignmentProjectStringId].assigned.filter(s => s !== student);
                 message += ` (Leaves P${previousAssignmentProjectStringId}).`;
            }
            currentStudentAssignments[student] = projectStringId;
            if (!currentProjectData.assigned.includes(student)) currentProjectData.assigned.push(student);
            unassignedStudents.delete(student);
            studentProposalIndex[student]++; // Increment AFTER action

        } else {
            // Case 2: Project is full
            message += `P${projectStringId} is full (${currentProjectData.assigned.length}/${currentProjectData.capacity}). Comparing. `;

            let worstStudent: string | null = null;
            let worstRank = -Infinity;
            for (const assignedStudent of currentProjectData.assigned) {
                const rankIndex = facultyPref.indexOf(assignedStudent);
                const effectiveRank = (rankIndex === -1) ? Infinity : rankIndex;
                if (effectiveRank >= worstRank) {
                   if (effectiveRank > worstRank || worstStudent === null) {
                        worstRank = effectiveRank;
                        worstStudent = assignedStudent;
                    }
                }
            }

            const proposerRankIndex = facultyPref.indexOf(student);
            const effectiveProposerRank = (proposerRankIndex === -1) ? Infinity : proposerRankIndex;

            message += `Worst is S${worstStudent ?? 'N/A'} (RankIdx ${worstRank === Infinity ? 'Inf' : worstRank}). Proposer S${student} (RankIdx ${effectiveProposerRank === Infinity ? 'Inf' : effectiveProposerRank}). `;

            if (worstStudent !== null && effectiveProposerRank < worstRank) {
                message += `P${projectStringId} prefers S${student}. Accepts S${student}, rejects S${worstStudent}.`;

               
                const previousAssignmentProjectStringId = currentStudentAssignments[student];
                if(previousAssignmentProjectStringId !== null && this.pData[previousAssignmentProjectStringId]) {
                    this.pData[previousAssignmentProjectStringId].assigned = this.pData[previousAssignmentProjectStringId].assigned.filter(s => s !== student);
                     message += ` (S${student} leaves P${previousAssignmentProjectStringId}).`;
                }
                
                currentProjectData.assigned = currentProjectData.assigned.filter(s => s !== worstStudent);
                
                currentStudentAssignments[worstStudent] = null;
                currentStudentAssignments[student] = projectStringId;
               
                unassignedStudents.add(worstStudent);
                if (!currentProjectData.assigned.includes(student)) currentProjectData.assigned.push(student); // Add proposer
                unassignedStudents.delete(student);
                
                studentProposalIndex[student]++;

            } else {
                
                message += `P${projectStringId} rejects S${student}.`;
               
                studentProposalIndex[student]++;
            }
        }

       
        this.steps.push(this.createStepStateForVisualizer(
            message,
            currentStudentAssignments,
            originalStudPref,
            this.pData
        ));

    } // End while loop

    // Final step message
    const finalMessage = stepsCount >= maxSteps ? "Maximum steps reached." : "Algorithm finished.";
    this.steps.push(this.createStepStateForVisualizer(finalMessage, currentStudentAssignments, originalStudPref, this.pData, true));
    console.log("Visualisation Complete. Steps generated:", this.steps.length);
    if (this.steps.length > 0) this.currentStep = 0;
}


createStepStateForVisualizer(
    message: string,
    currentAssignments: { [key: string]: string | null },
    studentPrefMap: { [key: string]: string[] },
    projectData: { [key: string]: { assigned: string[]; capacity: number } },
    isFinalOrError: boolean = false
): StepState {

    const finalAssignments: { [key: string]: number } = {}; 
    for (const studentId in currentAssignments) {
        if (currentAssignments[studentId] !== null) {
            const projectIdNum = Number(currentAssignments[studentId]);
            if (!isNaN(projectIdNum)) {
                finalAssignments[studentId] = projectIdNum;
            } else {
                // console.warn(`Could not convert project ID '${currentAssignments[studentId]}' to number for student ${studentId}.`);
            }
        }
    }


    const studentPrefsForState = JSON.parse(JSON.stringify(studentPrefMap));
    const projectStateForState = JSON.parse(JSON.stringify(projectData));

    const step: StepState = {
        message: message,
        assignments: finalAssignments,
        studentPref: studentPrefsForState,
        projectState: projectStateForState,
    };

    return JSON.parse(JSON.stringify(step)); 
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
