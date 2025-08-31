'use client';

import { Activity, AlertCircle, Pause, Play, Settings, Webcam } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// We'll import the face API after component mounts to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceapi: any = null;

export default function WebcamDetectionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('tiny_face_detector');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('128');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);

  // Performance metrics
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const timesRef = useRef<number[]>([]);

  useEffect(() => {
    loadModels();
    return () => {
      stopWebcam();
    };
  }, [selectedModel]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModels = async () => {
    try {
      setLoadingProgress(10);
      // Dynamic import to avoid SSR issues
      const faceAPI = await import('modern-face-api');
      faceapi = faceAPI;

      setLoadingProgress(50);

      // Load face detection model
      if (selectedModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }

      setLoadingProgress(100);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load face detection models. Please refresh the page.');
      setIsLoading(false);
    }
  };

  const getFaceDetectorOptions = useCallback(() => {
    if (selectedModel === 'ssd_mobilenetv1') {
      return new faceapi.SsdMobilenetv1Options({
        minConfidence: confidence[0],
      });
    } else {
      return new faceapi.TinyFaceDetectorOptions({
        inputSize: parseInt(inputSize),
        scoreThreshold: scoreThreshold[0],
      });
    }
  }, [selectedModel, confidence, inputSize, scoreThreshold]);

  const updateTimeStats = (timeInMs: number) => {
    timesRef.current = [timeInMs].concat(timesRef.current).slice(0, 30);
    const avgTimeInMs = timesRef.current.reduce((total, t) => total + t) / timesRef.current.length;
    setProcessingTime(Math.round(avgTimeInMs));
    setFps(Math.round(1000 / avgTimeInMs));
  };

  const detectFaces = useCallback(async () => {
    if (!faceapi || !videoRef.current || !canvasRef.current || isPaused) {
      if (!isPaused) {
        animationRef.current = requestAnimationFrame(detectFaces);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended) {
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const startTime = Date.now();
      const options = getFaceDetectorOptions();
      const result = await faceapi.detectSingleFace(video, options);
      const endTime = Date.now();

      updateTimeStats(endTime - startTime);

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (result) {
        setDetectionCount(1);
        // Match canvas dimensions to video
        const dims = faceapi.matchDimensions(canvas, video, true);
        faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
      } else {
        setDetectionCount(0);
      }
    } catch (err) {
      console.error('Face detection failed:', err);
    }

    if (!isPaused) {
      animationRef.current = requestAnimationFrame(detectFaces);
    }
  }, [isPaused, getFaceDetectorOptions]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            // Match canvas size to video
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;

            // Start detection loop
            detectFaces();
          }
        };
      }
    } catch (err) {
      console.error('Failed to access webcam:', err);
      setError('Failed to access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setIsStreaming(false);
    setDetectionCount(0);
    setFps(0);
    setProcessingTime(0);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused && isStreaming) {
      detectFaces();
    }
  };

  const handleModelChange = async (newModel: string) => {
    const wasStreaming = isStreaming;
    if (wasStreaming) {
      stopWebcam();
    }

    setSelectedModel(newModel);
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      setLoadingProgress(50);
      if (newModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }
      setLoadingProgress(100);
      setIsLoading(false);

      if (wasStreaming) {
        setTimeout(() => startWebcam(), 500);
      }
    } catch {
      setError('Failed to load new model');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webcam className="h-5 w-5" />
              Loading Webcam Detection Models...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 50
                ? 'Initializing...'
                : loadingProgress < 100
                  ? 'Loading detection models...'
                  : 'Ready!'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Webcam className="h-8 w-8 text-primary" />
          Webcam Face Detection
        </h1>
        <p className="text-muted-foreground">
          Real-time face detection using your webcam with live performance metrics
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Camera Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isStreaming ? (
                <Button onClick={startWebcam} className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={togglePause}
                    className="w-full"
                    variant={isPaused ? 'default' : 'secondary'}
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button onClick={stopWebcam} className="w-full" variant="destructive">
                    Stop Camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model">Detection Model</Label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssd_mobilenetv1">SSD MobileNet V1</SelectItem>
                    <SelectItem value="tiny_face_detector">Tiny Face Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedModel === 'ssd_mobilenetv1' ? (
                <div>
                  <Label>Minimum Confidence: {confidence[0].toFixed(2)}</Label>
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    min={0.1}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="inputSize">Input Size</Label>
                    <Select value={inputSize} onValueChange={setInputSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="128">128 x 128</SelectItem>
                        <SelectItem value="160">160 x 160</SelectItem>
                        <SelectItem value="224">224 x 224</SelectItem>
                        <SelectItem value="320">320 x 320</SelectItem>
                        <SelectItem value="416">416 x 416</SelectItem>
                        <SelectItem value="512">512 x 512</SelectItem>
                        <SelectItem value="608">608 x 608</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Score Threshold: {scoreThreshold[0].toFixed(2)}</Label>
                    <Slider
                      value={scoreThreshold}
                      onValueChange={setScoreThreshold}
                      min={0.1}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">FPS:</span>
                  <Badge variant="secondary">{fps}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Time:</span>
                  <Badge variant="outline">{processingTime}ms</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Faces Detected:</span>
                  <Badge variant={detectionCount > 0 ? 'default' : 'secondary'}>
                    {detectionCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={isStreaming ? (isPaused ? 'secondary' : 'default') : 'outline'}>
                    {!isStreaming ? 'Stopped' : isPaused ? 'Paused' : 'Running'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Live Video Feed</CardTitle>
              <CardDescription>
                Real-time face detection with performance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="max-w-full max-h-[600px] rounded-lg"
                  style={{ display: isStreaming ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{ display: isStreaming ? 'block' : 'none' }}
                />

                {!isStreaming && (
                  <div className="text-center text-muted-foreground">
                    <Webcam className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Camera not started</p>
                    <p className="text-sm">
                      Click &quot;Start Camera&quot; to begin real-time face detection
                    </p>
                  </div>
                )}

                {isStreaming && isPaused && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <Pause className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Detection Paused</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
