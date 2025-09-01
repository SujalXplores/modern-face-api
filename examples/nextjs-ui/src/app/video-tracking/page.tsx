'use client';

import { AlertCircle, Play, Settings, Target, Video } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceapi: any = null;

export default function VideoTrackingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('tiny_face_detector');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [withFaceLandmarks, setWithFaceLandmarks] = useState(true);
  const [hideBoundingBoxes, setHideBoundingBoxes] = useState(false);

  // Performance metrics
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timesRef = useRef<number[]>([]);

  // Use refs for stable state access to avoid useEffect dependencies
  const settingsRef = useRef({
    withFaceLandmarks,
    hideBoundingBoxes,
    selectedModel,
    confidence: confidence[0],
    inputSize,
    scoreThreshold: scoreThreshold[0],
  });

  // Update settings ref when state changes
  useEffect(() => {
    settingsRef.current = {
      withFaceLandmarks,
      hideBoundingBoxes,
      selectedModel,
      confidence: confidence[0],
      inputSize,
      scoreThreshold: scoreThreshold[0],
    };
  }, [withFaceLandmarks, hideBoundingBoxes, selectedModel, confidence, inputSize, scoreThreshold]);

  // Single useEffect for model loading
  useEffect(() => {
    const loadAllModels = async () => {
      try {
        setLoadingProgress(10);
        const faceAPI = await import('modern-face-api');
        faceapi = faceAPI;

        setLoadingProgress(40);

        // Load face detection model with better error handling
        const net = getCurrentFaceDetectionNet();
        if (net && !net.params) {
          try {
            await net.load('/');
            console.log(`${selectedModel} model loaded successfully`);
          } catch (err) {
            console.error(`Failed to load ${selectedModel} model:`, err);
            throw err;
          }
        }

        setLoadingProgress(70);

        // Always load landmark model for potential use
        if (!faceapi.nets.faceLandmark68Net.params) {
          try {
            await faceapi.nets.faceLandmark68Net.loadFromUri('/');
            console.log('Landmark model loaded successfully');
          } catch (err) {
            console.error('Failed to load landmark model:', err);
            // Don't throw here, landmarks are optional
          }
        }

        setLoadingProgress(100);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load face tracking models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadAllModels();
  }, [selectedModel]);

  const getFaceDetectorOptions = useCallback(() => {
    const settings = settingsRef.current;
    if (settings.selectedModel === 'ssd_mobilenetv1') {
      return new faceapi.SsdMobilenetv1Options({
        minConfidence: settings.confidence,
      });
    } else {
      // Tiny Face Detector options
      return new faceapi.TinyFaceDetectorOptions({
        inputSize: parseInt(settings.inputSize),
        scoreThreshold: settings.scoreThreshold,
      });
    }
  }, []);

  const getCurrentFaceDetectionNet = () => {
    const settings = settingsRef.current;
    if (settings.selectedModel === 'ssd_mobilenetv1') {
      return faceapi.nets.ssdMobilenetv1;
    }
    if (settings.selectedModel === 'tiny_face_detector') {
      return faceapi.nets.tinyFaceDetector;
    }
  };

  const isFaceDetectionModelLoaded = () => {
    const net = getCurrentFaceDetectionNet();
    const isLoaded = !!net?.params;

    // Additional check for Tiny Face Detector
    if (settingsRef.current.selectedModel === 'tiny_face_detector' && isLoaded) {
      // Verify the model has the required properties
      return !!net.params && typeof net.forwardInput === 'function';
    }

    return isLoaded;
  };

  const updateTimeStats = useCallback((timeInMs: number) => {
    timesRef.current = [timeInMs].concat(timesRef.current).slice(0, 30);
    const avgTimeInMs =
      timesRef.current.reduce((total: number, t: number) => total + t) / timesRef.current.length;

    // Batch state updates to reduce re-renders
    const newProcessingTime = Math.round(avgTimeInMs);
    const newFps = faceapi.utils
      ? faceapi.utils.round(1000 / avgTimeInMs)
      : Math.round(1000 / avgTimeInMs);

    setProcessingTime(newProcessingTime);
    setFps(newFps);
  }, []);

  const onPlay = useCallback(async () => {
    if (!faceapi || !videoRef.current || !canvasRef.current) {
      setTimeout(() => onPlay(), 100);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.currentTime || video.paused || video.ended || !isFaceDetectionModelLoaded()) {
      setTimeout(() => onPlay(), 100);
      return;
    }

    try {
      const startTime = Date.now();
      const options = getFaceDetectorOptions();

      // Validate options for Tiny Face Detector
      const { selectedModel, inputSize, scoreThreshold } = settingsRef.current;
      if (selectedModel === 'tiny_face_detector') {
        // Ensure valid input size (must be 128, 160, 224, 320, 416, 512, 608)
        const validInputSizes = [128, 160, 224, 320, 416, 512, 608];
        const parsedInputSize = parseInt(inputSize);
        if (!validInputSizes.includes(parsedInputSize)) {
          console.warn('Invalid input size for Tiny Face Detector:', parsedInputSize, 'using 416');
          settingsRef.current.inputSize = '416';
        }

        // Ensure valid score threshold (0-1)
        if (scoreThreshold < 0 || scoreThreshold > 1) {
          console.warn(
            'Invalid score threshold for Tiny Face Detector:',
            scoreThreshold,
            'using 0.5'
          );
          settingsRef.current.scoreThreshold = 0.5;
        }
      }

      // Use refs for stable state access
      const { withFaceLandmarks, hideBoundingBoxes } = settingsRef.current;
      const drawBoxes = !hideBoundingBoxes;
      const drawLandmarks = withFaceLandmarks;

      let task = faceapi.detectAllFaces(video, options);

      // Only add landmarks if model is loaded and toggle is on
      if (withFaceLandmarks && faceapi.nets.faceLandmark68Net.params) {
        task = task.withFaceLandmarks();
      }

      const results = await task;

      const endTime = Date.now();
      updateTimeStats(endTime - startTime);

      setDetectionCount(results.length);

      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (results.length > 0) {
        // Match canvas dimensions to video
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedResults = faceapi.resizeResults(results, dims);

        if (drawBoxes) {
          faceapi.draw.drawDetections(canvas, resizedResults);
        }

        // Only draw landmarks if they exist in the results
        if (drawLandmarks && resizedResults[0]?.landmarks) {
          faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
        }
      }
    } catch (err) {
      console.error('Face detection failed:', err);
    }

    setTimeout(() => onPlay(), 150); // Slightly longer interval for better performance
  }, []); // Remove dependencies to make it more stable

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setIsLoading(true);
    setLoadingProgress(0);

    try {
      setLoadingProgress(40);
      if (newModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }
      setLoadingProgress(70);
      await faceapi.loadFaceLandmarkModel('/');
      setLoadingProgress(100);
      setIsLoading(false);
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
              <Video className="h-5 w-5" />
              Loading Video Face Tracking Models...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 40
                ? 'Initializing...'
                : loadingProgress < 70
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
          <Video className="h-8 w-8 text-primary" />
          Video Face Tracking
        </h1>
        <p className="text-muted-foreground">
          Real-time face detection and landmarks on the Big Bang Theory demo video
        </p>
      </div>

      {error ? (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Video Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Video will start automatically. Use browser controls to play/pause.
              </p>
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="withFaceLandmarks"
                  checked={withFaceLandmarks}
                  onCheckedChange={setWithFaceLandmarks}
                />
                <Label htmlFor="withFaceLandmarks">Detect Face Landmarks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hideBoundingBoxes"
                  checked={hideBoundingBoxes}
                  onCheckedChange={setHideBoundingBoxes}
                />
                <Label htmlFor="hideBoundingBoxes">Hide Bounding Boxes</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Sample Demo Video</CardTitle>
              <CardDescription>
                Real-time face detection with optional landmarks detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px] flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/bbt.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="max-w-full max-h-[600px] rounded-lg"
                  onLoadedMetadata={() => {
                    if (videoRef.current && canvasRef.current) {
                      // Match canvas size to video
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                      // Start detection loop
                      setTimeout(() => onPlay(), 100);
                    }
                  }}
                />
                <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
