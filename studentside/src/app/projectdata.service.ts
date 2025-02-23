import { Injectable } from '@angular/core';
import { Project, Dept, Student } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectdataService {  
  private projectCriteria: { 
    [key: string]: Project } = {
      "AI-Powered Chatbot": { 
        name: "AI-Powered Chatbot",
        professor: "Dr. Rajesh Kumar",
        branch: [Dept.CS, Dept.DS],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.0,
        description: "An AI-based chatbot capable of handling real-time user queries using NLP and machine learning techniques. The chatbot will be trained on a dataset of frequently asked questions and use deep learning models for sentiment analysis and intelligent response generation. The project involves developing a frontend interface, integrating a backend AI model, and optimizing response accuracy."
      },
      "Blockchain-Based Voting System": { 
        name: "Blockchain-Based Voting System",
        professor: "Dr. Anjali Mehta",
        branch: [Dept.CS, Dept.DS],
        degree: ["BTech", "MTech"],
        year: [2, 3, 4],
        cgpa: 6.5,
        description: "A decentralized voting system using blockchain to ensure secure and tamper-proof elections. This project involves developing a smart contract using Ethereum, a web interface for voter authentication, and an encrypted digital ledger to prevent voting fraud. The system will be tested on a simulated election scenario for efficiency and reliability."
      },
      "IoT-Based Smart Home Automation": { 
        name: "IoT-Based Smart Home Automation",
        professor: "Dr. Arvind Sharma",
        branch: [Dept.EE],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.5,
        description: "A smart home automation system that uses IoT devices to control appliances remotely. The project involves designing a network of sensors and actuators to monitor and automate household appliances. Features include voice command integration, real-time energy monitoring, and mobile app connectivity."
      },
      "Autonomous Vehicle Design": { 
        name: "Autonomous Vehicle Design",
        professor: "Dr. Manish Patel",
        branch: [Dept.ME],
        degree: ["BTech"],
        year: [4],
        cgpa: 7.0,
        description: "A self-driving vehicle prototype with obstacle detection and autonomous navigation. This project focuses on integrating computer vision, LiDAR sensors, and AI-based path planning algorithms. The final design will be tested in a controlled environment for object avoidance and lane detection."
      },
      "Sustainable Concrete Using Recycled Materials": { 
        name: "Sustainable Concrete Using Recycled Materials",
        professor: "Dr. Sneha Verma",
        branch: [Dept.CE],
        degree: ["BTech"],
        year: [3],
        cgpa: 7.0,
        description: "An innovative approach to sustainable construction by incorporating recycled materials in concrete. The project aims to evaluate the structural integrity and environmental benefits of using industrial byproducts such as fly ash, silica fume, and crushed glass in concrete mixes."
      },
      "Energy-Efficient Smart Grid System": { 
        name: "Energy-Efficient Smart Grid System",
        professor: "Dr. Sandeep Mishra",
        branch: [Dept.EE],
        degree: ["BTech", "MTech"],
        year: [3, 4],
        cgpa: 7.2,
        description: "A smart grid system that enhances energy efficiency and optimizes electricity distribution using AI algorithms. This project involves demand-response modeling, renewable energy integration, and predictive maintenance using IoT sensors to improve power distribution efficiency."
      },
      "Deep Learning for Medical Image Analysis": { 
        name: "Deep Learning for Medical Image Analysis",
        professor: "Dr. Neha Kapoor",
        branch: [Dept.DS, Dept.CS],
        degree: ["BTech", "MTech"],
        year: [3, 4],
        cgpa: 7.5,
        description: "Using deep learning techniques to analyze and diagnose diseases from medical imaging datasets. The project involves training convolutional neural networks (CNNs) on MRI and CT scan data to automate disease classification with high accuracy."
      },
      "3D Printing for Structural Engineering": { 
        name: "3D Printing for Structural Engineering",
        professor: "Dr. Amit Joshi",
        branch: [Dept.CE, Dept.ME],
        degree: ["BTech"],
        year: [4],
        cgpa: 7.0,
        description: "Exploring the applications of 3D printing in structural engineering for sustainable and cost-effective construction. The project includes developing optimized printing techniques for concrete structures, evaluating material properties, and analyzing structural stability."
      },
      "AI-Based Predictive Maintenance for Machines": { 
        name: "AI-Based Predictive Maintenance for Machines",
        professor: "Dr. Ramesh Gupta",
        branch: [Dept.ME, Dept.EE],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.3,
        description: "Developing an AI-based system for predictive maintenance to reduce machine downtime and increase efficiency. The project includes data collection from industrial sensors, building machine learning models for failure prediction, and integrating real-time monitoring systems."
      },
      "Cybersecurity Threat Detection Using Machine Learning": { 
        name: "Cybersecurity Threat Detection Using Machine Learning",
        professor: "Dr. Preeti Sharma",
        branch: [Dept.CS, Dept.DS],
        degree: ["BTech", "MTech"],
        year: [2, 3, 4],
        cgpa: 7.0,
        description: "Leveraging machine learning to identify and mitigate cybersecurity threats in real-time. The project focuses on intrusion detection systems, anomaly detection using neural networks, and proactive threat mitigation strategies."
      },
      "Smart Traffic Management System": { 
        name: "Smart Traffic Management System",
        professor: "Dr. Vinod Bhatia",
        branch: [Dept.CS, Dept.EE],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.4,
        description: "A smart traffic management system that optimizes traffic flow using AI and IoT-based sensors. The project involves vehicle counting, congestion prediction, and dynamic traffic signal adjustments based on real-time data."
      },
      "Structural Health Monitoring Using IoT": { 
        name: "Structural Health Monitoring Using IoT",
        professor: "Dr. Pooja Malhotra",
        branch: [Dept.CE, Dept.EE],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.2,
        description: "Using IoT-enabled sensors to monitor and predict the structural health of buildings and bridges. The system will collect vibration, temperature, and stress data to detect early signs of structural failure."
      },
      "Human Activity Recognition Using AI": { 
        name: "Human Activity Recognition Using AI",
        professor: "Dr. Rohit Singh",
        branch: [Dept.DS, Dept.CS],
        degree: ["BTech"],
        year: [3, 4],
        cgpa: 7.0,
        description: "Developing an AI model to classify human activities using computer vision and sensor data. The project involves collecting motion capture data, training deep learning models, and optimizing recognition accuracy."
      },
      "Wind Turbine Performance Optimization": { 
        name: "Wind Turbine Performance Optimization",
        professor: "Dr. Meera Desai",
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
