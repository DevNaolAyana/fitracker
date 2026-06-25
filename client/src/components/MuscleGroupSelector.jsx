import React from 'react';

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Cardio',
  'Core',
  'Full Body',
  'Rest'
];

const MuscleGroupSelector = ({ selected, onChange }) => {
  const toggleGroup = (group) => {
    if (group === 'Rest') {
      // If Rest is selected, clear everything else and just keep Rest
      if (selected.includes('Rest')) {
        onChange([]);
      } else {
        onChange(['Rest']);
      }
    } else {
      // If any other group is selected, remove Rest first
      let updated = selected.filter((g) => g !== 'Rest');
      if (updated.includes(group)) {
        updated = updated.filter((g) => g !== group);
      } else {
        updated = [...updated, group];
      }
      onChange(updated);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((group) => {
        const isSelected = selected.includes(group);
        return (
          <button
            key={group}
            type="button"
            onClick={() => toggleGroup(group)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-[#FF4D2E] border-[#FF4D2E] text-white shadow shadow-[#FF4D2E]/25 scale-105'
                : 'bg-[var(--bg-color)] border-[var(--text-muted-color)]/20 text-[var(--text-color)] hover:border-[var(--text-muted-color)]/50 hover:bg-[var(--surface-color)]'
            }`}
          >
            {group}
          </button>
        );
      })}
    </div>
  );
};

export default MuscleGroupSelector;
