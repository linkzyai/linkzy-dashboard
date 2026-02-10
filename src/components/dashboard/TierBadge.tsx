import React from "react";

interface TierBadgeProps {
  tier: "bronze" | "silver" | "gold";
  size?: "sm" | "md" | "lg";
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = "md" }) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const tierConfig = {
    bronze: {
      emoji: "🥉",
      label: "Bronze",
      bgColor: "bg-amber-900/20",
      textColor: "text-amber-600",
      borderColor: "border-amber-600/30",
    },
    silver: {
      emoji: "🥈",
      label: "Silver",
      bgColor: "bg-gray-400/20",
      textColor: "text-gray-300",
      borderColor: "border-gray-400/30",
    },
    gold: {
      emoji: "🥇",
      label: "Gold",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-500/30",
    },
  };

  const config = tierConfig[tier];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${sizeClasses[size]} ${config.bgColor} ${config.textColor} ${config.borderColor} font-semibold`}
    >
      <span>{config.emoji}</span>
      <span>{config.label} Network</span>
    </div>
  );
};

export default TierBadge;
