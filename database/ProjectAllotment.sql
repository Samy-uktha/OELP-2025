create table Department(
dept_id integer PRIMARY KEY,
dept_name text UNIQUE NOT NULL
);


create table students
( 
Roll_no integer PRIMARY KEY,
FirstName varchar(50) NOT NULL,
LastName varchar(50) NOT NULL,
email text NOT NULL,
Phone_no VARCHAR(10) NOT NULL UNIQUE,
Department_id INTEGER,
Semester integer NOT NULL,
Cgpa integer NOT NULL,
CONSTRAINT check_cgpa CHECK(cgpa >= 0 and cgpa <= 10),
CONSTRAINT check_semester CHECK(Semester >= 1 and Semester <= 8),
CONSTRAINT fk_dept FOREIGN KEY (Department_id) REFERENCES Department(dept_id)
);

create table faculty(
faculty_id integer PRIMARY KEY,
firstName varchar(50) NOT NULL,
lastName varchar(50) NOT NULL,
email text NOT NULL UNIQUE,
Phone_no VARCHAR(10) NOT NULL UNIQUE,
Department_id INTEGER,
CONSTRAINT fk_dept FOREIGN KEY (Department_id) REFERENCES Department(dept_id)
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    password TEXT NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('student', 'faculty')),  -- To distinguish between students and faculty
    student_id INTEGER,
    faculty_id INTEGER,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(Roll_no),
    CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id),
    CONSTRAINT check_user_type CHECK (
        (user_type = 'student' AND student_id IS NOT NULL AND faculty_id IS NULL) OR 
        (user_type = 'faculty' AND faculty_id IS NOT NULL AND student_id IS NULL)
    )
);


create table courses (
course_id integer PRIMARY KEY,
course_name varchar(50) NOT NULL,
Course_code varchar(5) NOT NULL,
Credits integer NOT NULL,
CONSTRAINT check_credits CHECK(Credits > 0)
);

CREATE TABLE STUDENT_COURSES (
    Student_id INTEGER,
    Course_id INTEGER,
    Grade CHAR(1) NOT NULL,
    CONSTRAINT pk_student_course PRIMARY KEY (Student_id, Course_id, Grade),  -- Composite primary key
    CONSTRAINT fk_student FOREIGN KEY (Student_id) REFERENCES students(Roll_no),
    CONSTRAINT fk_course FOREIGN KEY (Course_id) REFERENCES courses(course_id),
    CONSTRAINT check_grade CHECK (Grade IN ('S', 'A', 'B', 'C', 'D', 'E', 'F', 'I'))  -- Ensure the grade is valid
);

create table projects(
	project_id integer PRIMARY KEY,
    faculty_id integer, 
	Title text NOT NULL UNIQUE,
	Description text NOT NULL,
	Min_cgpa integer NOT NULL  CHECK (Min_cgpa >= 0 AND Min_cgpa <= 10),
    CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
	
);

ALTER TABLE projects 
ADD COLUMN Available_slots INTEGER NOT NULL CHECK (Available_slots >= 0),  -- Total available slots for students
ADD COLUMN Students_per_team INTEGER NOT NULL CHECK (Students_per_team >= 1); -- Minimum 1 student per team
ALTER TABLE projects
ADD COLUMN min_sem INTEGER CHECK(min_sem >= 1 and min_sem <= 20);

ALTER TABLE projects 
ADD COLUMN faculty_id INTEGER,
ADD CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE;




create table prereq(
   project_id integer,
   course_id integer,
   PRIMARY KEY (Project_id, Course_id),
   CONSTRAINT fk_project FOREIGN KEY (Project_id) REFERENCES projects(Project_id) ON DELETE CASCADE,
   CONSTRAINT fk_course FOREIGN KEY (Course_id) REFERENCES courses(Course_id) ON DELETE CASCADE
);

create table project_dept (
Project_id INTEGER,
dept_id INTEGER,
PRIMARY KEY(project_id, dept_id)
CONSTRAINT fk_dept FOREIGN KEY (Department_id) REFERENCES Department(dept_id)
CONSTRAINT fk_project_dept FOREIGN KEY (Project_id) REFERENCES projects(Project_id) ON DELETE CASCADE
)

CREATE TABLE project_documents (
    Document_id SERIAL PRIMARY KEY,
    Project_id INTEGER,
    Document_name VARCHAR(255) NOT NULL,
    Document_path TEXT NOT NULL,
    Uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_docs FOREIGN KEY (Project_id) REFERENCES projects(Project_id) ON DELETE CASCADE
);


CREATE or replace VIEW project_details AS
SELECT 
    p.project_id,
    p.title,
    p.description,
    p.min_cgpa,
    p.available_slots,
    p.students_per_team,
    p.faculty_id,
	p.min_sem,
    ARRAY_AGG(DISTINCT pr.course_id) AS prerequisite_courses,
    ARRAY_AGG(DISTINCT pd.document_name) AS document_names,
    ARRAY_AGG(DISTINCT pd.document_path) AS document_paths
