import React, { useState } from 'react';
import { IncidentThread } from '../types';
import { X, FileText, Copy, Check, Download } from 'lucide-react';

interface Props {
  incident: IncidentThread;
  onClose: () => void;
}

export const PostMortemModal: React.FC<Props> = ({ incident, onClose }) => {
  const [copied, setCopied] = useState(false);

  const durationSec = Math.max(1, Math.round((incident.lastSeen - incident.firstSeen) / 1000));
  const dedupRatio = incident.alertCount > 0 
    ? (((incident.alertCount - (incident.dispatchedCount || 1)) / incident.alertCount) * 100).toFixed(1) 
    : '0';

  const reportMarkdown = `# Incident Post-Mortem Report: ${incident.title}

**Incident ID:** ${incident.id}  
**Signature Fingerprint:** \`${incident.fingerprint}\`  
**Service Component:** \`${incident.service}\`  
**Severity Tier:** ${incident.severity.toUpperCase()}  
**Resolution Status:** ${incident.status.toUpperCase()}  
**Initial Ingestion:** ${new Date(incident.firstSeen).toISOString()}  
**Latest Anomaly Timestamp:** ${new Date(incident.lastSeen).toISOString()}  
**Active Duration:** ${durationSec} seconds  

---

## 1. Executive Telemetry Summary
- **Total Ingested Events:** ${incident.alertCount} raw alert traces
- **Noise Reduction Ratio:** ${dedupRatio}% suppressed via SignalGuard Cooldown Matrix
- **Affected Infrastructure Nodes (${incident.affectedInstances.length}):** ${incident.affectedInstances.join(', ')}
- **Dispatched Channel Escalations:** ${incident.dispatchedCount || 1} alert notification(s)

---

## 2. Root Cause Anomaly Hypothesis
${incident.rootCauseHypothesis}

---

## 3. Automated Remediation Runbook & Corrective Actions
- [ ] ${incident.recommendedAction}
- [ ] Verify connection pool & memory limits across cluster instances.
- [ ] Adjust suppression window TTL if telemetry baseline shifts.
- [ ] Confirm metric normalization in OpenTelemetry collector pipelines.

---

## 4. Representative Error Trace
\`\`\`
${incident.rawAlerts[0]?.message || 'No stack trace recorded.'}
\`\`\`

*Generated automatically by SignalGuard Intelligent Telemetry Filter.*
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postmortem-${incident.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Incident Post-Mortem Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap select-all leading-relaxed">
          {reportMarkdown}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Export ready for Jira, Notion, or Confluence.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
