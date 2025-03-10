from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

STUDENT_FILE = "students.json"

# Load students from JSON file
def load_students():
    if not os.path.exists(STUDENT_FILE):  # If file doesn't exist, create an empty structure
        with open(STUDENT_FILE, "w") as file:
            json.dump({"students": []}, file, indent=4)
    with open(STUDENT_FILE, "r") as file:
        return json.load(file)

# Save students back to JSON
def save_students(data):
    with open(STUDENT_FILE, "w") as file:
        json.dump(data, file, indent=4)

# Get student details
@app.route("/student/<roll_number>", methods=["GET"])
def get_student(roll_number):
    students = load_students()["students"]
    student = next((s for s in students if s["roll"] == roll_number), None)
    
    if student:
        return jsonify(student)
    return jsonify({"message": "Student not found"}), 404

# Register a new student
@app.route("/register", methods=["POST"])
def register_student():
    new_student = request.json
    students_data = load_students()
    print("recierved student data", new_student)
    
    # Check if student already exists
    for student in students_data["students"]:
        if student["roll"] == new_student["roll"]:
            return jsonify({"message": "Student already registered"}), 400

    # Add student with all details
    student_entry = {
        "roll": new_student["roll"],
        "name": new_student["name"],
        "cgpa": new_student["cgpa"],
        "branch": new_student.get("branch", "Unknown"),
        "degree": new_student.get("degree", "Unknown"),
        "year": new_student.get("year", 0),
        # "semester": new_student.get("sem",0),
        "applied": []
    }
    students_data["students"].append(student_entry)
    save_students(students_data)
    
    print("student saved", student_entry)

    return jsonify({"message": "Student registered successfully!"}), 201

# # Apply for a project
@app.route("/apply", methods=["POST"])
def apply_project():
    
    data = request.json
    roll_number = data.get("roll")
    projectName = data.get("projectName")
    
    
    if not roll_number or not projectName:
        return jsonify({"message": "Missing roll number or project"}), 400

    students_data = load_students()
    student_found = False

    for student in students_data["students"]:
        if student["roll"] == roll_number:
            student_found = True

            
            if "applied" not in student:
                student["applied"] = []
                
            if projectName not in student["applied"]:
                student["applied"].append(projectName)
                save_students(students_data)
                print(f"Project '{projectName}' applied for {roll_number}")  
                
            else:
                print(f"Project '{projectName}' already applied for {roll_number}")  
                
            return jsonify(student["applied"]), 200

    if not student_found:
        print(f"Student {roll_number} not found!")  

        return jsonify({"message": "Student not found! Please register first."}), 404


# Remove a project
@app.route("/remove", methods=["POST"])
def remove_project():

    
    data = request.json
    roll_number = data.get("roll")
    projectName = data.get("projectName")


    
    if not roll_number or not projectName:
        return jsonify({"message": "Missing roll number or project"}), 400

    students_data = load_students()
    student_found = False

    for student in students_data["students"]:
        if student["roll"] == roll_number:
            student_found = True

            


            if "applied" not in student:
                student["applied"] = []
                
            if projectName in student["applied"]:
                student["applied"].remove(projectName)
                save_students(students_data)

                print(f"Removed project '{projectName}' for {roll_number}") 
            else:
                print(f"Project '{projectName}' not found in applied list!")  

            return jsonify(student["applied"]), 200

    if not student_found:
        print(f"Student {roll_number} not found!")  


        return jsonify({"message": "Student not found!"}), 404



if __name__ == "__main__":
    app.run(debug=True)






