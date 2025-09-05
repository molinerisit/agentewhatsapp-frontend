'use client';

export default function InstancePicker({ instances = [], value, onChange }) {
  return (
    <select
      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    >
      <option value="" disabled>Elegí una instancia…</option>
      {Array.isArray(instances) && instances.map((it, idx) => {
        const name = it?.instance?.name || it?.name || it?.instanceName || it?.id || `inst-${idx}`;
        return <option key={name} value={name}>{name}</option>;
      })}
    </select>
  );
}
