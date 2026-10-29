import { FadeUp } from "./gavel/FadeUp";

const ComparisonSection = () => {
  const tableRows = [
    { feature: "Per-decision audit log", gavel: "✓", perfios: "~", karza: "~", inhouse: "~" },
    { feature: "Deterministic rule engine", gavel: "✓", perfios: "~", karza: "~", inhouse: "~" },
    { feature: "RBI-compliant output format", gavel: "✓", perfios: "~", karza: "~", inhouse: "✗" },
    { feature: "Explainability per decision", gavel: "✓", perfios: "~", karza: "✗", inhouse: "~" },
    { feature: "API-first integration", gavel: "✓", perfios: "✓", karza: "✓", inhouse: "~" },
    { feature: "No black-box ML", gavel: "✓", perfios: "~", karza: "~", inhouse: "~" },
    { feature: "Webhook delivery", gavel: "✓", perfios: "✓", karza: "✓", inhouse: "~" },
  ];

  return (
    <section id="pricing" className="bg-background py-[100px]">
      <div className="container mx-auto px-6 text-center">
        <FadeUp>
          {/* Section label */}
          <div className="font-['DM_Sans'] font-semibold text-[11px] tracking-[0.15em] text-foreground uppercase mb-3">
            COMPARE
          </div>

          {/* Headline */}
          <h2 className="font-['DM_Sans'] font-bold text-[46px] text-foreground mb-4">
            Why lenders are switching to Gavel.
          </h2>

          {/* Subhead */}
          <p className="font-['DM_Sans'] font-normal text-[17px] leading-[1.6] text-muted-foreground max-w-[520px] mx-auto mb-[48px]">
            We're not the only option. Here's an honest comparison.
          </p>
        </FadeUp>

        {/* Table Container */}
        <FadeUp delay={0.2}>
          <div className="max-w-[800px] mx-auto border border-border rounded-[10px] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-6 py-4 font-['DM_Sans'] font-semibold text-[13px] text-muted-foreground">Capability</th>
                  <th className="text-center px-6 py-4 font-['DM_Sans'] font-semibold text-[13px] text-foreground">Gavel</th>
                  <th className="text-center px-6 py-4 font-['DM_Sans'] font-semibold text-[13px] text-muted-foreground">Perfios</th>
                  <th className="text-center px-6 py-4 font-['DM_Sans'] font-semibold text-[13px] text-muted-foreground">Karza</th>
                  <th className="text-center px-6 py-4 font-['DM_Sans'] font-semibold text-[13px] text-muted-foreground">In-house</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-border last:border-0 hover:bg-muted transition-colors duration-150`}
                  >
                    <td className="text-left px-6 py-[14px] font-['DM_Sans'] font-normal text-[14px] text-foreground">
                      {row.feature}
                    </td>
                    <td className="text-center px-6 py-[14px] bg-[rgba(249,115,22,0.03)] font-bold text-[16px] text-[#00FF94]">
                      {row.gavel}
                    </td>
                    <td className={`text-center px-6 py-[14px] text-[16px] ${row.perfios === '✓' ? 'text-[#00FF94] font-bold' : row.perfios === '~' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {row.perfios}
                    </td>
                    <td className={`text-center px-6 py-[14px] text-[16px] ${row.karza === '✓' ? 'text-[#00FF94] font-bold' : row.karza === '~' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {row.karza}
                    </td>
                    <td className={`text-center px-6 py-[14px] text-[16px] ${row.inhouse === '✓' ? 'text-[#00FF94] font-bold' : row.inhouse === '~' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {row.inhouse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>

        {/* Footer text */}
        <FadeUp delay={0.4}>
          <p className="mt-[16px] font-['DM_Sans'] font-normal text-[12px] text-muted-foreground text-center">
            ~ = partial support. Based on public documentation as of June 2026. <br />
            Perfios and Karza are data analytics providers, not underwriting decision engines.
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

export default ComparisonSection;
