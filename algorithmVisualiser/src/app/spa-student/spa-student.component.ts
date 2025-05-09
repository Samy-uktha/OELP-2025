import { Component } from '@angular/core';
import { Preference, StepState } from '../models';
import { StudentProjectService } from '../student-project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spa-student',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spa-student.component.html',
  styleUrl: './spa-student.component.css'
})
export class SpaStudentComponent {

  showdesc : boolean = false;
  studP : Preference[]  = [] as Preference[];
    projP : Preference[]  = [] as Preference[];
    isLoading = true;
  
    projPref :  { [key: string]: string[] } = {};
    studPref : { [key: string]: string[] } = {};
    pData : { [key: string]: { assigned: string[]; capacity: number } } = {} as { [key: string]: { assigned: string[]; capacity: number } };
  
    objectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
      }
      
    
      studentAssignments: { [key: string]: string } = {};
      projectAssignments :{ [key: string]: string[] } = {};
      steps: StepState[] = [] as StepState[];
      currentStep = 0;
    
      constructor(private service : StudentProjectService) {
      }
  
  
  
      ngOnInit() {
        this.isLoading=true;
        this.service.getStudpref().subscribe({
          next: (AppData) => {
            this.studP = AppData || [];
            this.studPref = this.buildStudentProjectMap(this.studP);
            this.tryRunSPA() ;
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
      
            await this.fetchAllProjectSlots(projectTitles); // Wait for all slots to be fetched
            this.isLoading = false;
            this.tryRunSPA() ; // Attempt to run once all data is in
          },
          error: (error) => {
            console.error('Error fetching project preferences:', error);
            alert('Failed to load project preferences.');
          }
        });
      }
      
  
      tryRunSPA() {
        if (
          this.studPref &&
          this.projPref &&
          Object.keys(this.studPref).length > 0 &&
          Object.keys(this.projPref).length > 0 &&
          Object.keys(this.pData).length === Object.keys(this.projPref).length
        ) {
          this.runStudentSPA();
        }
      }




runStudentSPA() {

    const originalStudPref = this.studPref;
    const studentProposalIndex: { [studentId: string]: number } = {};
    Object.keys(originalStudPref).forEach(student => {
        studentProposalIndex[student] = 0;
    });

    let freeStudents = new Set<string>(Object.keys(originalStudPref));

   
    const currentStudentAssignments: { [studentId: string]: number | null } = {};
     Object.keys(originalStudPref).forEach(student => {
        currentStudentAssignments[student] = null;
    });


   
    for (const pid in this.pData) {
        if (!this.pData[pid].assigned) {
            this.pData[pid].assigned = [];
        } else {
          
            this.pData[pid].assigned = [];
        }
    }

    this.steps = [];

    let stepsCount = 0;
    const maxSteps = Object.keys(originalStudPref).length * 100;

    while (freeStudents.size > 0 && stepsCount++ < maxSteps) {
        const student = Array.from(freeStudents)[0];
        const prefs = originalStudPref[student] || [];
        const proposalIndex = studentProposalIndex[student];

        if (proposalIndex >= prefs.length) {
            freeStudents.delete(student);
            const message = `Student ${student} has no more projects to propose to. Becomes inactive.`;
            this.steps.push(this.createStepState(
                message,
                currentStudentAssignments,
                originalStudPref,
                this.pData
            ));
            continue;
        }

        const projectStringId = prefs[proposalIndex];
        const projectNumId = Number(projectStringId);
        let message = `Student ${student} (next pref #${proposalIndex + 1}: P${projectStringId}) proposes to Project ${projectStringId}. `;

        const currentProjectData = this.pData[projectStringId];
        const facultyPref = this.projPref[projectStringId] || [];


        if (!currentProjectData) {
            message += `Project ${projectStringId} does not exist. Proposal ignored.`;
            studentProposalIndex[student]++;
        } else if (currentProjectData.assigned.length < currentProjectData.capacity) {

            message += `Project ${projectStringId} has space (${currentProjectData.assigned.length}/${currentProjectData.capacity}). Accepted.`;

            const previousAssignmentProjectId = currentStudentAssignments[student];

            if (previousAssignmentProjectId !== null) {
                const oldProjectStringId = String(previousAssignmentProjectId); // Ensure string key
                if (this.pData[oldProjectStringId]) {
                     this.pData[oldProjectStringId].assigned = this.pData[oldProjectStringId].assigned.filter(s => s !== student);
                      message += ` (Previously assigned to P${oldProjectStringId}).`;
                }
            }


            currentProjectData.assigned.push(student);
            currentStudentAssignments[student] = projectNumId;
            freeStudents.delete(student);
            studentProposalIndex[student]++;

        } else {
  
            message += `Project ${projectStringId} is full (${currentProjectData.assigned.length}/${currentProjectData.capacity}). Comparing preferences. `;

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

            message += `Worst assigned is ${worstStudent ?? 'N/A'} (Rank index ${worstRank === Infinity ? 'Inf' : worstRank}). Proposer ${student} rank index ${effectiveProposerRank === Infinity ? 'Inf' : effectiveProposerRank}. `;

            if (worstStudent !== null && effectiveProposerRank < worstRank) {
                message += `Project ${projectStringId} prefers proposer ${student}. Accepted, replaces ${worstStudent}.`;

 
                currentProjectData.assigned = currentProjectData.assigned.filter(s => s !== worstStudent);
                currentStudentAssignments[worstStudent] = null;
                freeStudents.add(worstStudent);


                const previousAssignmentProjectId = currentStudentAssignments[student];
                if (previousAssignmentProjectId !== null) {
                     const oldProjectStringId = String(previousAssignmentProjectId);
                     if (this.pData[oldProjectStringId]) {
                         this.pData[oldProjectStringId].assigned = this.pData[oldProjectStringId].assigned.filter(s => s !== student);
                          message += ` (Proposer previously assigned to P${oldProjectStringId}).`;
                     }
                }
                currentProjectData.assigned.push(student);
                currentStudentAssignments[student] = projectNumId;
                freeStudents.delete(student);
                studentProposalIndex[student]++;

            } else {

                message += `Project ${projectStringId} rejects proposer ${student}.`;
                studentProposalIndex[student]++; 
            }
        }


        this.steps.push(this.createStepState(
            message,
            currentStudentAssignments,
            originalStudPref,
            this.pData
        ));

    }

    if (stepsCount >= maxSteps) {
        console.error("SPA_student visualisation reached maximum steps.");
        this.steps.push(this.createStepState(
            "Maximum steps reached. Algorithm terminated.",
            currentStudentAssignments,
            originalStudPref,
            this.pData,
            true 
        ));
    } else {
        this.steps.push(this.createStepState(
             "Algorithm finished. All students processed or inactive.",
             currentStudentAssignments,
             originalStudPref,
             this.pData,
             true // final
        ));
    }
    console.log("Visualisation Complete. Steps generated:", this.steps.length);
}

