import { RefreshCw } from 'lucide-react';
import AIReport from './AIReport';

interface AIResponseProps { content: unknown; title: string; isLoading: boolean; onRegenerate?: () => void; }

export default function AIResponse({ content, title, isLoading, onRegenerate }: AIResponseProps) {
  if (!isLoading && (content === null || content === undefined || content === '')) return null;

  return (
    <div className="mt-4">
      <AIReport response={content} title={title} loading={isLoading} />
      {!isLoading && onRegenerate && (
        <div className="flex justify-end">
          <button type="button" onClick={onRegenerate} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
