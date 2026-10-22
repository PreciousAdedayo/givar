"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export default function ActivityChart({ data }: { data: Record<string, string | number>[] }) {
  return (
    <div className="h-64" role="img" aria-label="Money in and out over the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(128,128,128,.2)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={1} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 12 }} />
          <Legend />
          <Bar dataKey="in" name="Money in" fill="#D8F24A" radius={[6, 6, 0, 0]} />
          <Bar dataKey="out" name="Money out" fill="#a3a69a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
