import { Component, OnInit } from '@angular/core';
import { Preference, StepState } from '../models'; 
import { StudentProjectService } from '../student-project.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs'; 


interface StudentPrefData {
  prefList: string[];
  rankMap: Map<string, number>; 
}

@Component({
  selector: 'app-galeshapley-fac', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeshapley-fac.component.html', 
  styleUrl: './galeshapley-fac.component.css'
})
export class GaleshapleyFacComponent implements OnInit { 
  showdesc: boolean = false;
  studP: Preference[] = [];
  projP: Preference[] = [];

  projPref: { [key: string]: string[] } = {}; 

  studPref: { [key: string]: StudentPrefData } = {};
  pData: { [key: string]: { assigned: string[]; capacity: number } } = {};

  

  steps: StepState[] = [];
  currentStep = 0;
  isLoading = true; // loading

  constructor(private service: StudentProjectService) {}

  ngOnInit() {
      this.isLoading = true;
      forkJoin({
          students: this.service.getStudpref(),
          projects: this.service.getProjectpref()
      }).subscribe({
          next: (results) => {
              this.studP = results.students || [];

              this.studPref = this.buildStudentPrefDataMap(this.studP);

              this.projP = results.projects || [];
              this.projPref = this.buildProjectStudentMap(this.projP);

              const projectTitles = Object.keys(this.projPref);
   
              this.fetchAllProjectSlots(projectTitles).then(() => {
                  console.log("All data fetched for Slot Proposing.");
                  this.isLoading = false;
                  this.tryRunSPA(); 
              }).catch(error => {
                  console.error('Error fetching project slots:', error);
                  alert('Failed to load project capacities.');
                  this.isLoading = false;
              });
          },
          error: (error) => {
              console.error('Error fetching initial preferences:', error);
              alert('Failed to load preferences.');
              this.isLoading = false;
          }
      });
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }


  tryRunSPA() {
    if (
      this.studPref && Object.keys(this.studPref).length > 0 &&
      this.projPref && Object.keys(this.projPref).length > 0 &&
      this.pData && Object.keys(this.pData).length > 0 &&
      Object.keys(this.pData).length >= Object.keys(this.projPref).length 
    ) {
      console.log("Running Slot Proposing SPA Visualizer...");
      this.runSlotProposingSPA(); 
    } else {
        console.log("Waiting for all data before running Slot Proposing SPA...");
    }
  }



