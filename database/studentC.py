import csv
import random

# --- Data Setup (Recreating from previous steps) ---

# Department Mapping
departments = {
    11: "CSE", 10: "Civil", 12: "EE", 13: "Mech", 14: "DS"
}
dept_code_map = { "CS": 11, "CE": 10, "EE": 12, "ME": 13, "DS": 14, "HS": 0, "MG": 0 } # 0 for general/unknown

# Student Data Structure: (Roll_no, Department_id, year)
students = []
start_roll_base = {11: 112201001, 10: 102201001, 12: 122201001, 13: 132201001, 14: 142201001}
years = [22, 23, 24, 25] # Admission years
students_per_year_dept = 25

current_year_mapping = { 22: 4, 23: 3, 24: 2, 25: 1 } # Admission year -> Academic year

for dept_id in departments:
    dept_prefix = list(dept_code_map.keys())[list(dept_code_map.values()).index(dept_id)]
    for adm_year in years:
        acad_year = current_year_mapping[adm_year]
        start_seq = 1001 # Sequence number like 01001
        for i in range(students_per_year_dept):
            roll_no = int(f"{dept_id}{adm_year}0{start_seq + i}")
            students.append((roll_no, dept_id, acad_year))

# Course Data Structure: (course_id, course_code, dept_id, level, credits)
# (Combined core and electives from previous steps)
courses_raw = [
    (1,'Introduction to Programming','CS101',3), (2,'Data Structures and Algorithms','CS201',4),
    (3,'Discrete Mathematics','CS202',3), (4,'Computer Organization & Architecture','CS203',4),
    (5,'Operating Systems','CS301',4), (6,'Database Management Systems','CS302',4),
    (7,'Theory of Computation','CS303',3), (8,'Computer Networks','CS304',4),
    (9,'Design and Analysis of Algorithms','CS305',3), (10,'Software Engineering','CS306',3),
    (11,'Artificial Intelligence','CS401',3), (12,'Machine Learning','CS402',3),
    (13,'Compiler Design','CS403',4), (14,'Computer Graphics','CS404',3),
    (15,'Cryptography and Network Security','CS405',3), (16,'Web Development','CS406',3),
    (17,'Mobile Computing','CS407',3), (18,'Distributed Systems','CS408',3),
    (19,'Cloud Computing','CS409',3), (20,'Natural Language Processing','CS410',3),
    (21,'Data Mining and Warehousing','CS411',3), (22,'Programming Lab I','CS191',2),
    (23,'Data Structures Lab','CS291',2), (24,'Operating Systems Lab','CS391',2),
    (25,'Database Lab','CS392',1), (26,'Networks Lab','CS394',1),
    (27,'Machine Learning Lab','CS492',1), (28,'Software Engineering Lab','CS396',1),
    (29,'Compiler Lab','CS493',1), (30,'Seminar/Minor Project CSE','CS498',2),
    (31,'Engineering Mechanics','CE101',4), (32,'Introduction to Civil Engineering','CE102',2),
    (33,'Surveying and Geomatics','CE201',4), (34,'Mechanics of Solids','CE202',4),
    (35,'Fluid Mechanics','CE203',4), (36,'Building Materials and Construction','CE204',3),
    (37,'Structural Analysis I','CE301',4), (38,'Geotechnical Engineering I','CE302',4),
    (39,'Transportation Engineering I','CE303',4), (40,'Water Resources Engineering','CE304',3),
    (41,'Environmental Engineering I','CE305',3), (42,'Design of Concrete Structures I','CE306',4),
    (43,'Structural Analysis II','CE401',3), (44,'Geotechnical Engineering II','CE402',3),
    (45,'Transportation Engineering II','CE403',3), (46,'Design of Steel Structures','CE404',4),
    (47,'Construction Planning & Management','CE405',3), (48,'Advanced Structural Mechanics','CE406',3),
    (49,'Foundation Engineering','CE407',3), (50,'Hydraulic Engineering','CE408',3),
    (51,'Surveying Lab','CE291',1), (52,'Fluid Mechanics Lab','CE293',1),
    (53,'Geotechnical Lab I','CE392',1), (54,'Transportation Lab I','CE393',1),
    (55,'Environmental Lab I','CE395',1), (56,'Concrete Lab','CE396',1),
    (57,'Structural Engineering Lab','CE491',1), (58,'CAD Lab (Civil)','CE494',1),
    (59,'Construction Materials Lab','CE294',1), (60,'Seminar/Minor Project Civil','CE498',2),
    (61,'Introduction to Electrical Engineering','EE101',3), (62,'Basic Electronics','EE102',4),
    (63,'Network Theory','EE201',4), (64,'Digital Logic Design','EE202',4),
    (65,'Signals and Systems','EE203',4), (66,'Electromagnetic Theory','EE204',3),
    (67,'Analog Circuits','EE301',4), (68,'Microprocessors and Microcontrollers','EE302',4),
    (69,'Control Systems','EE303',4), (70,'Power Systems I','EE304',4),
    (71,'Communication Systems I','EE305',3), (72,'Digital Signal Processing','EE306',4),
    (73,'Power Electronics','EE401',4), (74,'VLSI Design','EE402',3),
    (75,'Power Systems II','EE403',3), (76,'Communication Systems II','EE404',3),
    (77,'Instrumentation and Measurements','EE405',3), (78,'Electric Drives','EE406',3),
    (79,'Renewable Energy Systems','EE407',3), (80,'Embedded Systems','EE408',3),
    (81,'Basic Electronics Lab','EE192',1), (82,'Digital Logic Lab','EE292',1),
    (83,'Circuits and Systems Lab','EE293',1), (84,'Analog Circuits Lab','EE391',1),
    (85,'Microprocessor Lab','EE392',1), (86,'Control Systems Lab','EE393',1),
    (87,'Communication Lab I','EE395',1), (88,'DSP Lab','EE396',1),
    (89,'Power Electronics Lab','EE491',1), (90,'Seminar/Minor Project EE','EE498',2),
    (91,'Engineering Drawing','ME101',3), (92,'Workshop Practice','ME102',2),
    (93,'Thermodynamics I','ME201',4), (94,'Engineering Materials','ME202',3),
    (95,'Fluid Mechanics I','ME203',4), (96,'Mechanics of Materials I','ME204',4),
    (97,'Kinematics of Machinery','ME301',4), (98,'Manufacturing Processes I','ME302',4),
    (99,'Heat Transfer','ME303',4), (100,'Machine Design I','ME304',4),
    (101,'Dynamics of Machinery','ME305',3), (102,'Thermodynamics II','ME306',3),
    (103,'Fluid Mechanics II','ME401',3), (104,'IC Engines and Gas Turbines','ME402',3),
    (105,'Manufacturing Processes II','ME403',3), (106,'Machine Design II','ME404',3),
    (107,'CAD/CAM','ME405',3), (108,'Refrigeration and Air Conditioning','ME406',3),
    (109,'Robotics','ME407',3), (110,'Finite Element Analysis','ME408',3),
    (111,'Mechatronics','ME409',3), (112,'Workshop Lab','ME192',1),
    (113,'Fluid Mechanics Lab ME','ME293',1), (114,'Strength of Materials Lab','ME294',1),
    (115,'Kinematics Lab','ME391',1), (116,'Manufacturing Lab I','ME392',1),
    (117,'Heat Transfer Lab','ME393',1), (118,'Machine Design Lab','ME394',1),
    (119,'IC Engines Lab','ME492',1), (120,'Seminar/Minor Project ME','ME498',2),
    (121,'Intro to Data Science & AI','DS101',3), (122,'Python for Data Science','DS102',3),
    (123,'Linear Algebra for DS','DS201',4), (124,'Probability & Statistics for DS','DS202',4),
    (125,'Calculus for Data Science','DS203',3), (126,'Data Structures for DS','DS204',3),
    (127,'Foundations of Machine Learning','DS301',4), (128,'Database Systems for DS','DS302',4),
    (129,'Big Data Technologies','DS303',3), (130,'Data Mining & Analysis','DS304',4),
    (131,'Deep Learning Foundations','DS305',3), (132,'Statistical Inference','DS306',3),
    (133,'Advanced Machine Learning','DS401',3), (134,'Natural Language Processing Tech','DS402',3),
    (135,'Data Visualization','DS403',3), (136,'Cloud Computing Platforms','DS404',3),
    (137,'Reinforcement Learning','DS405',3), (138,'Time Series Analysis','DS406',3),
    (139,'Data Ethics and Privacy','DS407',2), (140,'Optimization Techniques','DS408',3),
    (141,'Python Lab','DS192',1), (142,'Stats & Probability Lab','DS292',1),
    (143,'Machine Learning Lab I','DS391',2), (144,'Big Data Lab','DS393',1),
    (145,'Deep Learning Lab','DS395',1), (146,'Data Mining Lab','DS394',1),
    (147,'NLP Lab','DS492',1), (148,'Data Visualization Lab','DS493',1),
    (149,'Capstone Project I','DS497',3), (150,'Capstone Project II','DS499',3),
    (151,'Advanced Computer Architecture','CS501',3), (152,'High Performance Computing','CS502',3),
    (153,'Quantum Computing Introduction','CS503',3), (154,'Blockchain Technologies','CS504',3),
    (155,'Advanced Database Systems','CS505',3), (156,'Computational Geometry','CS506',3),
    (157,'Bioinformatics Algorithms','CS507',3), (158,'Formal Methods in Software Engg','CS508',3),
    (159,'Advanced Foundation Engineering','CE501',3), (160,'Earthquake Engineering','CE502',3),
    (161,'Finite Element Methods in Civil Engg','CE503',3), (162,'Pavement Design and Management','CE504',3),
    (163,'Bridge Engineering','CE505',3), (164,'Remote Sensing and GIS Applications','CE506',3),
    (165,'Advanced Water Treatment','CE507',3), (166,'Urban Transportation Planning','CE508',3),
    (167,'Advanced Control Systems','EE501',3), (168,'Smart Grid Technologies','EE502',3),
    (169,'Advanced Digital Signal Processing','EE503',3), (170,'RF and Microwave Engineering','EE504',3),
    (171,'Optical Communication Systems','EE505',3), (172,'Biomedical Instrumentation','EE506',3),
    (173,'Advanced Power Electronics','EE507',3), (174,'Nanoelectronics','EE508',3),
    (175,'Advanced Fluid Dynamics','ME501',3), (176,'Computational Fluid Dynamics','ME502',3),
    (177,'Advanced Manufacturing Processes','ME503',3), (178,'Fracture Mechanics','ME504',3),
    (179,'Automobile Engineering','ME505',3), (180,'Turbomachinery','ME506',3),
    (181,'Vibrations and Noise Control','ME507',3), (182,'Industrial Robotics','ME508',3),
    (183,'Bayesian Data Analysis','DS501',3), (184,'Advanced Topics in Deep Learning','DS502',3),
    (185,'Big Data Analytics Platforms','DS503',3), (186,'Causal Inference','DS504',3),
    (187,'Computer Vision Applications','DS505',3), (188,'AI Ethics and Society','DS506',2),
    (189,'Bioinformatics Data Analysis','DS507',3), (190,'Explainable AI (XAI)','DS508',3),
    (191,'Humanities Elective I','HS101',3), (192,'Economics I','HS102',3),
    (193,'Professional Communication','HS201',2), (194,'Management Principles','MG301',3)
]

