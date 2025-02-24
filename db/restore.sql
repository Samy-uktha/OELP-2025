--
-- NOTE:
--
-- File paths need to be edited. Search for $$PATH$$ and
-- replace it with the path to the directory containing
-- the extracted data files.
--
--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 17.0


GRANT ALL ON SCHEMA public TO postgres;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS "ProjectAllotment";


--
-- Name: ProjectAllotment; Type: DATABASE; Schema: -; Owner: abhiramiriyer
--

CREATE DATABASE "ProjectAllotment" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


ALTER DATABASE "ProjectAllotment" OWNER TO abhiramiriyer;

\connect "ProjectAllotment"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: abhiramiriyer
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO abhiramiriyer;

--
-- Name: prevent_duplicate_application(); Type: FUNCTION; Schema: public; Owner: abhiramiriyer
--

CREATE FUNCTION public.prevent_duplicate_application() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- If a student is part of a team applying for this project, prevent individual application
    IF EXISTS (
        SELECT 1 FROM team_project_applications tpa
        JOIN team_members tm ON tpa.Team_id = tm.Team_id
        WHERE tm.Student_id = NEW.Student_id AND tpa.Project_id = NEW.Project_id
    ) THEN
        RAISE EXCEPTION 'Student has already applied for this project as part of a team';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_duplicate_application() OWNER TO abhiramiriyer;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    course_name character varying(50) NOT NULL,
    course_code character varying(5) NOT NULL,
    credits integer NOT NULL,
    CONSTRAINT check_credits CHECK ((credits > 0))
);


ALTER TABLE public.courses OWNER TO abhiramiriyer;

--
-- Name: department; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.department (
    dept_id integer NOT NULL,
    dept_name text NOT NULL
);


ALTER TABLE public.department OWNER TO abhiramiriyer;

--
-- Name: documents_applications; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.documents_applications (
    document_id integer NOT NULL,
    individual_application_id integer,
    team_application_id integer,
    document_type character varying(50) NOT NULL,
    document_name character varying(255) NOT NULL,
    document_url text,
    upload_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_applications_check CHECK ((((individual_application_id IS NOT NULL) AND (team_application_id IS NULL)) OR ((individual_application_id IS NULL) AND (team_application_id IS NOT NULL))))
);


ALTER TABLE public.documents_applications OWNER TO abhiramiriyer;

--
-- Name: documents_applications_document_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.documents_applications_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_applications_document_id_seq OWNER TO abhiramiriyer;

--
-- Name: documents_applications_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.documents_applications_document_id_seq OWNED BY public.documents_applications.document_id;


--
-- Name: faculty; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.faculty (
    faculty_id integer NOT NULL,
    firstname character varying(50) NOT NULL,
    lastname character varying(50) NOT NULL,
    email text NOT NULL,
    phone_no character varying(10) NOT NULL,
    department_id integer
);


ALTER TABLE public.faculty OWNER TO abhiramiriyer;

--
-- Name: prereq; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.prereq (
    project_id integer NOT NULL,
    course_id integer NOT NULL
);


ALTER TABLE public.prereq OWNER TO abhiramiriyer;

