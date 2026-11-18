import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, type SegregationSlice, type WasteCategory } from "@/types";

interface Props {
  data: SegregationSlice[];
}

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  wet: "#059669",      // Forest Green
  dry: "#3b82f6",      // Blue
  plastic: "#f59e0b",  // Amber
  paper: "#8b5cf6",    // Purple
  e_waste: "#ef4444",  // Red
};

export function CategoryBreakdown({ data }: Props) {
  const totalKg = data.reduce((acc, curr) => acc + curr.kg, 0);

  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category],
    value: d.kg,
    percentage: totalKg > 0 ? Math.round((d.kg / totalKg) * 100) : 0,
    color: CATEGORY_COLORS[d.category] || "#6b7280",
    category: d.category,
  }));

  return (
    <Card className="p-5 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-foreground text-base">Waste Segregation</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distribution across categories
        </p>
      </div>

      <div className="relative h-56 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--foreground))",
              }}
              formatter={(val: number) => [`${val.toLocaleString()} kg`, "Quantity"]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">
            {totalKg >= 1000 ? `${(totalKg / 1000).toFixed(1)}t` : `${totalKg}kg`}
          </span>
          <span className="text-[11px] text-muted-foreground">Total Weight</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t pt-3">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-foreground ml-2">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
