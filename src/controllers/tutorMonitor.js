import { AttendanceModel } from "../models/ParticipationModel.js";

// Normalize to 00:00:00 (same convention as your `date` field)
const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const monitorAllTutors = async (req, res) => {
  try {
    const { from, to } = req.query; // optional ?from=2026-09-01&to=2026-09-30
    const today = startOfDay();

    const match = {};
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = startOfDay(from);
      if (to) match.date.$lte = startOfDay(to);
    }

    const stats = await AttendanceModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$tutor",
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          todayRecords: { $sum: { $cond: [{ $eq: ["$date", today] }, 1, 0] } },
          todayPresent: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$date", today] }, { $in: ["$status", ["present", "late"]] }] },
                1,
                0,
              ],
            },
          },
          uniqueStudents: { $addToSet: "$student" },
          lastActivity: { $max: "$checkInTime" },
        },
      },
      {
        $lookup: {
          from: "tutors", // mongoose pluralizes model "tutor" -> "tutors"
          localField: "_id",
          foreignField: "_id",
          as: "tutor",
        },
      },
      { $unwind: "$tutor" },
      {
        $project: {
          _id: 0,
          tutorId: "$tutor._id",
          name: "$tutor.name",
          email: "$tutor.email",
          profession: "$tutor.profession",
          totalRecords: 1,
          present: 1,
          late: 1,
          absent: 1,
          pending: 1,
          todayRecords: 1,
          todayPresent: 1,
          studentCount: { $size: "$uniqueStudents" },
          lastActivity: 1,
          attendanceRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$present", "$late"] },
                      { $max: [{ $subtract: ["$totalRecords", "$pending"] }, 1] },
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ success: true, count: stats.length, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Drill-down: one tutor's records, newest first
export const monitorOneTutor = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const records = await AttendanceModel.find({ tutor: tutorId })
      .populate("student", "name email")
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};