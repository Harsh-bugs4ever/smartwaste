import type { ReactNode } from "react";
import { Activity, BellRing, Leaf, Map, Recycle, Sparkles } from "lucide-react";

const MUMBAI_BG_IMAGE =
  "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=2160&q=85";

const HIGHLIGHTS = [
  {
    icon: Map,
    title: "Real-time Telemetric Mapping",
    description: "GPS-mapped smart bins with color-coded fill statuses across all Mumbai wards.",
  },
  {
    icon: BellRing,
    title: "Predictive Overflow Prevention",
    description: "Automated ultrasonic sensor alerts dispatched before bins reach critical capacity.",
  },
  {
    icon: Recycle,
    title: "Segregation Analytics",
    description: "Audit wet, dry, plastic, and electronic waste diversion with municipal reporting.",
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between">
      {/* Background Image: Mumbai Skyline, High-rises & Urban Forest Canopy */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url('${MUMBAI_BG_IMAGE}')` }}
        aria-hidden="true"
      />

      {/* Transparent Gradient Overlays - Removing solid green block, keeping backdrop transparent & readable */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/75 backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80"
        aria-hidden="true"
      />

      {/* Top Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              SmartWaste
              <span className="text-[11px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-emerald-300 border border-emerald-500/30">
                MMR Network
              </span>
            </span>
            <p className="text-[11px] text-white/60">
              Intelligent Urban Waste Management System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-white/80">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            14 Active Sensor Wards
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            BMC Operations Live
          </span>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-12 items-center px-4 py-8 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full gap-8 lg:gap-12">
        {/* Left Hero Side: Transparent Urban Ecology Info */}
        <div className="lg:col-span-7 text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-medium backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering a Greener, Cleaner Mumbai
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              Sustainable Urban Cities Begin With Intelligent Waste Infrastructure.
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
              Monitoring IoT fill sensors, automated fleet route dispatching, and municipal recycling segregation across South Mumbai, Western Suburbs, and Navi Mumbai.
            </p>
          </div>

          {/* Highlights feature list with transparent glass cards */}
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {HIGHLIGHTS.map(({ icon: Icon, title: hTitle, description }) => (
              <div
                key={hTitle}
                className="p-3.5 rounded-xl border border-white/15 bg-white/[0.07] backdrop-blur-md hover:bg-white/[0.12] transition-colors"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300 mb-2.5">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-xs text-white mb-1">{hTitle}</h3>
                <p className="text-[11px] text-white/70 leading-normal">{description}</p>
              </div>
            ))}
          </div>

          {/* Transparent Municipal Metrics Bar */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-white/10 text-xs text-white/80">
            <div>
              <p className="text-xl font-bold text-white">99.4%</p>
              <p className="text-[11px] text-white/60">IoT Uptime</p>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <p className="text-xl font-bold text-white">&lt; 15 mins</p>
              <p className="text-[11px] text-white/60">Incident Response</p>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <p className="text-xl font-bold text-white">82%</p>
              <p className="text-[11px] text-white/60">Segregation Efficiency</p>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Frosted Glass Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="relative rounded-2xl border border-white/20 bg-background/90 dark:bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
              {subtitle && <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            <div>{children}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-white/60 border-t border-white/10 backdrop-blur-md bg-black/20">
        Municipal Corporation of Greater Mumbai (MCGM / BMC) • IoT Smart Waste Management Portal
      </footer>
    </div>
  );
}
