"use client";

import { useState } from "react";
import { AgentResult } from "@/types/database";

interface ResultCardProps {
  result: AgentResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getOutputTypeColor = (type: string) => {
    switch (type) {
      case "blog":
        return "bg-blue-500/20 text-blue-400";
      case "social":
        return "bg-purple-500/20 text-purple-400";
      case "email":
        return "bg-green-500/20 text-green-400";
      case "webhook":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const sources = (result.metadata?.sources as Array<{ url: string; title: string; publishedAt: string }>) || [];
  const model = result.metadata?.model as string | undefined;
  const tokensUsed = result.metadata?.tokensUsed as number | undefined;

  const contentPreview = expanded ? result.content : result.content.slice(0, 500);
  const isTruncated = result.content.length > 500;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 text-xs font-medium rounded ${getOutputTypeColor(result.output_type)}`}>
            {result.output_type.toUpperCase()}
          </span>
          {model && (
            <span className="text-xs text-gray-400">Model: {model}</span>
          )}
          {tokensUsed !== undefined && (
            <span className="text-xs text-gray-400">Tokens: {tokensUsed.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-200 whitespace-pre-wrap">
          {contentPreview}
          {isTruncated && !expanded && "..."}
        </div>
        {isTruncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Sources:</h4>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 hover:underline"
                >
                  {source.title || source.url}
                </a>
                {source.publishedAt && (
                  <span className="text-gray-500 ml-2">
                    ({new Date(source.publishedAt).toLocaleDateString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

