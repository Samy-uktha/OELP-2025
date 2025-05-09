require("dotenv").config();
const { Pool } = require("pg");
// const { io } = require('./server');

const pool = new Pool({
  user: "postgres", // Replace with your actual username
  host: "localhost",
  database: "ProjectAllotment",
  password: "postgres",
  port: 5432,
});

// const pool = new Pool({
//   user: "postgres_pal", 
//   host: "dpg-d08k91pr0fns73a11q1g-a.oregon-postgres.render.com",
//   database: "project_allotment_ogqm",
//   password: "i4msCXk2lL9Kqz2MPRkhx8BRmqkcvqJH",
//   port: 5432,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

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
  while (unassignedStudents.size > 0 && iterations < 10000) {
    iterations++;
    let student_id_str = Array.from(unassignedStudents)[0]; 
    let studentId = Number(student_id_str);

    if (
      !studentProposals[studentId] ||
      studentProposals[studentId].length === 0
    ) {
      console.log(`Student ${studentId} has exhausted preferences.`);
      unassignedStudents.delete(studentId); 
      continue;
    }

    
    let preferredProject = studentProposals[studentId].shift();

    console.log(`\nIteration ${iterations}: Student ${studentId} proposing to Project ${preferredProject}`);

     
     if (!(preferredProject in projectSlots)) {
         console.log(`   WARN: Project ${preferredProject} not found in projectSlots. Skipping proposal.`);
         continue; 
     }


    
    if (
      projectAllocations[preferredProject].length <
      projectSlots[preferredProject]
    ) {
      console.log(`   Project ${preferredProject} has space.`);
      projectAllocations[preferredProject].push(studentId);
      unassignedStudents.delete(studentId); 
      console.log(`   Accepted ${studentId}. Allocations: [${projectAllocations[preferredProject].join(', ')}]`);
    }
   
    else {
      console.log(`   Project ${preferredProject} is full.`);
      let currentAllocations = projectAllocations[preferredProject]; 

     
     
      let facultyRankedStudentsMap = {}; 
      let facultyRankedStudentsList = facultyPreferences
        .filter((f) => f.project_id === preferredProject)
        .sort((a, b) => a.rank - b.rank)
        .map((f) => {
            facultyRankedStudentsMap[f.student_id] = f.rank;
            return f.student_id; 
        });

      console.log(`   Faculty preference list for ${preferredProject}: [${facultyRankedStudentsList.join(', ')}]`);

      let leastPreferredAllocatedStudentId = -1;
      let worstRank = -Infinity;

      for (const allocatedStudentId of currentAllocations) {
          const rank = facultyRankedStudentsMap[allocatedStudentId];
          const effectiveRank = (rank === undefined) ? Infinity : rank; // if the faculty has not ranked the 
          // student, we assign infinity(a very large value)

          if (effectiveRank >= worstRank) { 
              if (effectiveRank > worstRank || leastPreferredAllocatedStudentId === -1) {
                   worstRank = effectiveRank;
                   leastPreferredAllocatedStudentId = allocatedStudentId;
              }
          }
      }

       if (leastPreferredAllocatedStudentId === -1 && currentAllocations.length > 0) {
           leastPreferredAllocatedStudentId = currentAllocations[currentAllocations.length - 1];
           worstRank = facultyRankedStudentsMap[leastPreferredAllocatedStudentId] ?? Infinity; 
           console.log(`   Fallback: Multiple worst ranked? Using ${leastPreferredAllocatedStudentId}`);
       }


      console.log(`   Least preferred in project ${preferredProject} is ${leastPreferredAllocatedStudentId} (Rank: ${worstRank === Infinity ? 'Unranked/Infinity' : worstRank})`);

     
      const proposingStudentRank = facultyRankedStudentsMap[studentId];
      const effectiveProposingRank = (proposingStudentRank === undefined) ? Infinity : proposingStudentRank;

      console.log(`   Proposing student ${studentId} rank is ${effectiveProposingRank === Infinity ? 'Unranked/Infinity' : effectiveProposingRank}`);

      if (effectiveProposingRank < worstRank) {
        console.log(`   SUCCESS: Project ${preferredProject} prefers proposing student ${studentId} over ${leastPreferredAllocatedStudentId}.`);

        // now old student is removed, new proposing student is added
        projectAllocations[preferredProject] = projectAllocations[
          preferredProject
        ].filter((s_id) => s_id !== leastPreferredAllocatedStudentId);
        projectAllocations[preferredProject].push(studentId);

        
        unassignedStudents.delete(studentId);
        unassignedStudents.add(leastPreferredAllocatedStudentId); // add the old student to unassigned

        console.log(`   Removed ${leastPreferredAllocatedStudentId}, Added ${studentId}. New Allocations: [${projectAllocations[preferredProject].join(', ')}]`);
        console.log(`   Unassigned students now: [${Array.from(unassignedStudents).join(', ')}]`);

      } else {
        console.log(`   REJECTED: Project ${preferredProject} prefers current allocation or ranks ${studentId} lower/equally.`);
        // rejected, now the next project in the preference list is taken
      }
    }

     if (iterations >= 10000) {
         console.error("ERROR: Maximum iterations reached. Potential infinite loop or very large dataset?");
         break;
     }
  }

  console.log("\n--- Gale-Shapley Matching Complete ---");
  if (unassignedStudents.size > 0) {
    console.log(`WARN: ${unassignedStudents.size} students finished unassigned: [${Array.from(unassignedStudents).join(', ')}]`);
  }

 
  return projectAllocations;
}