  runSlotProposingSPA() {
      const studentPrefData = this.studPref; 
      const projectFacultyPrefs = this.projPref;


      const slotData: { [slotId: string]: { projectId: string, proposalIndex: number } } = {};
      const freeSlots = new Set<string>();
      let totalSlotsGenerated = 0;

      for (const projectId in this.pData) {
          const project = this.pData[projectId];
          const prefsForProject = projectFacultyPrefs[projectId] || [];
          for (let i = 0; i < project.capacity; i++) {
              const slotId = `${projectId}_${i}`;
              slotData[slotId] = { projectId: projectId, proposalIndex: 0 };
           
              if (prefsForProject.length > 0) {
                  freeSlots.add(slotId);
              }
              totalSlotsGenerated++;
          }
      }
      console.log(`Initialized ${totalSlotsGenerated} slots, ${freeSlots.size} are free and can propose.`);

     
      const currentStudentAssignments: { [studentId: string]: string | null } = {};
      Object.keys(studentPrefData).forEach(student => currentStudentAssignments[student] = null);

     
      for (const pid in this.pData) this.pData[pid].assigned = [];

      this.steps = [];
      let stepsCount = 0;
      const maxSteps = totalSlotsGenerated * Object.keys(studentPrefData).length * 2; 

     
      while (freeSlots.size > 0 && stepsCount++ < maxSteps) {
          const currentSlotId = Array.from(freeSlots)[0]; 
          const currentSlotInfo = slotData[currentSlotId];
          const projectId = String(currentSlotInfo.projectId); 
          const projectPrefs = projectFacultyPrefs[projectId] || []; 
          const proposalIndex = currentSlotInfo.proposalIndex;

          if (proposalIndex >= projectPrefs.length) {
              freeSlots.delete(currentSlotId);
              const message = `Slot ${currentSlotId} (P${projectId}) inactive (no more students).`;
              this.steps.push(this.createStepStateForVisualizer(message, currentStudentAssignments, slotData, studentPrefData, this.pData));
              continue;
          }

          const targetStudentId = projectPrefs[proposalIndex]; 
          let message = `Slot ${currentSlotId} (P${projectId}, next S${targetStudentId}) proposes to S${targetStudentId}. `;

         
          const studentData = studentPrefData[targetStudentId];

          if (!studentData) {
              message += `S${targetStudentId} data not found. Ignored.`;
              slotData[currentSlotId].proposalIndex++;
              if (slotData[currentSlotId].proposalIndex >= projectPrefs.length) freeSlots.delete(currentSlotId);
              // else slot remains free

          } else {
              const currentAssignmentSlotId = currentStudentAssignments[targetStudentId];
              const currentAssignedProjectId = currentAssignmentSlotId ? slotData[currentAssignmentSlotId]?.projectId : null;
              const studentRankMap = studentData.rankMap; 

              const currentRank = currentAssignedProjectId !== null ? (studentRankMap.get(currentAssignedProjectId) ?? Infinity) : Infinity;
              const proposerRank = studentRankMap.get(projectId) ?? Infinity; 

              message += `S${targetStudentId} current: Slot ${currentAssignmentSlotId ?? 'None'}(P${currentAssignedProjectId ?? 'None'}, Rank ${currentRank === Infinity ? 'Inf' : currentRank}). Proposer Slot ${currentSlotId}(P${projectId}, Rank ${proposerRank === Infinity ? 'Inf' : proposerRank}). `;

             
              if (proposerRank < currentRank) {
                  message += `S${targetStudentId} accepts Slot ${currentSlotId} (prefers P${projectId}). `;
                  const oldSlotId = currentAssignmentSlotId;

                 
                  if (oldSlotId !== null) {
                      message += `Rejects Slot ${oldSlotId}. `;
                      const oldProjId = slotData[oldSlotId]?.projectId;
                      if(oldProjId && this.pData[oldProjId]) {
                          this.pData[oldProjId].assigned = this.pData[oldProjId].assigned.filter(s => s !== targetStudentId);
                      }
                      const oldSlotInfo = slotData[oldSlotId];
                      const oldProjectPrefs = projectFacultyPrefs[oldProjId] || [];
                      
                      if (oldSlotInfo && oldSlotInfo.proposalIndex < oldProjectPrefs.length){
                          freeSlots.add(oldSlotId);
                          message += `Slot ${oldSlotId} becomes free. `;
                      }
                  }

                
                  currentStudentAssignments[targetStudentId] = currentSlotId;

                
                  if (this.pData[projectId] && !this.pData[projectId].assigned.includes(targetStudentId)) {
                      this.pData[projectId].assigned.push(targetStudentId);
                  }

                 
                  freeSlots.delete(currentSlotId);

                 
                  slotData[currentSlotId].proposalIndex++;

                

              } else {
               
                  message += `S${targetStudentId} rejects Slot ${currentSlotId}.`;
                 
                  slotData[currentSlotId].proposalIndex++;
                
                  if (slotData[currentSlotId].proposalIndex >= projectPrefs.length) {
                      freeSlots.delete(currentSlotId);
                      message += ` Slot ${currentSlotId} inactive.`
                  }
             
              }
          }


          this.steps.push(this.createStepStateForVisualizer(
              message,
              currentStudentAssignments,
              slotData,                
              studentPrefData,          
              this.pData                
          ));

      } 
      const finalMessage = stepsCount >= maxSteps ? "Maximum steps reached." : "Algorithm finished.";
      this.steps.push(this.createStepStateForVisualizer(finalMessage, currentStudentAssignments, slotData, studentPrefData, this.pData, true));
      console.log("Slot Proposing Visualisation Complete:", this.steps.length);
      if (this.steps.length > 0) this.currentStep = 0; 
  }



