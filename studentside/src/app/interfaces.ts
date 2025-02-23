export enum Dept {
    CS = "Computer Science Engineering",
    DS = "Data Science Engineering",
    EE = "Electrical Engineering",
    ME = "Mechanical Engineering",
    CE = "Civil Engineering",
  }
  
  export interface Project {
    name: string;
    professor: string;
    branch: Dept[]; 
    degree: string[]; 
    year: number[];   
    cgpa: number;
    description: string;
  }
  
  export interface Student {
    roll: string;
    branch: Dept;
    degree: string;
    year: number;
    cgpa: number;
  }