async function galeShapley_facpropose() {
  console.log("--- Starting Gale-Shapley (Project Slots Proposing Logic) ---");

 
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projects = (
    await pool.query("SELECT project_id, available_slots FROM projects")
  ).rows;

 
  const studentPrefData = {};
  const studentRankMapForInput = {}; 
  studentPreferences.forEach(({ student_id, project_id, rank }) => { 
    if (!studentPrefData[student_id]) {
      studentPrefData[student_id] = { preference_map: {}, ordered_list_temp: [] };
      studentRankMapForInput[student_id] = 1;
    }
    const effectiveRank = rank ?? studentRankMapForInput[student_id]++; 
    studentPrefData[student_id].preference_map[project_id] = effectiveRank;
    studentPrefData[student_id].ordered_list_temp.push({ project_id, rank: effectiveRank });
  });

  for (const student_id in studentPrefData) {
    studentPrefData[student_id].ordered_list = studentPrefData[student_id]
      .ordered_list_temp
      .sort((a, b) => a.rank - b.rank)
      .map(p => p.project_id);
    delete studentPrefData[student_id].ordered_list_temp;
  }
   console.log("Processed Student Preferences (example):", Object.values(studentPrefData)[0]);


  
  const projectStudentRankings = {};
  const facultyPrefsGrouped = {};
  facultyPreferences.forEach(({student_id, project_id, rank }) => {
      if (!projects.some(p => p.project_id === project_id)) {
          console.warn(`Faculty preference for non-existent project ${project_id} ignored.`);
          return;
      }
      if (!facultyPrefsGrouped[project_id]) {
          facultyPrefsGrouped[project_id] = [];
      }
      facultyPrefsGrouped[project_id].push({ student_id, rank });
  });
  for (const project_id in facultyPrefsGrouped) {
      projectStudentRankings[project_id] = facultyPrefsGrouped[project_id]
          .sort((a, b) => a.rank - b.rank)
          .map(s => s.student_id);
  }
   console.log("Processed Project Rankings (example):", Object.values(projectStudentRankings)[0]);


  
  let allSlots = [];
  let slotProposalIndex = {}; 
  let slotPreferences = {}; 
  let freeSlots = new Set();

  projects.forEach(({ project_id, available_slots }) => {
    const rankedStudents = projectStudentRankings[project_id] || [];
    if (rankedStudents.length === 0 && available_slots > 0) {
        console.warn(`WARN: Project ${project_id} has slots but no ranked students by faculty. Slots cannot propose.`);
    }
    for (let i = 0; i < available_slots; i++) {
      const slot_id = `${project_id}_${i}`;
      allSlots.push(slot_id);
      slotPreferences[slot_id] = rankedStudents; // all slots for a project share the same ranking
      slotProposalIndex[slot_id] = 0;
      if(rankedStudents.length > 0) {
        freeSlots.add(slot_id);
      }
    }
  });
  console.log(`Initialized ${allSlots.length} total slots. ${freeSlots.size} are initially free and able to propose.`);

  // student_id -> { project_id, slot_id } 
  let studentAssignments = {};
  let iterations = 0;

  while (freeSlots.size > 0 && iterations < 10000) {
    iterations++;
    const currentSlotId = Array.from(freeSlots)[0];
    const [projectIdStr, slotIndexStr] = currentSlotId.split('_');
    const proposingProjectId = Number(projectIdStr);

    const studentsToProposeTo = slotPreferences[currentSlotId];
    const proposalIndex = slotProposalIndex[currentSlotId];

    // if the slot doesnt have students to propose to skip and delete it from free slots. 
    if (proposalIndex >= studentsToProposeTo.length) {
      freeSlots.delete(currentSlotId);
      continue;
    }

    const targetStudentId = studentsToProposeTo[proposalIndex];
    console.log(`\nIter ${iterations}: Slot ${currentSlotId} (Project ${proposingProjectId}) proposing to Student ${targetStudentId}`);

   
    slotProposalIndex[currentSlotId]++;

    
    const studentData = studentPrefData[targetStudentId];
    if (!studentData) {
        console.warn(`   WARN: Student ${targetStudentId} has no preferences recorded. Skipping proposal.`);
        continue;
    }
    const studentRankMap = studentData.preference_map;

    if (!studentAssignments[targetStudentId]) {
      console.log(`   Student ${targetStudentId} is FREE.`);
      studentAssignments[targetStudentId] = { project_id: proposingProjectId, slot_id: currentSlotId };
      freeSlots.delete(currentSlotId); // tentatively filled
      console.log(`   Student ${targetStudentId} accepts. Assigned to P:${proposingProjectId} (Slot:${currentSlotId}). Slot removed from free set.`);

    } else {
      const currentAssignment = studentAssignments[targetStudentId];
      const currentProjectId = currentAssignment.project_id;

      console.log(`   Student ${targetStudentId} currently assigned to P:${currentProjectId}. Comparing with new offer P:${proposingProjectId}.`);

      const currentRank = studentRankMap[currentProjectId]; 
      const newRank = studentRankMap[proposingProjectId];

      let prefersNewOffer = false;
      if (newRank === undefined) {
          prefersNewOffer = false; // studebt has not ranked the project
      } else if (currentRank === undefined) {
          prefersNewOffer = true;
      } else if (newRank < currentRank) {
          prefersNewOffer = true;
      } else {
          prefersNewOffer = false;
      }

      if (prefersNewOffer) {
        console.log(`   Student ${targetStudentId} PREFERS new P:${proposingProjectId}. Accepts.`);
        const rejectedSlotId = currentAssignment.slot_id;

        studentAssignments[targetStudentId] = { project_id: proposingProjectId, slot_id: currentSlotId };

       
        freeSlots.delete(currentSlotId); 
        freeSlots.add(rejectedSlotId);
        console.log(`   Accepted: Slot ${currentSlotId} (removed from free).`);
        console.log(`   Rejected: Slot ${rejectedSlotId} (added back to free).`);
      } else {
        console.log(`   Student ${targetStudentId} REJECTS new P:${proposingProjectId} (prefers current P:${currentProjectId} or doesn't rank new).`);
      }
    }
  }

  if(iterations >= 10000) {
      console.error("Error: Maximum iterations reached.");
  }
  console.log("--- Gale-Shapley (Slots Proposing Logic) Finished ---");


  const finalAllocations = {};
  projects.forEach(p => { finalAllocations[p.project_id] = []; });

  for (const student_id in studentAssignments) {
    const assignment = studentAssignments[student_id];
  
    finalAllocations[assignment.project_id].push(Number(student_id));
  }

 
   for (const projectId in finalAllocations) {
       finalAllocations[projectId].sort((a, b) => a - b);
       console.log(`Final Allocation - Project ${projectId}: [${finalAllocations[projectId].join(', ')}]`);
   }


  return finalAllocations;
}