  createStepStateForVisualizer(
      message: string,
      currentStudentToSlotAssignments: { [key: string]: string | null },
      slotData: { [slotId: string]: { projectId: string, proposalIndex: number } },
      studentPrefData: { [key: string]: StudentPrefData },
      projectData: { [key: string]: { assigned: string[]; capacity: number } },
      isFinalOrError: boolean = false
  ): StepState {
      const finalAssignments: { [key: string]: number } = {}; 
      for (const studentId in currentStudentToSlotAssignments) {
          const assignedSlotId = currentStudentToSlotAssignments[studentId];
          if (assignedSlotId !== null && slotData[assignedSlotId]) {
              const projectIdStr = slotData[assignedSlotId].projectId;
              const projectIdNum = Number(projectIdStr);
              if (!isNaN(projectIdNum)) { finalAssignments[studentId] = projectIdNum; }
              else { 
              
              }
          }
      }

      const studentPrefsForState: { [key: string]: string[] } = {};
      for (const studentId in studentPrefData) {
          if(studentPrefData[studentId]?.prefList) { studentPrefsForState[studentId] = studentPrefData[studentId].prefList; }
          else { studentPrefsForState[studentId] = []; }
      }

      const projectStateForState = JSON.parse(JSON.stringify(projectData));

      const step: StepState = {
          message: message,
          assignments: finalAssignments, 
          studentPref: studentPrefsForState,
          projectState: projectStateForState,
      };
      return JSON.parse(JSON.stringify(step)); 
  }


  buildStudentPrefDataMap(preferences: Preference[]): { [key: string]: StudentPrefData } {
    const studentMap: { [key: string]: { _tempList: any[], rankMap: Map<string, number> } } = {};
    preferences.forEach(pref => {
      const name = String(pref.student);
      if (!studentMap[name]) { studentMap[name] = { _tempList: [], rankMap: new Map() }; }
      studentMap[name]._tempList.push(pref);
    });
    const finalStudentData: { [key: string]: StudentPrefData } = {};
    Object.keys(studentMap).forEach(name => {
      const studentData = studentMap[name];
      studentData._tempList.sort((a, b) => a.preference_rank - b.preference_rank);
      finalStudentData[name] = {
        prefList: studentData._tempList.map(entry => String(entry.project)),
        rankMap: new Map<string, number>()
      };
      studentData._tempList.forEach((entry, index) => {
        finalStudentData[name].rankMap.set(String(entry.project), index + 1);
      });
    });
    // console.log("student map (structured)", finalStudentData); // Keep logging if needed
    return finalStudentData;
  }

  // Builds project->[students] map
  buildProjectStudentMap(preferences: Preference[]): { [key: string]: string[] } {
      const projectMap: { [key: string]: any[] } = {};
      preferences.forEach(pref => {
          const name = String(pref.project);
          if (!projectMap[name]) { projectMap[name] = []; }
          projectMap[name].push(pref);
      });
      Object.keys(projectMap).forEach(name => {
          projectMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
          projectMap[name] = projectMap[name].map(entry => String(entry.student));
      });
      
      return projectMap;
  }

  
  fetchAllProjectSlots(projects: string[]): Promise<void[]> {
      const slotRequests = projects.map(title =>
          new Promise<void>((resolve, reject) => {
               const projTitleStr = String(title);
              if (!this.pData[projTitleStr]) { this.pData[projTitleStr] = { capacity: 0, assigned: [] }; }
              this.service.getAvailableSlots(projTitleStr).subscribe({
                  next: (slots) => { this.pData[projTitleStr].capacity = slots ?? 0; resolve(); },
                  error: (error) => { console.error(`Error fetching slots for ${projTitleStr}:`, error); this.pData[projTitleStr].capacity = 0; reject(error); }
              });
          })
      );
      return Promise.all(slotRequests);
  }

 
  nextStep() { if (this.currentStep < this.steps.length - 1) this.currentStep++; }
  prevStep() { if (this.currentStep > 0) this.currentStep--; }
  descshow() { this.showdesc = !this.showdesc; }
}