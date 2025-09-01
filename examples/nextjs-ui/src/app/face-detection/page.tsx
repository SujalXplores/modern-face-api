'use client';

import { AlertCircle, CheckCircle, Settings, Target, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SampleImageSelector, sampleImageSets } from '@/components/sample-image-selector';
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
}

export default function FaceDetectionPage() {
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
  const [selectedSampleImage, setSelectedSampleImage] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle sample image selection
  const handleSampleImageChange = (imageUrl: string) => {
    setSelectedSampleImage(imageUrl);
    handleImageLoad(imageUrl);
  };

  useEffect(() => {
    loadModels();
  }, [selectedModel]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModels = async () => {
    try {
      setLoadingProgress(10);
      // Dynamic import to avoid SSR issues
      const faceAPI = await import('modern-face-api');
      faceapi = faceAPI;

      setLoadingProgress(30);

      // Load the selected model
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

  const detectFaces = async (imageElement: HTMLImageElement) => {
    if (!faceapi || !imageElement) return;

    setIsProcessing(true);
    setError(null);

    try {
      const startTime = Date.now();
      const options = getFaceDetectorOptions();
      const results = await faceapi.detectAllFaces(imageElement, options);
      const endTime = Date.now();

      setProcessingTime(endTime - startTime);
      setDetections(
        results.map(
          (detection: {
            box: { x: number; y: number; width: number; height: number };
            score: number;
          }) => ({
            box: detection.box,
            score: detection.score,
          })
        )
      );

      // Draw detections on canvas using face-api utilities for proper scaling
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

        // Clear the canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Create a virtual element for resizing that matches the displayed size
        const virtualDisplayElement = {
          width: displayedWidth,
          height: displayedHeight,
        };

        // Resize results to match the displayed image and draw using face-api utilities
        const resizedResults = faceapi.resizeResults(results, virtualDisplayElement);
        faceapi.draw.drawDetections(canvas, resizedResults);
      }
    } catch (err) {
      console.error('Detection failed:', err);
      setError('Face detection failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = (src: string) => {
    if (imageRef.current) {
      imageRef.current.src = src;
      imageRef.current.onload = () => {
        if (imageRef.current) {
          detectFaces(imageRef.current);
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
      setLoadingProgress(30);
      if (newModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }
      setLoadingProgress(100);
      setIsLoading(false);

      // Re-detect if image is loaded
      if (imageRef.current && imageRef.current.src) {
        detectFaces(imageRef.current);
      }
    } catch {
      setError('Failed to load new model');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="card-shadow hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              Loading Face Detection Models...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={loadingProgress} className="w-full h-2" />
            <p className="text-sm text-muted-foreground">
              {loadingProgress < 30
                ? 'Initializing...'
                : loadingProgress < 100
                  ? 'Loading models...'
                  : 'Ready!'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Face Detection</h1>
        <p className="text-muted-foreground text-lg">
          Detect faces in images using state-of-the-art machine learning models
        </p>
      </div>

      {error && (
        <Alert className="border-destructive/20 bg-destructive/5" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="card-shadow hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="upload" className="text-sm">
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-sm">
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-6">
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
                      className="w-full h-11"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </Button>
                  </div>

                  <SampleImageSelector
                    images={sampleImageSets.basic}
                    value={selectedSampleImage}
                    onValueChange={handleSampleImageChange}
                    label="Sample Images"
                    placeholder="Choose a sample image..."
                    className="mt-4"
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Button onClick={handleUrlSubmit} className="w-full h-11">
                    Load Image
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="card-shadow hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium">
                  Detection Model
                </Label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssd_mobilenetv1">SSD MobileNet V1</SelectItem>
                    <SelectItem value="tiny_face_detector">Tiny Face Detector</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedModel === 'ssd_mobilenetv1' ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Minimum Confidence: {confidence[0].toFixed(2)}
                  </Label>
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="inputSize" className="text-sm font-medium">
                      Input Size
                    </Label>
                    <Select value={inputSize} onValueChange={setInputSize}>
                      <SelectTrigger className="h-11">
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

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Score Threshold: {scoreThreshold[0].toFixed(2)}
                    </Label>
                    <Slider
                      value={scoreThreshold}
                      onValueChange={setScoreThreshold}
                      min={0.1}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {imageRef.current && imageRef.current.src && (
                <Button
                  onClick={() => detectFaces(imageRef.current!)}
                  className="w-full h-11"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Detect Again'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {detections.length > 0 && (
            <Card className="card-shadow hover-lift">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Detection Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <span className="text-sm font-medium">Faces Detected:</span>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      {detections.length}
                    </Badge>
                  </div>

                  {processingTime && (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-sm font-medium">Processing Time:</span>
                      <Badge variant="outline">{processingTime}ms</Badge>
                    </div>
                  )}

                  <div className="space-y-3">
                    {detections.map((detection, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg bg-card">
                        <div className="text-sm font-medium mb-3 text-foreground">
                          Face {index + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                          <div>Confidence: {Math.round(detection.score * 100)}%</div>
                          <div>
                            Position: ({Math.round(detection.box.x)}, {Math.round(detection.box.y)})
                          </div>
                          <div className="col-span-2">
                            Size: {Math.round(detection.box.width)} ×{' '}
                            {Math.round(detection.box.height)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Image Display */}
        <div className="lg:col-span-2">
          <Card className="card-shadow hover-lift">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Image Preview</CardTitle>
              <CardDescription className="text-base">
                Upload an image or select a sample to start detecting faces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-accent/30 rounded-xl border-2 border-dashed border-border min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    className="max-w-full max-h-[600px] rounded-lg block"
                    style={{ display: 'none' }}
                    onLoad={() => {
                      if (imageRef.current) {
                        imageRef.current.style.display = 'block';
                        detectFaces(imageRef.current);
                      }
                    }}
                    alt="Input for face detection"
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
                    <p className="text-lg font-medium">No image selected</p>
                    <p className="text-sm">Upload an image or choose a sample to get started</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="bg-card border border-border p-6 rounded-lg shadow-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                      <p className="text-sm font-medium">Processing...</p>
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
