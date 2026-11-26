import "./App.css";

import { useEffect, useState } from "react";
import { useAuthContext } from "./context/AuthContext";

// Dashboard pages
import StudentDashboardPage from "./features/student/pages/StudentDashboardPage";
import CandidateDashboardPage from "./features/candidates/pages/CandidateDashboardPage";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import RegistrarDashboardPage from "./features/registrar/pages/RegistrarDashboardPage";
import DirectorDashboardPage from "./features/director/pages/DirectorDashboardPage";
import HeadDashboardPage from "./features/head/pages/HeadDashboardPage";

// Public information pages
import ContactPage from "./features/contact/pages/ContactPage";

// Authentication pages
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import LoginPage from "./features/auth/pages/LoginPage";

// Supports both local development and the GitHub Pages subpath.
const withBase = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const slides = [
  {
    image: withBase("/images/campus.jpg"),
    alt: "Debre Markos University Bure Campus",
    title: "Welcome to DMU Bure Campus",
    subtitle: "A connected campus. A stronger student voice.",
  },
  {
    image: withBase("/images/students.jpg"),
    alt: "University students",
    title: "Your Campus. Your Community.",
    subtitle: "Take part in shaping your student union.",
  },
  {
    image: withBase("/images/election.jpg"),
    alt: "Student union election",
    title: "Your Voice, Your Vote",
    subtitle: "A transparent digital experience for student elections.",
  },
];

function PublicHeader() {
  return (
    <header className="home-header">
      <a
        className="home-brand"
        href={withBase("/")}
        aria-label="DMU Bure Campus home"
      >
        <span className="home-logo">DMU</span>

        <span className="home-brand-text">
          <strong>Debre Markos University</strong>
          <span>Bure Campus</span>
        </span>
      </a>

      <nav className="home-nav" aria-label="Main navigation">
        <a href={withBase("/")}>Home</a>
        <a href={withBase("/about")}>About</a>
        <a href={withBase("/contact")}>Contact</a>
        <a className="home-nav-login" href={withBase("/login")}>
          Sign in
        </a>
      </nav>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="home-footer">
      <span>
        © {new Date().getFullYear()} Debre Markos University, Bure Campus
      </span>
      <span>Student Union Election System</span>
    </footer>
  );
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="home-page">
      <PublicHeader />

      <section className="home-hero" aria-label="Welcome">
        {slides.map((slide, index) => (
          <img
            key={slide.image}
            className={`home-hero-image ${
              index === activeSlide ? "is-active" : ""
            }`}
            src={slide.image}
            alt={slide.alt}
            aria-hidden={index !== activeSlide}
          />
        ))}

        <div className="home-hero-shade" />

        <div className="home-hero-content">
          <p className="home-eyebrow">
            Debre Markos University · Bure Campus
          </p>

          <h1>
            Student Union
            <br />
            Election System
          </h1>

          <p className="home-hero-description">
            A centralized digital platform for student union elections,
            candidate nominations, voting, examinations, campaigns, and results.
          </p>

          <div className="home-hero-actions">
            <a
              className="home-button home-button-primary"
              href={withBase("/login")}
            >
              Sign in to the system
              <span aria-hidden="true">→</span>
            </a>

            <a
              className="home-button home-button-secondary"
              href="#platform"
            >
              Explore the platform
            </a>
          </div>

          <div className="home-hero-caption">
            <div>
              <strong>{slides[activeSlide].title}</strong>
              <span>{slides[activeSlide].subtitle}</span>
            </div>

            <div className="home-slider-controls" aria-label="Image controls">
              <button
                type="button"
                className="home-slider-arrow"
                aria-label="Previous image"
                onClick={() =>
                  setActiveSlide(
                    (current) =>
                      (current - 1 + slides.length) % slides.length
                  )
                }
              >
                ‹
              </button>

              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  className={`home-slider-dot ${
                    index === activeSlide ? "is-active" : ""
                  }`}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === activeSlide}
                  onClick={() => setActiveSlide(index)}
                />
              ))}

              <button
                type="button"
                className="home-slider-arrow"
                aria-label="Next image"
                onClick={() =>
                  setActiveSlide((current) => (current + 1) % slides.length)
                }
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <a className="home-scroll-hint" href="#platform">
          <span>Scroll to explore</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="home-platform" id="platform">
        <div className="home-section-heading">
          <p className="home-section-eyebrow">One digital platform</p>
          <h2>Election management, made clear.</h2>
          <p>
            Access the tools and information needed throughout the student
            union election process.
          </p>
        </div>

        <div className="home-feature-grid">
          <article className="home-feature-card">
            <span className="home-feature-number">01</span>
            <h3>Candidate nominations</h3>
            <p>
              Support the nomination and review process for student union
              candidates.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="home-feature-number">02</span>
            <h3>Voting and elections</h3>
            <p>
              Provide a centralized place for eligible voters to participate
              in elections.
            </p>
          </article>

          <article className="home-feature-card">
            <span className="home-feature-number">03</span>
            <h3>Results and updates</h3>
            <p>
              Keep election information, announcements, and results together.
            </p>
          </article>
        </div>

        <div className="home-platform-cta">
          <div>
            <h2>Ready to access the system?</h2>
            <p>Sign in using your student or staff account.</p>
          </div>

          <a
            className="home-button home-button-primary"
            href={withBase("/login")}
          >
            Go to sign in
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function AboutPage() {
  return (
    <main className="public-info-page">
      <PublicHeader />

      <section className="public-info-content">
        <p className="home-section-eyebrow">About the system</p>
        <h1>Student Union Election System</h1>

        <p>
          The DMU Bure Campus Student Union Election System provides a
          centralized digital platform for student union election activities,
          including candidate nominations, voting, examinations, campaigns,
          and election results.
        </p>

        <p>
          The system supports the university and campus roles involved in
          managing and participating in the student union election process.
        </p>

        <a
          className="home-button home-button-primary"
          href={withBase("/login")}
        >
          Sign in to the system
          <span aria-hidden="true">→</span>
        </a>
      </section>

      <PublicFooter />
    </main>
  );
}

