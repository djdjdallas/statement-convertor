'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

/**
 * CodeBlock Component
 *
 * Displays syntax-highlighted code with copy functionality and optional features
 *
 * @param {Object} props
 * @param {string} props.code - The code to display
 * @param {string} props.language - Programming language (e.g., 'javascript', 'python')
 * @param {string} [props.filename] - Optional filename to display
 * @param {boolean} [props.showLineNumbers=false] - Show line numbers
 * @param {number[]} [props.highlightLines] - Array of line numbers to highlight
 *
 * @example
 * <CodeBlock
 *   code="const hello = 'world';"
 *   language="javascript"
 *   filename="example.js"
 *   showLineNumbers={true}
 *   highlightLines={[1, 3]}
 * />
 */
export default function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = false,
  highlightLines = []
}) {
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Simple syntax highlighting function
  const highlightSyntax = (line) => {
    // Keywords for common languages
    const keywords = /\b(const|let|var|function|if|else|return|import|export|class|extends|new|this|async|await|for|while|do|switch|case|break|continue|try|catch|throw|typeof|instanceof|delete|void|yield|static|public|private|protected|interface|type|enum)\b/g;

    // Strings
    const strings = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

    // Comments
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;

    // Numbers
    const numbers = /\b(\d+\.?\d*)\b/g;

    // Function calls
    const functions = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;

    let highlighted = line;

    // Apply highlighting (order matters!)
    highlighted = highlighted.replace(comments, '<span class="text-gray-500">$1</span>');
    highlighted = highlighted.replace(strings, '<span class="text-green-400">$1$2$1</span>');
    highlighted = highlighted.replace(keywords, '<span class="text-purple-400">$1</span>');
    highlighted = highlighted.replace(numbers, '<span class="text-yellow-400">$1</span>');
    highlighted = highlighted.replace(functions, '<span class="text-blue-400">$1</span>(');

    return highlighted;
  };

  const lines = code.split('\n');

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 my-6">
      {/* Header with filename and language badge */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {filename && (
            <span className="text-sm text-gray-300 font-mono">{filename}</span>
          )}
          <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white font-medium">
            {language}
          </span>
        </div>

        {/* Copy button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono">
          <code className="text-gray-100">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlightLines.includes(lineNumber);

              return (
                <div
                  key={index}
                  className={`${
                    isHighlighted ? 'bg-blue-900/20 -mx-4 px-4' : ''
                  } ${index !== lines.length - 1 ? 'block' : ''}`}
                >
                  {showLineNumbers && (
                    <span className="inline-block w-8 text-right mr-4 text-gray-500 select-none">
                      {lineNumber}
                    </span>
                  )}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightSyntax(line || ' ')
                    }}
                  />
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
