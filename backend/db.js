require("dotenv").config();
const { Pool } = require("pg");
// const { io } = require('./server');

// const pool = new Pool({
//   user: "postgres", // Replace with your actual username
//   host: "localhost",
//   database: "ProjectAllotment",
//   password: "postgres",
//   port: 5432,
// });

const pool = new Pool({
  user: "postgres_pal", // Replace with your actual username
  host: "dpg-d08k91pr0fns73a11q1g-a.oregon-postgres.render.com",
  database: "project_allotment_ogqm",
  password: "i4msCXk2lL9Kqz2MPRkhx8BRmqkcvqJH",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Fetch student and faculty preferences
async function getPreferences() {
  try {
    const studentPreferencesQuery = `
      SELECT sp.student_id, sp.project_id, sp.rank 
      FROM student_preferences sp
      JOIN project_applications pa ON sp.student_id = pa.student_id AND sp.project_id = pa.project_id
      WHERE pa.status = 'Pending'
      ORDER BY sp.rank ASC;
    `;

    const facultyPreferencesQuery = `
      SELECT fp.faculty_id, fp.student_id, fp.project_id, fp.rank
      FROM faculty_preferences fp
      JOIN project_applications pa ON fp.student_id = pa.student_id AND fp.project_id = pa.project_id
      WHERE pa.status = 'Pending'
      ORDER BY fp.rank ASC;
    `;

    const [studentPreferences, facultyPreferences] = await Promise.all([
      pool.query(studentPreferencesQuery),
      pool.query(facultyPreferencesQuery),
    ]);
    console.log("student preferences are", studentPreferences.rows);
    return {
      studentPreferences: studentPreferences.rows,
      facultyPreferences: facultyPreferences.rows,
    };
  } catch (error) {
    console.error("Error fetching preferences:", error);
    throw error;
  }
}

// Gale-Shapley Algorithm for Project Allocation
// Gale-Shapley Algorithm for Project Allocation
// async function galeShapley() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();
//   console.log("Preferences - students", studentPreferences);
//   console.log("Preferences - faculty", facultyPreferences);
//   let studentProposals = {}; // Students' project preferences
//   let projectSlots = {}; // Available slots for each project
//   let projectAllocations = {}; // Tracks project allocations

//   // Initialize available slots per project
//   const projects = await pool.query(
//     "SELECT project_id, available_slots FROM projects"
//   );
//   projects.rows.forEach(({ project_id, available_slots }) => {
//     projectSlots[project_id] = available_slots;
//     projectAllocations[project_id] = []; // Initialize empty list for allocations
//   });

//   // Store student preferences
//   studentPreferences.forEach(({ student_id, project_id }) => {
//     if (!studentProposals[student_id]) {
//       studentProposals[student_id] = [];
//     }
//     studentProposals[student_id].push(project_id);
//   });

//   // Unassigned students
//   let unassignedStudents = new Set(Object.keys(studentProposals));

//   while (unassignedStudents.size > 0) {
//     let student_id = Array.from(unassignedStudents)[0]; // Pick an unassigned student

//     if (
//       !studentProposals[student_id] ||
//       studentProposals[student_id].length === 0
//     ) {
//       unassignedStudents.delete(student_id); // No choices left, remove student
//       continue;
//     }

//     let preferredProject = studentProposals[student_id].shift(); // Pick top choice

//     if (
//       projectAllocations[preferredProject].length <
//       projectSlots[preferredProject]
//     ) {
//       // If project has space, allocate the student

//       projectAllocations[preferredProject].push(Number(student_id));
//       unassignedStudents.delete(student_id);
//     } else {
//       console.log("Now unassigned", student_id);
//       // Project full, check faculty preference
//       let currentAllocations = projectAllocations[preferredProject];
//       console.log("current", currentAllocations);
//       // Get faculty rankings for the project
//       let facultyRankedStudents = facultyPreferences
//         .filter((f) => f.project_id === preferredProject)
//         .sort((a, b) => a.rank - b.rank)
//         .map((f) => f.student_id);
//       console.log("faculty ranked students = ", facultyRankedStudents);

//       // Filter faculty preferences to only include currently allocated students
//       let rankedAllocatedStudents = facultyRankedStudents.filter((s) =>
//         currentAllocations.includes(s)
//       );
//       console.log("ranked allocated = ", rankedAllocatedStudents);

//       if (facultyRankedStudents.includes(Number(student_id))) {
//         let leastPreferred =
//           rankedAllocatedStudents[rankedAllocatedStudents.length - 1];
//         console.log(
//           "leastpreferred -- and the other student",
//           leastPreferred,
//           student_id
//         );
//         if (student_id !== leastPreferred) {
//           // Remove the least preferred student and replace with the new one
//           projectAllocations[preferredProject] = projectAllocations[
//             preferredProject
//           ].filter((s) => s !== leastPreferred);
//           projectAllocations[preferredProject].push(Number(student_id));

//           // Reassign the removed student
//           unassignedStudents.add(leastPreferred);
//           unassignedStudents.delete(student_id);
//         }
//       }
//     }
//   }

//   return projectAllocations;
// }


async function galeShapley() {
  // Fetch preferences (assuming this works as originally intended)
  const { studentPreferences, facultyPreferences } = await getPreferences();
  console.log("Preferences - students", studentPreferences);
  console.log("Preferences - faculty", facultyPreferences);

  let studentProposals = {}; // Stores remaining ordered project choices for each student
  let projectSlots = {}; // Available slots for each project
  let projectAllocations = {}; // Tracks current project allocations { project_id: [student_id, ...] }

  // Initialize available slots per project
  // Assuming 'pool' is available and the query works as intended
  const projects = await pool.query(
    "SELECT project_id, available_slots FROM projects"
  );
  projects.rows.forEach(({ project_id, available_slots }) => {
    projectSlots[project_id] = available_slots;
    projectAllocations[project_id] = []; // Initialize empty list for allocations
  });

  // Store student preferences in a way that we can easily get the next proposal
  // Group preferences by student
  const studentPrefsGrouped = {};
  studentPreferences.forEach(({ student_id, project_id, rank }) => {
    if (!studentPrefsGrouped[student_id]) {
      studentPrefsGrouped[student_id] = [];
    }
    studentPrefsGrouped[student_id].push({ project_id, rank });
  });

  // Sort each student's preferences by rank and store just the project_id order
  for (const student_id in studentPrefsGrouped) {
    studentProposals[student_id] = studentPrefsGrouped[student_id]
      .sort((a, b) => a.rank - b.rank) // Ensure sorted by rank (lower is better)
      .map(p => p.project_id); // Store just the ordered list of project IDs
  }

  // Set of students who are currently unassigned (use numbers for IDs)
  let unassignedStudents = new Set(Object.keys(studentProposals).map(Number));

  let iterations = 0; // Safety break

  // Main Gale-Shapley Loop
  while (unassignedStudents.size > 0 && iterations < 10000) { // Added iteration limit
    iterations++;
    let student_id_str = Array.from(unassignedStudents)[0]; // Pick an unassigned student (string key)
    let studentId = Number(student_id_str); // Use number for comparisons

    if (
      !studentProposals[studentId] || // Check using the number key if necessary or ensure keys are strings consistently
      studentProposals[studentId].length === 0
    ) {
      console.log(`Student ${studentId} has exhausted preferences.`);
      unassignedStudents.delete(studentId); // Remove student (use number)
      continue;
    }

    // Get the student's next preferred project (top choice) and remove it from their list
    let preferredProject = studentProposals[studentId].shift();

    console.log(`\nIteration ${iterations}: Student ${studentId} proposing to Project ${preferredProject}`);

     // Basic check if project exists in our setup
     if (!(preferredProject in projectSlots)) {
         console.log(`   WARN: Project ${preferredProject} not found in projectSlots. Skipping proposal.`);
         continue; // Student will try next preference in the next iteration
     }


    // Case 1: Project has available slots
    if (
      projectAllocations[preferredProject].length <
      projectSlots[preferredProject]
    ) {
      console.log(`   Project ${preferredProject} has space.`);
      projectAllocations[preferredProject].push(studentId); // Add student (use number)
      unassignedStudents.delete(studentId); // Remove student from unassigned (use number)
      console.log(`   Accepted ${studentId}. Allocations: [${projectAllocations[preferredProject].join(', ')}]`);
    }
    // Case 2: Project is full, compare preferences
    else {
      console.log(`   Project ${preferredProject} is full.`);
      let currentAllocations = projectAllocations[preferredProject]; // List of student IDs (numbers)

      // Get the faculty's ranked list of students FOR THIS PROJECT
      // Lower rank number means more preferred.
      let facultyRankedStudentsMap = {}; // Store as { student_id: rank } for faster lookup
      let facultyRankedStudentsList = facultyPreferences
        .filter((f) => f.project_id === preferredProject)
        .sort((a, b) => a.rank - b.rank) // Sort: lowest rank first
        .map((f) => {
            facultyRankedStudentsMap[f.student_id] = f.rank;
            return f.student_id; // List of student IDs preferred by faculty, in order
        });

      console.log(`   Faculty preference list for ${preferredProject}: [${facultyRankedStudentsList.join(', ')}]`);

      // Find the LEAST preferred student currently allocated to this project
      // according to the faculty's ranking.
      let leastPreferredAllocatedStudentId = -1;
      let worstRank = -Infinity; // Lower rank number is better, so highest number is worst

      for (const allocatedStudentId of currentAllocations) {
          const rank = facultyRankedStudentsMap[allocatedStudentId];
          // Treat students not ranked by faculty for this project as having the worst possible rank (Infinity)
          const effectiveRank = (rank === undefined) ? Infinity : rank;

          if (effectiveRank >= worstRank) { // Use >= to handle multiple unranked or same-rank students
              // If ranks are equal, the existing logic potentially keeps the one found earlier.
              // If the new student is definitively worse (higher rank or unranked vs ranked), update.
              if (effectiveRank > worstRank || leastPreferredAllocatedStudentId === -1) {
                   worstRank = effectiveRank;
                   leastPreferredAllocatedStudentId = allocatedStudentId;
              }
          }
      }

       // Ensure we actually found someone (should always happen if currentAllocations is not empty)
       if (leastPreferredAllocatedStudentId === -1 && currentAllocations.length > 0) {
           // Fallback: if all are somehow equally ranked (or unranked), pick the first one? Or last?
           // Let's pick the last one added as a simple heuristic if needed (less likely needed with Infinity logic)
           leastPreferredAllocatedStudentId = currentAllocations[currentAllocations.length - 1];
           worstRank = facultyRankedStudentsMap[leastPreferredAllocatedStudentId] ?? Infinity; // Recalculate rank if needed
           console.log(`   Fallback: Multiple worst ranked? Using ${leastPreferredAllocatedStudentId}`);
       }


      console.log(`   Least preferred in project ${preferredProject} is ${leastPreferredAllocatedStudentId} (Rank: ${worstRank === Infinity ? 'Unranked/Infinity' : worstRank})`);

      // Get the proposing student's rank for this project
      const proposingStudentRank = facultyRankedStudentsMap[studentId];
      const effectiveProposingRank = (proposingStudentRank === undefined) ? Infinity : proposingStudentRank;

      console.log(`   Proposing student ${studentId} rank is ${effectiveProposingRank === Infinity ? 'Unranked/Infinity' : effectiveProposingRank}`);

      // *** THE CORE GALE-SHAPLEY COMPARISON ***
      // Does the project faculty prefer the proposing student (lower rank) over the worst currently allocated?
      if (effectiveProposingRank < worstRank) {
        console.log(`   SUCCESS: Project ${preferredProject} prefers proposing student ${studentId} over ${leastPreferredAllocatedStudentId}.`);

        // Replace the least preferred student with the new proposer
        projectAllocations[preferredProject] = projectAllocations[
          preferredProject
        ].filter((s_id) => s_id !== leastPreferredAllocatedStudentId); // Remove the worst
        projectAllocations[preferredProject].push(studentId); // Add the proposer

        // Update the set of unassigned students
        unassignedStudents.delete(studentId); // Proposer is now assigned
        unassignedStudents.add(leastPreferredAllocatedStudentId); // The bumped student is now unassigned

        console.log(`   Removed ${leastPreferredAllocatedStudentId}, Added ${studentId}. New Allocations: [${projectAllocations[preferredProject].join(', ')}]`);
        console.log(`   Unassigned students now: [${Array.from(unassignedStudents).join(', ')}]`);

      } else {
        // Project prefers its current allocation (or ranks proposer equally or worse, or proposer is unranked when current worst is ranked)
        console.log(`   REJECTED: Project ${preferredProject} prefers current allocation or ranks ${studentId} lower/equally.`);
        // The proposing student (studentId) remains unassigned.
        // They will propose to their *next* preference in a future iteration
        // because preferredProject was already removed via shift().
      }
    }

     if (iterations >= 10000) {
         console.error("ERROR: Maximum iterations reached. Potential infinite loop or very large dataset?");
         break;
     }
  } // End while loop

  console.log("\n--- Gale-Shapley Matching Complete ---");
  if (unassignedStudents.size > 0) {
    console.log(`WARN: ${unassignedStudents.size} students finished unassigned: [${Array.from(unassignedStudents).join(', ')}]`);
  }

  // Return the final stable matching
  return projectAllocations;
}

// async function galeShapley_facpropose() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();

//   let studentAssignments = {}; // Stores which project a student is assigned to
//   let projectSlots = {}; // Stores available slots per project
//   let proposals = {}; // Faculty proposals for students

//   // Initialize available slots for each project
//   const projects = await pool.query("SELECT project_id, available_slots FROM projects");
//   projects.rows.forEach(({ project_id, available_slots }) => {
//     projectSlots[project_id] = available_slots;
//   });

//   // Initialize faculty proposals
//   facultyPreferences.forEach(({ faculty_id, student_id, project_id }) => {
//     if (!proposals[Number(student_id)]) {
//       proposals[Number(student_id)] = [];
//     }
//     proposals[Number(student_id)].push({ faculty_id, project_id });
//   });

//   // Students accept the best available project
//   let unassignedStudents = new Set(Object.keys(proposals));

//   while (unassignedStudents.size > 0) {
//     let student_id = Array.from(unassignedStudents)[0];

//     if (!proposals[student_id] || proposals[student_id].length === 0) {
//       // No proposals available, remove student from unassigned set
//       unassignedStudents.delete(student_id);
//       continue;
//     }

//     // Get the student's preferred project list
//     let studentChoices = studentPreferences
//       .filter((s) => s.student_id == Number(student_id))
//       .map((s) => s.project_id);

//     // Check proposals made to the student
//     let receivedProposals = proposals[Number(student_id)].map((p) => p.project_id);

//     // Select the highest-ranked project from the student's preference list
//     let bestChoice = studentChoices.find((p) => receivedProposals.includes(p));

//     if (!bestChoice) {
//       // If no preferred project matches, remove student from unassigned set
//       unassignedStudents.delete(student_id);
//       continue;
//     }

//     // Check if the project has available slots
//     if (projectSlots[bestChoice] > 0) {
//       // Assign the student to this project
//       studentAssignments[student_id] = bestChoice;
//       projectSlots[bestChoice]--;
//       unassignedStudents.delete(student_id);
//     } else {
//       // Project is full, check if a lower-ranked student is already assigned
//       let assignedStudents = Object.entries(studentAssignments)
//         .filter(([s_id, p_id]) => p_id === bestChoice)
//         .map(([s_id]) => s_id);

//       let worstStudent = assignedStudents
//         .sort((a, b) => {
//           let rankA = facultyPreferences.find(
//             (f) => f.student_id == a && f.project_id == bestChoice
//           )?.rank ?? Infinity;
//           let rankB = facultyPreferences.find(
//             (f) => f.student_id == b && f.project_id == bestChoice
//           )?.rank ?? Infinity;
//           return rankB - rankA; // Sort descending (worst ranked last)
//         })
//         .pop(); // Get the worst student assigned

//       let newStudentRank = facultyPreferences.find(
//         (f) => f.student_id == student_id && f.project_id == bestChoice
//       )?.rank ?? Infinity;

//       let worstStudentRank = facultyPreferences.find(
//         (f) => f.student_id == worstStudent && f.project_id == bestChoice
//       )?.rank ?? Infinity;

//       if (newStudentRank < worstStudentRank) {
//         // Replace the worst student with the new student
//         delete studentAssignments[worstStudent];
//         studentAssignments[student_id] = bestChoice;
//         unassignedStudents.delete(student_id);
//         if (worstStudent) unassignedStudents.add(worstStudent); // Add the removed student back
//       } else {
//         // If the student cannot replace anyone, remove them from the unassigned list
//         unassignedStudents.delete(student_id);
//       }
//     }
//   }

//   return studentAssignments;
// }

// async function galeShapley_facpropose() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();

//   // Build student preference mapping: student_id -> ordered array of project_ids
//   // (Assumes studentPreferences are provided in order; otherwise, sort them as needed.)
//   let studentPrefMapping = {};
//   studentPreferences.forEach(({ student_id, project_id }) => {
//     if (!studentPrefMapping[student_id]) {
//       studentPrefMapping[student_id] = [];
//     }
//     studentPrefMapping[student_id].push(project_id);
//   });

//   // Build faculty proposal mapping: faculty_id -> ordered array of proposals
//   // Each proposal is an object: { student_id, project_id, rank }
//   let facultyProposalMapping = {};
//   facultyPreferences.forEach(({ faculty_id, student_id, project_id, rank }) => {
//     if (!facultyProposalMapping[faculty_id]) {
//       facultyProposalMapping[faculty_id] = [];
//     }
//     facultyProposalMapping[faculty_id].push({ student_id, project_id, rank });
//   });

//   // For each faculty, sort proposals by rank (ascending: best preference first)
//   for (let faculty_id in facultyProposalMapping) {
//     facultyProposalMapping[faculty_id].sort((a, b) => a.rank - b.rank);
//   }

//   // Initialize the set of free (unmatched) faculty members.
//   let freeFaculties = new Set(Object.keys(facultyProposalMapping));

//   // Student assignments: mapping student_id -> { faculty_id, project_id }
//   let studentAssignments = {};

//   // While there exists at least one free faculty member with remaining proposals
//   while (freeFaculties.size > 0) {
//     // Pick one free faculty member
//     let faculty_id = Array.from(freeFaculties)[0];
//     let proposals = facultyProposalMapping[faculty_id];

//     // If no more proposals for this faculty, remove from free set
//     if (!proposals || proposals.length === 0) {
//       freeFaculties.delete(faculty_id);
//       continue;
//     }

//     // Faculty proposes to the top student on their list
//     let proposal = proposals.shift(); // Remove the first proposal
//     let student_id = proposal.student_id;
//     let project_id = proposal.project_id;

//     // If the student is currently unmatched, accept the proposal
//     if (!studentAssignments[student_id]) {
//       studentAssignments[student_id] = { faculty_id, project_id };
//       freeFaculties.delete(faculty_id);
//     } else {
//       // The student already has an assignment—compare proposals
//       let currentAssignment = studentAssignments[student_id];
//       let studentPrefs = studentPrefMapping[student_id] || [];

//       // Determine the ranking index in the student's preference list
//       let currentIndex = studentPrefs.indexOf(currentAssignment.project_id);
//       let newIndex = studentPrefs.indexOf(project_id);

//       // Lower index means the student prefers that project.
//       if (newIndex !== -1 && (currentIndex === -1 || newIndex < currentIndex)) {
//         // Student prefers the new proposal over the current assignment.
//         studentAssignments[student_id] = { faculty_id, project_id };
//         // The faculty who was previously matched becomes free again.
//         freeFaculties.add(currentAssignment.faculty_id);
//         freeFaculties.delete(faculty_id);
//       } else {
//         // Student rejects the new proposal.
//         // If the proposing faculty has more proposals, they remain free;
//         // otherwise, remove them from the free set.
//         if (facultyProposalMapping[faculty_id].length === 0) {
//           freeFaculties.delete(faculty_id);
//         }
//       }
//     }
//   }

//   return studentAssignments;
// }

// async function galeShapley_facpropose() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();
//   // const projects = await getProjects(); // Each project has project_id and available_slots

//   const projects = (
//     await pool.query("SELECT project_id, available_slots FROM projects")
//   ).rows;

//   // Build student preference mapping: student_id -> ordered array of project_ids
//   let studentPrefMapping = {};
//   studentPreferences.forEach(({ student_id, project_id }) => {
//     if (!studentPrefMapping[student_id]) {
//       studentPrefMapping[student_id] = [];
//     }
//     studentPrefMapping[student_id].push(project_id);
//   });
//   console.log("pref mapping", studentPrefMapping);
//   // Build faculty proposal mapping: faculty_id -> ordered array of proposals
//   let facultyProposalMapping = {};
//   facultyPreferences.forEach(({ faculty_id, student_id, project_id, rank }) => {
//     if (!facultyProposalMapping[faculty_id]) {
//       facultyProposalMapping[faculty_id] = [];
//     }
//     facultyProposalMapping[faculty_id].push({ student_id, project_id, rank });
//   });

//   // Sort proposals by rank
//   for (let faculty_id in facultyProposalMapping) {
//     facultyProposalMapping[faculty_id].sort((a, b) => a.rank - b.rank);
//   }
//   console.log("pref mapping - faculty", facultyProposalMapping);

//   // Build project slot tracker and allocations
//   let projectSlots = {};
//   let projectAllocations = {};
//   projects.forEach(({ project_id, available_slots }) => {
//     projectSlots[project_id] = available_slots;
//     projectAllocations[project_id] = []; // stores student_ids
//   });

//   // Student assignments: student_id -> { faculty_id, project_id }
//   let studentAssignments = {};

//   // Initialize the set of free (unmatched) faculty members.
//   let freeFaculties = new Set(Object.keys(facultyProposalMapping));

//   // Main loop
//   while (freeFaculties.size > 0) {
//     let faculty_id = Array.from(freeFaculties)[0];
//     let proposals = facultyProposalMapping[faculty_id];

//     // If no more proposals, remove from free set
//     if (!proposals || proposals.length === 0) {
//       freeFaculties.delete(faculty_id);
//       continue;
//     }

//     // Propose to the top student
//     let proposal = proposals.shift(); // Remove the first proposal
//     let student_id = proposal.student_id;
//     let project_id = proposal.project_id;

//     // Skip if project has no remaining slots
//     if (projectAllocations[project_id].length >= projectSlots[project_id]) {
//       continue;
//     }

//     if (!studentAssignments[student_id]) {
//       // Student is unassigned — accept the proposal
//       studentAssignments[student_id] = { faculty_id, project_id };
//       projectAllocations[project_id].push(student_id);
//     } else {
//       // Student is already assigned — compare preferences
//       let current = studentAssignments[student_id];
//       let studentPrefs = studentPrefMapping[student_id] || [];

//       let currentIndex = studentPrefs.indexOf(current.project_id);
//       let newIndex = studentPrefs.indexOf(project_id);

//       if (newIndex !== -1 && (currentIndex === -1 || newIndex < currentIndex)) {
//         // Student prefers new project — switch assignment
//         studentAssignments[student_id] = { faculty_id, project_id };

//         // Update project allocations
//         const oldProj = current.project_id;
//         projectAllocations[oldProj] = projectAllocations[oldProj].filter(
//           (id) => id !== student_id
//         );
//         projectAllocations[project_id].push(student_id);

//         // Free up the old faculty if they have more proposals
//         freeFaculties.add(current.faculty_id);
//       }
//     }

//     // Remove faculty if no more proposals
//     if (facultyProposalMapping[faculty_id].length === 0) {
//       freeFaculties.delete(faculty_id);
//     }
//   }

//   return studentAssignments;
// }

async function galeShapley_facpropose() { // Renamed function to reflect project/slot proposing logic inside
  console.log("--- Starting Gale-Shapley (Project Slots Proposing Logic) ---");

  // 1. Fetch Data (Keeping this part as is)
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projects = (
    await pool.query("SELECT project_id, available_slots FROM projects")
  ).rows;

  // 2. Pre-process Preferences and Initialize Structures

  // --- Student Preferences ---
  // student_id -> { preference_map: { project_id: rank }, ordered_list: [project_id] }
  // We need ranks for comparison, assuming input provides it or we derive it.
  // If studentPreferences only has project_id, we assume the order implies rank.
  const studentPrefData = {};
  const studentRankMapForInput = {}; // Temp structure to handle rank assignment if needed
  studentPreferences.forEach(({ student_id, project_id, rank }) => { // Assuming rank exists, if not, order is rank
    if (!studentPrefData[student_id]) {
      studentPrefData[student_id] = { preference_map: {}, ordered_list_temp: [] };
      studentRankMapForInput[student_id] = 1; // Start rank counter if not provided
    }
    const effectiveRank = rank ?? studentRankMapForInput[student_id]++; // Use provided rank or assign based on order
    studentPrefData[student_id].preference_map[project_id] = effectiveRank;
    studentPrefData[student_id].ordered_list_temp.push({ project_id, rank: effectiveRank });
  });
  // Create the final ordered list for quick comparison (lower rank is better)
  for (const student_id in studentPrefData) {
    studentPrefData[student_id].ordered_list = studentPrefData[student_id]
      .ordered_list_temp
      .sort((a, b) => a.rank - b.rank)
      .map(p => p.project_id);
    delete studentPrefData[student_id].ordered_list_temp; // Clean up temporary array
  }
   console.log("Processed Student Preferences (example):", Object.values(studentPrefData)[0]);


  // --- Faculty/Project Preferences ---
  // project_id -> ordered list of student_ids ranked by faculty for that project
  const projectStudentRankings = {};
  // Group faculty prefs by project first
  const facultyPrefsGrouped = {};
  facultyPreferences.forEach(({ /* faculty_id, */ student_id, project_id, rank }) => { // faculty_id not directly needed for slot proposing
      if (!projects.some(p => p.project_id === project_id)) {
          console.warn(`Faculty preference for non-existent project ${project_id} ignored.`);
          return; // Skip if project doesn't exist
      }
      if (!facultyPrefsGrouped[project_id]) {
          facultyPrefsGrouped[project_id] = [];
      }
      facultyPrefsGrouped[project_id].push({ student_id, rank });
  });
  // Sort each project's list by rank and store only student_id order
  for (const project_id in facultyPrefsGrouped) {
      projectStudentRankings[project_id] = facultyPrefsGrouped[project_id]
          .sort((a, b) => a.rank - b.rank) // Lower rank is better
          .map(s => s.student_id);
  }
   console.log("Processed Project Rankings (example):", Object.values(projectStudentRankings)[0]);


  // --- Initialize Slots and Assignments ---
  // Replaces projectAllocations, projectSlots setup in original code
  let allSlots = []; // List of unique slot identifiers, e.g., "projectId_slotIndex"
  let slotProposalIndex = {}; // slot_id -> index of next student to propose to
  let slotPreferences = {}; // slot_id -> ordered list of student_ids
  let freeSlots = new Set(); // Set of slot_ids that are currently unassigned (REPLACES freeFaculties)

  projects.forEach(({ project_id, available_slots }) => {
    const rankedStudents = projectStudentRankings[project_id] || []; // Get ranked students for this project
    if (rankedStudents.length === 0 && available_slots > 0) {
        console.warn(`WARN: Project ${project_id} has slots but no ranked students by faculty. Slots cannot propose.`);
    }
    for (let i = 0; i < available_slots; i++) {
      const slot_id = `${project_id}_${i}`;
      allSlots.push(slot_id);
      slotPreferences[slot_id] = rankedStudents; // All slots for a project share the same ranking
      slotProposalIndex[slot_id] = 0; // Start with the first student preference
      // Only add slots that have students to propose to
      if(rankedStudents.length > 0) {
        freeSlots.add(slot_id);
      }
    }
  });
  console.log(`Initialized ${allSlots.length} total slots. ${freeSlots.size} are initially free and able to propose.`);

  // student_id -> { project_id, slot_id } // Tracks current assignments (REPLACES original studentAssignments)
  let studentAssignments = {};
  let iterations = 0;


  // 3. Main Gale-Shapley Loop (Slots Proposing Logic)
  // This loop REPLACES the original `while (freeFaculties.size > 0)` loop
  while (freeSlots.size > 0 && iterations < 10000) {
    iterations++;
    const currentSlotId = Array.from(freeSlots)[0]; // Pick a free slot
    const [projectIdStr, slotIndexStr] = currentSlotId.split('_');
    const proposingProjectId = Number(projectIdStr); // The project associated with the slot

    const studentsToProposeTo = slotPreferences[currentSlotId];
    const proposalIndex = slotProposalIndex[currentSlotId];

    // Check if slot has exhausted its preference list
    if (proposalIndex >= studentsToProposeTo.length) {
      // This slot has proposed to everyone it can/prefers
      freeSlots.delete(currentSlotId);
      continue;
    }

    const targetStudentId = studentsToProposeTo[proposalIndex]; // The student being proposed to
    console.log(`\nIter ${iterations}: Slot ${currentSlotId} (Project ${proposingProjectId}) proposing to Student ${targetStudentId}`);

    // Slot makes the proposal - advance proposal index for next time *regardless* of outcome
    slotProposalIndex[currentSlotId]++;

    // --- Student Decision Logic ---
    const studentData = studentPrefData[targetStudentId];
    if (!studentData) {
        console.warn(`   WARN: Student ${targetStudentId} has no preferences recorded. Skipping proposal.`);
        continue; // Slot tries next student
    }
    const studentRankMap = studentData.preference_map; // { project_id: rank } map

    if (!studentAssignments[targetStudentId]) {
      // Case 1: Student is currently unassigned
      console.log(`   Student ${targetStudentId} is FREE.`);
      // Accept the proposal
      studentAssignments[targetStudentId] = { project_id: proposingProjectId, slot_id: currentSlotId };
      freeSlots.delete(currentSlotId); // This slot is now tentatively filled
      console.log(`   Student ${targetStudentId} accepts. Assigned to P:${proposingProjectId} (Slot:${currentSlotId}). Slot removed from free set.`);

    } else {
      // Case 2: Student is currently assigned, must compare
      const currentAssignment = studentAssignments[targetStudentId];
      const currentProjectId = currentAssignment.project_id;

      console.log(`   Student ${targetStudentId} currently assigned to P:${currentProjectId}. Comparing with new offer P:${proposingProjectId}.`);

      const currentRank = studentRankMap[currentProjectId]; // Student's rank for their current project
      const newRank = studentRankMap[proposingProjectId]; // Student's rank for the proposing project

      // Lower rank number is better. Determine if student prefers the new offer.
      let prefersNewOffer = false;
      if (newRank === undefined) {
          prefersNewOffer = false; // Student doesn't rank the proposing project
      } else if (currentRank === undefined) {
          prefersNewOffer = true; // Student ranks the new one, but not the current one
      } else if (newRank < currentRank) {
          prefersNewOffer = true; // Student ranks new one strictly better
      } else {
          prefersNewOffer = false; // Student ranks current one better or equal
      }

      if (prefersNewOffer) {
        console.log(`   Student ${targetStudentId} PREFERS new P:${proposingProjectId}. Accepts.`);
        // Student accepts the new offer
        const rejectedSlotId = currentAssignment.slot_id; // The slot that just got rejected

        // Update student's assignment
        studentAssignments[targetStudentId] = { project_id: proposingProjectId, slot_id: currentSlotId };

        // Update slot states
        freeSlots.delete(currentSlotId); // Proposing slot is now assigned
        freeSlots.add(rejectedSlotId); // Rejected slot becomes free again

        console.log(`   Accepted: Slot ${currentSlotId} (removed from free).`);
        console.log(`   Rejected: Slot ${rejectedSlotId} (added back to free).`);
      } else {
        // Student rejects the new offer
        console.log(`   Student ${targetStudentId} REJECTS new P:${proposingProjectId} (prefers current P:${currentProjectId} or doesn't rank new).`);
        // Proposing slot (currentSlotId) remains free. Its index was already incremented.
      }
    }
  } // End while loop

  if(iterations >= 10000) {
      console.error("Error: Maximum iterations reached.");
  }
  console.log("--- Gale-Shapley (Slots Proposing Logic) Finished ---");


  // 4. Format the final result (project_id -> list of student_ids)
  // This replaces the simple return of the old studentAssignments
  const finalAllocations = {};
  projects.forEach(p => { finalAllocations[p.project_id] = []; }); // Initialize project keys

  for (const student_id in studentAssignments) {
    const assignment = studentAssignments[student_id];
    // Ensure student_id is stored as a number if needed
    finalAllocations[assignment.project_id].push(Number(student_id));
  }

  // Optional: Sort student IDs within each project for consistent output
   for (const projectId in finalAllocations) {
       finalAllocations[projectId].sort((a, b) => a - b);
       console.log(`Final Allocation - Project ${projectId}: [${finalAllocations[projectId].join(', ')}]`);
   }

  // Return the desired format
  return finalAllocations;
}




// Store allocations in the database
async function saveAllocations() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction
    const allocations = await galeShapley();
    console.log("faccc--student", allocations);
    // Clear previous allocations
    await pool.query("DELETE FROM project_allocations");
    for (const [project_id, students] of Object.entries(allocations)) {
      for (const student_id of students) {
        const facultyResult = await client.query(
          "SELECT faculty_id FROM projects WHERE project_id = $1",
          [project_id]
        );
        const faculty_id = facultyResult.rows[0]?.faculty_id || null;

        await client.query(
          `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (student_id, project_id) DO NOTHING`,
          [student_id, project_id, faculty_id]
        );
      }
    }

    await client.query("COMMIT"); // Commit transaction
    // await SPA_student();
    console.log("Project allocations saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error allocating projects:", err);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

// async function saveAllocations_facpropose() {
//   const client = await pool.connect(); // Get a client from the pool
//   try {
//     await client.query("BEGIN"); // Start transaction

//     // Run the Gale-Shapley algorithm (faculty propose version)
//     // It should return an object with keys as student_ids and values as assignments objects
//     const studentAssignments = await galeShapley_facpropose();
//     console.log("faccc---prop", studentAssignments);
//     // const stud2 = await SPA_lecturer();
//     // console.log("SPA lecturer", stud2);
//     console.log("faccc---prop", studentAssignments);

//     // Clear previous allocations (adjust table name as needed)
//     await client.query("DELETE FROM project_allocations");

//     // Iterate over each student assignment
//     for (const [student_id, assignment] of Object.entries(studentAssignments)) {
//       // assignment is an object with faculty_id and project_id
//       const project_id = assignment.project_id;
//       const faculty_id = assignment.faculty_id;

//       // Insert the allocation into the database
//       await client.query(
//         `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
//          VALUES ($1, $2, $3) 
//          ON CONFLICT (student_id, project_id) DO NOTHING`,
//         [student_id, project_id, faculty_id]
//       );
//     }

//     await client.query("COMMIT"); // Commit transaction
//     console.log("Project allocations (faculty propose) saved successfully!");
//   } catch (err) {
//     await client.query("ROLLBACK"); // Rollback on error
//     console.error("Error in saving allocations (faculty propose):", err);
//   } finally {
//     client.release(); // Release the client back to the pool
//   }
// }

async function saveAllocations_facpropose() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction
    const allocations = await galeShapley_facpropose();
    console.log("faccc--student", allocations);
    // Clear previous allocations
    await pool.query("DELETE FROM project_allocations");
    for (const [project_id, students] of Object.entries(allocations)) {
      for (const student_id of students) {
        const facultyResult = await client.query(
          "SELECT faculty_id FROM projects WHERE project_id = $1",
          [project_id]
        );
        const faculty_id = facultyResult.rows[0]?.faculty_id || null;

        await client.query(
          `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (student_id, project_id) DO NOTHING`,
          [student_id, project_id, faculty_id]
        );
      }
    }

    await client.query("COMMIT"); // Commit transaction
    // await SPA_student();
    console.log("Project allocations saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error allocating projects:", err);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

async function setupTriggers() {
  await pool.query(`
    CREATE OR REPLACE FUNCTION trigger_gale_shapley()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM pg_notify('run_gale_shapley', 'run');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_student_preferences ON student_preferences;
    CREATE TRIGGER trigger_student_preferences
    AFTER INSERT OR UPDATE OR DELETE ON student_preferences
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_gale_shapley();

    DROP TRIGGER IF EXISTS trigger_faculty_preferences ON faculty_preferences;
    CREATE TRIGGER trigger_faculty_preferences
    AFTER INSERT OR UPDATE OR DELETE ON faculty_preferences
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_gale_shapley();
  `);

  console.log("Triggers set up successfully!");
}

// async function bostonMechanism(priorities) {

//   const weights = {
//     [priorities.first]: 12,
//     [priorities.second]: 9,
//     [priorities.third]: 6
//   };

//   const students = (
//     await pool.query(
//       "SELECT Roll_no AS student_id, cgpa, year, Department_id FROM students"
//     )
//   ).rows;
//   const projects = (
//     await pool.query(
//       `SELECT p.project_id, p.available_slots, p.min_cgpa, p.min_year, pd.dept_id AS department_id FROM projects p 
//       LEFT JOIN project_dept pd ON p.project_id = pd.project_id`
//     )
//   ).rows;
//   const applications = (await pool.query("SELECT * FROM project_applications"))
//     .rows;

//   const studentMap = Object.fromEntries(students.map((s) => [s.student_id, s]));
//   const projectMap = Object.fromEntries(projects.map((p) => [p.project_id, p]));
//   const projectApplicants = {};

//   // Group applicants by project
//   for (const app of applications) {
//     const student = studentMap[app.student_id];
//     const project = projectMap[app.project_id];
//     if (!student || !project) continue;

//     const cgpa = parseFloat(student.cgpa) || 0;
//     const year = student.year;
//     const Department_id = student.Department_id;
//     const min_year = project.min_year;
//     const project_dept = project.department_id;

//     let score = cgpa; 

//     if (year != null && min_year != null && year >= min_year) score += weights['year'] || 0;
//     if (
//       Department_id != null &&
//       project_dept != null &&
//       Department_id === project_dept
//     )
//       score += weights['department'] || 0;

//     const prereqRes = await pool.query(
//       `SELECT course_id FROM prereq WHERE project_id = $1`,
//       [project.project_id]
//     );
//     const prereqIds = prereqRes.rows.map((row) => row.course_id);

//     const completedRes = await pool.query(
//       `SELECT course_id FROM student_courses WHERE student_id = $1`,
//       [student.student_id]
//     );
//     const completedIds = completedRes.rows.map((row) => row.course_id);

//     const matchedCourses = prereqIds.filter((id) => completedIds.includes(id));
//     let prereqBonus = 0;
//     if (prereqIds.length > 0) {
//       const percentMatched = matchedCourses.length / prereqIds.length;
//       prereqBonus = percentMatched * (weights['prereq'] || 0);
//     }

//     score += prereqBonus;

//     if (!projectApplicants[project.project_id])
//       projectApplicants[project.project_id] = [];
//     projectApplicants[project.project_id].push({
//       student_id: student.student_id,
//       score,
//     });
//   }

//   // Final allocations
//   const allocations = {};
//   const ranks = {};

//   for (const [project_id, applicants] of Object.entries(projectApplicants)) {
//     const remaining = projectMap[project_id].available_slots;
//     if (remaining <= 0) continue;

//     applicants.sort((a, b) => b.score - a.score);
//     const selected = applicants.slice(0, remaining);

//     allocations[project_id] = selected;

//     // Save ranks for all applicants
//     ranks[project_id] = applicants.map((app, index) => ({
//       student_id: app.student_id,
//       rank: index + 1,
//       score: app.score,
//     }));
//   }

//   return { allocations, ranks };
// }

async function bostonMechanism(priorities) {
  console.log("running bostonMechanism---------------------------------------------------------")
  const weights = {
    cgpa: priorities.cgpa || 0,
    department: priorities.department || 0,
    year: priorities.year || 0,
    prereq: priorities.prereq || 0
  };

  console.log(weights)

  const students = (
    await pool.query(
      'SELECT Roll_no AS student_id, cgpa, year, department_id FROM students'
    )
  ).rows;


  const projects = (
    await pool.query(
      `SELECT p.project_id, p.available_slots, p.min_cgpa, p.min_year, pd.dept_id AS department_id 
       FROM projects p 
       LEFT JOIN project_dept pd ON p.project_id = pd.project_id`
    )
  ).rows;

  const applications = (await pool.query("SELECT * FROM project_applications")).rows;
  const studentMap = Object.fromEntries(students.map(s => [s.student_id, s]));
  const projectMap = Object.fromEntries(projects.map(p => [p.project_id, p]));

  const projectApplicants = {};

  for (const app of applications) {
    const student = studentMap[app.student_id];
    const project = projectMap[app.project_id];
    if (!student || !project) continue;

    const cgpa = parseFloat(student.cgpa) || 0;
    const year = student.year;
    const dept = student.department_id;
    const min_year = project.min_year;
    const proj_dept = project.department_id;
    
    // console.log("students details",cgpa,year,dept,'and',min_year,proj_dept)

    let score = 0;

    // CGPA is normalized out of 10 and scaled
    score += (cgpa / 10) * weights.cgpa;

    // Year match
    if (year != null && min_year != null && year >= min_year) {
      score += weights.year;
    }

    // Department match
    if (dept != null && proj_dept != null && dept === proj_dept) {
      score += weights.department;
    }

    // Prerequisite match
    const prereqRes = await pool.query(
      `SELECT course_id FROM prereq WHERE project_id = $1`,
      [project.project_id]
    );
    const prereqIds = prereqRes.rows.map(row => row.course_id);

    const completedRes = await pool.query(
      `SELECT course_id FROM student_courses WHERE student_id = $1`,
      [student.student_id]
    );
    const completedIds = completedRes.rows.map(row => row.course_id);

    const matchedCourses = prereqIds.filter(id => completedIds.includes(id));

    if (prereqIds.length > 0) {
      const percentMatched = matchedCourses.length / prereqIds.length;
      score += percentMatched * weights.prereq;
    }

    if (!projectApplicants[project.project_id])
      projectApplicants[project.project_id] = [];

    projectApplicants[project.project_id].push({
      student_id: student.student_id,
      score
    });
   console.log("score is", score)
 
  }

  
  const allocations = {};
  const ranks = {};

  for (const [project_id, applicants] of Object.entries(projectApplicants)) {
    const remaining = projectMap[project_id].available_slots;
    if (remaining <= 0) continue;

    applicants.sort((a, b) => b.score - a.score);
    const selected = applicants.slice(0, remaining);

    allocations[project_id] = selected;

    ranks[project_id] = applicants.map((app, index) => ({
      student_id: app.student_id,
      rank: index + 1,
      score: app.score
    }));
  }

  return { allocations, ranks };
}


async function saveAllocations_boston(prioritiesArray) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let priorities = {};
    if (Array.isArray(prioritiesArray)) {
      prioritiesArray.forEach(p => {
        priorities[p.key] = p.value;
      });
    } else {
      priorities = prioritiesArray || {};
    }

    const { allocations, ranks } = await bostonMechanism(priorities);

    // Clear previous records
    await client.query("DELETE FROM boston_allocations");
    await client.query("DELETE FROM boston_ranks");

    for (const [project_id, projectRanks] of Object.entries(ranks)) {
      const facultyResult = await client.query(
        "SELECT faculty_id FROM projects WHERE project_id = $1",
        [project_id]
      );
      const faculty_id = facultyResult.rows[0]?.faculty_id || null;

      for (const { student_id, rank, score } of projectRanks) {
        await client.query(
          `INSERT INTO boston_allocations (student_id, project_id, faculty_id, score)
           VALUES ($1, $2, $3, $4)`,
          [student_id, project_id, faculty_id, score]
        );

        await client.query(
          `INSERT INTO boston_ranks (student_id, project_id, rank)
           VALUES ($1, $2, $3)`,
          [student_id, project_id, rank]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Boston scores and ranks saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in Boston allocation:", err);
  } finally {
    client.release();
  }
}

// Listen for trigger notifications and run Gale-Shapley
pool.connect().then((client) => {
  client.query("LISTEN run_gale_shapley");

  client.on("notification", async (msg) => {
    if (msg.channel === "run_gale_shapley") {
      console.log("Detected preference change. Running Gale-Shapley...");
      await saveAllocations();
    }
  });
});

// async function SPA_lecturer() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();
//   const projects = await pool.query(
//     "SELECT project_id, faculty_id, available_slots FROM projects"
//   );

//   let studentPrefMapping = {};
//   studentPreferences.forEach(({ student_id, project_id }) => {
//     if (!studentPrefMapping[student_id]) {
//       studentPrefMapping[student_id] = [];
//     }
//     studentPrefMapping[student_id].push(Number(project_id));
//   });
//   console.log("SPA - Student preference mapping:", studentPrefMapping);
//   // io.emit()

//   let facPrefMapping = {};
//   facultyPreferences.forEach(({ project_id, student_id, rank }) => {
//     if (!facPrefMapping[project_id]) {
//       facPrefMapping[project_id] = [];
//     }
//     facPrefMapping[project_id].push({ student_id: Number(student_id), rank });
//   });

//   Object.keys(facPrefMapping).forEach((pid) => {
//     facPrefMapping[pid].sort((a, b) => a.rank - b.rank);
//     facPrefMapping[pid] = facPrefMapping[pid].map((item) => item.student_id);
//   });
//   console.log(
//     "SPA - Faculty (per project) preference mapping:",
//     facPrefMapping
//   );

//   let projectData = {};
//   let studentAssignments = {};

//   projects.rows.forEach(({ project_id, faculty_id, available_slots }) => {
//     projectData[project_id] = {
//       faculty_id,
//       capacity: available_slots,
//       assigned: [],
//     };
//   });
//   console.log("SPA - Project data:", projectData);

//   let freeProjects = new Set(Object.keys(facPrefMapping));

//   // if there are free projects
//   while (freeProjects.size > 0) {
//     console.log("Free projects:", Array.from(freeProjects));

//     // free proj at that instance
//     for (let project_id of Array.from(freeProjects)) {
//       let project = projectData[project_id];
//       // if the proj is full remove from free projects
//       if (project.assigned.length >= project.capacity) {
//         freeProjects.delete(project_id);
//         continue;
//       }

//       // pref list for each project
//       let prefList = facPrefMapping[project_id];
//       if (!prefList || prefList.length === 0) {
//         freeProjects.delete(project_id);
//         console.log(
//           `Project ${project_id} has no more students to propose to. Removing from freeProjects.`
//         );
//         continue;
//       }

//       // if not using shift(), the project gets proposed to that student again and again
//       // first preferred student is selected then the other .. and so on..
//       let student_id = prefList.shift();
//       console.log(`Project ${project_id} proposes to student ${student_id}`);

//       // if in the preference mapping of the student, the project is not present, the student is skipped
//       if (
//         !studentPrefMapping[student_id] ||
//         !studentPrefMapping[student_id].includes(Number(project_id))
//       ) {
//         console.log(
//           `Student ${student_id} does not have project ${project_id} in their preferences. Proposal rejected.`
//         );
//         continue;
//       }

//       // if the student is preferred,
//       // the already assigned project to it is removed and this project is assigned and the
//       // old project is added back to free projects,
//       // and the student is removed from the assigned of old project
//       if (studentAssignments[student_id] !== undefined) {
//         let oldProject = studentAssignments[student_id];
//         projectData[oldProject].assigned = projectData[
//           oldProject
//         ].assigned.filter((s) => s !== student_id);
//         freeProjects.add(String(oldProject));
//         console.log(
//           `Student ${student_id} was reassigned from project ${oldProject} to project ${project_id}.`
//         );
//       }

//       // the student is added to assigned of the current project,
//       // and this is added to assignments
//       project.assigned.push(student_id);
//       studentAssignments[student_id] = Number(project_id);

//       // all the projects after the project in the preference of that student is removed
//       let idx = studentPrefMapping[student_id].indexOf(Number(project_id));
//       if (idx !== -1) {
//         let removed = studentPrefMapping[student_id].splice(idx + 1);
//         console.log(
//           `Removed successors from student ${student_id}'s preference list after assignment to project ${project_id}:`,
//           removed
//         );
//       }

//       console.log(
//         `Project ${project_id} (Faculty ${project.faculty_id}) assigned student ${student_id}`
//       );

//       // if the assigned lists length = capacity, the project is deleted from the freeprojects
//       if (project.assigned.length >= project.capacity) {
//         freeProjects.delete(project_id);
//         console.log(
//           `Project ${project_id} is now full. Removing from freeProjects.`
//         );
//       }
//     }
//   }

//   console.log("Final student assignments:", studentAssignments);
//   return studentAssignments;
// }


async function SPA_lecturer() {
  console.log("--- Starting SPA_lecturer (Lecturer Proposing) ---");

  // 1. Fetch Data
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projectsResult = await pool.query(
    "SELECT project_id, faculty_id, available_slots FROM projects"
  );
  const projectsInput = projectsResult.rows;

  // 2. Process Preferences and Initialize Structures

  // --- Student Preferences ---
  // student_id -> { prefList: [project_id], rankMap: Map<project_id, rank> }
  const studentPrefData = {};
  const allStudentIds = new Set();
  studentPreferences.forEach(({ student_id, project_id, rank }) => {
      const sid = Number(student_id);
      const pid = Number(project_id);
      allStudentIds.add(sid);
      if (!studentPrefData[sid]) {
          studentPrefData[sid] = { prefList: [], rankMap: new Map(), _tempList: [] };
      }
      // Use provided rank or assign sequentially
      const effectiveRank = rank ?? studentPrefData[sid]._tempList.length + 1;
      studentPrefData[sid]._tempList.push({ pid, rank: effectiveRank });
      studentPrefData[sid].rankMap.set(pid, effectiveRank);
  });
  // Finalize sorted preference list
  for (const sid in studentPrefData) {
      studentPrefData[sid].prefList = studentPrefData[sid]._tempList
          .sort((a, b) => a.rank - b.rank)
          .map(item => item.pid);
      delete studentPrefData[sid]._tempList; // Clean up
  }
   console.log("SPA - Processed Student Prefs (Example):", Object.values(studentPrefData)[0]);


  // --- Lecturer Preferences ---
  // lecturer_id -> ordered list of student_ids
  const lecturerPrefLists = {};
   // Keep track of the next student index the lecturer will propose to
  const lecturerProposalIndex = {};
  const allLecturerIds = new Set();
  facultyPreferences.forEach(({ faculty_id, student_id, rank }) => {
      const lid = Number(faculty_id);
      const sid = Number(student_id);
      allLecturerIds.add(lid);
      if (!lecturerPrefLists[lid]) {
          lecturerPrefLists[lid] = [];
          lecturerProposalIndex[lid] = 0; // Start proposing from first student
      }
      lecturerPrefLists[lid].push({ sid, rank });
  });
  // Sort and finalize lists
  for (const lid in lecturerPrefLists) {
      lecturerPrefLists[lid] = lecturerPrefLists[lid]
          .sort((a, b) => a.rank - b.rank)
          .map(item => item.sid);
  }
  console.log("SPA - Processed Lecturer Prefs (Example):", lecturerPrefLists[Array.from(allLecturerIds)[0]]);


  // --- Project Data & Assignments ---
  // project_id -> { lecturer_id: number, capacity: number, assigned: Set<number> }
  const projectData = {};
  // Map lecturer_id -> Set<project_id> for easy lookup of projects offered by a lecturer
  const lecturerProjects = {};
  projectsInput.forEach(({ project_id, faculty_id, available_slots }) => {
      const pid = Number(project_id);
      const lid = Number(faculty_id);
      projectData[pid] = {
          lecturer_id: lid,
          capacity: available_slots,
          assigned: new Set(),
      };
      if (!lecturerProjects[lid]) {
          lecturerProjects[lid] = new Set();
      }
      lecturerProjects[lid].add(pid);
  });
  console.log("SPA - Initialized Project Data:", projectData);

  // student_id -> assigned_project_id | null
  const studentAssignments = {};
  allStudentIds.forEach(sid => studentAssignments[sid] = null);


  // --- Algorithm State (Following Figure 8 Implementation Sketch) ---
  // Stack of lecturers who might be able to make offers
  const lecturerStack = Array.from(allLecturerIds); // Start with all lecturers
  // Variable to hold a project that just became under-subscribed (used to prioritize its lecturer)
  let projectBecameUnderSubscribed = null; // Stores { projectId, lecturerId }

  let iterations = 0;

  // 3. Main Gale-Shapley Loop (Lecturer Proposing - based on Fig 8)
  while (lecturerStack.length > 0 || projectBecameUnderSubscribed) {
      iterations++;
      if (iterations > 10000) { // Safety break
          console.error("Max iterations reached. Potential infinite loop?");
          break;
      }

      let currentLecturerId;
      let processProjectBecameUnderSubscribed = false;

      // Prioritize lecturer whose project just became under-subscribed (Fig 8 logic with 'p')
      if (projectBecameUnderSubscribed) {
          currentLecturerId = projectBecameUnderSubscribed.lecturerId;
          // We only need to re-evaluate this lecturer if they might offer to the specific
          // student who would have been next for the project 'p'.
          // This logic gets complex; simplified approach: process this lecturer.
          console.log(`\nIter ${iterations}: Prioritizing Lecturer ${currentLecturerId} (Project ${projectBecameUnderSubscribed.projectId} became under-subscribed)`);
          projectBecameUnderSubscribed = null; // Reset the trigger
          processProjectBecameUnderSubscribed = true; // Flag to potentially re-add to stack later
      } else {
          // Otherwise, get a lecturer from the main stack
          currentLecturerId = Number(lecturerStack.pop());
          console.log(`\nIter ${iterations}: Processing Lecturer ${currentLecturerId} from stack`);
      }

      const currentLecPrefList = lecturerPrefLists[currentLecturerId] || [];
      let proposalIndex = lecturerProposalIndex[currentLecturerId];

      // Check if lecturer has students left to propose to
      if (proposalIndex >= currentLecPrefList.length) {
          console.log(`   Lecturer ${currentLecturerId} has no more students on their list.`);
          continue; // Get next lecturer from stack
      }

      // Get the next student the lecturer wants to propose to
      const targetStudentId = currentLecPrefList[proposalIndex];
      console.log(`   Lecturer ${currentLecturerId} considers Student ${targetStudentId} (Index ${proposalIndex})`);

      const studentData = studentPrefData[targetStudentId];
      const studentProjPrefList = studentData?.prefList || [];
      const studentProjRankMap = studentData?.rankMap || new Map();

      // Find the best project offered by this lecturer that the student might accept
      let bestOfferProjectId = null;
      let currentAssignmentProjectId = studentAssignments[targetStudentId];
      let currentAssignmentRank = currentAssignmentProjectId !== null ? (studentProjRankMap.get(currentAssignmentProjectId) ?? Infinity) : Infinity;

      // Iterate through the *student's* project preferences
      for (const projectId of studentProjPrefList) {
          const projInfo = projectData[projectId];
          // Check if this project is offered by the current lecturer
          if (projInfo && projInfo.lecturer_id === currentLecturerId) {
              // Check if project has capacity OR if student is already assigned there (no capacity check needed for that)
              const projectHasCapacity = projInfo.assigned.size < projInfo.capacity;

              // Check if student prefers this project over their current assignment
              const proposedRank = studentProjRankMap.get(projectId) ?? Infinity;
              const studentPrefersThisProject = proposedRank < currentAssignmentRank;

              // Valid offer if: project has space AND student prefers it (or is free)
              if (projectHasCapacity && studentPrefersThisProject) {
                   bestOfferProjectId = projectId;
                   console.log(`   Found suitable offer: Project ${projectId} for Student ${targetStudentId} (Rank ${proposedRank} < Current Rank ${currentAssignmentRank === Infinity ? 'Inf' : currentAssignmentRank})`);
                   break; // Found the best possible offer from this lecturer for this student
              }
              // If student already assigned here, no better offer from this lecturer possible
              if (projectId === currentAssignmentProjectId) {
                  console.log(`   Student ${targetStudentId} already holds best/equal offer from this lecturer (Project ${projectId}). No action.`);
                  break; // No better offer possible *from this lecturer*
              }
          }
      } // End iterating student's preferences

      // --- Process the Offer Outcome ---
      if (bestOfferProjectId !== null) {
          // OFFER ACCEPTED (Implicitly, as it's the best valid one)
          console.log(`   OFFER ACCEPTED: Student ${targetStudentId} accepts Project ${bestOfferProjectId} from Lecturer ${currentLecturerId}`);

          // 1. Break previous assignment, if any
          if (currentAssignmentProjectId !== null) {
              const oldProjInfo = projectData[currentAssignmentProjectId];
              const oldLecturerId = oldProjInfo.lecturer_id;
              const wasFull = oldProjInfo.assigned.size >= oldProjInfo.capacity;

              oldProjInfo.assigned.delete(targetStudentId);
              console.log(`   Student ${targetStudentId} removed from previous Project ${currentAssignmentProjectId} (Lecturer ${oldLecturerId})`);

              // If old project became under-subscribed, flag its lecturer for re-evaluation (Fig 8 logic)
              if (wasFull && oldProjInfo.assigned.size < oldProjInfo.capacity) {
                  projectBecameUnderSubscribed = { projectId: currentAssignmentProjectId, lecturerId: oldLecturerId };
                  console.log(`   Project ${currentAssignmentProjectId} became under-subscribed. Flagging Lecturer ${oldLecturerId}.`);
              }
              // Add the lecturer back to the main stack if not handled by the priority mechanism
              // To avoid infinite loops if they bounce back and forth, only add if not the current one
              else if (oldLecturerId !== currentLecturerId && !lecturerStack.includes(oldLecturerId)) {
                 // Push only if not already handled or on stack - prevents duplicates maybe? Needs care.
                 // Let's simplify: Always push. If they have no valid moves, they'll be popped quickly.
                 lecturerStack.push(oldLecturerId);
                 console.log(`   Lecturer ${oldLecturerId} pushed back onto stack.`);
              }
          }

          // 2. Make the new assignment
          projectData[bestOfferProjectId].assigned.add(targetStudentId);
          studentAssignments[targetStudentId] = bestOfferProjectId;
          console.log(`   Student ${targetStudentId} assigned to Project ${bestOfferProjectId}.`);

          // 3. "Delete" subsequent projects from student's perspective
          // (Implicitly handled by how we search student list from the start)
          // The paper's Fig 5 pseudocode implies direct list modification, but we handle
          // it by always searching for the *best* valid project on their list.
          console.log(`   (Implicitly: projects after ${bestOfferProjectId} on Student ${targetStudentId}'s list are now irrelevant for future offers)`);

          // Lecturer `currentLecturerId` successfully made an assignment.
          // Should they be pushed back? Yes, if they might propose to the *same* student for a *different* project later,
          // OR if they need to propose to the *next* student.
          // Since we processed student `proposalIndex`, let's advance the lecturer's index
          // and push them back IF they have more students to consider.
          lecturerProposalIndex[currentLecturerId]++;
          if (lecturerProposalIndex[currentLecturerId] < currentLecPrefList.length) {
              if (!lecturerStack.includes(currentLecturerId)) { // Avoid duplicate pushes if possible
                  lecturerStack.push(currentLecturerId);
                  console.log(`   Lecturer ${currentLecturerId} pushed back onto stack (to consider next student).`);
              }
          } else {
               console.log(`   Lecturer ${currentLecturerId} finished their list.`);
          }


      } else {
          // NO SUITABLE OFFER FOUND for this student from this lecturer at this time
          console.log(`   No suitable project found for Student ${targetStudentId} from Lecturer ${currentLecturerId} at this time.`);

          // Advance lecturer's pointer to consider the next student next time
          lecturerProposalIndex[currentLecturerId]++;

          // Push lecturer back onto stack ONLY if they haven't exhausted their list
          if (lecturerProposalIndex[currentLecturerId] < currentLecPrefList.length) {
               // Avoid adding duplicates if possible
              if (!lecturerStack.includes(currentLecturerId) && !processProjectBecameUnderSubscribed) {
                 lecturerStack.push(currentLecturerId);
                 console.log(`   Lecturer ${currentLecturerId} pushed back onto stack (to consider next student).`);
              } else if(processProjectBecameUnderSubscribed) {
                 // If processed due to priority, ensure it gets back on stack if needed
                 lecturerStack.push(currentLecturerId);
                 console.log(`   Lecturer ${currentLecturerId} (priority processed) pushed back onto stack.`);
              }
          } else {
              console.log(`   Lecturer ${currentLecturerId} finished their list.`);
          }
      }

  } // End while loop

  console.log("--- SPA_lecturer Finished ---");

  // 4. Return the final assignments (student_id -> project_id)
  console.log("Final Student Assignments:", studentAssignments);
  return studentAssignments;
}


// async function SPA_student() {
//   const { studentPreferences, facultyPreferences } = await getPreferences();
//   const projects = await pool.query(
//     "SELECT project_id, faculty_id, available_slots FROM projects"
//   );

//   let studentPrefMapping = {};
//   studentPreferences.forEach(({ student_id, project_id }) => {
//     if (!studentPrefMapping[student_id]) {
//       studentPrefMapping[student_id] = [];
//     }
//     studentPrefMapping[student_id].push(Number(project_id));
//   });
//   console.log("SPA - Student preference mapping:", studentPrefMapping);
//   // broadcast("SPA - Student preference mapping:"+JSON.stringify(studentPrefMapping));
//   let facPrefMapping = {};
//   facultyPreferences.forEach(({ project_id, student_id, rank }) => {
//     if (!facPrefMapping[project_id]) {
//       facPrefMapping[project_id] = [];
//     }
//     facPrefMapping[project_id].push({ student_id: Number(student_id), rank });
//   });

//   Object.keys(facPrefMapping).forEach((pid) => {
//     facPrefMapping[pid].sort((a, b) => a.rank - b.rank);
//     facPrefMapping[pid] = facPrefMapping[pid].map((item) => item.student_id);
//   });
//   console.log(
//     "SPA - Faculty (per project) preference mapping:",
//     facPrefMapping
//   );
//   // broadcast("SPA - Faculty (per project) preference mapping:"+JSON.stringify(facPrefMapping));

//   let projectData = {};
//   let projectAssignments = {};

//   projects.rows.forEach(({ project_id, faculty_id, available_slots }) => {
//     projectData[project_id] = {
//       faculty_id,
//       capacity: available_slots,
//       assigned: [],
//     };
//   });
//   console.log("SPA - Project data:", projectData);
//   // broadcast("SPA - Project data:"+JSON.stringify(projectData));

//   let freeStudents = new Set(Object.keys(studentPrefMapping));

//   // if there are free projects
//   while (freeStudents.size > 0) {
//     console.log("Free projects:", Array.from(freeStudents));
//     // broadcast("Free projects:" + JSON.stringify(Array.from(freeStudents)));

//     // free proj at that instance
//     for (let student_id of Array.from(freeStudents)) {
//       let prefList = studentPrefMapping[student_id];
//       if (!prefList || prefList.length === 0) {
//         freeStudents.delete(student_id);
//         console.log(
//           `Student ${student_id} has no more projects to propose to. Removing from freeStudents.`
//         );
//         continue;
//       }

//       // if not using shift(), the student gets proposed to that project again and again
//       // first preferred project is selected then the other .. and so on..
//       let project_id = prefList.shift();
//       console.log(`student_id ${student_id} proposes to project ${project_id}`);

//       // if in the preference mapping of the student, the project is not present, the student is skipped
//       if (
//         !facPrefMapping[project_id] ||
//         !facPrefMapping[project_id].includes(Number(student_id))
//       ) {
//         console.log(
//           `project ${project_id} does not have student ${project_id} in their preferences. Proposal rejected.`
//         );
//         continue;
//       }

//       // if the project is preferred,
//       // the already assigned project to it is removed and this project is assigned and the
//       // old project is added back to free projects,
//       // and the student is removed from the assigned of old project
//       if (
//         projectData[project_id].assigned.length <
//         projectData[project_id].capacity
//       ) {
//         // let oldProject = studentAssignments[student_id];
//         // projectData[oldProject].assigned = projectData[oldProject].assigned.filter(s => s !== student_id);
//         // freeProjects.add(String(oldProject));
//         // console.log(`Student ${student_id} was reassigned from project ${oldProject} to project ${project_id}.`);
//         if (projectData[project_id].assigned.length === 0) {
//           projectAssignments[project_id] = [];
//         }
//         projectAssignments[project_id].push(student_id);
//         projectData[project_id].assigned.push(student_id);
//         freeStudents.delete(student_id);
//       } else {
//         let assigned = projectData[project_id].assigned;
//         let facultyPref = facPrefMapping[project_id] || [];
//         let worstStudent = assigned.reduce((worst, s) => {
//           // If the student s ranks lower (i.e. appears later in the facultyPref list)
//           // than the current worst, then update worst.
//           if (worst === null) return s;
//           let worstIndex = facultyPref.indexOf(worst);
//           let sIndex = facultyPref.indexOf(s);
//           return sIndex > worstIndex ? s : worst;
//         }, null);
//         projectData[project_id].assigned = assigned.filter(
//           (s) => s !== worstStudent
//         );
//         freeStudents.add(String(worstStudent));
//         console.log(
//           `Project ${project_id} over-subscribed: removed worst student ${worstStudent}`
//         );
//       }

//       if (projectData[project_id].assigned.includes(Number(student_id))) {
//         freeStudents.delete(student_id);

//         // all the projects after the project in the preference of that student is removed
//         let idx = facPrefMapping[project_id].indexOf(Number(student_id));
//         if (idx !== -1) {
//           let removed = facPrefMapping[project_id].splice(idx + 1);
//           console.log(
//             `Removed successors from projects ${project_id}'s preference list after assignment to student ${student_id}:`,
//             removed
//           );
//         }

//         console.log(`Project ${project_id} assigned student ${student_id}`);
//       }
//     }
//   }

//   console.log("Final student assignments:", projectAssignments);
//   return projectAssignments;
// }

async function SPA_student()  {
  console.log("--- Starting SPA_student (Student Proposing) ---");

  // 1. Fetch Data
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projectsResult = await pool.query(
    // We don't strictly need faculty_id if we ignore lecturer capacity
    "SELECT project_id, available_slots FROM projects"
  );
  const projects = projectsResult.rows;

  // 2. Process Preferences and Initialize Structures

  // --- Student Preferences ---
  // student_id -> ordered list of project_ids
  // Assumes studentPreferences is ordered by preference (rank 1 first)
  let studentPrefLists = {};
  // Keep track of the next project index the student will propose to
  let studentProposalIndex = {};
  const allStudentIds = new Set(); // Collect all student IDs

  studentPreferences.forEach(({ student_id, project_id, rank }) => {
      const sid = Number(student_id);
      const pid = Number(project_id);
      allStudentIds.add(sid);
      if (!studentPrefLists[sid]) {
          studentPrefLists[sid] = [];
          studentProposalIndex[sid] = 0; // Initialize proposal index
      }
      // Store with rank to sort, then map to just project_id
      studentPrefLists[sid].push({ pid, rank: rank ?? studentPrefLists[sid].length + 1 });
  });

  // Ensure lists are sorted by rank and contain only project IDs
  for (const sid in studentPrefLists) {
      studentPrefLists[sid] = studentPrefLists[sid]
          .sort((a, b) => a.rank - b.rank)
          .map(item => item.pid);
  }
   console.log("SPA - Processed Student Preferences (Example):", studentPrefLists[Array.from(allStudentIds)[0]]);


  // --- Faculty Preferences (per Project) ---
  // project_id -> Map<student_id, rank> for efficient rank lookup
  let projectRankingsMap = {};
  facultyPreferences.forEach(({ project_id, student_id, rank }) => {
      const pid = Number(project_id);
      const sid = Number(student_id);
      if (!projectRankingsMap[pid]) {
          projectRankingsMap[pid] = new Map();
      }
      projectRankingsMap[pid].set(sid, rank); // Store student ID -> rank mapping
  });
  console.log("SPA - Processed Faculty Preferences (Example):", projectRankingsMap[Object.keys(projectRankingsMap)[0]]);


  // --- Project Data & Assignments ---
  // project_id -> { capacity: number, assigned: Set<student_id> }
  let projectData = {};
  projects.forEach(({ project_id, available_slots }) => {
      const pid = Number(project_id);
      projectData[pid] = {
          capacity: available_slots,
          assigned: new Set(), // Use a Set for efficient add/delete/has
      };
  });
   console.log("SPA - Initialized Project Data:", projectData);

  // student_id -> project_id | null : Tracks current tentative assignment
  let studentAssignments = {};
  allStudentIds.forEach(sid => studentAssignments[sid] = null);

  // Set of students who need to make a proposal
  let freeStudents = new Set(allStudentIds); // Initially all students are free

  let iterations = 0;


  // 3. Main Gale-Shapley Loop (Student Proposing)
  while (freeStudents.size > 0 && iterations < 10000) { // Add iteration limit
    iterations++;
    // Select ONE free student
    const studentId = Number(Array.from(freeStudents)[0]);

    const prefList = studentPrefLists[studentId] || [];
    const proposalIndex = studentProposalIndex[studentId];

    // Check if student has exhausted their list
    if (proposalIndex >= prefList.length) {
      console.log(`Student ${studentId} has exhausted preferences.`);
      freeStudents.delete(studentId); // Remove permanently
      continue;
    }

    // Get the next project to propose to
    const projectId = prefList[proposalIndex];
    console.log(`\nIter ${iterations}: Student ${studentId} proposes to Project ${projectId}`);

    // --- Project Decision Logic ---
    const project = projectData[projectId];

    // Sanity check: Does the project exist in our data?
    if (!project) {
        console.warn(`   WARN: Student ${studentId} proposed to non-existent/unconfigured project ${projectId}. Skipping.`);
        studentProposalIndex[studentId]++; // Student moves to next preference
        freeStudents.add(studentId); // Student needs to propose again
        freeStudents.delete(studentId); // Trick to re-trigger loop correctly if needed
        freeStudents.add(studentId); // Make sure student stays in free set to try again
        continue;
    }

    const rankings = projectRankingsMap[projectId]; // Map<student_id, rank> for this project

    // Case 1: Project has space
    if (project.assigned.size < project.capacity) {
      console.log(`   Project ${projectId} has space (${project.assigned.size}/${project.capacity}).`);
      // Accept the proposal tentatively
      const previousAssignment = studentAssignments[studentId];
      // If student was assigned elsewhere, remove them from that project's set
      if (previousAssignment !== null && projectData[previousAssignment]) {
          projectData[previousAssignment].assigned.delete(studentId);
          console.log(`   Student ${studentId} removed from previous project ${previousAssignment}.`);
      }

      // Assign student to new project
      project.assigned.add(studentId);
      studentAssignments[studentId] = projectId;
      freeStudents.delete(studentId); // Student is now tentatively assigned
      console.log(`   Student ${studentId} tentatively assigned to Project ${projectId}.`);

    }
    // Case 2: Project is full
    else {
      console.log(`   Project ${projectId} is full (${project.assigned.size}/${project.capacity}). Comparing preferences.`);
      let worstStudentId = -1;
      let worstRank = -Infinity; // Lower rank number is better, so highest number is worst

      // Find the worst student currently assigned (according to project's ranking)
      for (const assignedStudentId of project.assigned) {
          const rank = rankings?.get(assignedStudentId);
          // Treat unranked students as having the worst possible rank (Infinity)
          const effectiveRank = (rank === undefined) ? Infinity : rank;

          if (effectiveRank >= worstRank) { // Find highest rank number (or first Infinity)
              if (effectiveRank > worstRank || worstStudentId === -1 || effectiveRank === Infinity) {
                 worstRank = effectiveRank;
                 worstStudentId = assignedStudentId;
              }
          }
      }
       console.log(`   Worst student currently in Project ${projectId} is ${worstStudentId} (Rank: ${worstRank === Infinity ? 'Unranked/Inf' : worstRank})`);

      // Compare proposer to the worst student
      const proposerRank = rankings?.get(studentId);
      const effectiveProposerRank = (proposerRank === undefined) ? Infinity : proposerRank;
      console.log(`   Proposing student ${studentId} rank is ${effectiveProposerRank === Infinity ? 'Unranked/Inf' : effectiveProposerRank}`);


      // If proposer is preferred over the worst (strictly better rank, or proposer ranked and worst not)
      if (effectiveProposerRank < worstRank) {
          console.log(`   Project ${projectId} PREFERS proposing Student ${studentId} over worst Student ${worstStudentId}.`);
          // Reject the worst student
          project.assigned.delete(worstStudentId);
          studentAssignments[worstStudentId] = null; // Mark worst student as unassigned
          freeStudents.add(worstStudentId); // Make worst student free again
          console.log(`   Rejected/Freed Student ${worstStudentId}.`);

          // Accept the proposing student
          const previousAssignment = studentAssignments[studentId];
           // If student was assigned elsewhere, remove them from that project's set
          if (previousAssignment !== null && projectData[previousAssignment]) {
              projectData[previousAssignment].assigned.delete(studentId);
              console.log(`   Student ${studentId} removed from previous project ${previousAssignment}.`);
          }
          project.assigned.add(studentId);
          studentAssignments[studentId] = projectId;
          freeStudents.delete(studentId); // Proposer is now assigned
          console.log(`   Accepted Student ${studentId} into Project ${projectId}.`);

      } else {
        // Project prefers the current worst, or proposer is ranked worse/equally/unranked
        console.log(`   Project ${projectId} REJECTS Student ${studentId} (prefers current worst or ranks proposer lower/equally).`);
        // Student remains free. Add them back to ensure the loop continues processing them.
        // (No need to add back if we only select one student per outer loop - they stay free naturally)
      }
    }
    // Crucially, advance the student's proposal index AFTER the proposal outcome is known for *this* project
    studentProposalIndex[studentId]++;

  } // End while loop

  if (iterations >= 10000) {
      console.error("Error: Maximum iterations reached.");
  }
  console.log("--- SPA_student Finished ---");

  // 4. Format Final Output (project_id -> list of student_ids)
  const finalProjectAssignments = {};
  Object.keys(projectData).forEach(pid => {
      const projectIdNum = Number(pid);
      // Convert Set to sorted Array for consistent output
      finalProjectAssignments[projectIdNum] = Array.from(projectData[projectIdNum].assigned).sort((a, b) => a - b);
  });

  console.log("Final Project Assignments:", finalProjectAssignments);
  // You could also return studentAssignments if needed: console.log("Final Student Assignments:", studentAssignments);
  return studentAssignments;
}


async function saveAllocations_SPAlecture() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const studentAssignments = await SPA_lecturer();
    console.log("SPA lecturer allocations", studentAssignments);

    await client.query("DELETE FROM project_allocations");
    console.log("ass :", Object.entries(studentAssignments));
    // Iterate over each student assignment
    for (const [student_id, project_id] of Object.entries(studentAssignments)) {
      // const project_id = assignment.project_id;
      if (project_id != null){
      const { faculty_id } = (
        await client.query(
          "SELECT faculty_id from projects where project_id = $1",
          [project_id]
        )
      ).rows[0];
      console.log("faculty_id", faculty_id);
      // Insert the allocation into the database
      await client.query(
        `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (student_id, project_id) DO NOTHING`,
        [student_id, project_id, faculty_id]
      );
    }
    }

    await client.query("COMMIT"); // Commit transaction
    console.log("Project allocations (faculty propose) saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error in saving allocations (faculty propose):", err);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

async function saveAllocations_SPAstudent() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction
    const allocations = await SPA_student();
    console.log("SPA student", allocations);
    // Clear previous allocations
    await pool.query("DELETE FROM project_allocations");
    for (const [student_id, project_id] of Object.entries(allocations)) {
        const facultyResult = await client.query(
          "SELECT faculty_id FROM projects WHERE project_id = $1",
          [project_id]
        );
        const faculty_id = facultyResult.rows[0]?.faculty_id || null;

        await client.query(
          `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (student_id, project_id) DO NOTHING`,
          [student_id, project_id, faculty_id]
        );
      
    }

    await client.query("COMMIT"); // Commit transaction
    await SPA_student();
    console.log("Project allocations -- SPA student saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error allocating projects:", err);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

saveAllocations().catch((err) =>
  console.error("Error allocating projects:", err)
);

// module.exports =  pool;
module.exports = {
  pool,
  saveAllocations_facpropose,
  saveAllocations,
  bostonMechanism,
  saveAllocations_boston,
  saveAllocations_SPAlecture,
  saveAllocations_SPAstudent,
};
