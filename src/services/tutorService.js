import mongoose from "mongoose";
import crypto from "crypto";
import TutorModel from "../models/TutorModel.js";
import UserModel from "../models/UserModel.js";
import { tutorWelcomeEmailTemplate } from "../utils/emailTemplates/tutorWelcomeEmail.js";
import { ENV } from "../libs/environments.js";
import { sendMail } from "../config/mailer.js";

function toPlainTutor(t) {
  return {
    id: t._id.toString(),
    name: t.name,
    email: t.email,
    profession: t.profession,
    bio: t.bio,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function generateTempPassword() {
  // 12 random bytes -> 16 char base64url string, meets the 8-char minlength easily
  return crypto.randomBytes(12).toString("base64url");
}

export async function listAllTutors() {
  const tutors = await TutorModel.find().sort({ createdAt: -1 });
  return tutors.map(toPlainTutor);
}

export async function getTutorById(id) {
  const tutor = await TutorModel.findById(id);
  return tutor ? toPlainTutor(tutor) : null;
}

export async function createTutor({ name, email, profession, bio }) {
  const normalizedEmail = email?.toLowerCase().trim();

  const [existingTutor, existingUser] = await Promise.all([
    TutorModel.findOne({ email: normalizedEmail }),
    UserModel.findOne({ email: normalizedEmail }),
  ]);

  if (existingTutor || existingUser) return "duplicate_email";

  const tempPassword = generateTempPassword();

  const session = await mongoose.startSession();

  let tutorDoc;

  try {
    await session.withTransaction(async () => {
      const [tutor] = await TutorModel.create(
        [
          {
            name,
            email: normalizedEmail,
            profession,
            bio,
          },
        ],
        { session },
      );

      await UserModel.create(
        [
          {
            name,
            email: normalizedEmail,
            password: tempPassword,
            role: "tutor",
          },
        ],
        { session },
      );

      tutorDoc = tutor;
    });
  } catch (err) {
    if (err.code === 11000) return "duplicate_email";
    throw err;
  } finally {
    session.endSession();
  }

  try {
    const { subject, html, text } = tutorWelcomeEmailTemplate({
      name,
      email: normalizedEmail,
      tempPassword,
      loginUrl: `${ENV.frontend}/sign-in`,
    });

    await sendMail({ to: normalizedEmail, subject, html, text });
  } catch (mailErr) {
    console.error(
      `Failed to send welcome email to ${normalizedEmail}:`,
      mailErr.message,
    );
  }

  return { tutor: toPlainTutor(tutorDoc) };
}

export async function updateTutor(id, updates) {
  const allowed = ["name", "email", "profession", "bio"];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }

  if (payload.email) {
    payload.email = payload.email.toLowerCase().trim();
    const [existingTutor, existingUser] = await Promise.all([
      TutorModel.findOne({ email: payload.email, _id: { $ne: id } }),
      UserModel.findOne({ email: payload.email }),
    ]);
    if (existingTutor || existingUser) return "duplicate_email";
  }

  const session = await mongoose.startSession();
  try {
    let tutorDoc;

    await session.withTransaction(async () => {
      const existingTutorDoc = await TutorModel.findById(id, null, { session });
      if (!existingTutorDoc) return;

      const originalEmail = existingTutorDoc.email;

      tutorDoc = await TutorModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
        session,
      });

      if (tutorDoc && (payload.name || payload.email)) {
        const userUpdates = {};
        if (payload.name) userUpdates.name = payload.name;
        if (payload.email) userUpdates.email = payload.email;

        const updatedUser = await UserModel.findOneAndUpdate(
          { email: originalEmail, role: "tutor" },
          userUpdates,
          { session, new: true },
        );

        if (!updatedUser) {
          throw new Error(
            `No matching User account found for tutor ${id} (email: ${originalEmail}) during update.`,
          );
        }
      }
    });

    return tutorDoc ? toPlainTutor(tutorDoc) : null;
  } finally {
    session.endSession();
  }
}

export async function deleteTutor(id) {
  const session = await mongoose.startSession();
  try {
    let tutorDoc;

    await session.withTransaction(async () => {
      tutorDoc = await TutorModel.findByIdAndDelete(id, { session });
      if (tutorDoc) {
        await UserModel.deleteOne(
          { email: tutorDoc.email, role: "tutor" },
          { session },
        );
      }
    });

    return tutorDoc ? toPlainTutor(tutorDoc) : null;
  } finally {
    session.endSession();
  }
}

export async function resendTutorPassword(id) {
  const tutor = await TutorModel.findById(id);

  if (!tutor) return null;

  const tempPassword = generateTempPassword();

  const user = await UserModel.findOne({ email: tutor.email, role: "tutor" });

  if (!user) {
    throw new Error(
      `No matching User account found for tutor ${id} (email: ${tutor.email}).`,
    );
  }

  user.password = tempPassword;
  await user.save();

  await sendMail({ to: tutor.email, subject, html, text });

  return toPlainTutor(tutor);
}

// change password

export async function changeOwnPassword(id, { currentPassword, newPassword }) {
  const user = await UserModel.findById(id).select("+password");

  if (!user) return "not_found";

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) return "invalid_current_password";

  if (currentPassword === newPassword) return "same_password";

  user.password = newPassword;
  await user.save();

  return "ok";
}

// change password
