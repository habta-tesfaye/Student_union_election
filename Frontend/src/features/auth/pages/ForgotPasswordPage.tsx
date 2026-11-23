import "../../../App.css";

export default function ForgotPasswordPage() {
  return (
    <main className="login-page">
      <header className="login-page__header">
        <div className="login-page__brand">
          <div className="login-page__logo" aria-hidden="true">
            DMU
          </div>

          <div>
            <h1>Debre Markos University</h1>
            <p>Bure Campus</p>
          </div>
        </div>
      </header>

      <section className="login-page__content">
        <div className="login-page__intro">
          <p className="login-page__eyebrow">Account assistance</p>
          <h2>Forgot your password?</h2>
          <p>
            Online password reset is not available yet. Please contact your
            system administrator for help accessing your account.
          </p>
        </div>

        <div className="login-page__form">
          <h2>Password assistance</h2>
          <p>
            For account security, do not share your password with anyone.
            The administrator can help you regain access through the approved
            account-management process.
          </p>

          <a className="welcome-login-link" href="/login">
            Return to sign in
          </a>
        </div>
      </section>

      <footer className="login-page__footer">
        © {new Date().getFullYear()} Debre Markos University, Bure Campus
      </footer>
    </main>
  );
}