courses = []
for c_id, c_name, c_code, c_cred in courses_raw:
    dept_prefix = ''.join(filter(str.isalpha, c_code[:2])) # Extract prefix like CS, CE, HS
    dept_id = dept_code_map.get(dept_prefix, 0) # Get dept ID, default to 0 if prefix not found
    level = 0
    try:
        level_digit = ''.join(filter(str.isdigit, c_code))[0] # Get first digit
        level = int(level_digit) * 100 # e.g., '1' -> 100, '2' -> 200
    except IndexError:
        level = 0 # Handle cases like maybe MG codes if they don't start with digit
    courses.append((c_id, c_code, dept_id, level, c_cred, c_name)) # Added name for filtering electives later

# --- Helper Functions ---
def get_courses_by_level_dept(target_level, target_dept_id, include_lower=True, include_general=False):
    """Gets courses matching level and department."""
    results = []
    for c_id, c_code, dept_id, level, c_cred, c_name in courses:
        match = False
        if dept_id == target_dept_id:
            if include_lower:
                if level <= target_level and level > 0:
                    match = True
            elif level == target_level:
                 match = True
        elif include_general and dept_id == 0 and level <= target_level: # Include HS/MG etc if requested
             match = True
        if match:
            results.append((c_id, c_code, dept_id, level, c_cred, c_name))
    return results