async function saveAllocations() {
  const client = await pool.connect(); 
  try {
    await client.query("BEGIN"); 
    const allocations = await galeShapley();
    console.log("faccc--student", allocations);
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

    await client.query("COMMIT");
    
    console.log("Project allocations saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error allocating projects:", err);
  } finally {
    client.release(); 
  }
}


async function saveAllocations_facpropose() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const allocations = await galeShapley_facpropose();
    console.log("faccc--student", allocations);
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

    await client.query("COMMIT");
  
    console.log("Project allocations saved successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error allocating projects:", err);
  } finally {
    client.release();
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

async function SPA_lecturer() {
  console.log("Starting SPA Lecturer (Explicit Dummy Lecturer) Algorithm...");
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projectsResult = await pool.query(
    "SELECT project_id, faculty_id, available_slots FROM projects"
  );

  let studentData = {};
  studentPreferences.forEach(({ student_id, project_id, rank }) => {
    const studentIdNum = Number(student_id);
    if (!studentData[studentIdNum]) {
      studentData[studentIdNum] = { prefList: [], rankMap: new Map() };
    }
    const lecturerIdNum = Number(project_id); //  project_id as the unique dummy lecturer ID
    studentData[studentIdNum].prefList.push(lecturerIdNum);
    studentData[studentIdNum].rankMap.set(lecturerIdNum, rank);
  });
 
  //combines lecturer capacity and preferene list
  let lecturerData = {};

  projectsResult.rows.forEach(
    ({ project_id, faculty_id, available_slots }) => {
      const lecturerIdNum = Number(project_id);
      lecturerData[lecturerIdNum] = {
        prefList: [], 
        capacity: available_slots,
        assigned: new Set(),
        nextStudentIndex: 0,
        original_faculty_id: faculty_id, 
      };
    }
  );


  facultyPreferences.forEach(({ project_id, student_id }) => {
    const lecturerIdNum = Number(project_id);
    if (lecturerData[lecturerIdNum]) { 
        lecturerData[lecturerIdNum].prefList.push(Number(student_id));
    } else {
        console.warn(`WARN: Preferences found for non-existent project/lecturer ID ${project_id}. Ignoring.`);
    }
  });



  let studentAssignments = {}; // student_id -> lecturer_id (using numbers)

 // lecturers that can make proposals
  let lecturerQueueSet = new Set();
  Object.keys(lecturerData).forEach((lecturerIdStr) => {
    const lecturerIdNum = Number(lecturerIdStr);
    const lecturer = lecturerData[lecturerIdNum];
    if (
      lecturer.capacity > 0 &&
      lecturer.prefList.length > 0 
    ) {
      lecturerQueueSet.add(lecturerIdNum);
    }
  });
  let lecturerQueue = Array.from(lecturerQueueSet); 
  console.log("Initial Lecturer Queue Length:", lecturerQueue.length);
 



  let iterations = 0;
  const MAX_ITERATIONS = Object.keys(studentData).length * Object.keys(lecturerData).length * 2; // Heuristic
  let operationsCount = 0;

  while (lecturerQueue.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    const lecturerIdNum = lecturerQueue.shift(); // Dequeue a lecturer ID (number)
    const lecturer = lecturerData[lecturerIdNum]; 

    
    if (!lecturer) {
        console.error(`ERROR: Lecturer ${lecturerIdNum} dequeued but not found in lecturerData! Skipping.`);
        continue;
    }
    if (lecturer.assigned.size >= lecturer.capacity) {
      // console.log(`Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) dequeued but already full. Skipping.`);
      continue;
    }
    const lecturerPrefList = lecturer.prefList;
     if (!lecturerPrefList || lecturer.nextStudentIndex >= lecturerPrefList.length) {
        // console.log(`Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) dequeued but has no more students to propose to (index ${lecturer.nextStudentIndex}/${lecturerPrefList?.length}). Skipping.`);
        continue;
    }

   
    let proposed = false;
    while (lecturer.nextStudentIndex < lecturerPrefList.length && lecturer.assigned.size < lecturer.capacity && !proposed) {
      operationsCount++;
      const targetStudentId = lecturerPrefList[lecturer.nextStudentIndex];


      const studentInfo = studentData[targetStudentId];
      if (!studentInfo) {
        // console.log(`WARN: Student ${targetStudentId} (from lecturer ${lecturerIdNum} prefs) not found or inactive. Advancing lecturer pointer.`);
        lecturer.nextStudentIndex++;
        continue;
      }

      if (!studentInfo.prefList.includes(lecturerIdNum)) {
          // console.log(`Student ${targetStudentId} no longer considers lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) acceptable. Advancing lecturer pointer.`);
          lecturer.nextStudentIndex++;
          continue;
      }

  
      proposed = true;
      console.log(`---> [Op:${operationsCount}] Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) proposes to Student ${targetStudentId}`);

      const currentAssignmentLecturerId = studentAssignments[targetStudentId]; // lecturer_id or undefined

      let studentAccepts = false;
      if (currentAssignmentLecturerId === undefined) {
          studentAccepts = true;
          console.log(`   Student ${targetStudentId} is FREE and ACCEPTS lecturer ${lecturerIdNum} (Project ${lecturerIdNum}).`);
      } else {
          const currentLecturerRank = studentInfo.rankMap.get(currentAssignmentLecturerId);
          const proposingLecturerRank = studentInfo.rankMap.get(lecturerIdNum);

          if (proposingLecturerRank === undefined) {
              console.error(`   ERROR: Rank for proposing lecturer ${lecturerIdNum} not found for student ${targetStudentId}. REJECTING.`);
              studentAccepts = false;
          } else if (currentLecturerRank === undefined) {
              console.error(`   ERROR: Rank for current assignment ${currentAssignmentLecturerId} not found for student ${targetStudentId}. Accepting new offer.`);
              studentAccepts = true;
          } else if (proposingLecturerRank < currentLecturerRank) {
              studentAccepts = true;
              console.log(`   Student ${targetStudentId} prefers lecturer ${lecturerIdNum} (rank ${proposingLecturerRank}) over current ${currentAssignmentLecturerId} (rank ${currentLecturerRank}). ACCEPTS.`);
          } else {
              studentAccepts = false;
              console.log(`   Student ${targetStudentId} prefers current ${currentAssignmentLecturerId} (rank ${currentLecturerRank}) or indifferent. REJECTS ${lecturerIdNum} (rank ${proposingLecturerRank}).`);
          }
      }


      if (studentAccepts) {
          
          if (currentAssignmentLecturerId !== undefined) {
              const oldLecturer = lecturerData[currentAssignmentLecturerId];
              if (oldLecturer) {
                  oldLecturer.assigned.delete(targetStudentId);
                  console.log(`   <- Broken assignment: Student ${targetStudentId} removed from Lecturer ${currentAssignmentLecturerId} (Project ${currentAssignmentLecturerId})`);

                  
                  const oldLecturerPrefList = oldLecturer.prefList;
                  if (oldLecturer.assigned.size < oldLecturer.capacity &&
                      oldLecturerPrefList &&
                      oldLecturer.nextStudentIndex < oldLecturerPrefList.length)
                  {
                      if (!lecturerQueueSet.has(currentAssignmentLecturerId)) {
                          lecturerQueue.push(currentAssignmentLecturerId);
                          lecturerQueueSet.add(currentAssignmentLecturerId);
                          console.log(`   Lecturer ${currentAssignmentLecturerId} (Project ${currentAssignmentLecturerId}) can propose again, added back to queue.`);
                      }
                  }
              } else {
                   console.error(`   ERROR: Old lecturer ${currentAssignmentLecturerId} data not found when breaking assignment for student ${targetStudentId}`);
              }
          }

         
          lecturer.assigned.add(targetStudentId);
          studentAssignments[targetStudentId] = lecturerIdNum;
          console.log(`   -> New assignment: Student ${targetStudentId} assigned to Lecturer ${lecturerIdNum} (Project ${lecturerIdNum})`);

          // pruning
          const acceptedRank = studentInfo.rankMap.get(lecturerIdNum);
          if (acceptedRank === undefined) {
            console.error(`   ERROR: Accepted rank for ${lecturerIdNum} missing for student ${targetStudentId}. Cannot perform deletions.`);
          } else {
            let i = studentInfo.prefList.length - 1;
            while (i >= 0) {
                const worseLecturerIdNum = studentInfo.prefList[i];
                const worseLecturerRank = studentInfo.rankMap.get(worseLecturerIdNum);

                if (worseLecturerRank !== undefined && worseLecturerRank > acceptedRank) {
                    // remove worse lecturer from student's list
                    studentInfo.prefList.splice(i, 1);
                    // console.log(`      Removed worse lecturer ${worseLecturerIdNum} (Project ${worseLecturerIdNum}) from student ${targetStudentId}'s list.`);

                    // Remove student from the worse lecturer's preference list
                    const worseLecturer = lecturerData[worseLecturerIdNum];
                    if (worseLecturer) {
                       const worseLecturerPrefList = worseLecturer.prefList;
                       const indexInWorseList = worseLecturerPrefList.indexOf(targetStudentId);
                       if (indexInWorseList !== -1) {
                           worseLecturerPrefList.splice(indexInWorseList, 1);
                           // console.log(`      Removed student ${targetStudentId} from worse lecturer ${worseLecturerIdNum}'s pref list.`);

                           // Adjust pointer if needed
                           if (indexInWorseList < worseLecturer.nextStudentIndex) {
                               worseLecturer.nextStudentIndex--;
                               // console.log(`      Adjusted nextStudentIndex for lecturer ${worseLecturerIdNum} to ${worseLecturer.nextStudentIndex}`);
                           }
                       }
                    }
                } else if (worseLecturerIdNum === lecturerIdNum) {
                    break; // Stop at the accepted lecturer
                }
                i--;
            }
          }
      } 

      // for the next proposal
      lecturer.nextStudentIndex++;

    }

    // check if the current lecturer should be re-queued
    if (lecturer.assigned.size < lecturer.capacity &&
        lecturer.prefList && // list still exists
        lecturer.nextStudentIndex < lecturer.prefList.length)
    {
        if (!lecturerQueueSet.has(lecturerIdNum)) {
            lecturerQueue.push(lecturerIdNum);
            lecturerQueueSet.add(lecturerIdNum);
            // console.log(`Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) re-queued as it might propose again.`);
        }
    } else {
         lecturerQueueSet.delete(lecturerIdNum);
         if (lecturer.assigned.size >= lecturer.capacity) {
            console.log(`Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) is now full (${lecturer.assigned.size}/${lecturer.capacity}).`);
         } else {
            console.log(`Lecturer ${lecturerIdNum} (Project ${lecturerIdNum}) has proposed to all eligible students on its list.`);
         }
    }

  } 
  if(iterations >= MAX_ITERATIONS){
      console.error(`SPA Algorithm exceeded MAX_ITERATIONS (${MAX_ITERATIONS}).`);
      console.log(`Operations count: ${operationsCount}`);
  }
  console.log("--------------------------------------------------");
  console.log("SPA Lecturer (Explicit Dummy Lecturer) Algorithm Finished.");
  console.log(`Iterations: ${iterations}, Operations: ${operationsCount}`);
  console.log("--------------------------------------------------");

  const finalAssignments = {};
  Object.keys(studentData).forEach(sidStr => {
      const sidNum = Number(sidStr);
      finalAssignments[sidNum] = studentAssignments[sidNum] ?? null;
  });

 
  console.log("Final Lecturer/Project Assignments (LecturerID/ProjectID -> [StudentIDs]):");
   Object.entries(lecturerData).forEach(([lecturerId, data]) => {
    if (data.assigned.size > 0) {
      console.log(`  Lecturer/Project ${lecturerId}: ${Array.from(data.assigned)}`);
    }
  });
  console.log("--------------------------------------------------");
  console.log("Final Student Assignments (StudentID -> LecturerID/ProjectID):");
  Object.entries(finalAssignments).forEach(([studId, lectId]) => {
     if (lectId !== null) {
         console.log(`  Student ${studId}: Lecturer/Project ${lectId}`);
     } else {
       
     }
   });
  console.log("--------------------------------------------------");


  return finalAssignments;
}



function findWorstStudent(projectId, studentIdList, facRankMap) {
  let worstStudent = -1;
  let highestRank = -1;

  if (!facRankMap[projectId]) {
     console.error(`ERROR: Faculty rank map not found for project ${projectId}`);
     
     return null;
  }
  const projectRankMap = facRankMap[projectId];

  for (const studentId of studentIdList) {
     const rank = projectRankMap.get(studentId);
     if (rank === undefined) {
        console.warn(`WARN: Rank for student ${studentId} not found in project ${projectId}'s map during worst student search.`);
       // unranked can be treated as worst
        continue;
     }
     if (rank > highestRank) {
        highestRank = rank;
        worstStudent = studentId;
     }
  }
  return worstStudent === -1 ? null : worstStudent; 
}

async function SPA_student() {
  console.log("Starting SPA Student Algorithm...");
  const { studentPreferences, facultyPreferences } = await getPreferences();
  const projectsResult = await pool.query(
    "SELECT project_id, faculty_id, available_slots FROM projects"
  );

 
  let studentData = {};
  let allStudentIds = new Set();
  studentPreferences.forEach(({ student_id, project_id, rank }) => {
    const studentIdNum = Number(student_id);
    allStudentIds.add(studentIdNum);
    if (!studentData[studentIdNum]) {
      studentData[studentIdNum] = { prefList: [], nextProjIndex: 0 };
    }
    const projIdNum = Number(project_id);
    studentData[studentIdNum].prefList.push(projIdNum);
  
  });

  let facPrefMapping = {};
  let facRankMapping = {};
  facultyPreferences.forEach(({ project_id, student_id, rank }) => {
    const projIdStr = String(project_id);
    const studentIdNum = Number(student_id);
    if (!facPrefMapping[projIdStr]) {
      facPrefMapping[projIdStr] = [];
      facRankMapping[projIdStr] = new Map();
    }
    facPrefMapping[projIdStr].push(studentIdNum);
    facRankMapping[projIdStr].set(studentIdNum, rank);
  });

  let projectData = {};
  projectsResult.rows.forEach(
    ({ project_id, faculty_id, available_slots }) => {
      const projIdStr = String(project_id);
      projectData[projIdStr] = {
        faculty_id,
        capacity: available_slots,
        assigned: [],
      };
    }
  );

  let studentAssignments = {}; 

  let freeStudents = Array.from(allStudentIds); 
  console.log("Initial Free Students Count:", freeStudents.length);



  let iterations = 0;
  const MAX_ITERATIONS = 100000; // Adjust based on expected scale

  while (freeStudents.length > 0 && iterations < MAX_ITERATIONS) {
    iterations++;
    let studentId = freeStudents.shift(); // get the next free student
    let studentInfo = studentData[studentId];

    if (!studentInfo) {
      console.warn(`WARN: Free student ${studentId} not found in studentData. Skipping.`);
      continue;
    }

  
    let proposedProjectId = null;
    while (studentInfo.nextProjIndex < studentInfo.prefList.length) {
        let potentialProjectId = studentInfo.prefList[studentInfo.nextProjIndex];
        if (projectData[String(potentialProjectId)]) {
             proposedProjectId = potentialProjectId;
             studentInfo.nextProjIndex++; // Move pointer *after* selecting
             break;
        } else {
            console.warn(`Student ${studentId} has project ${potentialProjectId} on list, but project data not found. Skipping project.`);
            studentInfo.nextProjIndex++;
        }
    }

    // if student has no more projects to propose to
    if (proposedProjectId === null) {
        console.log(`Student ${studentId} has no more projects to propose to.`);
        continue;
    }

    const projectIdStr = String(proposedProjectId);
    const project = projectData[projectIdStr];
    console.log(`---> Student ${studentId} proposes to Project ${projectIdStr}`);

    project.assigned.push(studentId);
    studentAssignments[studentId] = proposedProjectId; 
     console.log(`   Project ${projectIdStr} tentatively accepts Student ${studentId}. Current assigned: [${project.assigned.join(', ')}]`);

    let rejectedStudentId = null;

    // --- Check Project Overflow ---
    if (project.assigned.length > project.capacity) {
      console.log(`   Project ${projectIdStr} is over capacity (${project.assigned.length}/${project.capacity}). Finding worst student...`);
      let worstStudent = findWorstStudent(projectIdStr, project.assigned, facRankMapping);

      if (worstStudent !== null) {
        rejectedStudentId = worstStudent;
        console.log(`   Worst student in Project ${projectIdStr} is ${worstStudent}. Rejecting.`);
        // remove rejected student from project's assigned list
        project.assigned = project.assigned.filter(s => s !== rejectedStudentId);
        // remove assignment for rejected student
        delete studentAssignments[rejectedStudentId];
        // add rejected student back to the free list
        freeStudents.push(rejectedStudentId);
         console.log(`<- Rejected: Student ${rejectedStudentId} becomes free again.`);
      } else {
         console.error(`ERROR: Could not determine worst student for project ${projectIdStr} despite overflow. State: ${project.assigned}`);
      }
    }

// deletion rule
    if (project.assigned.length === project.capacity && project.capacity > 0) {
        console.log(`   Project ${projectIdStr} is now exactly full. Applying deletion rule...`);
        let currentWorstAssigned = findWorstStudent(projectIdStr, project.assigned, facRankMapping);

        if (currentWorstAssigned !== null) {
            const projectRankMap = facRankMapping[projectIdStr];
            const worstRank = projectRankMap.get(currentWorstAssigned);
             console.log(`   Current worst assigned to ${projectIdStr} is ${currentWorstAssigned} (rank ${worstRank}).`);

            const originalFacPrefList = facPrefMapping[projectIdStr] || [];

            for (const potentialVictimStudentId of originalFacPrefList) {
                if (!project.assigned.includes(potentialVictimStudentId)) {
                    const victimRank = projectRankMap.get(potentialVictimStudentId);

                    if (victimRank !== undefined && victimRank > worstRank) {
                        // this student (potentialVictimStudentId) is ranked worse than the
                        // worst student currently holding a place in the full project.
                        // this student can NEVER get into this project in this stable matching.
                        // Delete the pair (potentialVictimStudentId, proposedProjectId).
                         console.log(`   Student ${potentialVictimStudentId} (rank ${victimRank}) is worse than ${currentWorstAssigned}. Deleting pair (${potentialVictimStudentId}, ${projectIdStr}).`);

                        const victimStudentInfo = studentData[potentialVictimStudentId];
                        if (victimStudentInfo) {
                            const projIndex = victimStudentInfo.prefList.indexOf(proposedProjectId);
                            if (projIndex !== -1) {
                                victimStudentInfo.prefList.splice(projIndex, 1);
                                console.log(`      Removed project ${projectIdStr} from student ${potentialVictimStudentId}'s preference list.`);
                                // No need to adjust nextProjIndex here usually, as it points *past* proposed ones.
                            }
                        }
                    }
                }
            }
        } else {
             console.error(`ERROR: Could not determine worst student for full project ${projectIdStr} for deletion rule. State: ${project.assigned}`);
        }
    }


  }

   if(iterations >= MAX_ITERATIONS){
      console.error("SPA Algorithm (Student) exceeded MAX_ITERATIONS. Possible infinite loop or very large instance.");
  }

  console.log("SPA Student Algorithm finished.");
  console.log("Final student assignments:", studentAssignments);

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
