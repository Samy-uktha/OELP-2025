import { Injectable } from '@angular/core';
import { Project, Dept, Student } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectdataService {  
  private projectCriteria: { 
    [key: string]: Project } = {
      "AI-Powered Chatbot": { 
      projectId: 100,
      name: "AI-Powered Chatbot",
      faculty: "Dr. Rajesh Kumar",
      facultyId: 1,
      branch: [Dept.CS, Dept.DS],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.0,
      description: "An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. The chatbot will be trained on a dataset of frequently asked questions and use deep learning models for sentiment analysis and intelligent response generation. The project involves developing a frontend interface, integrating a backend AI model, and optimizing response accuracy."
    },
    "Blockchain-Based Voting System": { 
      projectId: 101,
      name: "Blockchain-Based Voting System",
      faculty: "Dr. Anjali Mehta",
      facultyId: 2,
      branch: [Dept.CS, Dept.DS],
      degree: ["BTech", "MTech"],
      year: [2, 3, 4],
      cgpa: 6.5,
      description: "A decentralized voting system using blockchain to ensure secure and tamper-proof elections. This project involves developing a smart contract using Ethereum, a web interface for voter authentication, and an encrypted digital ledger to prevent voting fraud. The system will be tested on a simulated election scenario for efficiency and reliability."
    },
    "IoT-Based Smart Home Automation": { 
      projectId: 103,
      name: "IoT-Based Smart Home Automation",
      faculty: "Dr. Arvind Sharma",
      facultyId: 3,
      branch: [Dept.EE],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.5,
      description: "A smart home automation system that uses IoT devices to control appliances remotely. The project involves designing a network of sensors and actuators to monitor and automate household appliances. Features include voice command integration, real-time energy monitoring, and mobile app connectivity."
    },
    "Autonomous Vehicle Design": { 
      projectId: 104,
      name: "Autonomous Vehicle Design",
      faculty: "Dr. Manish Patel",
      facultyId: 4,
      branch: [Dept.ME],
      degree: ["BTech"],
      year: [4],
      cgpa: 7.0,
      description: "A self-driving vehicle prototype with obstacle detection and autonomous navigation. This project focuses on integrating computer vision, LiDAR sensors, and AI-based path planning algorithms. The final design will be tested in a controlled environment for object avoidance and lane detection."
    },
    "Sustainable Concrete Using Recycled Materials": { 
      projectId: 105,
      name: "Sustainable Concrete Using Recycled Materials",
      faculty: "Dr. Sneha Verma",
      facultyId: 5,
      branch: [Dept.CE],
      degree: ["BTech"],
      year: [3],
      cgpa: 7.0,
      description: "An innovative approach to sustainable construction by incorporating recycled materials in concrete. The project aims to evaluate the structural integrity and environmental benefits of using industrial byproducts such as fly ash, silica fume, and crushed glass in concrete mixes."
    },
    "Energy-Efficient Smart Grid System": { 
      projectId: 106,
      name: "Energy-Efficient Smart Grid System",
      faculty: "Dr. Sandeep Mishra",
      facultyId: 6,
      branch: [Dept.EE],
      degree: ["BTech", "MTech"],
      year: [3, 4],
      cgpa: 7.2,
      description: "A smart grid system that enhances energy efficiency and optimizes electricity distribution using AI algorithms. This project involves demand-response modeling, renewable energy integration, and predictive maintenance using IoT sensors to improve power distribution efficiency."
    },
    "Deep Learning for Medical Image Analysis": { 
      projectId: 107,
      name: "Deep Learning for Medical Image Analysis",
      faculty: "Dr. Neha Kapoor",
      facultyId: 7,
      branch: [Dept.DS, Dept.CS],
      degree: ["BTech", "MTech"],
      year: [3, 4],
      cgpa: 7.5,
      description: "Using deep learning techniques to analyze and diagnose diseases from medical imaging datasets. The project involves training convolutional neural networks (CNNs) on MRI and CT scan data to automate disease classification with high accuracy."
    },
    "3D Printing for Structural Engineering": { 
      projectId: 108,
      name: "3D Printing for Structural Engineering",
      faculty: "Dr. Amit Joshi",
      facultyId: 8,
      branch: [Dept.CE, Dept.ME],
      degree: ["BTech"],
      year: [4],
      cgpa: 7.0,
      description: "Exploring the applications of 3D printing in structural engineering for sustainable and cost-effective construction. The project includes developing optimized printing techniques for concrete structures, evaluating material properties, and analyzing structural stability."
    },
    "AI-Based Predictive Maintenance for Machines": { 
      projectId: 109,
      name: "AI-Based Predictive Maintenance for Machines",
      faculty: "Dr. Ramesh Gupta",
      facultyId: 9,
      branch: [Dept.ME, Dept.EE],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.3,
      description: "Developing an AI-based system for predictive maintenance to reduce machine downtime and increase efficiency. The project includes data collection from industrial sensors, building machine learning models for failure prediction, and integrating real-time monitoring systems."
    },
    "Cybersecurity Threat Detection Using Machine Learning": { 
      projectId: 110,
      name: "Cybersecurity Threat Detection Using Machine Learning",
      faculty: "Dr. Preeti Sharma",
      facultyId: 10,
      branch: [Dept.CS, Dept.DS],
      degree: ["BTech", "MTech"],
      year: [2, 3, 4],
      cgpa: 7.0,
      description: "Leveraging machine learning to identify and mitigate cybersecurity threats in real-time. The project focuses on intrusion detection systems, anomaly detection using neural networks, and proactive threat mitigation strategies."
    },
    "Smart Traffic Management System": { 
      projectId: 111,
      name: "Smart Traffic Management System",
      faculty: "Dr. Vinod Bhatia",
      facultyId: 11,
      branch: [Dept.CS, Dept.EE],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.4,
      description: "A smart traffic management system that optimizes traffic flow using AI and IoT-based sensors. The project involves vehicle counting, congestion prediction, and dynamic traffic signal adjustments based on real-time data."
    },
    "Structural Health Monitoring Using IoT": { 
      projectId: 112,
      name: "Structural Health Monitoring Using IoT",
      faculty: "Dr. Pooja Malhotra",
      facultyId: 12,
      branch: [Dept.CE, Dept.EE],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.2,
      description: "Using IoT-enabled sensors to monitor and predict the structural health of buildings and bridges. The system will collect vibration, temperature, and stress data to detect early signs of structural failure."
    },
    "Human Activity Recognition Using AI": { 
      projectId: 113,
      name: "Human Activity Recognition Using AI",
      faculty: "Dr. Rohit Singh",
      facultyId: 13,
      branch: [Dept.DS, Dept.CS],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.0,
      description: "Developing an AI model to classify human activities using computer vision and sensor data. The project involves collecting motion capture data, training deep learning models, and optimizing recognition accuracy."
    },
    "Wind Turbine Performance Optimization": { 
      projectId: 114,
      name: "Wind Turbine Performance Optimization",
      faculty: "Dr. Meera Desai",
      facultyId: 14,
      branch: [Dept.ME, Dept.EE],
      degree: ["BTech"],
      year: [3, 4],
      cgpa: 7.5,
      description: "Optimizing wind turbine performance using data-driven algorithms for increased energy efficiency. The project includes real-time wind speed monitoring, dynamic blade angle adjustments, and predictive maintenance to enhance energy output."
    }
    };


  getAllProjects(): Project [] {
    return Object.keys(this.projectCriteria).map(project => this.projectCriteria[project]);
  }

  getEligibleProjects(student: Student): Project[] {
    return Object.keys(this.projectCriteria).filter(project => {
      const criteria = this.projectCriteria[project];
      return (
        criteria.branch.includes(student.branch) &&
        criteria.degree.includes(student.degree) &&
        criteria.year.includes(student.year) &&
        student.cgpa >= criteria.cgpa 
    );
    })
    .map(project => this.projectCriteria[project])
  }

  getAppliedProjects(): string[] {
    return ['Blockchain-Based Voting System','project2','project3']; // This should ideally come from user data
  }

  constructor() { }
}