def get_labs_for_courses(course_list):
    """Finds lab courses (code ending 9x) potentially related to given courses."""
    labs = []
    dept_ids = set(c[2] for c in course_list) # Depts of the student's courses
    levels = set(c[3] for c in course_list) # Levels of the student's courses

    for c_id, c_code, dept_id, level, c_cred, c_name in courses:
         # Check if it's a lab (heuristic: code ends '9' followed by digit) and matches dept/level range
        if len(c_code) >= 3 and c_code[-2] == '9' and c_code[-1].isdigit():
            if dept_id in dept_ids and level in levels:
                 labs.append((c_id, c_code, dept_id, level, c_cred, c_name))
    return labs

def get_electives(target_dept_id, min_level=400, count=5, exclude_ids=None):
    """Gets electives, prioritizing department, then general, then others."""
    if exclude_ids is None:
        exclude_ids = set()

    possible_electives = []
    # Prioritize own dept electives
    for c_id, c_code, dept_id, level, c_cred, c_name in courses:
        if c_id not in exclude_ids and dept_id == target_dept_id and level >= min_level:
             possible_electives.append(((c_id, c_code, dept_id, level, c_cred, c_name), 1)) # Priority 1

    # Add general electives (HS, MG)
    for c_id, c_code, dept_id, level, c_cred, c_name in courses:
         if c_id not in exclude_ids and dept_id == 0 and level < min_level + 100: # Allow slightly lower level general electives too
            possible_electives.append(((c_id, c_code, dept_id, level, c_cred, c_name), 2)) # Priority 2

    # Add other dept electives (lower priority)
    for c_id, c_code, dept_id, level, c_cred, c_name in courses:
         if c_id not in exclude_ids and dept_id != target_dept_id and dept_id != 0 and level >= min_level:
             # Add some heuristic for relevance? For now, just add them with lower priority
             possible_electives.append(((c_id, c_code, dept_id, level, c_cred, c_name), 3)) # Priority 3

    # Sort by priority, then randomly sample
    possible_electives.sort(key=lambda x: x[1])
    
    num_to_sample = min(count, len(possible_electives))
    sampled = random.sample([item[0] for item in possible_electives], num_to_sample) # Get only course tuple
    return sampled


