import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectdataService {
  // private allProjects: string[] = ['Project A', 'Project B', 'Project C', 'Project D'];
  
  private projectCriteria: { 
    [key: string]: { branch: string[], degree: string[], year: number[], cgpa: number, professor: string, description: string }
  } = {
    "AI-Powered Chatbot": { 
      professor: "Dr. Rajesh Kumar",
      branch: ["CSE", "DSE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.0,
      description: "An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Blockchain-Based Voting System": { 
      professor: "Dr. Anjali Mehta",
      branch: ["CSE", "DSE"], 
      degree: ["BTech", "MTech"], 
      year: [2, 3, 4], 
      cgpa: 6.5,
      description: "A decentralized voting system using blockchain to ensure secure and tamper-proof elections. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "IoT-Based Smart Home Automation": { 
      professor: "Dr. Arvind Sharma",
      branch: ["ECE", "EE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.5,
      description: "A smart home automation system that uses IoT devices to control appliances remotely. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Autonomous Vehicle Design": { 
      professor: "Dr. Manish Patel",
      branch: ["ME"], 
      degree: ["BTech"], 
      year: [4], 
      cgpa: 7.0,
      description: "A self-driving vehicle prototype with obstacle detection and autonomous navigation. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Sustainable Concrete Using Recycled Materials": { 
      professor: "Dr. Sneha Verma",
      branch: ["CE"], 
      degree: ["BTech"], 
      year: [3], 
      cgpa: 7.0,
      description: "An innovative approach to sustainable construction by incorporating recycled materials in concrete. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Energy-Efficient Smart Grid System": { 
      professor: "Dr. Sandeep Mishra",
      branch: ["EE"], 
      degree: ["BTech", "MTech"], 
      year: [3, 4], 
      cgpa: 7.2,
      description: "A smart grid system that enhances energy efficiency and optimizes electricity distribution using AI algorithms. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Deep Learning for Medical Image Analysis": { 
      professor: "Dr. Neha Kapoor",
      branch: ["DSE", "CSE"], 
      degree: ["BTech", "MTech"], 
      year: [3, 4], 
      cgpa: 7.5,
      description: "Using deep learning techniques to analyze and diagnose diseases from medical imaging datasets. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "3D Printing for Structural Engineering": { 
      professor: "Dr. Amit Joshi",
      branch: ["CE", "ME"], 
      degree: ["BTech"], 
      year: [4], 
      cgpa: 7.0,
      description: "Exploring the applications of 3D printing in structural engineering for sustainable and cost-effective construction. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "AI-Based Predictive Maintenance for Machines": { 
      professor: "Dr. Ramesh Gupta",
      branch: ["ME", "EE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.3,
      description: "Developing an AI-based system for predictive maintenance to reduce machine downtime and increase efficiency. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Cybersecurity Threat Detection Using Machine Learning": { 
      professor: "Dr. Preeti Sharma",
      branch: ["CSE", "DSE"], 
      degree: ["BTech", "MTech"], 
      year: [2, 3, 4], 
      cgpa: 7.0,
      description: "Leveraging machine learning to identify and mitigate cybersecurity threats in real-time. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Smart Traffic Management System": { 
      professor: "Dr. Vinod Bhatia",
      branch: ["CSE", "EE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.4,
      description: "A smart traffic management system that optimizes traffic flow using AI and IoT-based sensors. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Structural Health Monitoring Using IoT": { 
      professor: "Dr. Pooja Malhotra",
      branch: ["CE", "EE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.2,
      description: "Using IoT-enabled sensors to monitor and predict the structural health of buildings and bridges. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Human Activity Recognition Using AI": { 
      professor: "Dr. Rohit Singh",
      branch: ["DSE", "CSE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.0,
      description: "Developing an AI model to classify human activities using computer vision and sensor data. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    },
    "Wind Turbine Performance Optimization": { 
      professor: "Dr. Meera Desai",
      branch: ["ME", "EE"], 
      degree: ["BTech"], 
      year: [3, 4], 
      cgpa: 7.5,
      description: "Optimizing wind turbine performance using data-driven algorithms for increased energy efficiency. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques."
    }
  };


  getAllProjects(): { name: string, professor: string, branch: string[], year: number[], description: string }[] {
    return Object.keys(this.projectCriteria).map(project => ({
      name: project,
      professor: this.projectCriteria[project].professor,
      branch: this.projectCriteria[project].branch,
      year: this.projectCriteria[project].year,
      description: this.projectCriteria[project].description
    }));
  }

  getEligibleProjects(student: { branch: string; degree: string; year: number; cgpa: number }): string[] {
    return Object.keys(this.projectCriteria).filter(project => {
      const criteria = this.projectCriteria[project];
      return (
        criteria.branch.includes(student.branch) &&
        criteria.degree.includes(student.degree) &&
        criteria.year.includes(student.year) &&
        student.cgpa >= criteria.cgpa 
        
        // (criteria.prerequisites.length === 0 || criteria.prerequisites.every(course => student.completedCourses.includes(course)))
    );
    });
  }

  getAppliedProjects(): string[] {
    return ['Blockchain-Based Voting System','project2','project3']; // This should ideally come from user data
  }

  constructor() { }
}