// Helper function to create a StepState object with deep copies
createStepState(
    message: string,
    currentAssignments: { [key: string]: number | null },
    originalStudPref: { [key: string]: string[] },
    projectData: { [key: string]: { assigned: string[]; capacity: number } },
    isFinalOrError: boolean = false // flag for terminal states
): StepState {
    // filter out null assignments for the final StepState assignments field
    const finalAssignments: { [key: string]: number } = {};
    for (const studentId in currentAssignments) {
        if (currentAssignments[studentId] !== null) {
            finalAssignments[studentId] = currentAssignments[studentId] as number;
        }
    }

    return {
        message: message,

        assignments: JSON.parse(JSON.stringify(finalAssignments)),
        studentPref: JSON.parse(JSON.stringify(originalStudPref)),
        projectState: JSON.parse(JSON.stringify(projectData)),
    };
}
    
      nextStep() {
        if (this.currentStep < this.steps.length - 1) this.currentStep++;
      }
    
      prevStep() {
        if (this.currentStep > 0) this.currentStep--;
      }
  
  
  buildStudentProjectMap(preferences: Preference[]): { [key: string]: string[] } {
        const studentMap: { [key: string]: any[] } = {};
      
        // Group by student name
        preferences.forEach(pref => {
          const name = pref.student;
          if (!studentMap[name]) {
            studentMap[name] = [];
          }
          studentMap[name].push(pref);
        });
      
        // Sort and extract only project names
        Object.keys(studentMap).forEach(name => {
          studentMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
          studentMap[name] = studentMap[name].map(entry => entry.project);
        });
        console.log("student map",studentMap);
        return studentMap;
  
      }
  
      buildProjectStudentMap(preferences: Preference[]): { [key: string]: string[] } {
        const projectMap: { [key: string]: any[] } = {};
        
  
        preferences.forEach(pref => {
          const name = pref.project;
          if (!projectMap[name]) {
            projectMap[name] = [];
          }
          if (!this.pData[name]){
          this.service.getAvailableSlots(name).subscribe({
            next: (AppData) => {
              console.log('Raw API Response:', AppData); 
              this.pData[name] = {
                capacity: AppData,
                assigned: []
              };
              
              console.log('project preferences:', this.projP);
            },
            error: (error) => {
              console.error('Error fetching slots:', error);
              alert('Failed to load slots. Please try again.');
            }
          });
        }
          projectMap[name].push(pref);
        });
  
        Object.keys(projectMap).forEach(name => {
          projectMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
          projectMap[name] = projectMap[name].map(entry => entry.student);
        });
        console.log("PROJECT map",projectMap);
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

      descshow(){
        this.showdesc = ! this.showdesc;
      }
}
