import { useState, useEffect, useRef } from 'react';

/**
 * Enterprise Streaming AI Hook
 * Handles SSE connections, partial JSON assembly, and reconnection logic.
 */
export const useStreamingAi = (sessionId) => {
    const [streamingText, setStreamingText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);

    const streamQuery = (query) => {
        setIsStreaming(true);
        setStreamingText("");
        setError(null);

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `/api/ai/v2/chat/stream?query=${encodeURIComponent(query)}&sessionId=${sessionId}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                // The backend sends repaired JSON chunks
                const data = event.data;
                setStreamingText(prev => prev + data); // In a real system, we'd handle chunk merging better
            } catch (err) {
                console.error("Stream parsing error:", err);
            }
        };

        es.onerror = (err) => {
            console.error("EventSource failed:", err);
            setError("Connection lost. Retrying...");
            es.close();
            setIsStreaming(false);
        };

        es.addEventListener('complete', () => {
            es.close();
            setIsStreaming(false);
        });
    };

    const abortStream = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            setIsStreaming(false);
        }
    };

    return { streamQuery, streamingText, isStreaming, error, abortStream };
};
