'use client';

import { AlertCircle, CheckCircle, Clock, Layers, Settings, Upload, Zap } from 'lucide-react';
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

interface BatchResult {
  imageIndex: number;
  imageName: string;
  processingTime: number;
  landmarks: unknown[];
  faces: number;
}

export default function BatchLandmarksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [numImages, setNumImages] = useState(10);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [individualTime, setIndividualTime] = useState<number | null>(null);
  const [batchTime, setBatchTime] = useState<number | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Sample images for batch processing
  const sampleImageSets = [
    { name: 'BBT Cast (5 images)', count: 5, prefix: 'bbt' },
    { name: 'Sample Set (10 images)', count: 10, prefix: 'sample' },
    { name: 'Demo Set (15 images)', count: 15, prefix: 'demo' },
  ];

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingProgress(10);
        // Dynamic import to avoid SSR issues
        const faceAPI = await import('modern-face-api');
        faceapi = faceAPI;

        setLoadingProgress(30);

        // Load face detection model
        if (selectedModel === 'ssd_mobilenetv1') {
          await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
        } else {
          await faceapi.nets.tinyFaceDetector.loadFromUri('/');
        }

        setLoadingProgress(70);

        // Load face landmark model
        await faceapi.nets.faceLandmark68Net.loadFromUri('/');

        setLoadingProgress(100);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load face landmark models. Please refresh the page.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, [selectedModel]);

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

  const processImageForLandmarks = async (imageElement: HTMLImageElement) => {
    if (!faceapi || !imageElement) return [];

    const options = getFaceDetectorOptions();
    const results = await faceapi.detectAllFaces(imageElement, options).withFaceLandmarks();

    return results;
  };

  const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const measureIndividualProcessing = async (images: HTMLImageElement[]) => {
    const startTime = Date.now();

    for (let i = 0; i < images.length; i++) {
      await processImageForLandmarks(images[i]);
      setProcessingProgress(((i + 1) / images.length) * 50); // First 50% for individual
    }

    const endTime = Date.now();
    return endTime - startTime;
  };

  const measureBatchProcessing = async (images: HTMLImageElement[]) => {
    const startTime = Date.now();
    const batchResults: BatchResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const imageStartTime = Date.now();
      const landmarks = await processImageForLandmarks(images[i]);
      const imageEndTime = Date.now();

      batchResults.push({
        imageIndex: i,
        imageName: `Image ${i + 1}`,
        processingTime: imageEndTime - imageStartTime,
        landmarks,
        faces: landmarks.length,
      });

      setProcessingProgress(50 + ((i + 1) / images.length) * 50); // Second 50% for batch details
    }

    const endTime = Date.now();
    setBatchResults(batchResults);
    return endTime - startTime;
  };

  const runBatchProcessing = async () => {
    if (!faceapi) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    setBatchResults([]);
    setIndividualTime(null);
    setBatchTime(null);

    try {
      const images: HTMLImageElement[] = [];

      // Load images from files or sample images
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles.slice(0, numImages)) {
          const img = await loadImageFromFile(file);
          images.push(img);
        }
      } else {
        // Use sample images
        for (let i = 1; i <= Math.min(numImages, 5); i++) {
          try {
            const img = await loadImageFromUrl(`/images/bbt${i}.jpg`);
            images.push(img);
          } catch {
            // If image doesn't exist, use a placeholder or skip
            console.warn(`Image bbt${i}.jpg not found`);
          }
        }
      }

      if (images.length === 0) {
        throw new Error('No images loaded for processing');
      }

      // Measure individual processing time
      const individualProcessingTime = await measureIndividualProcessing(images);
      setIndividualTime(individualProcessingTime);

      // Measure batch processing time with detailed results
      const batchProcessingTime = await measureBatchProcessing(images);
      setBatchTime(batchProcessingTime);
    } catch (err) {
      console.error('Batch processing failed:', err);
      setError('Batch processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setIsLoading(true);
    setLoadingProgress(0);
    setBatchResults([]);
    setIndividualTime(null);
    setBatchTime(null);

    try {
      setLoadingProgress(30);
      if (newModel === 'ssd_mobilenetv1') {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/');
      } else {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/');
      }
      setLoadingProgress(70);
      await faceapi.nets.faceLandmark68Net.loadFromUri('/');
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
              <Layers className="h-5 w-5" />
              Loading Batch Landmark Models...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {loadingProgress < 30
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
          <Layers className="h-8 w-8 text-primary" />
          Batch Face Landmarks
        </h1>
        <p className="text-muted-foreground">
          Compare individual vs batch processing performance for face landmark detection
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
                <Upload className="h-4 w-4" />
                Image Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="samples" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="samples">Samples</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="samples" className="space-y-4">
                  <div>
                    <Label>Sample Image Sets</Label>
                    <div className="grid gap-2 mt-2">
                      {sampleImageSets.map(set => (
                        <Button
                          key={set.name}
                          variant="outline"
                          className="h-auto p-3 flex flex-col gap-1"
                          onClick={() => {
                            setNumImages(set.count);
                            setSelectedFiles([]);
                          }}
                        >
                          <div className="text-sm font-medium">{set.name}</div>
                          <div className="text-xs text-muted-foreground">{set.count} images</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Images
                    </Button>
                    {selectedFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedFiles.length} files selected
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="numImages">Number of Images to Process</Label>
                <Input
                  id="numImages"
                  type="number"
                  min="1"
                  max="50"
                  value={numImages}
                  onChange={e => setNumImages(parseInt(e.target.value) || 1)}
                />
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

              <Button onClick={runBatchProcessing} className="w-full" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Start Batch Processing'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {processingProgress < 50 ? 'Individual processing...' : 'Batch processing...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Comparison */}
          {(individualTime !== null || batchTime !== null) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Individual Processing</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {individualTime !== null ? `${individualTime}ms` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Processing each image separately
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Batch Processing</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {batchTime !== null ? `${batchTime}ms` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Processing all images in sequence
                    </div>
                  </div>
                </div>

                {individualTime !== null && batchTime !== null && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Performance Ratio:</span>
                      <Badge variant={batchTime < individualTime ? 'default' : 'secondary'}>
                        {batchTime < individualTime
                          ? `${((individualTime / batchTime - 1) * 100).toFixed(1)}% faster`
                          : `${((batchTime / individualTime - 1) * 100).toFixed(1)}% slower`}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Batch Processing Results
                </CardTitle>
                <CardDescription>Detailed results for each processed image</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium border-b pb-2">
                    <span>Image</span>
                    <span>Faces Found</span>
                    <span>Landmarks</span>
                    <span>Time (ms)</span>
                  </div>

                  {batchResults.map(result => (
                    <div
                      key={result.imageIndex}
                      className="grid grid-cols-4 gap-2 text-sm py-2 border-b last:border-b-0"
                    >
                      <span className="font-medium">{result.imageName}</span>
                      <Badge variant="secondary" className="w-fit">
                        {result.faces}
                      </Badge>
                      <Badge variant="outline" className="w-fit">
                        {result.landmarks.length * 68}
                      </Badge>
                      <span className="text-muted-foreground">{result.processingTime}ms</span>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Images:</span>
                        <div className="text-lg">{batchResults.length}</div>
                      </div>
                      <div>
                        <span className="font-medium">Total Faces:</span>
                        <div className="text-lg">
                          {batchResults.reduce((total, result) => total + result.faces, 0)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Avg. Time/Image:</span>
                        <div className="text-lg">
                          {Math.round(
                            batchResults.reduce(
                              (total, result) => total + result.processingTime,
                              0
                            ) / batchResults.length
                          )}
                          ms
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {batchResults.length === 0 && !isProcessing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-muted-foreground text-center">
                  Configure your settings and click &quot;Start Batch Processing&quot; to compare
                  individual vs batch processing performance for face landmark detection.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
