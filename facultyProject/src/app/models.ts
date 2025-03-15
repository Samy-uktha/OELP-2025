export interface user {
	user_id : number,
	password : string
}

export interface faculty {
	faculty_id : number,
	firstname : string,
	lastname : string,
	email : string,
	phone_no : string,
	dept_name : string

}

export interface course {
	course_id  : number,
	course_name : string,
	credits : number,
	course_code : string
}

export interface Doc{
	doc_name  : string,
	doc_url : string
}

export interface department{
	dept_id : number,
	dept_name : string
}

export interface project{
	project_id : number,
	title : string,
	min_cgpa : number,
	description : string,
	available_slots : number,
	students_per_team : number,
	prerequisites? : course[],
	documents? : Doc[],
	min_sem : number,
	department? : department[]

}
