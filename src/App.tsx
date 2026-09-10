import { useCallback, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ForecastTool } from "./components/ForecastTool";
import { FactorsSection } from "./components/FactorsSection";
import { AboutSection } from "./components/AboutSection";
import { Footer } from "./components/Footer";

export default function App() {
  const [horizon, setHorizon] = useState(5);
  const [exportPulse, setExportPulse] = useState(0);

  /** Navbar / footer "Export" → jump to the studio and pulse the export actions. */
  const handleExport = useCallback(() => {
    setExportPulse((p) => p + 1);
    document.getElementById("forecast")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-ink-900 font-sans text-slate-200">
      <Navbar onExport={handleExport} />
      <main>
        <Hero />
        <ForecastTool horizon={horizon} setHorizon={setHorizon} exportPulse={exportPulse} />
        <FactorsSection horizon={horizon} />
        <AboutSection />
      </main>
      <Footer onExport={handleExport} />
    </div>
  );
}
