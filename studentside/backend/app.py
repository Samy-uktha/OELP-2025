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
    student = next((s for s in students if s["rollNumber"] == roll_number), None)
    
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
        if student["rollNumber"] == new_student["roll"]:
            return jsonify({"message": "Student already registered"}), 400

    # Add student with all details
    student_entry = {
        "rollNumber": new_student["roll"],
        "name": new_student["name"],
        "cgpa": new_student["cgpa"],
        "branch": new_student.get("branch", "Unknown"),
        "degree": new_student.get("degree", "Unknown"),
        "year": new_student.get("year", 0),
        # "semester": new_student.get("sem",0),
        "applied_projects": []
    }
    students_data["students"].append(student_entry)
    save_students(students_data)
    
    print("student saved", student_entry)

    return jsonify({"message": "Student registered successfully!"}), 201

# # Apply for a project
# @app.route("/apply", methods=["POST"])
# def apply_project():
#     data = request.json
#     roll_number = data["rollNumber"]
#     project = data["project"]

#     students_data = load_students()

#     for student in students_data["students"]:
#         if student["rollNumber"] == roll_number:
#             if project not in student["applied_projects"]:
#                 student["applied_projects"].append(project)
#                 save_students(students_data)
#                 return jsonify({"message": "Project applied successfully!"}), 200
#             else:
#                 return jsonify({"message": "Project already applied!"}), 400

#     return jsonify({"message": "Student not found! Please register first."}), 404

if __name__ == "__main__":
    app.run(debug=True)






