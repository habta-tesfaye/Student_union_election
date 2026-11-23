
import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { env } from "../config/environment.js";
import { connectDatabase } from "../config/database.js";

import {
  StudentAccount,
  StaffAccount,
} from "../modules/auth/auth.model.js";

async function seedTestAccounts(): Promise<void> {
  try {
    if (env.NODE_ENV !== "development") {
      throw new Error(
        "Test accounts can only be created in development mode."
      );
    }

    await connectDatabase();

    // Create or update the student test account.
    const studentPasswordHash = await bcrypt.hash(
      "Student@123",
      12
    );

    await StudentAccount.findOneAndUpdate(
      { studentId: "TEST001" },
      {
        $set: {
          studentId: "TEST001",
          firstName: "Test",
          middleName: "Student",
          lastName: "Account",
          department: "Computer Science",
          yearSection: "Year 3",
          password: studentPasswordHash,
          role: "student",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Create or update the system administrator.
    const adminPasswordHash = await bcrypt.hash(
      "Staff@123",
      12
    );

    await StaffAccount.findOneAndUpdate(
      { staffId: "TESTSTAFF001" },
      {
        $set: {
          staffId: "TESTSTAFF001",
          firstName: "Test",
          middleName: "Admin",
          lastName: "Account",
          password: adminPasswordHash,
          role: "admin",
          department: "University Administration",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Create or update the registrar.
    const registrarPasswordHash = await bcrypt.hash(
      "Registrar@123",
      12
    );

    await StaffAccount.findOneAndUpdate(
      { staffId: "TESTSTAFF002" },
      {
        $set: {
          staffId: "TESTSTAFF002",
          firstName: "Test",
          middleName: "Registrar",
          lastName: "Account",
          password: registrarPasswordHash,
          role: "registrar",
          department: "Academic Affairs",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Create or update the director / SSD.
    const directorPasswordHash = await bcrypt.hash(
      "Director@123",
      12
    );

    await StaffAccount.findOneAndUpdate(
      { staffId: "TESTSTAFF003" },
      {
        $set: {
          staffId: "TESTSTAFF003",
          firstName: "Test",
          middleName: "Director",
          lastName: "Account",
          password: directorPasswordHash,
          role: "director",
          department: "Student Union",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Create or update the department head.
    const headPasswordHash = await bcrypt.hash(
      "Head@123",
      12
    );

    await StaffAccount.findOneAndUpdate(
      { staffId: "TESTHEAD001" },
      {
        $set: {
          staffId: "TESTHEAD001",
          firstName: "Test",
          middleName: "Department",
          lastName: "Head",
          password: headPasswordHash,
          role: "head",
          department: "Computer Science",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log("\nAll five test accounts are ready!");
    console.log("--------------------------------");
    console.log("Student:          TEST001");
    console.log("Student password: Student@123");
    console.log("--------------------------------");
    console.log("Admin:        TESTSTAFF001    ");
    console.log("Admin password:   Staff@123");
    console.log("--------------------------------");
    console.log("Registrar:        TESTSTAFF002");
    console.log("Registrar password: Registrar@123");
    console.log("--------------------------------");
    console.log("Director / SSD:   TESTSTAFF003");
    console.log("Director password: Director@123");
    console.log("--------------------------------");
    console.log("Department Head:  TESTHEAD001");
    console.log("Head password:    Head@123");
    console.log("--------------------------------");
  } catch (error) {
    console.error("Failed to create test accounts:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedTestAccounts();
