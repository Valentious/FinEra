import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface Alert {
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss: (alert: Alert) => void;
}

export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'high':
        return <AlertTriangle size={20} className="text-orange-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getBgClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-critical';
      case 'high':
        return 'alert-high';
      default:
        return 'alert-info';
    }
  };

  return (
    <div className="alerts-panel">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`alert-item ${getBgClass(alert.severity)}`}>
          <button className="alert-dismiss" onClick={() => onDismiss(alert)}>
            <X size={16} />
          </button>
          <div className="alert-content">
            {getIcon(alert.severity)}
            <div>
              <p className="alert-title">{alert.title}</p>
              <p className="alert-message">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
