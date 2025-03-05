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
    data = request.json
    roll_number = data["rollNumber"]
    name = data["name"]
    cgpa = data["cgpa"]

    students_data = load_students()

    # Check if student already exists
    existing_student = next((s for s in students_data["students"] if s["rollNumber"] == roll_number), None)
    if existing_student:
        return jsonify({"message": "Student already exists!"}), 400

    # Add new student
    new_student = {
        "rollNumber": roll_number,
        "name": name,
        "cgpa": cgpa,
        "applied_projects": []
    }
    students_data["students"].append(new_student)
    save_students(students_data)

    return jsonify({"message": "Student registered successfully!"}), 201

# Apply for a project
@app.route("/apply", methods=["POST"])
def apply_project():
    data = request.json
    roll_number = data["rollNumber"]
    project = data["project"]

    students_data = load_students()

    for student in students_data["students"]:
        if student["rollNumber"] == roll_number:
            if project not in student["applied_projects"]:
                student["applied_projects"].append(project)
                save_students(students_data)
                return jsonify({"message": "Project applied successfully!"}), 200
            else:
                return jsonify({"message": "Project already applied!"}), 400

    return jsonify({"message": "Student not found! Please register first."}), 404

if __name__ == "__main__":
    app.run(debug=True)
