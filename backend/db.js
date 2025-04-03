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
      SELECT student_id, project_id, rank FROM student_preferences ORDER BY rank ASC;
    `;

    const facultyPreferencesQuery = `
      SELECT faculty_id, student_id, project_id, rank FROM faculty_preferences ORDER BY rank ASC;
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

async function galeShapley_facpropose() {
  const { studentPreferences, facultyPreferences } = await getPreferences();

  let studentAssignments = {}; // Stores which project a student is assigned to
  let projectSlots = {}; // Stores available slots per project
  let proposals = {}; // Faculty proposals for students

  // Initialize available slots for each project
  const projects = await pool.query("SELECT project_id, available_slots FROM projects");
  projects.rows.forEach(({ project_id, available_slots }) => {
    projectSlots[project_id] = available_slots;
  });

  // Initialize faculty proposals
  facultyPreferences.forEach(({ faculty_id, student_id, project_id }) => {
    if (!proposals[Number(student_id)]) {
      proposals[Number(student_id)] = [];
    }
    proposals[Number(student_id)].push({ faculty_id, project_id });
  });

  // Students accept the best available project
  let unassignedStudents = new Set(Object.keys(proposals));

  while (unassignedStudents.size > 0) {
    let student_id = Array.from(unassignedStudents)[0];

    if (!proposals[student_id] || proposals[student_id].length === 0) {
      // No proposals available, remove student from unassigned set
      unassignedStudents.delete(student_id);
      continue;
    }

    // Get the student's preferred project list
    let studentChoices = studentPreferences
      .filter((s) => s.student_id == Number(student_id))
      .map((s) => s.project_id);

    // Check proposals made to the student
    let receivedProposals = proposals[Number(student_id)].map((p) => p.project_id);

    // Select the highest-ranked project from the student's preference list
    let bestChoice = studentChoices.find((p) => receivedProposals.includes(p));

    if (!bestChoice) {
      // If no preferred project matches, remove student from unassigned set
      unassignedStudents.delete(student_id);
      continue;
    }

    // Check if the project has available slots
    if (projectSlots[bestChoice] > 0) {
      // Assign the student to this project
      studentAssignments[student_id] = bestChoice;
      projectSlots[bestChoice]--;
      unassignedStudents.delete(student_id);
    } else {
      // Project is full, check if a lower-ranked student is already assigned
      let assignedStudents = Object.entries(studentAssignments)
        .filter(([s_id, p_id]) => p_id === bestChoice)
        .map(([s_id]) => s_id);

      let worstStudent = assignedStudents
        .sort((a, b) => {
          let rankA = facultyPreferences.find(
            (f) => f.student_id == a && f.project_id == bestChoice
          )?.rank ?? Infinity;
          let rankB = facultyPreferences.find(
            (f) => f.student_id == b && f.project_id == bestChoice
          )?.rank ?? Infinity;
          return rankB - rankA; // Sort descending (worst ranked last)
        })
        .pop(); // Get the worst student assigned

      let newStudentRank = facultyPreferences.find(
        (f) => f.student_id == student_id && f.project_id == bestChoice
      )?.rank ?? Infinity;

      let worstStudentRank = facultyPreferences.find(
        (f) => f.student_id == worstStudent && f.project_id == bestChoice
      )?.rank ?? Infinity;

      if (newStudentRank < worstStudentRank) {
        // Replace the worst student with the new student
        delete studentAssignments[worstStudent];
        studentAssignments[student_id] = bestChoice;
        unassignedStudents.delete(student_id);
        if (worstStudent) unassignedStudents.add(worstStudent); // Add the removed student back
      } else {
        // If the student cannot replace anyone, remove them from the unassigned list
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