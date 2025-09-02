'use client';

import { AlertCircle, MapPin, Play, Settings, Target, Webcam } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';

// We'll import the face API after component mounts to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceapi: any = null;

export default function WebcamLandmarksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [hideBoundingBoxes, setHideBoundingBoxes] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);

  // Performance metrics
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [landmarkCount, setLandmarkCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timesRef = useRef<number[]>([]);
  const isDetectingRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingProgress(10);
        // Dynamic import to avoid SSR issues
        const faceAPI = await import('modern-face-api');
        faceapi = faceAPI;

        setLoadingProgress(25);

        // Load face detection model
        if (selectedModel === 'ssd_mobilenetv1') {
          await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
        } else {
          await faceapi.nets.tinyFaceDetector.loadFromUri('/');
        }

        setLoadingProgress(75);

        // Load face landmark model
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');

        setLoadingProgress(100);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadModels();
    return () => {
      stopWebcam();
    };
  }, [selectedModel]);

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

  const detectLandmarks = useCallback(async () => {
    if (!faceapi || !videoRef.current || !canvasRef.current || !isDetectingRef.current) {
      if (isDetectingRef.current) {
        setTimeout(() => detectLandmarks(), 100);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended || video.readyState !== 4) {
      setTimeout(() => detectLandmarks(), 100);
      return;
    }

    const startTime = Date.now();

    try {
      const options = getFaceDetectorOptions();
      const result = await faceapi.detectSingleFace(video, options).withFaceLandmarks();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      updateTimeStats(processingTime);

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (result) {
        setLandmarkCount(68); // Standard 68 landmarks

        // Draw results on canvas
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedResult = faceapi.resizeResults(result, dims);

        if (!hideBoundingBoxes) {
          faceapi.draw.drawDetections(canvas, resizedResult);
        }

        if (showLandmarks) {
          faceapi.draw.drawFaceLandmarks(canvas, resizedResult);
        }
      } else {
        setLandmarkCount(0);
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    if (isDetectingRef.current) {
      setTimeout(() => detectLandmarks(), 100);
    }
  }, [getFaceDetectorOptions, hideBoundingBoxes, showLandmarks]);

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
        // Start detection automatically when video loads
        isDetectingRef.current = true;
      }
    } catch (err) {
      console.error('Failed to start webcam:', err);
      setError('Failed to access webcam. Please ensure you have granted camera permissions.');
    }
  };

  const stopWebcam = () => {
    isDetectingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setLandmarkCount(0);
    setFps(0);
    setProcessingTime(0);
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
      setLoadingProgress(25);
      if (newModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }
      setLoadingProgress(75);
      await faceapi.nets.faceLandmark68Net.loadFromUri('/');
      setLoadingProgress(100);
      setIsLoading(false);

      if (wasStreaming) {
        setTimeout(() => startWebcam(), 100);
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
              <MapPin className="h-5 w-5" />
              Loading Webcam Landmark Models...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 25
                ? 'Initializing...'
                : loadingProgress < 75
                  ? 'Loading detection models...'
                  : loadingProgress < 100
                    ? 'Loading landmark models...'
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
          <MapPin className="h-8 w-8 text-primary" />
          Webcam Face Landmarks
        </h1>
        <p className="text-muted-foreground">
          Real-time facial landmark detection from your webcam
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webcam className="h-4 w-4" />
                Webcam Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {!isStreaming ? (
                  <Button onClick={startWebcam} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Start Webcam
                  </Button>
                ) : (
                  <Button onClick={stopWebcam} variant="outline" className="w-full">
                    Stop Webcam
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hideBoundingBoxes"
                    checked={hideBoundingBoxes}
                    onCheckedChange={setHideBoundingBoxes}
                  />
                  <Label htmlFor="hideBoundingBoxes">Hide Bounding Boxes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLandmarks"
                    checked={showLandmarks}
                    onCheckedChange={setShowLandmarks}
                  />
                  <Label htmlFor="showLandmarks">Show Landmarks</Label>
                </div>
              </div>
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

          {/* Performance Stats */}
          {isStreaming && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Time:</span>
                    <Badge variant="outline">{processingTime}ms</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">FPS:</span>
                    <Badge variant="secondary">{fps}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Landmarks:</span>
                    <Badge variant={landmarkCount > 0 ? 'default' : 'outline'}>
                      {landmarkCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Video Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Video Stream</CardTitle>
              <CardDescription>
                Real-time facial landmark detection from your webcam
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="max-w-full max-h-[600px] rounded-lg"
                    style={{
                      display: isStreaming ? 'block' : 'none',
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current && canvasRef.current) {
                        // Match canvas size to video using faceapi utility
                        faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                        // Start detection loop
                        setTimeout(() => detectLandmarks(), 100);
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none rounded-lg w-full h-full"
                    style={{
                      display: isStreaming ? 'block' : 'none',
                    }}
                  />
                </div>

                {!isStreaming && (
                  <div className="text-center text-muted-foreground">
                    <Webcam className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Webcam not active</p>
                    <p className="text-sm">
                      Click &quot;Start Webcam&quot; to begin landmark detection
                    </p>
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
