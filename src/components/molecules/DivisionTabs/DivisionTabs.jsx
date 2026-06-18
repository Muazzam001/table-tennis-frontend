import Button from '@/components/atoms/Button';
import { DIVISIONS } from '@/constants/divisions';

const DivisionTabs = ({ selected, onChange, counts = {} }) => (
  <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Division">
    {DIVISIONS.map((division) => {
      const count = counts[division.value];
      const label =
        count != null ? `${division.label} (${count})` : division.label;

      return (
        <Button
          key={division.value}
          type="button"
          role="tab"
          aria-selected={selected === division.value}
          onClick={() => onChange(division.value)}
          variant={selected === division.value ? 'primary' : 'outline'}
          size="sm"
        >
          {label}
        </Button>
      );
    })}
  </div>
);

export default DivisionTabs;
