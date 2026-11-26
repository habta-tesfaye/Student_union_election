import "./ContactPage.css";

export default function ContactPage() {
  return (
    <main className="contact-page">
      <header className="contact-header">
        <a className="contact-brand" href="/">
          DMU Bure Campus
        </a>

        <nav className="contact-nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a className="active" href="/contact">
            Contact
          </a>
          <a className="contact-sign-in" href="/login">
            Sign in
          </a>
        </nav>
      </header>

      <section className="contact-content">
        <div className="contact-heading">
          <p className="contact-eyebrow">Contact</p>
          <h1>Get in touch</h1>
          <p className="contact-intro">
            Have a question or need assistance with the Student Union Election
            System? Reach us by phone or email.
          </p>
        </div>

        <div className="contact-cards">
          <article className="contact-card">
            <div className="contact-icon" aria-hidden="true">
              ☎
            </div>
            <h2>Phone</h2>
            <p>Call us for assistance.</p>
            <a href="tel:0930612566">0930612566</a>
          </article>

          <article className="contact-card">
            <div className="contact-icon" aria-hidden="true">
              ✉
            </div>
            <h2>Email</h2>
            <p>Send us your questions or feedback.</p>
            <a href="mailto:abebawtesfaye26@gmail.com">
              abebawtesfaye26@gmail.com
            </a>
          </article>
        </div>

        <a className="contact-back" href="/">
          ← Back to home
        </a>
      </section>

      <footer className="contact-footer">
        © {new Date().getFullYear()} Debre Markos University, Bure Campus
        <br />
        Student Union Election System
      </footer>
    </main>
  );
}