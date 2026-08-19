import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, MessageSquare, Bell, MessageCircle, Info, X } from 'lucide-react';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'pagerduty':
        return <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'discord':
        return <MessageCircle className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl flex items-start justify-between gap-2.5 pointer-events-auto animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-start gap-2.5">
            {getIcon(t.type)}
            <div>
              <div className="text-xs font-bold leading-tight mb-0.5">{t.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{t.description}</div>
            </div>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
