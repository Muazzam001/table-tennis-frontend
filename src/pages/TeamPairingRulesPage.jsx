import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import DivisionTabs from '@/components/molecules/DivisionTabs';
import { PAIRING_RULE_LABELS } from '@shared/tournament/teamPairing.js';
import { getPlayers } from '@/services/playerService';
import { getDivisionSettings } from '@/services/divisionService';
import {
  getPairingRules,
  getBuiltInPairingRules,
  getEffectivePairingRules,
  createPairingRule,
  deletePairingRule,
} from '@/services/teamPairingRuleService';
import { DIVISIONS } from '@/constants/divisions';
import { showConfirm } from '@/utils/sweetAlert';

const RULE_TYPE_OPTIONS = [
  { value: 'never_pair', label: 'Never pair' },
  { value: 'must_pair', label: 'Must pair' },
  { value: 'prefer_pair', label: 'Prefer pair' },
];

const DEFAULT_FORMATS = { Expert: 'doubles', Intermediate: 'doubles', Women: 'doubles' };

const getPlayersForDivision = (players, division) => {
  if (division === 'Expert') {
    return players.filter(
      (p) => p.expertise_level === 'Expert' && (p.category === 'Men' || !p.category)
    );
  }
  if (division === 'Intermediate') {
    return players.filter(
      (p) =>
        p.expertise_level === 'Intermediate' && (p.category === 'Men' || !p.category)
    );
  }
  return players.filter((p) => p.category === 'Women');
};

