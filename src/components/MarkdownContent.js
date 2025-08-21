'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-lg max-w-none"
      components={{
        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
        p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
        a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 my-4" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 my-4" {...props} />,
        li: ({node, ...props}) => <li className="ml-6" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-700" {...props} />
        ),
        code: ({node, inline, ...props}) => 
          inline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
          ) : (
            <code className="block bg-gray-100 p-4 rounded-lg overflow-x-auto my-4" {...props} />
          ),
        pre: ({node, ...props}) => (
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4" {...props} />
        ),
        table: ({node, ...props}) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full divide-y divide-gray-200" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
        tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
        th: ({node, ...props}) => (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}