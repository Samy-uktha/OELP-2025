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

async function galeShapley_facpropose() {
  // Get preferences from your data source.
  const { studentPreferences, facultyPreferences } = await getPreferences();

  // Build a lookup for each student’s sorted project preferences.
  // Map key: student_id, value: sorted array of { project_id, rank }
  const studentPrefMap = new Map();
  studentPreferences.forEach(pref => {
    const sid = Number(pref.student_id);
    if (!studentPrefMap.has(sid)) {
      studentPrefMap.set(sid, []);
    }
    studentPrefMap.get(sid).push({ project_id: pref.project_id, rank: pref.rank });
  });
  // Sort each student’s preferences by rank (ascending)
  for (const [sid, prefs] of studentPrefMap.entries()) {
    prefs.sort((a, b) => a.rank - b.rank);
  }

  // Build a lookup for faculty rankings.
  // Key is `${student_id}-${project_id}` and value is the rank.
  const facultyRankMap = new Map();
  facultyPreferences.forEach(pref => {
    const key = `${Number(pref.student_id)}-${pref.project_id}`;
    facultyRankMap.set(key, pref.rank);
  });

  // Build proposals from faculty. For each student, collect all proposals.
  // Map key: student_id, value: array of { faculty_id, project_id }
  const proposals = new Map();
  facultyPreferences.forEach(pref => {
    const sid = Number(pref.student_id);
    if (!proposals.has(sid)) {
      proposals.set(sid, []);
    }
    proposals.get(sid).push({ faculty_id: pref.faculty_id, project_id: pref.project_id });
  });

  // Get available slots for each project.
  const projectSlots = {};
  const projectsResult = await pool.query("SELECT project_id, available_slots FROM projects");
  projectsResult.rows.forEach(({ project_id, available_slots }) => {
    projectSlots[project_id] = available_slots;
  });

  // Object to store final student assignments: { student_id: project_id }
  const studentAssignments = {};

  // Start with all students who have received proposals.
  const unassignedStudents = new Set(proposals.keys());

  while (unassignedStudents.size > 0) {
    // Pick one unassigned student.
    const student_id = unassignedStudents.values().next().value;
    const studentProposals = proposals.get(student_id) || [];

    // If the student has no proposals, remove and continue.
    if (studentProposals.length === 0) {
      unassignedStudents.delete(student_id);
      continue;
    }

    // Get the student's sorted list of preferred projects.
    const studentPrefs = studentPrefMap.get(student_id) || [];
    // Create a set of projects that have proposed to this student.
    const proposedProjects = new Set(studentProposals.map(p => p.project_id));
    // From the student's preference list, pick the first project that was proposed.
    const bestChoiceObj = studentPrefs.find(pref => proposedProjects.has(pref.project_id));
    if (!bestChoiceObj) {
      unassignedStudents.delete(student_id);
      continue;
    }
    const bestChoice = bestChoiceObj.project_id;

    // If the project has available slots, assign the student.
    if (projectSlots[bestChoice] > 0) {
      studentAssignments[student_id] = bestChoice;
      projectSlots[bestChoice]--;
      unassignedStudents.delete(student_id);
    } else {
      // Project is full; find the worst-ranked student currently assigned to this project.
      const assignedStudents = Object.entries(studentAssignments)
        .filter(([sid, pid]) => pid === bestChoice)
        .map(([sid]) => Number(sid));

      let worstStudent = null;
      let worstStudentRank = -1; // Higher number is worse

      for (const sid of assignedStudents) {
        const key = `${sid}-${bestChoice}`;
        const rank = facultyRankMap.get(key) ?? Infinity;
        if (rank > worstStudentRank) {
          worstStudent = sid;
          worstStudentRank = rank;
        }
      }

      // Determine the current student's ranking for the project.
      const currentKey = `${student_id}-${bestChoice}`;
      const currentStudentRank = facultyRankMap.get(currentKey) ?? Infinity;

      // If the current student has a better (lower) rank, replace the worst student.
      if (currentStudentRank < worstStudentRank) {
        delete studentAssignments[worstStudent];
        studentAssignments[student_id] = bestChoice;
        unassignedStudents.delete(student_id);
        // Add the replaced student back for reprocessing.
        unassignedStudents.add(worstStudent);
      } else {
        // The current student cannot beat the worst student; remove from unassigned.
        unassignedStudents.delete(student_id);
      }
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
  // Run the Gale-Shapley Faculty-Propose algorithm to get student assignments
  const studentAssignments = await galeShapley_facpropose();

  // Loop through the assignments and insert them into the database
  for (const [student_id, project_id] of Object.entries(studentAssignments)) {
    // Get the faculty_id associated with the project (assuming each project has one faculty member)
    const facultyResult = await pool.query(
      "SELECT faculty_id FROM projects WHERE project_id = $1", [project_id]
    );

    const faculty_id = facultyResult.rows[0]?.faculty_id || null;

    // Insert the assignment into the project_allocations table
    await pool.query("DELETE FROM project_allocations");
    await pool.query(
      `INSERT INTO project_allocations (student_id, project_id, faculty_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (student_id, project_id) DO NOTHING`, 
      [student_id, project_id, faculty_id]
    );
  }

  console.log("Allocations saved successfully!");
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