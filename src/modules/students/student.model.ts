/**
 * Student Management Module
 *
 * Reuses the existing student account model
 * from the authentication module.
 */

import {
  StudentAccount,
} from "../auth/auth.model.js";

export {
  StudentAccount,
};

export type {
  StudentAccountDocument,
} from "../auth/auth.model.js";