'use client';

import { AlertCircle, Calendar, CheckCircle, Settings, Upload } from 'lucide-react';
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
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
  age: number;
  gender: string;
  genderProbability: number;
}

export default function AgeGenderPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [imageUrl, setImageUrl] = useState('');
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample images
  const sampleImages = [
    { name: 'Happy', url: '/images/happy.jpg' },
    { name: 'Sample 1', url: '/images/bbt1.jpg' },
    { name: 'Sample 2', url: '/images/bbt2.jpg' },
    { name: 'Sample 3', url: '/images/bbt3.jpg' },
    { name: 'Sample 4', url: '/images/bbt4.jpg' },
  ];

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

      // Load age and gender model
      await faceapi.nets.ageGenderNet.loadFromUri('/');

      setLoadingProgress(100);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load age and gender recognition models. Please refresh the page.');
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

  const detectAgeAndGender = async (imageElement: HTMLImageElement) => {
    if (!faceapi || !imageElement) return;

    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();
      const options = getFaceDetectorOptions();
      const results = await faceapi
        .detectAllFaces(imageElement, options)
        .withFaceLandmarks()
        .withAgeAndGender();
      const endTime = Date.now();

      setProcessingTime(endTime - startTime);

      setDetections(
        results.map(
          (result: {
            detection: {
              box: { x: number; y: number; width: number; height: number };
              score: number;
            };
            age: number;
            gender: string;
            genderProbability: number;
          }) => ({
            box: result.detection.box,
            score: result.detection.score,
            age: result.age,
            gender: result.gender,
            genderProbability: result.genderProbability,
          })
        )
      );

      // Draw detections and age/gender on canvas using face-api utilities for proper scaling
      if (canvasRef.current && imageElement) {
        const canvas = canvasRef.current;
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

          // Resize results to match displayed image
          const resizedResults = faceapi.resizeResults(results, virtualDisplayElement);

          // Draw bounding boxes
          faceapi.draw.drawDetections(canvas, resizedResults);

          // Draw age and gender text
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resizedResults.forEach((result: any) => {
            const { age, gender, genderProbability } = result;
            new faceapi.draw.DrawTextField(
              [`${Math.round(age)} years`, `${gender} (${Math.round(genderProbability * 100)}%)`],
              result.detection.box.bottomLeft
            ).draw(canvas);
          });
        }
      }
    } catch (err) {
      console.error('Age and gender detection failed:', err);
      setError('Age and gender detection failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = (src: string) => {
    if (imageRef.current) {
      imageRef.current.src = src;
      imageRef.current.onload = () => {
        if (imageRef.current) {
          detectAgeAndGender(imageRef.current);
        }
      };
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        handleImageLoad(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      handleImageLoad(imageUrl);
    }
  };

  const handleModelChange = async (newModel: string) => {
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

      // Re-detect if image is loaded
      if (imageRef.current && imageRef.current.src) {
        detectAgeAndGender(imageRef.current);
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
              <Calendar className="h-5 w-5" />
              Loading Age & Gender Models...
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
          Age & Gender Recognition
        </h1>
        <p className="text-muted-foreground">Predict age and gender from facial features</p>
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
                <Upload className="h-4 w-4" />
                Upload Image
              </CardTitle>
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
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Sample Images</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {sampleImages.map(sample => (
                        <Button
                          key={sample.name}
                          variant="ghost"
                          className="h-auto p-2 flex flex-col gap-1"
                          onClick={() => handleImageLoad(sample.url)}
                        >
                          <div className="text-xs">{sample.name}</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleUrlSubmit} className="w-full">
                    Load Image
                  </Button>
                </TabsContent>
              </Tabs>
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

              {imageRef.current && imageRef.current.src && (
                <Button
                  onClick={() => detectAgeAndGender(imageRef.current!)}
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Detect Again'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {detections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Age & Gender Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Faces Detected:</span>
                    <Badge variant="secondary">{detections.length}</Badge>
                  </div>

                  {processingTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processing Time:</span>
                      <Badge variant="outline">{processingTime}ms</Badge>
                    </div>
                  )}

                  {detections.map((detection, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Face {index + 1}</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Age:</span>
                          <Badge variant="secondary">{Math.round(detection.age)} years</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Gender:</span>
                          <Badge variant="secondary">
                            {detection.gender} ({Math.round(detection.genderProbability * 100)}%)
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Confidence:</span>
                          <Badge variant="outline">{Math.round(detection.score * 100)}%</Badge>
                        </div>
                        <div>
                          Position: ({Math.round(detection.box.x)}, {Math.round(detection.box.y)})
                        </div>
                        <div>
                          Size: {Math.round(detection.box.width)} ×{' '}
                          {Math.round(detection.box.height)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Image Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
              <CardDescription>
                Upload an image or select a sample to start analyzing age and gender
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    className="max-w-full max-h-[600px] rounded-lg block"
                    style={{ display: 'none' }}
                    onLoad={() => {
                      if (imageRef.current) {
                        imageRef.current.style.display = 'block';
                        detectAgeAndGender(imageRef.current);
                      }
                    }}
                    alt="Input for age and gender detection"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none rounded-lg"
                    style={{
                      display: imageRef.current?.src ? 'block' : 'none',
                      width: imageRef.current?.offsetWidth || 0,
                      height: imageRef.current?.offsetHeight || 0,
                    }}
                  />
                </div>

                {!imageRef.current?.src && (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No image selected</p>
                    <p className="text-sm">Upload an image or choose a sample to get started</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
