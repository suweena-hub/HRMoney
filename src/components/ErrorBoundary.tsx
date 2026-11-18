import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'เกิดข้อผิดพลาดในการแสดงผล' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-700 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-semibold">เกิดข้อผิดพลาดในระบบ</h1>
            </div>
            <p className="text-sm text-slate-600 mb-6 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              โหลดหน้าจอใหม่
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