# --- Grade Distribution ---
grades = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'I']
# Weights favoring S, A, B
weights = [15, 30, 35, 10, 4, 3, 1, 2] # Slightly higher 'I' than 'F' maybe

# --- Main Generation Logic ---
student_course_records = []
min_courses_per_student = 20
target_courses_per_student = 23 # Aim slightly higher to ensure min is met

common_cross_dept_courses = {1, 121, 122, 191, 192, 193, 194} # CS101, DS101, DS102, HS*, MG*

for student_roll, student_dept_id, student_year in students:
    taken_courses = set() # Keep track of course_ids assigned to this student
    assigned_courses_details = [] # Store full course tuple for potential lab matching etc.

    # 1. Assign Core Departmental Courses + Lower Level
    max_level = student_year * 100
    core_courses = get_courses_by_level_dept(max_level, student_dept_id, include_lower=True, include_general=False)
    for course_detail in core_courses:
        c_id = course_detail[0]
        if c_id not in taken_courses:
            taken_courses.add(c_id)
            assigned_courses_details.append(course_detail)

    # 2. Assign Labs for the courses taken
    labs = get_labs_for_courses(assigned_courses_details)
    for lab_detail in labs:
        c_id = lab_detail[0]
        if c_id not in taken_courses:
             taken_courses.add(c_id)
             # No need to add labs to assigned_courses_details as they won't typically have labs themselves

    # 3. Assign Common Cross-Departmental / General Courses
    for c_id in common_cross_dept_courses:
        # Find the course details
        course_info = next((c for c in courses if c[0] == c_id), None)
        if course_info and course_info[2] != student_dept_id: # Only add if not student's own dept
            if c_id not in taken_courses:
                 taken_courses.add(c_id)

    # 4. Fill with Electives until target count is reached
    needed = target_courses_per_student - len(taken_courses)
    if needed > 0:
        # Determine appropriate elective level based on year
        elective_min_level = 300 if student_year <= 2 else 400
        electives = get_electives(student_dept_id, min_level=elective_min_level, count=needed + 5, exclude_ids=taken_courses) # Get a few extra
        
        count_added = 0
        for elective_detail in electives:
             if len(taken_courses) >= target_courses_per_student:
                 break
             c_id = elective_detail[0]
             if c_id not in taken_courses:
                 taken_courses.add(c_id)
                 count_added += 1
    
    # Ensure minimum is met even if target wasn't reached (e.g., few electives available)
    while len(taken_courses) < min_courses_per_student:
         # Force add any remaining course not yet taken (less realistic, but meets constraint)
         potential_adds = [c[0] for c in courses if c[0] not in taken_courses]
         if not potential_adds: break # Should not happen with 190+ courses
         c_id_to_add = random.choice(potential_adds)
         taken_courses.add(c_id_to_add)


    # 5. Assign Grades for all taken courses
    for course_id in taken_courses:
        grade = random.choices(grades, weights=weights, k=1)[0]
        student_course_records.append((student_roll, course_id, grade))

# --- Write to CSV ---
output_filename = 'student_courses.csv'
print(f"Generating {len(student_course_records)} records for {output_filename}...")

with open(output_filename, 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Student_id', 'Course_id', 'Grade']) # Header
    writer.writerows(student_course_records)

print("CSV file generated successfully.")