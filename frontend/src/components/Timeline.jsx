import RecordCard from './RecordCard.jsx';

export default function Timeline({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="timeline">
      {items.map((item, idx) => {
        const type = item.timelineType === 'document' ? 'document' : (item.type || 'other');
        const date = item.date || item.createdAt || item.uploadedAt;

        return (
          <div
            key={item._id || idx}
            className="timeline-item"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className={`timeline-dot ${type}`}></div>
            <RecordCard item={item} type={type} date={date} />
          </div>
        );
      })}
    </div>
  );
}
