'use client';

export default function ClassificationBadge({ classification }) {
  const MAP = {
    AUTO:           { cls: 'badge-auto',     label: 'Auto',           icon: '⚡' },
    NEEDS_APPROVAL: { cls: 'badge-approval', label: 'Needs Approval', icon: '⚠️' },
    BLOCKED:        { cls: 'badge-blocked',  label: 'Blocked',        icon: '🚫' },
  };
  const item = MAP[classification] || MAP['AUTO'];
  return (
    <span className={`badge ${item.cls}`}>
      {item.icon} {item.label}
    </span>
  );
}
