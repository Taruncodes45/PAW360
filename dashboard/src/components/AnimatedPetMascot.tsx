import React from 'react';

interface AnimatedPetMascotProps {
  activityState?: 'resting' | 'walking' | 'running' | 'scratching' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AnimatedPetMascot: React.FC<AnimatedPetMascotProps> = ({
  activityState = 'resting',
  size = 'md',
  showLabel = true,
}) => {
  const normalizedState = activityState?.toLowerCase() || 'resting';

  const config = {
    running: {
      emoji: '🐕‍🦺',
      badge: 'Zoomies / Running! 💨',
      color: '#EA580C',
      bg: '#FFEDD5',
      animationClass: 'mascot-running',
      subtext: 'High energy active state',
    },
    walking: {
      emoji: '🐕',
      badge: 'Strolling / Walking 🐾',
      color: '#059669',
      bg: '#D1FAE5',
      animationClass: 'mascot-walking',
      subtext: 'Exploring comfortably',
    },
    scratching: {
      emoji: '🐶',
      badge: 'Shaking / Scratching ⚡',
      color: '#D97706',
      bg: '#FEF3C7',
      animationClass: 'mascot-scratching',
      subtext: 'Quick shaking movement',
    },
    resting: {
      emoji: '🐶',
      badge: 'Cozy Rest / Sleeping 💤',
      color: '#6366F1',
      bg: '#E0E7FF',
      animationClass: 'mascot-resting',
      subtext: 'Recharging energy',
    },
  }[normalizedState] || {
    emoji: '🐶',
    badge: 'Relaxing 🐾',
    color: '#0D9488',
    bg: '#CCFBF1',
    animationClass: 'mascot-resting',
    subtext: 'Collar connected',
  };

  const sizeDimensions = {
    sm: { avatar: 48, font: 24 },
    md: { avatar: 72, font: 38 },
    lg: { avatar: 96, font: 52 },
  }[size];

  return (
    <div className="pet-mascot-wrapper">
      <div
        className={`pet-mascot-avatar ${config.animationClass}`}
        style={{
          width: sizeDimensions.avatar,
          height: sizeDimensions.avatar,
          background: config.bg,
          borderColor: config.color,
        }}
      >
        <span style={{ fontSize: sizeDimensions.font }} role="img" aria-label="Pet">
          {config.emoji}
        </span>
        {normalizedState === 'resting' && <span className="sleep-bubble">Zzz</span>}
        {normalizedState === 'running' && <span className="dash-wind">💨</span>}
        {normalizedState === 'walking' && <span className="walk-paw">🐾</span>}
      </div>

      {showLabel && (
        <div className="pet-mascot-info">
          <span
            className="pet-status-pill"
            style={{ color: config.color, background: config.bg, borderColor: config.color }}
          >
            {config.badge}
          </span>
          <span className="pet-subtext">{config.subtext}</span>
        </div>
      )}
    </div>
  );
};

export default AnimatedPetMascot;