function App() {
  const { user, isAuthenticated, signOut } = useAuthContext();

  // Remove Vite's configured base path so the app can match its internal routes.
  const basePath = import.meta.env.BASE_URL;
  const pathname = window.location.pathname;

  const currentPath = pathname.startsWith(basePath)
    ? `/${pathname.slice(basePath.length)}`
    : pathname;

  // Authenticated user dashboards
  if (isAuthenticated && user) {
    switch (user.role) {
      case "admin":
        return <AdminDashboardPage />;

      case "student":
        return <StudentDashboardPage />;

      case "candidate":
        return <CandidateDashboardPage />;

      case "registrar":
        return <RegistrarDashboardPage />;

      case "director":
        return <DirectorDashboardPage />;

      case "head":
        return <HeadDashboardPage />;

      default: {
        const displayName = [
          user.firstName,
          user.middleName,
          user.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <main className="app">
            <header className="app-header">
              <div className="app-brand">
                <div className="app-logo">DMU</div>

                <div className="app-brand-text">
                  <h1>Debre Markos University</h1>
                  <p>Bure Campus</p>
                </div>
              </div>

              <span className="app-system-label">
                Student Union Election System
              </span>
            </header>

            <section className="welcome-section">
              <div className="welcome-content">
                <span className="welcome-badge">{user.role}</span>

                <h2>Welcome, {displayName || "User"}</h2>

                <p className="welcome-description">
                  You have signed in successfully. Your dashboard will be
                  available according to your assigned role.
                </p>

                <button
                  className="welcome-login-link"
                  type="button"
                  onClick={() => void signOut()}
                >
                  Sign out
                </button>
              </div>
            </section>

            <footer className="app-footer">
              <p>
                © {new Date().getFullYear()} Debre Markos University, Bure
                Campus. Student Union Election System.
              </p>
            </footer>
          </main>
        );
      }
    }
  }

  // Public authentication and information pages
  if (currentPath === "/login") {
    return <LoginPage />;
  }

  if (currentPath === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  if (currentPath === "/contact") {
    return <ContactPage />;
  }

  if (currentPath === "/about") {
    return <AboutPage />;
  }

  // Public homepage
  return <HomePage />;
}

export default App;