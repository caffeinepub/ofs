import { useCallback, useRef, useState } from "react";

const CHUNK_SIZE = 16 * 1024; // 16KB

interface SDPData {
  type: RTCSdpType;
  sdp: string;
  candidates: RTCIceCandidateInit[];
}

export interface WebRTCTransferState {
  status:
    | "idle"
    | "creating-offer"
    | "waiting-answer"
    | "connecting"
    | "sending"
    | "receiving"
    | "done"
    | "error";
  progress: number; // 0-100
  error: string | null;
  receivedFile: { name: string; type: string; blob: Blob } | null;
}

function gatherCandidates(
  pc: RTCPeerConnection,
): Promise<RTCIceCandidateInit[]> {
  return new Promise((resolve) => {
    const candidates: RTCIceCandidateInit[] = [];
    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        resolve(candidates);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidates.push(e.candidate.toJSON());
      }
    };
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") finish();
    };
    // Timeout fallback after 4 seconds
    setTimeout(finish, 4000);
  });
}

export function useWebRTCTransfer() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const fileRef = useRef<File | null>(null);
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const receivedSizeRef = useRef(0);
  const totalSizeRef = useRef(0);
  const fileNameRef = useRef("");
  const fileTypeRef = useRef("");
  const onFileReceivedRef = useRef<
    ((file: { name: string; type: string; blob: Blob }) => void) | null
  >(null);

  const [state, setState] = useState<WebRTCTransferState>({
    status: "idle",
    progress: 0,
    error: null,
    receivedFile: null,
  });

  const setOnFileReceived = useCallback(
    (cb: (file: { name: string; type: string; blob: Blob }) => void) => {
      onFileReceivedRef.current = cb;
    },
    [],
  );

  const reset = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    fileRef.current = null;
    receivedChunksRef.current = [];
    receivedSizeRef.current = 0;
    totalSizeRef.current = 0;
    setState({ status: "idle", progress: 0, error: null, receivedFile: null });
  }, []);

  // SENDER: create offer
  const createOffer = useCallback(
    async (file: File): Promise<string> => {
      reset();
      setState((s) => ({ ...s, status: "creating-offer" }));

      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;
      fileRef.current = file;

      const dc = pc.createDataChannel("fileTransfer", { ordered: true });
      dcRef.current = dc;

      const candidatesPromise = gatherCandidates(pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const candidates = await candidatesPromise;

      const sdpData: SDPData = {
        type: offer.type,
        sdp: offer.sdp || "",
        candidates,
      };

      setState((s) => ({ ...s, status: "waiting-answer" }));
      return JSON.stringify(sdpData);
    },
    [reset],
  );

  // SENDER: apply answer from receiver
  const applyAnswer = useCallback(async (answerJson: string) => {
    const pc = pcRef.current;
    const dc = dcRef.current;
    const file = fileRef.current;
    if (!pc || !dc || !file) return;

    setState((s) => ({ ...s, status: "connecting" }));

    try {
      const answerData: SDPData = JSON.parse(answerJson);
      await pc.setRemoteDescription({
        type: answerData.type,
        sdp: answerData.sdp,
      });

      for (const candidate of answerData.candidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // ignore
        }
      }

      // Wait for DataChannel to open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          15000,
        );
        const cleanup = () => clearTimeout(timeout);
        if (dc.readyState === "open") {
          cleanup();
          resolve();
          return;
        }
        dc.onopen = () => {
          cleanup();
          resolve();
        };
        dc.onerror = (e) => {
          cleanup();
          reject(e);
        };
      });

      setState((s) => ({ ...s, status: "sending", progress: 0 }));

      // Send metadata first
      dc.send(
        JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
        }),
      );

      // Send file in chunks
      const buffer = await file.arrayBuffer();
      let offset = 0;
      while (offset < buffer.byteLength) {
        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        // Back-pressure
        while (dc.bufferedAmount > 1024 * 1024) {
          await new Promise((r) => setTimeout(r, 50));
        }
        dc.send(chunk);
        offset += chunk.byteLength;
        setState((s) => ({
          ...s,
          progress: Math.round((offset / buffer.byteLength) * 100),
        }));
      }

      // Signal completion
      dc.send(JSON.stringify({ done: true }));
      setState((s) => ({ ...s, status: "done", progress: 100 }));
    } catch (e) {
      setState((s) => ({
        ...s,
        status: "error",
        error: e instanceof Error ? e.message : "Transfer failed",
      }));
    }
  }, []);

  // RECEIVER: create answer from sender's offer
  const createAnswer = useCallback(
    async (offerJson: string): Promise<string> => {
      reset();
      setState((s) => ({ ...s, status: "creating-offer" }));

      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

      // Set up DataChannel receiver
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dcRef.current = dc;
        let metaReceived = false;

        setState((s) => ({ ...s, status: "receiving", progress: 0 }));

        dc.onmessage = (e) => {
          if (typeof e.data === "string") {
            try {
              const msg = JSON.parse(e.data as string);
              if (msg.done) {
                const blob = new Blob(receivedChunksRef.current, {
                  type: fileTypeRef.current,
                });
                const fileResult = {
                  name: fileNameRef.current,
                  type: fileTypeRef.current,
                  blob,
                };
                setState((s) => ({
                  ...s,
                  status: "done",
                  progress: 100,
                  receivedFile: fileResult,
                }));
                onFileReceivedRef.current?.(fileResult);
                return;
              }
              if (!metaReceived && msg.name) {
                metaReceived = true;
                fileNameRef.current = msg.name;
                fileTypeRef.current = msg.type;
                totalSizeRef.current = msg.size;
                receivedChunksRef.current = [];
                receivedSizeRef.current = 0;
              }
            } catch {
              // not JSON
            }
            return;
          }

          // Binary chunk
          const chunk = e.data as ArrayBuffer;
          receivedChunksRef.current.push(chunk);
          receivedSizeRef.current += chunk.byteLength;
          if (totalSizeRef.current > 0) {
            setState((s) => ({
              ...s,
              progress: Math.round(
                (receivedSizeRef.current / totalSizeRef.current) * 100,
              ),
            }));
          }
        };
      };

      const offerData: SDPData = JSON.parse(offerJson);
      await pc.setRemoteDescription({
        type: offerData.type,
        sdp: offerData.sdp,
      });

      for (const candidate of offerData.candidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // ignore
        }
      }

      const candidatesPromise = gatherCandidates(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const candidates = await candidatesPromise;

      const answerData: SDPData = {
        type: answer.type,
        sdp: answer.sdp || "",
        candidates,
      };

      return JSON.stringify(answerData);
    },
    [reset],
  );

  return {
    state,
    createOffer,
    applyAnswer,
    createAnswer,
    setOnFileReceived,
    reset,
  };
}