const TeamPairingRulesPage = () => {
  const [selectedDivision, setSelectedDivision] = useState('Expert');
  const [divisionFormats, setDivisionFormats] = useState({ ...DEFAULT_FORMATS });
  const [players, setPlayers] = useState([]);
  const [dbRules, setDbRules] = useState([]);
  const [builtInRules, setBuiltInRules] = useState([]);
  const [effectiveRules, setEffectiveRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    player_id: '',
    related_player_id: '',
    rule_type: 'never_pair',
    priority: 50,
  });

  const isDoublesDivision = divisionFormats[selectedDivision] !== 'singles';
  const divisionPlayers = useMemo(
    () => getPlayersForDivision(players, selectedDivision),
    [players, selectedDivision]
  );

  const divisionDbRules = dbRules.filter((rule) => rule.division === selectedDivision);
  const divisionEffectiveRules = effectiveRules.filter((rule) => rule.division === selectedDivision);
  const divisionBuiltInRules = builtInRules.filter((rule) => rule.division === selectedDivision);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [playerData, settings, rules, builtIn, effective] = await Promise.all([
        getPlayers(),
        getDivisionSettings(),
        getPairingRules(),
        getBuiltInPairingRules(),
        getEffectivePairingRules(),
      ]);

      setPlayers(playerData);
      setDbRules(rules);
      setBuiltInRules(builtIn);
      setEffectiveRules(effective);

      const formats = { ...DEFAULT_FORMATS };
      for (const row of settings) {
        formats[row.division] = row.competition_format || 'doubles';
      }
      setDivisionFormats(formats);
    } catch (err) {
      setError(err.message || 'Failed to load pairing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!isDoublesDivision) {
      setError('Pairing rules only apply to Doubles divisions. Switch the division to doubles on the Teams page first.');
      return;
    }

    if (!form.player_id || !form.related_player_id) {
      setError('Select both players');
      return;
    }

    if (form.player_id === form.related_player_id) {
      setError('Select two different players');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createPairingRule({
        player_id: Number(form.player_id),
        related_player_id: Number(form.related_player_id),
        rule_type: form.rule_type,
        division: selectedDivision,
        priority: form.rule_type === 'prefer_pair' ? Number(form.priority) : undefined,
      });

      setForm({
        player_id: '',
        related_player_id: '',
        rule_type: 'never_pair',
        priority: 50,
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create pairing rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    const confirmed = await showConfirm({
      title: 'Delete pairing rule?',
      text: 'This rule will no longer apply to doubles team generation.',
      confirmText: 'Delete',
      icon: 'warning',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setError(null);
      await deletePairingRule(ruleId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete pairing rule');
    }
  };

  const selectedDivisionLabel =
    DIVISIONS.find((l) => l.value === selectedDivision)?.label || selectedDivision;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Doubles Pairing Rules</h2>
            <p className="text-gray-600 mt-1">
              Control how players are paired into doubles teams. Rules are ignored for singles divisions.
            </p>
          </div>
          <Link to="/teams" className="text-sm text-blue-600 hover:underline">
            ← Back to Teams
          </Link>
        </div>

        <h3 className="font-semibold text-gray-900">How rules work</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
          <li>
            <strong>Never pair</strong> — two players cannot be on the same doubles team.
          </li>
          <li>
            <strong>Must pair</strong> — always teamed together (enforced after initial pairing).
          </li>
          <li>
            <strong>Prefer pair</strong> — sometimes teamed together (priority = % chance).
          </li>
          <li>Built-in rules in code are always merged with custom database rules.</li>
          <li>Singles divisions skip all pairing rules during generation.</li>
        </ul>
      </div>

      {!isDoublesDivision && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
          <strong>{selectedDivisionLabel}</strong> is set to <strong>singles</strong>. Pairing rules
          only apply when the division uses doubles format. Change the format on the{' '}
          <Link to="/teams" className="font-medium underline">
            Teams page
          </Link>{' '}
          to manage or preview rules for this division.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <DivisionTabs
        selected={selectedDivision}
        onChange={setSelectedDivision}
        counts={{
          Expert: divisionFormats.Expert === 'doubles' ? 1 : 0,
          Intermediate: divisionFormats.Intermediate === 'doubles' ? 1 : 0,
          Women: divisionFormats.Women === 'doubles' ? 1 : 0,
        }}
      />

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Add custom rule</h3>
        <p className="text-sm text-gray-600">
          Never-pair rules are applied during random pairing. Must-pair and prefer-pair rules are
          applied afterward via swaps.
        </p>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className={`grid grid-cols-1 gap-6 
            ${form.rule_type === 'prefer_pair' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player A</label>
              <select
                value={form.player_id}
                onChange={(e) => setForm((prev) => ({ ...prev, player_id: e.target.value }))}
                disabled={!isDoublesDivision || saving}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">Select player</option>
                {divisionPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player B</label>
              <select
                value={form.related_player_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, related_player_id: e.target.value }))
                }
                disabled={!isDoublesDivision || saving}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">Select player</option>
                {divisionPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule type</label>
              <select
                value={form.rule_type}
                onChange={(e) => setForm((prev) => ({ ...prev, rule_type: e.target.value }))}
                disabled={!isDoublesDivision || saving}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-60"
              >
                {RULE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.rule_type === 'prefer_pair' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chance to pair (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                  disabled={!isDoublesDivision || saving}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>
            )}
          </div>

          <Button align="right" type="submit" variant="primary" disabled={!isDoublesDivision || saving}>
            Add rule
          </Button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Custom rules — {selectedDivisionLabel}
          </h3>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-gray-600">Loading...</p>
        ) : divisionDbRules.length === 0 ? (
          <p className="p-5 text-sm text-gray-600">No custom rules for this division.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-5 py-3">Player A</th>
                  <th className="px-5 py-3">Player B</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {divisionDbRules.map((rule) => (
                  <tr key={rule.id} className="border-t border-gray-100">
                    <td className="px-5 py-3">{rule.player_name}</td>
                    <td className="px-5 py-3">{rule.related_player_name}</td>
                    <td className="px-5 py-3">{PAIRING_RULE_LABELS[rule.rule_type]}</td>
                    <td className="px-5 py-3">
                      {rule.rule_type === 'prefer_pair' ? `${rule.priority}%` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {divisionBuiltInRules.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Built-in rules — {selectedDivisionLabel}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Defined in code; edit defaultTeamPairingRules.js</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-5 py-3">Player A (email)</th>
                  <th className="px-5 py-3">Player B (email)</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {divisionBuiltInRules.map((rule, index) => (
                  <tr key={`${rule.playerEmail}-${rule.relatedPlayerEmail}-${index}`} className="border-t border-gray-100">
                    <td className="px-5 py-3">{rule.playerEmail}</td>
                    <td className="px-5 py-3">{rule.relatedPlayerEmail}</td>
                    <td className="px-5 py-3">{PAIRING_RULE_LABELS[rule.rule_type]}</td>
                    <td className="px-5 py-3">
                      {rule.rule_type === 'prefer_pair'
                        ? `${rule.priority ?? 50}%`
                        : rule.rule_type === 'must_pair'
                          ? rule.priority ?? 100
                          : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Effective rules (merged) — {selectedDivisionLabel}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Used when generating doubles teams for this division
          </p>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-gray-600">Loading...</p>
        ) : divisionEffectiveRules.length === 0 ? (
          <p className="p-5 text-sm text-gray-600">No effective rules for this division.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-5 py-3">Player A</th>
                  <th className="px-5 py-3">Player B</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {divisionEffectiveRules.map((rule) => (
                  <tr
                    key={`${rule.source}-${rule.player_id}-${rule.related_player_id}-${rule.rule_type}`}
                    className="border-t border-gray-100"
                  >
                    <td className="px-5 py-3">{rule.player_name}</td>
                    <td className="px-5 py-3">{rule.related_player_name}</td>
                    <td className="px-5 py-3">{PAIRING_RULE_LABELS[rule.rule_type]}</td>
                    <td className="px-5 py-3 capitalize">{rule.source || 'database'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPairingRulesPage;
