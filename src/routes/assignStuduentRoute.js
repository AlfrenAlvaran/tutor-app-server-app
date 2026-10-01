import express from "express";
import * as assignStudentController from "../controllers/AssignstudentController.js";

const AssignStudentRouter = express.Router();

AssignStudentRouter.get("/assignable", assignStudentController.getAssignableStudents);
AssignStudentRouter.get("/students/all", assignStudentController.getAllStudents);

AssignStudentRouter.get("/student/:studentId", assignStudentController.getAssignmentsByStudent);
AssignStudentRouter.get("/teacher/:teacherId", assignStudentController.getAssignmentsByTeacher);

AssignStudentRouter.post("/", assignStudentController.assignStudent);
AssignStudentRouter.get("/", assignStudentController.getAllAssignments);
AssignStudentRouter.get("/:id", assignStudentController.getAssignmentById);
AssignStudentRouter.patch("/:id", assignStudentController.reassignStudent);
AssignStudentRouter.delete("/:id", assignStudentController.unassignStudent);

export default AssignStudentRouter;