--
-- Name: project_applications; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.project_applications (
    application_id integer NOT NULL,
    student_id integer,
    project_id integer,
    application_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Pending'::character varying,
    CONSTRAINT project_applications_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Accepted'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.project_applications OWNER TO abhiramiriyer;

--
-- Name: project_applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.project_applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_applications_application_id_seq OWNER TO abhiramiriyer;

--
-- Name: project_applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.project_applications_application_id_seq OWNED BY public.project_applications.application_id;


--
-- Name: project_documents; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.project_documents (
    document_id integer NOT NULL,
    project_id integer,
    document_name character varying(255) NOT NULL,
    document_path text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_documents OWNER TO abhiramiriyer;

--
-- Name: project_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.project_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_documents_document_id_seq OWNER TO abhiramiriyer;

--
-- Name: project_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.project_documents_document_id_seq OWNED BY public.project_documents.document_id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.projects (
    project_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    min_cgpa integer NOT NULL,
    available_slots integer NOT NULL,
    students_per_team integer NOT NULL,
    CONSTRAINT projects_available_slots_check CHECK ((available_slots >= 0)),
    CONSTRAINT projects_min_cgpa_check CHECK (((min_cgpa >= 0) AND (min_cgpa <= 10))),
    CONSTRAINT projects_students_per_team_check CHECK ((students_per_team >= 1))
);


ALTER TABLE public.projects OWNER TO abhiramiriyer;

--
-- Name: student_courses; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.student_courses (
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    grade character(1) NOT NULL,
    CONSTRAINT check_grade CHECK ((grade = ANY (ARRAY['S'::bpchar, 'A'::bpchar, 'B'::bpchar, 'C'::bpchar, 'D'::bpchar, 'E'::bpchar, 'F'::bpchar, 'I'::bpchar])))
);


ALTER TABLE public.student_courses OWNER TO abhiramiriyer;

--
-- Name: students; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.students (
    roll_no integer NOT NULL,
    firstname character varying(50) NOT NULL,
    lastname character varying(50) NOT NULL,
    email text NOT NULL,
    phone_no character varying(10) NOT NULL,
    department_id integer,
    semester integer NOT NULL,
    cgpa integer NOT NULL,
    CONSTRAINT check_cgpa CHECK (((cgpa >= 0) AND (cgpa <= 10))),
    CONSTRAINT check_semester CHECK (((semester >= 1) AND (semester <= 8)))
);


ALTER TABLE public.students OWNER TO abhiramiriyer;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.team_members (
    team_id integer NOT NULL,
    student_id integer NOT NULL
);


ALTER TABLE public.team_members OWNER TO abhiramiriyer;

--
-- Name: team_project_applications; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.team_project_applications (
    application_id integer NOT NULL,
    team_id integer,
    project_id integer,
    application_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Pending'::character varying,
    CONSTRAINT team_project_applications_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Accepted'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.team_project_applications OWNER TO abhiramiriyer;

--
-- Name: team_project_applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.team_project_applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_project_applications_application_id_seq OWNER TO abhiramiriyer;

--
-- Name: team_project_applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.team_project_applications_application_id_seq OWNED BY public.team_project_applications.application_id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.teams (
    team_id integer NOT NULL,
    team_name character varying(100) NOT NULL
);


ALTER TABLE public.teams OWNER TO abhiramiriyer;

--
-- Name: teams_team_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.teams_team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_team_id_seq OWNER TO abhiramiriyer;

--
-- Name: teams_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.teams_team_id_seq OWNED BY public.teams.team_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: abhiramiriyer
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    password text NOT NULL,
    user_type character varying(10) NOT NULL,
    student_id integer,
    faculty_id integer,
    CONSTRAINT check_user_type CHECK (((((user_type)::text = 'student'::text) AND (student_id IS NOT NULL) AND (faculty_id IS NULL)) OR (((user_type)::text = 'faculty'::text) AND (faculty_id IS NOT NULL) AND (student_id IS NULL)))),
    CONSTRAINT users_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['student'::character varying, 'faculty'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO abhiramiriyer;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: abhiramiriyer
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO abhiramiriyer;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: abhiramiriyer
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: documents_applications document_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.documents_applications ALTER COLUMN document_id SET DEFAULT nextval('public.documents_applications_document_id_seq'::regclass);


--
-- Name: project_applications application_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_applications ALTER COLUMN application_id SET DEFAULT nextval('public.project_applications_application_id_seq'::regclass);


--
-- Name: project_documents document_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_documents ALTER COLUMN document_id SET DEFAULT nextval('public.project_documents_document_id_seq'::regclass);


--
-- Name: team_project_applications application_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_project_applications ALTER COLUMN application_id SET DEFAULT nextval('public.team_project_applications_application_id_seq'::regclass);


--
-- Name: teams team_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.teams ALTER COLUMN team_id SET DEFAULT nextval('public.teams_team_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3804.dat

--
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3799.dat

--
-- Data for Name: documents_applications; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3818.dat

--
-- Data for Name: faculty; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3801.dat

--
-- Data for Name: prereq; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3807.dat

--
-- Data for Name: project_applications; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3814.dat

--
-- Data for Name: project_documents; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3809.dat

--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3806.dat

--
-- Data for Name: student_courses; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3805.dat

--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3800.dat

--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3812.dat

--
-- Data for Name: team_project_applications; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3816.dat

--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3811.dat

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: abhiramiriyer
--

\i $$PATH$$/3803.dat

--
-- Name: documents_applications_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.documents_applications_document_id_seq', 1, false);


--
-- Name: project_applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.project_applications_application_id_seq', 1, false);


--
-- Name: project_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.project_documents_document_id_seq', 1, false);


--
-- Name: team_project_applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.team_project_applications_application_id_seq', 1, false);


--
-- Name: teams_team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.teams_team_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: abhiramiriyer
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: department department_dept_name_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_dept_name_key UNIQUE (dept_name);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (dept_id);


--
-- Name: documents_applications documents_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.documents_applications
    ADD CONSTRAINT documents_applications_pkey PRIMARY KEY (document_id);


--
-- Name: faculty faculty_email_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_email_key UNIQUE (email);


--
-- Name: faculty faculty_phone_no_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_phone_no_key UNIQUE (phone_no);


--
-- Name: faculty faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_pkey PRIMARY KEY (faculty_id);


--
-- Name: student_courses pk_student_course; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT pk_student_course PRIMARY KEY (student_id, course_id, grade);


--
-- Name: prereq prereq_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.prereq
    ADD CONSTRAINT prereq_pkey PRIMARY KEY (project_id, course_id);


--
-- Name: project_applications project_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT project_applications_pkey PRIMARY KEY (application_id);


--
-- Name: project_applications project_applications_student_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT project_applications_student_id_project_id_key UNIQUE (student_id, project_id);


--
-- Name: project_documents project_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_documents
    ADD CONSTRAINT project_documents_pkey PRIMARY KEY (document_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (project_id);


--
-- Name: projects projects_title_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_title_key UNIQUE (title);


--
-- Name: students students_phone_no_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_phone_no_key UNIQUE (phone_no);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (roll_no);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (team_id, student_id);


--
-- Name: team_project_applications team_project_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_project_applications
    ADD CONSTRAINT team_project_applications_pkey PRIMARY KEY (application_id);


--
-- Name: team_project_applications team_project_applications_team_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_project_applications
    ADD CONSTRAINT team_project_applications_team_id_project_id_key UNIQUE (team_id, project_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (team_id);


--
-- Name: teams teams_team_name_key; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_team_name_key UNIQUE (team_name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: project_applications check_individual_application; Type: TRIGGER; Schema: public; Owner: abhiramiriyer
--

CREATE TRIGGER check_individual_application BEFORE INSERT ON public.project_applications FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_application();


--
-- Name: student_courses fk_course; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: prereq fk_course; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.prereq
    ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: students fk_dept; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_dept FOREIGN KEY (department_id) REFERENCES public.department(dept_id);


--
-- Name: faculty fk_dept; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT fk_dept FOREIGN KEY (department_id) REFERENCES public.department(dept_id);


--
-- Name: users fk_faculty; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES public.faculty(faculty_id);


--
-- Name: documents_applications fk_individual_application; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.documents_applications
    ADD CONSTRAINT fk_individual_application FOREIGN KEY (individual_application_id) REFERENCES public.project_applications(application_id) ON DELETE CASCADE;


--
-- Name: prereq fk_project; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.prereq
    ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: project_applications fk_project; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: team_project_applications fk_project; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_project_applications
    ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: project_documents fk_project_docs; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_documents
    ADD CONSTRAINT fk_project_docs FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;


--
-- Name: users fk_student; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.students(roll_no);


--
-- Name: student_courses fk_student; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.students(roll_no);


--
-- Name: team_members fk_student; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.students(roll_no) ON DELETE CASCADE;


--
-- Name: project_applications fk_student; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.students(roll_no) ON DELETE CASCADE;


--
-- Name: team_members fk_team; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;


--
-- Name: team_project_applications fk_team; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.team_project_applications
    ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;


--
-- Name: documents_applications fk_team_application; Type: FK CONSTRAINT; Schema: public; Owner: abhiramiriyer
--

ALTER TABLE ONLY public.documents_applications
    ADD CONSTRAINT fk_team_application FOREIGN KEY (team_application_id) REFERENCES public.team_project_applications(application_id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: abhiramiriyer
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

