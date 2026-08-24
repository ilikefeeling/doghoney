/**
 * Video & Animation Recording Utility for TrunkFit 3D Simulation
 * Uses HTML5 Canvas captureStream + MediaRecorder API to record 3D loading animations.
 */

export interface RecordOptions {
  durationMs?: number; // default 3000ms (3s)
  frameRate?: number;  // default 30 fps
  mimeType?: string;
}

/**
 * Check if the browser supports MediaRecorder canvas recording
 */
export function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    typeof MediaRecorder === 'function'
  );
}

/**
 * Record a Canvas element for a specified duration and return a video Blob URL
 */
export function recordCanvasStream(
  canvas: HTMLCanvasElement,
  options: RecordOptions = {}
): Promise<{ blob: Blob; url: string }> {
  const { durationMs = 3000, frameRate = 30 } = options;

  return new Promise((resolve, reject) => {
    if (!isRecordingSupported()) {
      reject(new Error('현재 브라우저에서는 3D 영상 녹화를 지원하지 않습니다.'));
      return;
    }

    try {
      // 1. Capture stream from canvas
      const stream = canvas.captureStream(frameRate);

      // Determine best supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      const recorderOptions: MediaRecorderOptions = selectedMimeType
        ? { mimeType: selectedMimeType, videoBitsPerSecond: 2500000 }
        : {};

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      };

      mediaRecorder.onerror = (event) => {
        reject(event);
      };

      // Start recording
      mediaRecorder.start(100);

      // Stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationMs);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Download a Blob/DataUrl as a file
 */
export function triggerFileDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