FROM projects p
LEFT JOIN faculty f ON p.faculty_id = f.faculty_id
LEFT JOIN prereq pr ON p.project_id = pr.project_id
LEFT JOIN project_documents pd ON p.project_id = pd.project_id
GROUP BY p.project_id, f.firstname;

SELECT * FROM project_details;


CREATE or replace FUNCTION get_project_details(proj_id INTEGER)
RETURNS TABLE (
    project_id INTEGER,
    title TEXT,
    description TEXT,
    min_cgpa INTEGER,
    available_slots INTEGER,
    students_per_team INTEGER,
    faculty_id INTEGER,
    prerequisite_courses integer[],
    document_names varchar[],
    document_paths text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.project_id,
        p.title,
        p.description,
        p.min_cgpa,
        p.available_slots,
        p.students_per_team,
        p.faculty_id,
        ARRAY_AGG(DISTINCT pr.course_id) AS prerequisite_courses,
        ARRAY_AGG(DISTINCT pd.document_name) AS document_names,
        ARRAY_AGG(DISTINCT pd.document_path) AS document_paths
    FROM projects p
    LEFT JOIN faculty f ON p.faculty_id = f.faculty_id
    LEFT JOIN prereq pr ON p.project_id = pr.project_id
    LEFT JOIN project_documents pd ON p.project_id = pd.project_id
    WHERE p.project_id = proj_id
    GROUP BY p.project_id;
END; 
$$ LANGUAGE plpgsql;

-- drop function get_project_details;
SELECT * FROM get_project_details(2);

create or replace function getcourse(course_id integer)
returns var



CREATE TABLE teams (
    Team_id SERIAL PRIMARY KEY,
    Team_name VARCHAR(100) NOT NULL UNIQUE 
);

CREATE TABLE team_members (
    Team_id INTEGER,
    Student_id INTEGER,
    PRIMARY KEY (Team_id, Student_id),
    CONSTRAINT fk_team FOREIGN KEY (Team_id) REFERENCES teams(Team_id) ON DELETE CASCADE,
    CONSTRAINT fk_student FOREIGN KEY (Student_id) REFERENCES students(Roll_no) ON DELETE CASCADE
);


CREATE TABLE project_applications (
    Application_id SERIAL PRIMARY KEY,
    Student_id INTEGER,
    Project_id INTEGER,
    Application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bio text;
    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Accepted', 'Rejected')),
    CONSTRAINT fk_student FOREIGN KEY (Student_id) REFERENCES students(Roll_no) ON DELETE CASCADE,
    CONSTRAINT fk_project FOREIGN KEY (Project_id) REFERENCES projects(Project_id) ON DELETE CASCADE,
    UNIQUE (Student_id, Project_id)
);

CREATE TABLE team_project_applications (
    Application_id SERIAL PRIMARY KEY,
    Team_id INTEGER,
    Project_id INTEGER,
    Application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Accepted', 'Rejected')),
    CONSTRAINT fk_team FOREIGN KEY (Team_id) REFERENCES teams(Team_id) ON DELETE CASCADE,
    CONSTRAINT fk_project FOREIGN KEY (Project_id) REFERENCES projects(Project_id) ON DELETE CASCADE,
    UNIQUE (Team_id, Project_id)
);


/* this is to prevent the student from applying to a project both as team and individually to the same project*/
CREATE OR REPLACE FUNCTION prevent_duplicate_application()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM team_project_applications tpa
        JOIN team_members tm ON tpa.Team_id = tm.Team_id
        WHERE tm.Student_id = NEW.Student_id AND tpa.Project_id = NEW.Project_id
    ) THEN
        RAISE EXCEPTION 'Student has already applied for this project as part of a team';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_individual_application
BEFORE INSERT ON project_applications
FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_application();

CREATE TABLE documents_applications (
    Document_id SERIAL PRIMARY KEY,
    Individual_Application_id INTEGER,
    Team_Application_id INTEGER,
    Document_type VARCHAR(50) NOT NULL,
    Document_name VARCHAR(255) NOT NULL,
    Document_url TEXT,
    Upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_individual_application FOREIGN KEY (Individual_Application_id)
        REFERENCES project_applications(Application_id) ON DELETE CASCADE,
    CONSTRAINT fk_team_application FOREIGN KEY (Team_Application_id) 
        REFERENCES team_project_applications(Application_id) ON DELETE CASCADE,
    CHECK (
        (Individual_Application_id IS NOT NULL AND Team_Application_id IS NULL) OR
        (Individual_Application_id IS NULL AND Team_Application_id IS NOT NULL)
    )
);

ALTER TABLE project_applications 
ADD COLUMN bio text;



ALTER TABLE team_project_applications
ADD COLUMN bio text;


