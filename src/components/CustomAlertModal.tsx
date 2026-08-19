import React, { useState } from 'react';
import { AppInstance, ServiceType, Severity } from '../types';
import { X, Flame, Send, Sparkles } from 'lucide-react';
import { ERROR_TEMPLATES } from '../utils/mockData';

interface Props {
  instances: AppInstance[];
  onClose: () => void;
  onInjectCustom: (payload: {
    service: ServiceType;
    severity: Severity;
    errorType: string;
    message: string;
    instanceId: string;
    count: number;
  }) => void;
}

export const CustomAlertModal: React.FC<Props> = ({
  instances,
  onClose,
  onInjectCustom,
}) => {
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState(instances[0]?.id || 'inst-gw-01');
  const [severity, setSeverity] = useState<Severity>('critical');
  const [customMessage, setCustomMessage] = useState('');
  const [burstCount, setBurstCount] = useState(5);

  const currentTemplate = ERROR_TEMPLATES[selectedTemplateIdx] || ERROR_TEMPLATES[0];

  const handleTemplateChange = (idx: number) => {
    setSelectedTemplateIdx(idx);
    const tmpl = ERROR_TEMPLATES[idx];
    if (tmpl) {
      setSeverity(tmpl.severity);
      const inst = instances.find(i => i.id === selectedInstanceId);
      const msg = tmpl.messageGenerators[0]?.(inst?.name || 'app-node-01') || 'Generic anomaly detected';
      setCustomMessage(msg);
    }
  };

  const handleInject = () => {
    const inst = instances.find(i => i.id === selectedInstanceId);
    const msg = customMessage.trim() || currentTemplate.messageGenerators[0]?.(inst?.name || 'app-node-01') || 'Custom alert message';

    onInjectCustom({
      service: currentTemplate.service,
      severity,
      errorType: currentTemplate.errorType,
      message: msg,
      instanceId: selectedInstanceId,
      count: burstCount
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Craft & Inject Test Alert Storm
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Preset Error Scenario Selector */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Failure Scenario:
            </label>
            <select
              value={selectedTemplateIdx}
              onChange={e => handleTemplateChange(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ERROR_TEMPLATES.map((tmpl, idx) => (
                <option key={tmpl.errorType} value={idx}>
                  [{tmpl.service}] {tmpl.title} ({tmpl.severity})
                </option>
              ))}
            </select>
          </div>

          {/* Target Instance */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Target Cluster Node:
            </label>
            <select
              value={selectedInstanceId}
              onChange={e => setSelectedInstanceId(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {instances.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.region} • {inst.service})
                </option>
              ))}
            </select>
          </div>

          {/* Severity & Burst Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Severity:
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Burst Volume:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={burstCount}
                  onChange={e => setBurstCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs shrink-0">alerts</span>
              </div>
            </div>
          </div>

          {/* Custom Message Field */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Error Message Payload (Optional custom override):
            </label>
            <textarea
              rows={3}
              placeholder={currentTemplate.messageGenerators[0]?.('node-01')}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInject}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Inject {burstCount} Alert{burstCount > 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
