// check-students.js — put at your backend project root
import mongoose from "mongoose";
import { StudentModel } from "../src/models/StudentModel.js";
import { Assignment } from "../src/models/ScheduleModel.js";
import { connect, disconnection } from "../src/libs/database.js";

await connect();

const students = await StudentModel.find({}, "_id name status").limit(10);
console.log(`\nFound ${students.length} student(s):`);
for (const s of students) {
  const assignment = await Assignment.findOne({ student: s._id, status: "active" });
  console.log(`  _id: ${s._id}  name: ${s.name}  enrollmentStatus: ${s.status}  hasActiveAssignment: ${!!assignment}`);
}

await disconnection();
process.exit(0);