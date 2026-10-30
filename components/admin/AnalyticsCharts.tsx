
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = Record<string, string | number>;

type D = {
  visitors: Row[];
  signups: Row[];
  giveaways: Row[];
  volume: Row[];
  entries: Row[];
};

const L = "#D8F24A";
const W = "#a3a69a";

const tip = {
  contentStyle: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 12,
  },
};

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const axes = (n: number) => (
  <>
    <CartesianGrid
      stroke="rgba(128,128,128,.2)"
      vertical={false}
    />
    <XAxis
      dataKey="day"
      tick={{ fontSize: 11 }}
      interval={Math.max(0, Math.ceil(n / 8) - 1)}
    />
    <YAxis
      tick={{ fontSize: 11 }}
      width={44}
      allowDecimals={false}
    />
    <Tooltip {...tip} />
    <Legend />
  </>
);

export default function AnalyticsCharts({
  data,
  only,
}: {
  data: Partial<D>;
  only?: (keyof D)[];
}) {
  const show = (k: keyof D) =>
    (!only || only.includes(k)) && !!data[k];

  const visitors = data.visitors ?? [];
  const signups = data.signups ?? [];
  const giveaways = data.giveaways ?? [];
  const volume = data.volume ?? [];
  const entries = data.entries ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {show("visitors") && (
        <Box title="Visitors">
          <LineChart data={visitors}>
            {axes(visitors.length)}
            <Line
              dataKey="views"
              name="Page views"
              stroke={L}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              dataKey="unique"
              name="Unique visitors"
              stroke={W}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </Box>
      )}

      {show("signups") && (
        <Box title="Signups">
          <BarChart data={signups}>
            {axes(signups.length)}
            <Bar
              dataKey="signups"
              name="Signups"
              fill={L}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </Box>
      )}

      {show("giveaways") && (
        <Box title="Giveaways created vs claimed">
          <BarChart data={giveaways}>
            {axes(giveaways.length)}
            <Bar
              dataKey="created"
              name="Created"
              fill={L}
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="claimed"
              name="Claimed"
              fill={W}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </Box>
      )}

      {show("volume") && (
        <Box title="Deposit volume (major units)">
          <LineChart data={volume}>
            {axes(volume.length)}
            <Line
              dataKey="NGN"
              name="NGN"
              stroke={L}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              dataKey="USD"
              name="USD"
              stroke={W}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </Box>
      )}

      {show("entries") && (
        <Box title="Contest entries">
          <BarChart data={entries}>
            {axes(entries.length)}
            <Bar
              dataKey="entries"
              name="Entries"
              fill={L}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </Box>
      )}
    </div>
  );
}
