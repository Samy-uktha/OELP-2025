export enum Dept {
    CS = "Computer Science Engineering",
    DS = "Data Science Engineering",
    EE = "Electrical Engineering",
    ME = "Mechanical Engineering",
    CE = "Civil Engineering",
  }
  
  export interface Project {
    name: string;
    faculty: string;
    projectId: number;
    facultyId: number;
    branch: Dept[]; 
    degree: string[]; 
    year: number[];   
    cgpa: number;
    description: string;
  }
  
  export interface Student {
    name: string,
    roll: string;
    branch: Dept;
    degree: string;
    year: number;
    // sem: number;
    cgpa: number;
    applied: string[];
  }
