import { Component, OnInit } from '@angular/core';
import { Preference, StepState } from '../models'; // Ensure StepState path is correct
import { CommonModule } from '@angular/common';
import { StudentProjectService } from '../student-project.service';
import { forkJoin } from 'rxjs'; // Import forkJoin for parallel requests

// Define the richer student preference structure
interface StudentPrefData {
  prefList: string[];
  rankMap: Map<string, number>;
}

@Component({
  selector: 'app-spa-lecturer', // Consider renaming selector if it's now project-proposing?
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spa-lecturer.component.html',
  styleUrl: './spa-lecturer.component.css'
})
export class SpaLecturerComponent implements OnInit {
  showdesc: boolean = false;
  studP: Preference[] = [];
  projP: Preference[] = [];

  projPref: { [key: string]: string[] } = {};
  // *** UPDATED TYPE for studPref ***
  studPref: { [key: string]: StudentPrefData } = {};
  pData: { [key: string]: { assigned: string[]; capacity: number } } = {};

  // Removed redundant studentAssignments
  steps: StepState[] = [];
  currentStep = 0;
  isLoading = true; // Flag for loading state

  constructor(private service: StudentProjectService) {}

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  ngOnInit() {
    this.isLoading = true; // Start loading
    // Use forkJoin to wait for all initial data
    forkJoin({
      students: this.service.getStudpref(),
      projects: this.service.getProjectpref()
    }).subscribe({
      next: (results) => {
        // Process Student Preferences
        this.studP = results.students || [];
        // *** CALL MODIFIED buildStudentProjectMap ***
        this.studPref = this.buildStudentPrefDataMap(this.studP);

        // Process Project Preferences (without pData init)
        this.projP = results.projects || [];
        this.projPref = this.buildProjectStudentMap(this.projP);

        const projectTitles = Object.keys(this.projPref);

        // Fetch all slots AFTER getting project list
        this.fetchAllProjectSlots(projectTitles).then(() => {
            console.log("All data fetched and processed.");
            this.isLoading = false; // Stop loading
            this.tryRunSPA(); // Attempt to run SPA
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

  // Build the richer student preference structure
  buildStudentPrefDataMap(preferences: Preference[]): { [key: string]: StudentPrefData } {
    const studentMap: { [key: string]: { _tempList: any[], rankMap: Map<string, number> } } = {};

    // Group preferences by student
    preferences.forEach(pref => {
      const name = pref.student;
      if (!studentMap[name]) {
        // Initialize with _tempList and rankMap
        studentMap[name] = { _tempList: [], rankMap: new Map() };
      }
      studentMap[name]._tempList.push(pref); // Store the whole preference object temporarily
    });

    const finalStudentData: { [key: string]: StudentPrefData } = {};

    // Sort, create prefList (project IDs), and create rankMap
    Object.keys(studentMap).forEach(name => {
      const studentData = studentMap[name];
      // Sort by preference rank
      studentData._tempList.sort((a, b) => a.preference_rank - b.preference_rank);

      // Create the final structure
      finalStudentData[name] = {
        prefList: studentData._tempList.map(entry => entry.project), // Extract project IDs in order
        rankMap: new Map<string, number>() // Initialize the rank map
      };

      // Populate the rankMap (rank starts from 1)
      studentData._tempList.forEach((entry, index) => {
        finalStudentData[name].rankMap.set(entry.project, index + 1);
      });
    });

    console.log("student map (structured)", finalStudentData);
    return finalStudentData;
  }

  // Build project->student map (cleaner: no pData init here)
  buildProjectStudentMap(preferences: Preference[]): { [key: string]: string[] } {
    const projectMap: { [key: string]: any[] } = {};

    preferences.forEach(pref => {
      const name = pref.project;
      if (!projectMap[name]) {
        projectMap[name] = [];
      }
      projectMap[name].push(pref);
    });

    Object.keys(projectMap).forEach(name => {
      projectMap[name].sort((a, b) => a.preference_rank - b.preference_rank);
      projectMap[name] = projectMap[name].map(entry => entry.student);
    });
    console.log("PROJECT map", projectMap);
    return projectMap;
  }

  // Fetch slots using Promise.all (more robust than mixing Promise/Observable)
  fetchAllProjectSlots(projects: string[]): Promise<void[]> {
    const slotRequests = projects.map(title =>
      new Promise<void>((resolve, reject) => {
        this.service.getAvailableSlots(title).subscribe({
          next: (slots) => {
            this.pData[title] = {
              capacity: slots ?? 0, // Use nullish coalescing for default
              assigned: []
            };
            resolve();
          },
          error: (error) => {
            console.error(`Error fetching slots for ${title}:`, error);
            // Initialize with 0 capacity on error? Or handle differently?
            this.pData[title] = { capacity: 0, assigned: [] };
            reject(error); // Propagate error if needed, or resolve gracefully
          }
        });
      })
    );
    // Promise.all waits for all individual promises to resolve
    return Promise.all(slotRequests);
  }


  tryRunSPA() {
    // Check if all necessary data structures are populated
    if (
      this.studPref && Object.keys(this.studPref).length > 0 &&
      this.projPref && Object.keys(this.projPref).length > 0 &&
      this.pData && Object.keys(this.pData).length === Object.keys(this.projPref).length // Ensure pData keys match projPref keys
    ) {
      console.log("Running Project Proposing SPA Visualizer...");
      this.runProjectProposingSPA(); // Call the correct function
    } else {
        console.log("Waiting for all data before running SPA...");
        // Optional: Add user feedback if waiting for data
    }
  }


  // --- Corrected Project-Proposing Algorithm Visualizer ---
  runProjectProposingSPA() {
    const studentPrefData = this.studPref; // Use the { prefList, rankMap } structure

    const projectProposalIndex: { [projectId: string]: number } = {};
    Object.keys(this.projPref).forEach(project => projectProposalIndex[project] = 0);

    let freeProjects = new Set<string>(Object.keys(this.projPref).filter(pid =>
        this.projPref[pid]?.length > 0 && this.pData[pid]?.capacity > 0
    ));

    // Central source of truth for student assignments
    const currentStudentAssignments: { [studentId: string]: string | null } = {};
    Object.keys(studentPrefData).forEach(student => currentStudentAssignments[student] = null);

    // Clear pData assignments at the start
    for (const pid in this.pData) this.pData[pid].assigned = [];

    this.steps = [];
    let stepsCount = 0;
    const maxSteps = Object.keys(this.projPref).length * Object.keys(studentPrefData).length * 3; // Even more generous

    while (freeProjects.size > 0 && stepsCount++ < maxSteps) {
        const projectStringId = Array.from(freeProjects)[0];

        const prefs = this.projPref[projectStringId] || [];
        const proposalIndex = projectProposalIndex[projectStringId];

        if (proposalIndex >= prefs.length) {
            freeProjects.delete(projectStringId);
            const message = `Project ${projectStringId} has no more students to propose to. Becomes inactive.`;
            this.steps.push(this.createStepStateForVisualizer(message, currentStudentAssignments, studentPrefData, this.pData));
            continue;
        }

        const student = prefs[proposalIndex];
        let message = `Project ${projectStringId} (next pref #${proposalIndex + 1}: S${student}) proposes to Student ${student}. `;

        // --- Student Decision ---
        const studentData = studentPrefData[student];

        if (!studentData) {
            message += `Student ${student} not found. Proposal ignored.`;
            projectProposalIndex[projectStringId]++; // Try next student
            if (projectProposalIndex[projectStringId] >= prefs.length) freeProjects.delete(projectStringId);

        } else {
            const currentAssignmentProjectStringId = currentStudentAssignments[student]; // This is the single source of truth now
            const studentRankMap = studentData.rankMap;

            const currentRank = currentAssignmentProjectStringId !== null ? (studentRankMap.get(currentAssignmentProjectStringId) ?? Infinity) : Infinity;
            const proposerRank = studentRankMap.get(projectStringId) ?? Infinity;

            message += `Student ${student} current: P${currentAssignmentProjectStringId ?? 'None'}(Rank ${currentRank === Infinity ? 'Inf' : currentRank}). Proposer P${projectStringId}(Rank ${proposerRank === Infinity ? 'Inf' : proposerRank}). `;

            // Student accepts if free or prefers the proposing project
            if (proposerRank < currentRank) {
                message += `Student ${student} accepts P${projectStringId}. `;

                // **CRITICAL FIX: Remove from OLD project FIRST**
                if (currentAssignmentProjectStringId !== null) {
                    message += `Rejects previous P${currentAssignmentProjectStringId}. `;
                    if (this.pData[currentAssignmentProjectStringId]) {
                        this.pData[currentAssignmentProjectStringId].assigned = this.pData[currentAssignmentProjectStringId].assigned.filter(s => s !== student);
                        // Make old project free again ONLY if it wasn't just made free AND has proposals left and capacity
                        const oldProjPrefs = this.projPref[currentAssignmentProjectStringId] || [];
                        if (this.pData[currentAssignmentProjectStringId].capacity > 0 && projectProposalIndex[currentAssignmentProjectStringId] < oldProjPrefs.length) {
                             freeProjects.add(currentAssignmentProjectStringId);
                             message += `P${currentAssignmentProjectStringId} becomes free. `;
                        }
                    }
                }

                // **Assign to NEW project**
                currentStudentAssignments[student] = projectStringId; // Update central assignment map
                // Add to pData.assigned AFTER removing from old one
                if (!this.pData[projectStringId].assigned.includes(student)) { // Avoid duplicates just in case
                  this.pData[projectStringId].assigned.push(student);
                }

                freeProjects.delete(projectStringId); // Project now holds this student, temporarily not free

                // **Check capacity AFTER assignment**
                const currentProjectData = this.pData[projectStringId];
                if (currentProjectData.assigned.length > currentProjectData.capacity) {
                    message += `Project ${projectStringId} over capacity (${currentProjectData.capacity}). `;
                    // Find and reject worst student in THIS project
                    let studentToReject: string | null = null;
                    let worstRankInProj = -Infinity;
                    for (const assignedS of currentProjectData.assigned) {
                         const rankIndex = prefs.indexOf(assignedS); // Project's own pref list
                         const effectiveRank = (rankIndex === -1) ? Infinity : rankIndex;
                         if (effectiveRank >= worstRankInProj) {
                            if (effectiveRank > worstRankInProj || studentToReject === null) {
                                worstRankInProj = effectiveRank;
                                studentToReject = assignedS;
                            }
                         }
                    }
                    if (studentToReject) {
                        message += `Rejecting worst S${studentToReject}.`;
                         // **CRITICAL FIX: Remove rejected student from pData FIRST**
                         this.pData[projectStringId].assigned = this.pData[projectStringId].assigned.filter(s => s !== studentToReject);
                         // **Update central assignment map for rejected student**
                         currentStudentAssignments[studentToReject] = null;

                        // Make project free again if it has proposals left and capacity
                        if (this.pData[projectStringId].capacity > 0 && projectProposalIndex[projectStringId] < prefs.length) {
                             freeProjects.add(projectStringId);
                             message += `P${projectStringId} becomes free. `;
                        }
                    }
                } else {
                    // Accepted and not over capacity. Project needs to be free again *if* it has more students to propose to.
                    if (projectProposalIndex[projectStringId] < prefs.length - 1) { // Check BEFORE incrementing index
                         freeProjects.add(projectStringId);
                    }
                }
                projectProposalIndex[projectStringId]++; // Advance index AFTER action

            } else {
                // Student rejects
                message += `Student ${student} rejects P${projectStringId}.`;
                projectProposalIndex[projectStringId]++; // Advance index AFTER action
                // Ensure project stays free if it has more proposals
                if (projectProposalIndex[projectStringId] >= prefs.length) {
                    freeProjects.delete(projectStringId); // No more students left
                } else {
                   freeProjects.add(projectStringId); // Needs to try next student
                }
            }
        }

        // Record Step AFTER all state changes for this proposal are done
        this.steps.push(this.createStepStateForVisualizer(
            message, currentStudentAssignments, studentPrefData, this.pData
        ));

    } // End while loop

    // Final step message
    const finalMessage = stepsCount >= maxSteps ? "Maximum steps reached." : "Algorithm finished.";
    this.steps.push(this.createStepStateForVisualizer(finalMessage, currentStudentAssignments, studentPrefData, this.pData, true));
    console.log("Visualisation Complete. Steps generated:", this.steps.length);
    if (this.steps.length > 0) this.currentStep = 0; // Reset view to first step
}

// --- HELPER FUNCTION (Unchanged) ---
createStepStateForVisualizer(
  message: string,
  currentAssignments: { [key: string]: string | null }, // Accept string project IDs
  studentPrefData: { [key: string]: StudentPrefData },
  projectData: { [key: string]: { assigned: string[]; capacity: number } },
  isFinalOrError: boolean = false
): StepState {

  // 1. Create the assignments map { studentId: projectId<number> } for StepState
  const finalAssignments: { [key: string]: number } = {};
  for (const studentId in currentAssignments) {
      if (currentAssignments[studentId] !== null) {
          // *** FIX: Convert STRING project ID to NUMBER here ***
          const projectIdNum = Number(currentAssignments[studentId]);
          if (!isNaN(projectIdNum)) { // Check if conversion is valid
              finalAssignments[studentId] = projectIdNum;
          } else {
              // console.warn(`Could not convert project ID '${currentAssignments[studentId]}' to number for student ${studentId} in step state.`);
              // Handle error or skip assignment? Skipping for now.
          }
      }
  }

  // 2. Create the studentPref map { studentId: string[] }
  const studentPrefsForState: { [key: string]: string[] } = {};
  for (const studentId in studentPrefData) {
      studentPrefsForState[studentId] = studentPrefData[studentId].prefList;
  }

  // 3. Deep copy project state
  const projectStateForState = JSON.parse(JSON.stringify(projectData));

  // 4. Construct the StepState object
  const step: StepState = {
      message: message,
      assignments: finalAssignments, // Contains project IDs as numbers
      studentPref: studentPrefsForState,
      projectState: projectStateForState,
  };

  return JSON.parse(JSON.stringify(step));
}


  nextStep() {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  descshow() {
    this.showdesc = !this.showdesc;
  }
}