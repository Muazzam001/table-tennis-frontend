import Button from '../../atoms/Button';

const LeagueTabs = ({ selected, onChange, counts = {} }) => (
  <div className="flex gap-2 flex-wrap" role="tablist" aria-label="League">
    {[
      { value: 'Expert', label: 'Expert League' },
      { value: 'Intermediate', label: 'Intermediate League' },
      { value: 'Women', label: 'Women League' },
    ].map((league) => {
      const count = counts[league.value];
      const label =
        count != null ? `${league.label} (${count})` : league.label;

      return (
        <Button
          key={league.value}
          type="button"
          role="tab"
          aria-selected={selected === league.value}
          onClick={() => onChange(league.value)}
          variant={selected === league.value ? 'primary' : 'outline'}
          size="sm"
        >
          {label}
        </Button>
      );
    })}
  </div>
);

export default LeagueTabs;
