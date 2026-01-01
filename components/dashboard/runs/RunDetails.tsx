"use client";

import { AgentRunWithResults } from "@/types/database";
import ResultCard from "./ResultCard";
import { useEffect, useState, useRef } from "react";

interface RunDetailsProps {
  run: AgentRunWithResults;
}

export default function RunDetails({ run: initialRun }: RunDetailsProps) {
  const [run, setRun] = useState<AgentRunWithResults>(initialRun);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging for initial run data
  useEffect(() => {
    console.log("[RunDetails] Initial run data:", {
      runId: initialRun.id,
      status: initialRun.status,
      resultsCount: initialRun.results?.length || 0,
      results: initialRun.results,
      resultsError: initialRun.resultsError,
      progressLogsCount: initialRun.progressLogs?.length || 0,
    });
  }, [initialRun]);

  // Poll for updates when run is pending or processing
  useEffect(() => {
    const shouldPoll = run.status === "pending" || run.status === "processing";
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/runs/${run.id}`);
        if (!response.ok) {
          console.error("[RunDetails] Failed to fetch run updates:", {
            status: response.status,
            statusText: response.statusText,
          });
          return;
        }
        
        const data = await response.json();
        if (data.run) {
          console.log("[RunDetails] Polling update received:", {
            runId: data.run.id,
            status: data.run.status,
            resultsCount: data.run.results?.length || 0,
            results: data.run.results?.map((r: any) => ({ id: r.id, output_type: r.output_type })),
            resultsError: data.run.resultsError,
          });
          
          // Ensure results are preserved when updating run state
          setRun({
            ...data.run,
            results: data.run.results || [],
            progressLogs: data.run.progressLogs || [],
          });
          
          // Stop polling if status changed to completed or failed
          if (data.run.status === "completed" || data.run.status === "failed") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error("[RunDetails] Error polling for run updates:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [run.id, run.status]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "processing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "pending":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const resultsByType = (run.results || []).reduce((acc, result) => {
    if (!acc[result.output_type]) {
      acc[result.output_type] = [];
    }
    acc[result.output_type].push(result);
    return acc;
  }, {} as Record<string, typeof run.results>);

  // Debug logging for results rendering
  useEffect(() => {
    console.log("[RunDetails] Rendering with results:", {
      runId: run.id,
      status: run.status,
      hasResults: !!run.results,
      resultsCount: run.results?.length || 0,
      resultsByTypeKeys: Object.keys(resultsByType),
      resultsError: run.resultsError,
    });
  }, [run.id, run.status, run.results, run.resultsError, resultsByType]);

  return (
    <div className="space-y-6">
      {/* Run Metadata */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Run Details</h2>
            <p className="text-sm text-gray-400">
              Run ID: {run.id}
              {isPolling && (
                <span className="ml-2 inline-flex items-center text-yellow-400">
                  <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking for updates...
                </span>
              )}
            </p>
          </div>
          <span className={`px-4 py-2 text-sm font-medium rounded-lg border ${getStatusColor(run.status)}`}>
            {run.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Triggered At</p>
            <p className="text-sm text-white">
              {new Date(run.triggered_at).toLocaleString()}
            </p>
          </div>
          {run.completed_at && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Completed At</p>
              <p className="text-sm text-white">
                {new Date(run.completed_at).toLocaleString()}
              </p>
            </div>
          )}
          {run.industry_id && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Industry</p>
              <p className="text-sm text-white">Industry ID: {run.industry_id}</p>
            </div>
          )}
        </div>

        {run.prompt_instructions && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">Prompt Instructions</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{run.prompt_instructions}</p>
          </div>
        )}

        {run.error_message && (
          <div className="mt-4 pt-4 border-t border-red-500/50">
            <p className="text-xs text-red-400 mb-2">Error Message</p>
            <p className="text-sm text-red-300">{run.error_message}</p>
          </div>
        )}
      </div>

      {/* Progress Logs */}
      {(run.progressLogs && run.progressLogs.length > 0) || (run.status === "pending" || run.status === "processing") ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Progress</h3>
          <div className="space-y-3">
            {run.progressLogs && run.progressLogs.length > 0 ? (
              run.progressLogs.map((log) => {
                const getLogColor = (status?: string) => {
                  switch (status) {
                    case "success":
                      return "text-green-400 border-green-500/50";
                    case "warning":
                      return "text-yellow-400 border-yellow-500/50";
                    case "error":
                      return "text-red-400 border-red-500/50";
                    default:
                      return "text-blue-400 border-blue-500/50";
                  }
                };

                return (
                  <div
                    key={log.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${getLogColor(log.status)} bg-white/5`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {log.status === "success" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : log.status === "error" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-400">
                <p>Waiting for progress updates...</p>
              </div>
            )}
            {(run.status === "pending" || run.status === "processing") && (
              <div className="flex items-center space-x-2 text-blue-400 text-sm pt-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Results Error Display */}
      {run.resultsError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Results</h3>
              <p className="text-sm text-red-300 mb-2">{run.resultsError.message}</p>
              {run.resultsError.code && (
                <p className="text-xs text-red-400/70">Error Code: {run.resultsError.code}</p>
              )}
              <p className="text-xs text-red-400/70 mt-2">
                Please check the browser console for more details or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {run.results && run.results.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Results</h3>
          
          {Object.entries(resultsByType).map(([outputType, results]) => (
            <div key={outputType} className="space-y-4">
              <h4 className="text-lg font-medium text-gray-300 capitalize">
                {outputType} ({results.length})
              </h4>
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          ))}
        </div>
      ) : !run.resultsError ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {run.status === "pending" || run.status === "processing"
              ? "Results are being generated..."
              : "No results available"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

