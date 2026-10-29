import { FaCar, FaStar, FaHistory, FaEllipsisV } from 'react-icons/fa';

export default function StatsCards({ stats, totalVehicles }) {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-icon-wrapper">
          <FaCar />
        </div>
        <div className="stat-details">
          <span className="stat-label">Available Cars</span>
          <span className="stat-value">{stats?.availableCars ?? totalVehicles ?? 56}</span>
        </div>
        <button className="stat-menu-btn" title="Options">
          <FaEllipsisV />
        </button>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper">
          <FaStar />
        </div>
        <div className="stat-details">
          <span className="stat-label">Average Rating</span>
          <span className="stat-value">{stats?.avgRating ? `${stats.avgRating}/5` : '4.8/5'}</span>
        </div>
        <button className="stat-menu-btn" title="Options">
          <FaEllipsisV />
        </button>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper">
          <FaHistory />
        </div>
        <div className="stat-details">
          <span className="stat-label">Happy Customers</span>
          <span className="stat-value">{stats?.happyCustomers || '2.4K+'}</span>
        </div>
        <button className="stat-menu-btn" title="Options">
          <FaEllipsisV />
        </button>
      </div>
    </div>
  );
}
