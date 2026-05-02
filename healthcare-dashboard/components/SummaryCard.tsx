"use client";

interface SymptomDetail { name: string; severity: string; triggers: string; relievers: string; }
interface UMLSConcept  { term: string; fullName: string; cui: string; confidence: "High" | "Medium" | "Low"; }
interface SummaryData {
  chiefComplaint: string;
  urgency: "Low" | "Medium" | "High" | "Emergency";
  urgencyReason: string;
  confidence: "Low" | "Medium" | "High";
  confidenceReason: string;
  symptoms: SymptomDetail[] | string[];
  duration: string;
  associatedSymptoms: string[];
  deniedSymptoms: string[];
  medications: string[];
  relevantHistory: string[];
  dialysisDetails: string;
  dialysisSymptoms: string[];
  redFlags: string[];
  clinicalImpression: string;
  nextSteps: string[];
  doctorPriority: string[];
  patientNote: string;
  umlsConcepts: UMLSConcept[];
}

const urgencyStyle: Record<string, string> = {
  Low:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium:    "bg-amber-50 text-amber-700 border-amber-200",
  High:      "bg-red-50 text-red-700 border-red-200",
  Emergency: "bg-red-100 text-red-800 border-red-300",
};
const urgencyDot: Record<string, string> = {
  Low: "bg-emerald-500", Medium: "bg-amber-500", High: "bg-red-500", Emergency: "bg-red-600",
};
const confidenceStyle: Record<string, string> = {
  High:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low:    "bg-red-50 text-red-700 border-red-200",
};

function toArr(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") return val ? [val] : [];
  return [];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function Pills({ items }: { items: string[] }) {
  const empty = !items.length || (items.length === 1 && (items[0].toLowerCase().includes("none") || items[0].toLowerCase().includes("not identified")));
  if (empty) return <p className="text-slate-400 text-xs">{items[0] ?? "None reported"}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">{s}</span>)}
    </div>
  );
}

function Lines({ items }: { items: string[] }) {
  const empty = !items.length || (items.length === 1 && items[0].toLowerCase().includes("none"));
  if (empty) return <p className="text-slate-400 text-xs">{items[0] ?? "None reported"}</p>;
  return <>{items.map((h, i) => <p key={i} className="text-slate-700 text-xs leading-relaxed">{h}</p>)}</>;
}

