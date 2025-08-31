'use client';

import { AlertCircle, ArrowRight, Brain, Settings, Upload, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// We'll import the face API after component mounts to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceapi: any = null;

interface DetectionResult {
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    score: number;
  };
  descriptor: Float32Array;
}

interface DetectionResult {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
  descriptor: Float32Array;
  label?: string;
}

export default function FaceRecognitionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);

  // Reference image state
  const [refImageUrl, setRefImageUrl] = useState('');
  const [refDetections, setRefDetections] = useState<DetectionResult[]>([]);
  const [refProcessingTime, setRefProcessingTime] = useState<number | null>(null);

  // Query image state
  const [queryImageUrl, setQueryImageUrl] = useState('');
  const [queryDetections, setQueryDetections] = useState<DetectionResult[]>([]);
  const [queryProcessingTime, setQueryProcessingTime] = useState<number | null>(null);

  // Face matcher
  const [faceMatcher, setFaceMatcher] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const refCanvasRef = useRef<HTMLCanvasElement>(null);
  const refImageRef = useRef<HTMLImageElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const queryCanvasRef = useRef<HTMLCanvasElement>(null);
  const queryImageRef = useRef<HTMLImageElement>(null);
  const queryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadModels();
  }, [selectedModel]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Load face recognition model
      await faceapi.nets.faceRecognitionNet.loadFromUri('/');

      setLoadingProgress(100);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load face recognition models. Please refresh the page.');
      setIsLoading(false);
    }
  };

  const getFaceDetectorOptions = () => {
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
  };

  const detectFacesWithDescriptors = async (
    imageElement: HTMLImageElement,
    isReference: boolean = false
  ) => {
    if (!faceapi || !imageElement) return;

    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();
      const options = getFaceDetectorOptions();
      const results = await faceapi
        .detectAllFaces(imageElement, options)
        .withFaceLandmarks()
        .withFaceDescriptors();
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      const detectionResults = results.map(
        (result: {
          detection: {
            box: { x: number; y: number; width: number; height: number };
            score: number;
          };
          descriptor: Float32Array;
        }) => ({
          box: result.detection.box,
          score: result.detection.score,
          descriptor: result.descriptor,
        })
      );

      if (isReference) {
        setRefProcessingTime(processingTime);
        setRefDetections(detectionResults);

        // Create face matcher from reference image
        if (results.length > 0) {
          const matcher = new faceapi.FaceMatcher(results);
          setFaceMatcher(matcher);
        }

        // Draw on reference canvas using face-api utilities for proper scaling
        if (refCanvasRef.current && imageElement) {
          const canvas = refCanvasRef.current;
          const img = imageElement;

          // Set canvas size to match the displayed image size (not natural size)
          const displayedWidth = img.offsetWidth;
          const displayedHeight = img.offsetHeight;

          canvas.width = displayedWidth;
          canvas.height = displayedHeight;

          // Update canvas style to match displayed dimensions
          canvas.style.width = `${displayedWidth}px`;
          canvas.style.height = `${displayedHeight}px`;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a virtual element for resizing that matches the displayed size
            const virtualDisplayElement = {
              width: displayedWidth,
              height: displayedHeight,
            };

            const resizedResults = faceapi.resizeResults(results, virtualDisplayElement);

            // Draw detections with auto-assigned labels
            const labels = faceMatcher?.labeledDescriptors?.map((ld: any) => ld.label) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
            resizedResults.forEach((result: DetectionResult, index: number) => {
              const label = labels[index] || `person_${index}`;
              const options = { label };
              const drawBox = new faceapi.draw.DrawBox(result.detection.box, options);
              drawBox.draw(canvas);
            });
          }
        }
      } else {
        setQueryProcessingTime(processingTime);

        // Match against reference faces
        let matchedResults = detectionResults;
        if (faceMatcher) {
          matchedResults = detectionResults.map((detection: DetectionResult) => ({
            ...detection,
            label: faceMatcher.findBestMatch(detection.descriptor).toString(),
          }));
        }
        setQueryDetections(matchedResults);

        // Draw on query canvas using face-api utilities for proper scaling
        if (queryCanvasRef.current && imageElement) {
          const canvas = queryCanvasRef.current;
          const img = imageElement;

          // Set canvas size to match the displayed image size (not natural size)
          const displayedWidth = img.offsetWidth;
          const displayedHeight = img.offsetHeight;

          canvas.width = displayedWidth;
          canvas.height = displayedHeight;

          // Update canvas style to match displayed dimensions
          canvas.style.width = `${displayedWidth}px`;
          canvas.style.height = `${displayedHeight}px`;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a virtual element for resizing that matches the displayed size
            const virtualDisplayElement = {
              width: displayedWidth,
              height: displayedHeight,
            };

            const resizedResults = faceapi.resizeResults(results, virtualDisplayElement);

            // Draw detections with match labels
            resizedResults.forEach((result: DetectionResult, index: number) => {
              const label = matchedResults[index]?.label || 'unknown';
              const options = { label };
              const drawBox = new faceapi.draw.DrawBox(result.detection.box, options);
              drawBox.draw(canvas);
            });
          }
        }
      }
    } catch (err) {
      console.error('Face recognition failed:', err);
      setError('Face recognition failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = (src: string, isReference: boolean = false) => {
    const imageRef = isReference ? refImageRef : queryImageRef;
    if (imageRef.current) {
      imageRef.current.src = src;
      imageRef.current.onload = () => {
        if (imageRef.current) {
          detectFacesWithDescriptors(imageRef.current, isReference);
        }
      };
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    isReference: boolean = false
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        handleImageLoad(result, isReference);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (isReference: boolean = false) => {
    const url = isReference ? refImageUrl : queryImageUrl;
    if (url.trim()) {
      handleImageLoad(url, isReference);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setIsLoading(true);
    setLoadingProgress(0);
    setFaceMatcher(null);

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
      await faceapi.nets.faceRecognitionNet.loadFromUri('/');
      setLoadingProgress(100);
      setIsLoading(false);

      // Re-detect if images are loaded
      if (refImageRef.current && refImageRef.current.src) {
        await detectFacesWithDescriptors(refImageRef.current, true);
      }
      if (queryImageRef.current && queryImageRef.current.src) {
        await detectFacesWithDescriptors(queryImageRef.current, false);
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
              <Brain className="h-5 w-5" />
              Loading Face Recognition Models...
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
                      ? 'Loading recognition models...'
                      : 'Ready!'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          Face Recognition
        </h1>
        <p className="text-muted-foreground">
          Recognize and match faces using deep neural network embeddings
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Detection Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Detection Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label>Min Confidence: {confidence[0].toFixed(2)}</Label>
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
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reference Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Reference Image
            </CardTitle>
            <CardDescription>Upload a reference image to create face identities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div>
                  <input
                    ref={refFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, true)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => refFileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Reference Image
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="refImageUrl">Reference Image URL</Label>
                  <Input
                    id="refImageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={refImageUrl}
                    onChange={e => setRefImageUrl(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleUrlSubmit(true)} className="w-full">
                  Load Reference Image
                </Button>
              </TabsContent>
            </Tabs>

            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[300px] flex items-center justify-center overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={refImageRef}
                  className="max-w-full max-h-[400px] rounded-lg block"
                  style={{ display: 'none' }}
                  onLoad={() => {
                    if (refImageRef.current) {
                      refImageRef.current.style.display = 'block';
                      detectFacesWithDescriptors(refImageRef.current, true);
                    }
                  }}
                  alt="Reference image for face recognition"
                />
                <canvas
                  ref={refCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none rounded-lg"
                  style={{
                    display: refImageRef.current?.src ? 'block' : 'none',
                    width: refImageRef.current?.offsetWidth || 0,
                    height: refImageRef.current?.offsetHeight || 0,
                  }}
                />
              </div>

              {!refImageRef.current?.src && (
                <div className="text-center text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload reference image</p>
                </div>
              )}
            </div>

            {refDetections.length > 0 && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Reference Faces:</span>
                  <Badge variant="secondary">{refDetections.length}</Badge>
                </div>
                {refProcessingTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Processing Time:</span>
                    <Badge variant="outline">{refProcessingTime}ms</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Query Image
            </CardTitle>
            <CardDescription>Upload a query image to match against reference faces</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div>
                  <input
                    ref={queryFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, false)}
                    className="hidden"
                  />
                  <Button
                    onClick={() => queryFileInputRef.current?.click()}
                    className="w-full"
                    variant="outline"
                    disabled={!faceMatcher}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Query Image
                  </Button>
                  {!faceMatcher && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a reference image first
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="queryImageUrl">Query Image URL</Label>
                  <Input
                    id="queryImageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={queryImageUrl}
                    onChange={e => setQueryImageUrl(e.target.value)}
                    disabled={!faceMatcher}
                  />
                </div>
                <Button
                  onClick={() => handleUrlSubmit(false)}
                  className="w-full"
                  disabled={!faceMatcher}
                >
                  Load Query Image
                </Button>
              </TabsContent>
            </Tabs>

            <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[300px] flex items-center justify-center overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={queryImageRef}
                  className="max-w-full max-h-[400px] rounded-lg block"
                  style={{ display: 'none' }}
                  onLoad={() => {
                    if (queryImageRef.current) {
                      queryImageRef.current.style.display = 'block';
                      detectFacesWithDescriptors(queryImageRef.current, false);
                    }
                  }}
                  alt="Query image for face recognition"
                />
                <canvas
                  ref={queryCanvasRef}
                  className="absolute top-0 left-0 pointer-events-none rounded-lg"
                  style={{
                    display: queryImageRef.current?.src ? 'block' : 'none',
                    width: queryImageRef.current?.offsetWidth || 0,
                    height: queryImageRef.current?.offsetHeight || 0,
                  }}
                />
              </div>

              {!queryImageRef.current?.src && (
                <div className="text-center text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload query image</p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Processing...</p>
                  </div>
                </div>
              )}
            </div>

            {queryDetections.length > 0 && (
              <div className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Query Faces:</span>
                    <Badge variant="secondary">{queryDetections.length}</Badge>
                  </div>
                  {queryProcessingTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Processing Time:</span>
                      <Badge variant="outline">{queryProcessingTime}ms</Badge>
                    </div>
                  )}
                </div>

                {queryDetections.map((detection, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-2">Face {index + 1}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Match Result:</span>
                        <Badge
                          variant={
                            detection.label?.includes('unknown') ? 'destructive' : 'secondary'
                          }
                        >
                          {detection.label || 'No match'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence:</span>
                        <Badge variant="outline">{Math.round(detection.score * 100)}%</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
