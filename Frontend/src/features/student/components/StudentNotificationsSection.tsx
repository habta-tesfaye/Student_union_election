interface StudentNotification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
}

interface StudentNotificationsSectionProps {
  notifications: StudentNotification[];
  onRefresh: () => void;
  formatDate: (value?: string) => string;
}

function StudentNotificationsSection({
  notifications,
  onRefresh,
  formatDate,
}: StudentNotificationsSectionProps) {
  return (
    <section className="student-panel student-notifications-panel">
      <div className="student-panel-heading">
        <div>
          <p className="student-panel-kicker">Updates</p>
          <h2>Recent notifications</h2>
        </div>

        <button
          className="student-refresh-button"
          type="button"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="student-empty-state">
          You have no notifications to display.
        </p>
      ) : (
        <ul className="student-notification-list">
          {notifications.map((notification) => (
            <li
              key={
                notification._id ??
                notification.id ??
                `${notification.title}-${notification.createdAt}`
              }
              className={
                notification.isRead
                  ? "student-notification"
                  : "student-notification student-notification-unread"
              }
            >
              <div className="student-notification-title">
                <strong>{notification.title}</strong>

                {!notification.isRead && (
                  <span className="student-unread-label">
                    Unread
                  </span>
                )}
              </div>

              <p>{notification.message}</p>

              <span className="student-notification-date">
                {formatDate(notification.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default StudentNotificationsSection;
