import { useState } from "react";
import type { FormEvent } from "react";

import { useAuthContext } from "../../../context/AuthContext";

export default function LoginForm() {
  const { signIn, isLoading, isAuthenticated, user } = useAuthContext();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await signIn({
        identifier: identifier.trim(),
        password,
      });

      setSuccessMessage("You have signed in successfully.");
      setPassword("");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign-in failed. Please try again.";

      setErrorMessage(message);
    }
  }

  if (isAuthenticated && user) {
    const displayName = [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <section aria-live="polite">
        <h2>Welcome, {displayName || user.role}</h2>
        <p>You are signed in.</p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign in</h2>

      <div>
        <label htmlFor="login-identifier">Student or staff ID</label>
        <input
          id="login-identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="login-form__forgot">
        <a href="/forgot-password">Forgot password?</a>
      </div>

      {errorMessage && (
        <p role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p role="status" aria-live="polite">
          {successMessage}
        </p>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}