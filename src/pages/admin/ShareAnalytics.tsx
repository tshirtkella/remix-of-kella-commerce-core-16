import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Share2, Copy, MousePointerClick, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 3650,
};

const NETWORK_COLORS: Record<string, string> = {
  facebook: "hsl(214, 89%, 52%)",
  whatsapp: "hsl(142, 70%, 45%)",
  messenger: "hsl(210, 100%, 56%)",
  x: "hsl(220, 9%, 20%)",
  linkedin: "hsl(201, 90%, 40%)",
  telegram: "hsl(200, 70%, 50%)",
  email: "hsl(38, 92%, 50%)",
  copy_link: "hsl(280, 60%, 55%)",
  native: "hsl(160, 60%, 45%)",
};

const networkLabel = (n: string) =>
  ({
    copy_link: "Copy Link",
    x: "X (Twitter)",
    native: "Native Share",
  }[n] ?? n.charAt(0).toUpperCase() + n.slice(1));

const ShareAnalytics = () => {
  const [range, setRange] = useState<string>("30d");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["share-events", range],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - RANGE_DAYS[range]);
      const { data, error } = await supabase
        .from("share_events")
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const total = events.length;
    const copies = events.filter((e) => e.action === "copy").length;
    const clicks = events.filter((e) => e.action === "click").length;
    const native = events.filter((e) => e.action === "native").length;

    const byNetwork = events.reduce<Record<string, number>>((acc, e) => {
      acc[e.network] = (acc[e.network] ?? 0) + 1;
      return acc;
    }, {});
    const networkData = Object.entries(byNetwork)
      .map(([name, value]) => ({ name, value, label: networkLabel(name) }))
      .sort((a, b) => b.value - a.value);

    const byProduct = events.reduce<Record<string, { name: string; count: number; slug: string | null }>>((acc, e) => {
      const key = e.product_id ?? e.product_slug ?? e.product_name ?? "unknown";
      if (!acc[key]) {
        acc[key] = { name: e.product_name ?? "Unknown", count: 0, slug: e.product_slug };
      }
      acc[key].count += 1;
      return acc;
    }, {});
    const topProducts = Object.values(byProduct).sort((a, b) => b.count - a.count).slice(0, 10);

    // Daily trend
    const byDay = events.reduce<Record<string, number>>((acc, e) => {
      const day = new Date(e.created_at).toISOString().slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});
    const trendData = Object.entries(byDay)
      .map(([date, count]) => ({ date: date.slice(5), count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, copies, clicks, native, networkData, topProducts, trendData };
  }, [events]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            Share Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track which networks customers use to share your products.
          </p>
        </div>
        <Tabs value={range} onValueChange={setRange}>
          <TabsList>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Share2} label="Total Shares" value={stats.total} color="text-primary" />
        <StatCard icon={MousePointerClick} label="Network Clicks" value={stats.clicks} color="text-info" />
        <StatCard icon={Copy} label="Link Copies" value={stats.copies} color="text-warning" />
        <StatCard icon={TrendingUp} label="Native Shares" value={stats.native} color="text-success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shares by Network</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.networkData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.networkData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e) => `${e.label} (${e.value})`}
                  >
                    {stats.networkData.map((entry) => (
                      <Cell key={entry.name} fill={NETWORK_COLORS[entry.name] ?? "hsl(var(--muted-foreground))"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.trendData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Shared Products</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{p.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Share Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : events.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Product</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 30).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: NETWORK_COLORS[e.network] ?? "hsl(var(--border))",
                          color: NETWORK_COLORS[e.network] ?? "hsl(var(--foreground))",
                        }}
                      >
                        {networkLabel(e.network)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs capitalize">{e.action}</TableCell>
                    <TableCell className="text-sm">{e.product_name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value.toLocaleString()}</p>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = () => (
  <div className="py-10 text-center text-sm text-muted-foreground">
    No share activity yet. Once customers start sharing products, data will appear here.
  </div>
);

export default ShareAnalytics;
