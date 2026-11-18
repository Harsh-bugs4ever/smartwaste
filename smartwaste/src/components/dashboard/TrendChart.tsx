import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useTrend } from "@/hooks/useData";
import { LoadingState } from "@/components/common/States";
import type { TrendPeriod } from "@/types";

export function TrendChart() {
  const [period, setPeriod] = useState<TrendPeriod>("daily");
  const { data, loading } = useTrend(period);

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-semibold text-foreground text-base">Waste Collection Trends</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quantity of waste collected vs pickup runs
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as TrendPeriod)}
          options={[
            { label: "Daily (14d)", value: "daily" },
            { label: "Weekly (10w)", value: "weekly" },
            { label: "Monthly (12m)", value: "monthly" },
          ]}
        />
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <LoadingState label="Loading trend data…" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888825" />
              <XAxis
                dataKey="label"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${val}kg`}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                formatter={(val: number) => [`${val.toLocaleString()} kg`, "Collected Waste"]}
                labelStyle={{ fontWeight: "600", marginBottom: "0.25rem" }}
              />
              <Area
                type="monotone"
                dataKey="collectedKg"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#fillKg)"
                name="Waste (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