export default function SummaryCard({ raw }: { raw: string }) {
  let data: SummaryData | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) data = JSON.parse(match[0]);
  } catch { /* fall through */ }

  if (!data) {
    return <pre className="text-slate-700 text-sm whitespace-pre-wrap font-sans leading-relaxed bg-white rounded-xl p-5 border border-slate-200 shadow-sm">{raw}</pre>;
  }

  const uStyle = urgencyStyle[data.urgency]       ?? urgencyStyle.Medium;
  const uDot   = urgencyDot[data.urgency]         ?? urgencyDot.Medium;
  const cStyle = confidenceStyle[data.confidence] ?? confidenceStyle.Medium;

  const rawSymptoms   = Array.isArray(data.symptoms) ? data.symptoms : [];
  const symptomsRich  = (rawSymptoms as SymptomDetail[]).filter(s => typeof s === "object" && s.name);
  const symptomsFlat  = (rawSymptoms as string[]).filter(s => typeof s === "string");

  const redFlags       = toArr(data.redFlags);
  const nextSteps      = toArr(data.nextSteps);
  const doctorPriority = toArr(data.doctorPriority);
  const assocSymptoms  = toArr(data.associatedSymptoms);
  const deniedSymptoms = toArr(data.deniedSymptoms);
  const medications    = toArr(data.medications);
  const relevantHist   = toArr(data.relevantHistory);
  const dialysisSyms   = toArr(data.dialysisSymptoms);
  const umlsConcepts   = Array.isArray(data.umlsConcepts) ? data.umlsConcepts : [];

  const hasDialysis  = data.dialysisDetails && !data.dialysisDetails.toLowerCase().includes("none");
  const hasRedFlags  = redFlags.length > 0 && !redFlags[0].toLowerCase().includes("none");
  const hasNextSteps = nextSteps.length > 0;

  return (
    <div className="space-y-3">
      {/* Chief Complaint + Urgency + Confidence */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Chief Complaint</p>
          <div className="flex items-center gap-2">
            {data.confidence && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cStyle}`} title={data.confidenceReason}>
                {data.confidence} confidence
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${uStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${uDot}`} />
              {data.urgency}
            </span>
          </div>
        </div>
        <p className="text-slate-900 text-base font-semibold leading-snug">{data.chiefComplaint}</p>
        {data.urgencyReason    && <p className="text-slate-500 text-xs mt-1.5 italic">{data.urgencyReason}</p>}
        {data.confidenceReason && <p className="text-slate-400 text-[10px] mt-1">{data.confidenceReason}</p>}
      </div>

      {hasRedFlags && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 uppercase tracking-widest font-semibold mb-2">⚠ Red Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {redFlags.map((f, i) => (
              <span key={i} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      )}

      <Section title="Symptoms">
        {symptomsRich.length > 0 ? (
          <div className="space-y-3">
            {symptomsRich.map((s, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <p className="text-slate-800 text-xs font-semibold mb-1.5">{s.name}</p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div><span className="text-slate-400 block">Severity</span><span className="text-slate-700">{s.severity || "Not specified"}</span></div>
                  <div><span className="text-slate-400 block">Triggers</span><span className="text-slate-700">{s.triggers || "None reported"}</span></div>
                  <div><span className="text-slate-400 block">Relievers</span><span className="text-slate-700">{s.relievers || "None reported"}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : symptomsFlat.length > 0 ? (
          <Pills items={symptomsFlat} />
        ) : (
          <p className="text-slate-400 text-xs">None reported</p>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section title="Duration">
          <p className="text-slate-800 text-sm font-medium">{data.duration || "Not specified"}</p>
        </Section>
        <Section title="Associated Symptoms">
          <Pills items={assocSymptoms.length ? assocSymptoms : ["None reported"]} />
        </Section>
      </div>

      {deniedSymptoms.length > 0 && !deniedSymptoms[0].toLowerCase().includes("none") && (
        <Section title="Denied Symptoms">
          <div className="flex flex-wrap gap-1.5">
            {deniedSymptoms.map((s, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-400 border border-slate-200 px-2.5 py-1 rounded-full line-through">{s}</span>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Section title="Medications">
          <Lines items={medications.length ? medications : ["None reported"]} />
        </Section>
        <Section title="Relevant History">
          <Lines items={relevantHist.length ? relevantHist : ["None reported"]} />
        </Section>
      </div>

      {hasDialysis && (
        <div className="grid grid-cols-2 gap-3">
          <Section title="Dialysis Details">
            <p className="text-slate-700 text-xs">{data.dialysisDetails}</p>
          </Section>
          <Section title="Dialysis Symptoms">
            <Lines items={dialysisSyms.length ? dialysisSyms : ["None reported"]} />
          </Section>
        </div>
      )}

      {data.clinicalImpression && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 uppercase tracking-widest font-semibold mb-2">Clinical Impression (AI)</p>
          <p className="text-slate-700 text-sm leading-relaxed">{data.clinicalImpression}</p>
        </div>
      )}

      {hasNextSteps && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-xs text-teal-600 uppercase tracking-widest font-semibold mb-2.5">Suggested Next Steps</p>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-[10px] text-teal-700 font-bold shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-slate-700 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {doctorPriority.length > 0 && (
        <Section title="Doctor's Priority Checklist">
          <div className="space-y-2">
            {doctorPriority.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded border border-slate-300 shrink-0 mt-0.5" />
                <p className="text-slate-700 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {umlsConcepts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Clinical Concepts</p>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">UMLS Mapped</span>
          </div>
          <div className="flex flex-col gap-2">
            {umlsConcepts.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-slate-800 text-xs font-semibold">{c.term}</span>
                  {c.fullName && c.fullName !== c.term && (
                    <span className="text-slate-400 text-[10px] ml-2">{c.fullName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-[10px] font-mono">{c.cui}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    c.confidence === "High"   ? "bg-emerald-50 text-emerald-700" :
                    c.confidence === "Medium" ? "bg-amber-50 text-amber-700" :
                                               "bg-red-50 text-red-700"
                  }`}>{c.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.patientNote && (
        <p className="text-slate-400 text-xs italic text-center px-2 pb-1">{data.patientNote}</p>
      )}
    </div>
  );
}
