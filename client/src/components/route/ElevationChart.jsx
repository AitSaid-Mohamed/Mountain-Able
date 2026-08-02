import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Mountain } from 'lucide-react';
import { EmptyState } from '../ui/index.js';

/**
 * Route elevation as an area chart. Hovering a point calls `onHover` with its
 * coordinates so the map can highlight the matching location. Degrades to a
 * clear "unavailable" state when the provider returned no elevation.
 */
export default function ElevationChart({ elevation, onHover }) {
  const { t } = useTranslation();
  if (!elevation || !elevation.profile?.length) {
    return <EmptyState icon={Mountain} title={t('route.elevation.unavailable')} />;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={elevation.profile}
          margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
          onMouseMove={(s) => {
            const p = s?.activePayload?.[0]?.payload;
            if (p) onHover?.({ lat: p.lat, lng: p.lng, ele: p.ele, distKm: p.distKm });
          }}
          onMouseLeave={() => onHover?.(null)}
        >
          <defs>
            <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#21bf73" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#21bf73" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="distKm" tickFormatter={(v) => Math.round(v)} tick={{ fontSize: 11, fill: '#808080' }}
            label={{ value: t('route.elevation.distance'), position: 'insideBottom', offset: -2, fontSize: 11, fill: '#999' }} />
          <YAxis tick={{ fontSize: 11, fill: '#808080' }} width={48} domain={['dataMin - 50', 'dataMax + 50']} />
          <Tooltip
            formatter={(v) => [`${v} m`, t('route.elevation.altitude')]}
            labelFormatter={(v) => `${Math.round(v)} km`}
          />
          <Area type="monotone" dataKey="ele" stroke="#21bf73" strokeWidth={2} fill="url(#elev)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
