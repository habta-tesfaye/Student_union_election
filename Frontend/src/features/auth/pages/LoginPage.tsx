import LoginForm from "../components/LoginForm";

export default function LoginPage() {
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
          <p className="login-page__eyebrow">Bure Campus</p>
          <h2>Student Union Election System</h2>
          <p>
            Sign in with your student or staff account to access the election
            system.
          </p>
        </div>

        <div className="login-page__form">
          <LoginForm />
        </div>
      </section>

      <footer className="login-page__footer">
        © {new Date().getFullYear()} Debre Markos University, Bure Campus
      </footer>
    </main>
  );
}