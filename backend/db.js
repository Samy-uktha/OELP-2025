require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: 'postgres', // Replace with your actual username
  host: 'localhost',
  database: 'ProjectAllotment',
  password: 'postgres',
  port: 5432,
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
    console.log(studentPreferences.rows);
    return { studentPreferences: studentPreferences.rows, facultyPreferences: facultyPreferences.rows };
  } catch (error) {
    console.error("Error fetching preferences:", error);
    throw error;
  }
}

// Gale-Shapley Algorithm for Project Allocation
// Gale-Shapley Algorithm for Project Allocation
async function galeShapley() {
  const { studentPreferences, facultyPreferences } = await getPreferences();

  let studentProposals = {}; // Students' project preferences
  let projectSlots = {}; // Available slots for each project
  let projectAllocations = {}; // Tracks project allocations

  // Initialize available slots per project
  const projects = await pool.query("SELECT project_id, available_slots FROM projects");
  projects.rows.forEach(({ project_id, available_slots }) => {
      projectSlots[project_id] = available_slots;
      projectAllocations[project_id] = []; // Initialize empty list for allocations
  });

  // Store student preferences
  studentPreferences.forEach(({ student_id, project_id }) => {
      if (!studentProposals[student_id]) {
          studentProposals[student_id] = [];
      }
      studentProposals[student_id].push(project_id);
  });

  // Unassigned students
  let unassignedStudents = new Set(Object.keys(studentProposals));

  while (unassignedStudents.size > 0) {
      let student_id = Array.from(unassignedStudents)[0]; // Pick an unassigned student

      if (!studentProposals[student_id] || studentProposals[student_id].length === 0) {
          unassignedStudents.delete(student_id); // No choices left, remove student
          continue;
      }

      let preferredProject = studentProposals[student_id].shift(); // Pick top choice

      if (projectAllocations[preferredProject].length < projectSlots[preferredProject]) {
          // If project has space, allocate the student
         
          projectAllocations[preferredProject].push(Number(student_id));
          unassignedStudents.delete(student_id);
      } else {
        console.log("Now unassigned",student_id);
          // Project full, check faculty preference
          let currentAllocations = projectAllocations[preferredProject];
          console.log("current",currentAllocations);
          // Get faculty rankings for the project
          let facultyRankedStudents = facultyPreferences
              .filter(f => f.project_id === preferredProject)
              .sort((a, b) => a.rank - b.rank)
              .map(f => f.student_id);
            console.log("faculty ranked students = ",facultyRankedStudents);

          // Filter faculty preferences to only include currently allocated students
          let rankedAllocatedStudents = facultyRankedStudents.filter(s => currentAllocations.includes(s));
          console.log("ranked allocated = ",rankedAllocatedStudents);

          if (facultyRankedStudents.includes(Number(student_id))) {
              let leastPreferred = rankedAllocatedStudents[rankedAllocatedStudents.length - 1];
            console.log("leastpreferred -- and the other student",leastPreferred, student_id);
              if (student_id !== leastPreferred) {
                  // Remove the least preferred student and replace with the new one
                  projectAllocations[preferredProject] = projectAllocations[preferredProject].filter(s => s !== leastPreferred);
                  projectAllocations[preferredProject].push(Number(student_id));

                  // Reassign the removed student
                  unassignedStudents.add(leastPreferred);
                  unassignedStudents.delete(student_id);
              }
          }
      }
  }

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

async function galeShapley_facpropose() {
  const { studentPreferences, facultyPreferences } = await getPreferences();
  // const projects = await getProjects(); // Each project has project_id and available_slots

  const projects = (await pool.query("SELECT project_id, available_slots FROM projects")).rows;

  // Build student preference mapping: student_id -> ordered array of project_ids
  let studentPrefMapping = {};
  studentPreferences.forEach(({ student_id, project_id }) => {
    if (!studentPrefMapping[student_id]) {
      studentPrefMapping[student_id] = [];
    }
    studentPrefMapping[student_id].push(project_id);
  });

  // Build faculty proposal mapping: faculty_id -> ordered array of proposals
  let facultyProposalMapping = {};
  facultyPreferences.forEach(({ faculty_id, student_id, project_id, rank }) => {
    if (!facultyProposalMapping[faculty_id]) {
      facultyProposalMapping[faculty_id] = [];
    }
    facultyProposalMapping[faculty_id].push({ student_id, project_id, rank });
  });

  // Sort proposals by rank
  for (let faculty_id in facultyProposalMapping) {
    facultyProposalMapping[faculty_id].sort((a, b) => a.rank - b.rank);
  }

  // Build project slot tracker and allocations
  let projectSlots = {};
  let projectAllocations = {};
  projects.forEach(({ project_id, available_slots }) => {
    projectSlots[project_id] = available_slots;
    projectAllocations[project_id] = []; // stores student_ids
  });

  // Student assignments: student_id -> { faculty_id, project_id }
  let studentAssignments = {};

  // Initialize the set of free (unmatched) faculty members.
  let freeFaculties = new Set(Object.keys(facultyProposalMapping));

  // Main loop
  while (freeFaculties.size > 0) {
    let faculty_id = Array.from(freeFaculties)[0];
    let proposals = facultyProposalMapping[faculty_id];

    // If no more proposals, remove from free set
    if (!proposals || proposals.length === 0) {
      freeFaculties.delete(faculty_id);
      continue;
    }

    // Propose to the top student
    let proposal = proposals.shift(); // Remove the first proposal
    let student_id = proposal.student_id;
    let project_id = proposal.project_id;

    // Skip if project has no remaining slots
    if (projectAllocations[project_id].length >= projectSlots[project_id]) {
      continue;
    }

    if (!studentAssignments[student_id]) {
      // Student is unassigned — accept the proposal
      studentAssignments[student_id] = { faculty_id, project_id };
      projectAllocations[project_id].push(student_id);
    } else {
      // Student is already assigned — compare preferences
      let current = studentAssignments[student_id];
      let studentPrefs = studentPrefMapping[student_id] || [];

      let currentIndex = studentPrefs.indexOf(current.project_id);
      let newIndex = studentPrefs.indexOf(project_id);

      if (newIndex !== -1 && (currentIndex === -1 || newIndex < currentIndex)) {
        // Student prefers new project — switch assignment
        studentAssignments[student_id] = { faculty_id, project_id };

        // Update project allocations
        const oldProj = current.project_id;
        projectAllocations[oldProj] = projectAllocations[oldProj].filter(id => id !== student_id);
        projectAllocations[project_id].push(student_id);

        // Free up the old faculty if they have more proposals
        freeFaculties.add(current.faculty_id);
      }
    }

    // Remove faculty if no more proposals
    if (facultyProposalMapping[faculty_id].length === 0) {
      freeFaculties.delete(faculty_id);
    }
  }

  return studentAssignments;
}





// Store allocations in the database
async function saveAllocations() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction
    const allocations = await galeShapley();
    console.log("faccc--student",allocations);
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
    console.log("Project allocations saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback on error
    console.error("Error allocating projects:", err);
  } finally {
    client.release(); // Release the client back to the pool
  }
}

async function saveAllocations_facpropose() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query("BEGIN"); // Start transaction

    // Run the Gale-Shapley algorithm (faculty propose version)
    // It should return an object with keys as student_ids and values as assignments objects
    const studentAssignments = await galeShapley_facpropose();
    console.log("faccc---prop",studentAssignments);

    // Clear previous allocations (adjust table name as needed)
    await client.query("DELETE FROM project_allocations");

    // Iterate over each student assignment
    for (const [student_id, assignment] of Object.entries(studentAssignments)) {
      // assignment is an object with faculty_id and project_id
      const project_id = assignment.project_id;
      const faculty_id = assignment.faculty_id;

      // Insert the allocation into the database
      await client.query(
        `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (student_id, project_id) DO NOTHING`,
        [student_id, project_id, faculty_id]
      );
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

saveAllocations()
  .catch((err) => console.error("Error allocating projects:", err));

// module.exports =  pool;
module.exports = {
  pool,
  saveAllocations_facpropose,
  saveAllocations,
};