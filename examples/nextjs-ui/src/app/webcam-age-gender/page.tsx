'use client';

import { AlertCircle, Calendar, Eye, Pause, Play, Settings, Users, Webcam } from 'lucide-react';
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

interface DetectionStats {
  totalFrames: number;
  avgProcessingTime: number;
  currentFps: number;
  estimatedFps: number;
}

interface FaceResult {
  age: number;
  gender: string;
  genderProbability: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function WebcamAgeGenderPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [hideBoundingBoxes, setHideBoundingBoxes] = useState(false);
  const [detectionStats, setDetectionStats] = useState<DetectionStats>({
    totalFrames: 0,
    avgProcessingTime: 0,
    currentFps: 0,
    estimatedFps: 0,
  });
  const [currentFaces, setCurrentFaces] = useState<FaceResult[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const statsRef = useRef({
    frameCount: 0,
    totalProcessingTime: 0,
    lastFpsUpdate: Date.now(),
    lastFrameTime: Date.now(),
  });

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

        setLoadingProgress(50);

        // Load face landmark model for alignment
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');

        setLoadingProgress(75);

        // Load age and gender model
        await faceapi.nets.ageGenderNet.loadFromUri('/');

        setLoadingProgress(100);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadModels();
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
      }
    } catch (err) {
      console.error('Failed to start webcam:', err);
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
    setIsDetecting(false);
    setCurrentFaces([]);
  };

  const detectFaces = useCallback(async () => {
    if (!faceapi || !videoRef.current || !canvasRef.current || !isDetecting) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const startTime = Date.now();

    try {
      const options = getFaceDetectorOptions();
      const results = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks()
        .withAgeAndGender();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Update stats
      statsRef.current.frameCount++;
      statsRef.current.totalProcessingTime += processingTime;
      const now = Date.now();

      // Update FPS every second
      if (now - statsRef.current.lastFpsUpdate > 1000) {
        const currentFps = 1000 / (now - statsRef.current.lastFrameTime);
        const avgProcessingTime =
          statsRef.current.totalProcessingTime / statsRef.current.frameCount;
        const estimatedFps = processingTime > 0 ? 1000 / processingTime : 0;

        setDetectionStats({
          totalFrames: statsRef.current.frameCount,
          avgProcessingTime: Math.round(avgProcessingTime),
          currentFps: Math.round(currentFps * 10) / 10,
          estimatedFps: Math.round(estimatedFps * 10) / 10,
        });

        statsRef.current.lastFpsUpdate = now;
      }
      statsRef.current.lastFrameTime = now;

      // Update face results
      const faceResults: FaceResult[] = results.map(
        (result: {
          detection: {
            box: { x: number; y: number; width: number; height: number };
          };
          age: number;
          gender: string;
          genderProbability: number;
        }) => ({
          age: result.age,
          gender: result.gender,
          genderProbability: result.genderProbability,
          box: result.detection.box,
        })
      );

      setCurrentFaces(faceResults);

      // Draw results on canvas
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!hideBoundingBoxes && results.length > 0) {
          const resizedResults = faceapi.resizeResults(results, displaySize);

          // Draw bounding boxes
          faceapi.draw.drawDetections(canvas, resizedResults);

          // Draw age and gender text
          resizedResults.forEach(
            (result: {
              age: number;
              gender: string;
              genderProbability: number;
              detection: { box: { bottomLeft: { x: number; y: number } } };
            }) => {
              const { age, gender, genderProbability } = result;
              new faceapi.draw.DrawTextField(
                [`${Math.round(age)} years`, `${gender} (${Math.round(genderProbability * 100)}%)`],
                result.detection.box.bottomLeft
              ).draw(canvas);
            }
          );
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    }

    animationRef.current = requestAnimationFrame(detectFaces);
  }, [isDetecting, getFaceDetectorOptions, hideBoundingBoxes]);

  const startDetection = () => {
    if (!isStreaming) return;

    setIsDetecting(true);
    statsRef.current = {
      frameCount: 0,
      totalProcessingTime: 0,
      lastFpsUpdate: Date.now(),
      lastFrameTime: Date.now(),
    };
    detectFaces();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCurrentFaces([]);

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleModelChange = async (newModel: string) => {
    const wasDetecting = isDetecting;
    if (wasDetecting) {
      stopDetection();
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
      setLoadingProgress(50);
      await faceapi.nets.faceLandmark68Net.loadFromUri('/');
      setLoadingProgress(75);
      await faceapi.nets.ageGenderNet.loadFromUri('/');
      setLoadingProgress(100);
      setIsLoading(false);

      if (wasDetecting) {
        setTimeout(startDetection, 100);
      }
    } catch {
      setError('Failed to load new model');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Loading Webcam Age & Gender Models...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 25
                ? 'Initializing...'
                : loadingProgress < 50
                  ? 'Loading detection models...'
                  : loadingProgress < 75
                    ? 'Loading landmark models...'
                    : loadingProgress < 100
                      ? 'Loading age/gender models...'
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
          <Calendar className="h-8 w-8 text-primary" />
          Webcam Age & Gender Recognition
        </h1>
        <p className="text-muted-foreground">
          Real-time age and gender prediction from your webcam
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
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Webcam
                  </Button>
                )}

                {isStreaming && (
                  <>
                    {!isDetecting ? (
                      <Button onClick={startDetection} className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Start Detection
                      </Button>
                    ) : (
                      <Button onClick={stopDetection} variant="outline" className="w-full">
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Detection
                      </Button>
                    )}
                  </>
                )}
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
          {isDetecting && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Time:</span>
                    <Badge variant="outline">{detectionStats.avgProcessingTime}ms</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated FPS:</span>
                    <Badge variant="secondary">{detectionStats.estimatedFps}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current FPS:</span>
                    <Badge variant="outline">{detectionStats.currentFps}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Frames:</span>
                    <Badge variant="outline">{detectionStats.totalFrames}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Detection Results */}
          {currentFaces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Current Detections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Faces Detected:</span>
                    <Badge variant="secondary">{currentFaces.length}</Badge>
                  </div>

                  {currentFaces.map((face, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Face {index + 1}</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Age:</span>
                          <Badge variant="secondary">{Math.round(face.age)} years</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Gender:</span>
                          <Badge variant="secondary">
                            {face.gender} ({Math.round(face.genderProbability * 100)}%)
                          </Badge>
                        </div>
                        <div>
                          Position: ({Math.round(face.box.x)}, {Math.round(face.box.y)})
                        </div>
                        <div>
                          Size: {Math.round(face.box.width)} × {Math.round(face.box.height)}
                        </div>
                      </div>
                    </div>
                  ))}
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
                Real-time age and gender recognition from your webcam
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
                      transform: 'scaleX(-1)', // Mirror the video
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current && canvasRef.current) {
                        const video = videoRef.current;
                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none rounded-lg"
                    style={{
                      display: isStreaming ? 'block' : 'none',
                      transform: 'scaleX(-1)', // Mirror the canvas to match video
                    }}
                  />
                </div>

                {!isStreaming && (
                  <div className="text-center text-muted-foreground">
                    <Webcam className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Webcam not active</p>
                    <p className="text-sm">
                      Click &quot;Start Webcam&quot; to begin age and gender detection
                    </p>
                  </div>
                )}

                {isStreaming && !isDetecting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm">Click &quot;Start Detection&quot; to begin analysis</p>
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
