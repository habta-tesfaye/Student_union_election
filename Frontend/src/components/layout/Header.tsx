
import "./Header.css";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="director-header">
      <div className="director-header-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="director-header-right">
        <div className="director-header-campus">
          <span className="director-header-campus-name">
            Debre Markos University
          </span>
          <span className="director-header-campus-location">
            Bure Campus
          </span>
        </div>

        <div className="director-header-avatar" title="Director">
          D
        </div>
      </div>
    </header>
  );
}

export default Header;
