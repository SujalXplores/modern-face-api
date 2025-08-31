'use client';

import { AlertCircle, Brain, CheckCircle, Clock, Settings, Upload, Users, Zap } from 'lucide-react';
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

interface RecognitionResult {
  imageIndex: number;
  imageName: string;
  processingTime: number;
  faces: Array<{
    box: { x: number; y: number; width: number; height: number };
    descriptor: number[];
    similarity?: number;
    matchedPerson?: string;
  }>;
}

interface ReferenceFace {
  name: string;
  descriptor: number[];
  imageUrl: string;
}

export default function BatchRecognitionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('ssd_mobilenetv1');
  const [confidence, setConfidence] = useState([0.5]);
  const [inputSize, setInputSize] = useState('416');
  const [scoreThreshold, setScoreThreshold] = useState([0.5]);
  const [similarityThreshold, setSimilarityThreshold] = useState([0.6]);
  const [numImages, setNumImages] = useState(10);
  const [batchResults, setBatchResults] = useState<RecognitionResult[]>([]);
  const [referenceFaces, setReferenceFaces] = useState<ReferenceFace[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalProcessingTime, setTotalProcessingTime] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  // Sample reference faces
  const sampleReferences = [
    { name: 'Person 1', url: '/images/reference1.jpg' },
    { name: 'Person 2', url: '/images/reference2.jpg' },
    { name: 'Person 3', url: '/images/reference3.jpg' },
  ];

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

        // Load face landmark model
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

  const computeFaceDescriptor = async (imageElement: HTMLImageElement) => {
    if (!faceapi || !imageElement) return [];

    const options = getFaceDetectorOptions();
    const results = await faceapi
      .detectAllFaces(imageElement, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return results.map(
      (result: {
        detection: {
          box: { x: number; y: number; width: number; height: number };
        };
        descriptor: number[];
      }) => ({
        box: result.detection.box,
        descriptor: Array.from(result.descriptor),
      })
    );
  };

  const loadReferenceFaces = async () => {
    if (!faceapi) return;

    const references: ReferenceFace[] = [];
    setProcessingProgress(0);

    try {
      // Load from reference files if any
      if (referenceFiles.length > 0) {
        for (let i = 0; i < referenceFiles.length; i++) {
          const file = referenceFiles[i];
          const img = await loadImageFromFile(file);
          const faces = await computeFaceDescriptor(img);

          if (faces.length > 0) {
            references.push({
              name: file.name.split('.')[0],
              descriptor: faces[0].descriptor,
              imageUrl: URL.createObjectURL(file),
            });
          }

          setProcessingProgress(((i + 1) / referenceFiles.length) * 50);
        }
      } else {
        // Load sample references
        for (let i = 0; i < sampleReferences.length; i++) {
          try {
            const sample = sampleReferences[i];
            const img = await loadImageFromUrl(sample.url);
            const faces = await computeFaceDescriptor(img);

            if (faces.length > 0) {
              references.push({
                name: sample.name,
                descriptor: faces[0].descriptor,
                imageUrl: sample.url,
              });
            }
          } catch {
            console.warn(`Failed to load reference image: ${sampleReferences[i].url}`);
          }

          setProcessingProgress(((i + 1) / sampleReferences.length) * 50);
        }
      }

      setReferenceFaces(references);
      return references;
    } catch (err) {
      console.error('Failed to load reference faces:', err);
      throw err;
    }
  };

  const findBestMatch = (descriptor: number[], references: ReferenceFace[]) => {
    let bestMatch: { person: string; similarity: number } | null = null;

    for (const ref of references) {
      const distance = faceapi.euclideanDistance(descriptor, ref.descriptor);
      const similarity = 1 - distance; // Convert distance to similarity

      if (
        similarity >= similarityThreshold[0] &&
        (!bestMatch || similarity > bestMatch.similarity)
      ) {
        bestMatch = { person: ref.name, similarity };
      }
    }

    return bestMatch;
  };

  const runBatchRecognition = async () => {
    if (!faceapi) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    setBatchResults([]);
    setTotalProcessingTime(null);

    try {
      // First load reference faces
      const references = await loadReferenceFaces();

      if (!references || references.length === 0) {
        throw new Error('No reference faces loaded');
      }

      // Load test images
      const images: HTMLImageElement[] = [];

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
            console.warn(`Image bbt${i}.jpg not found`);
          }
        }
      }

      if (images.length === 0) {
        throw new Error('No test images loaded');
      }

      const startTime = Date.now();
      const results: RecognitionResult[] = [];

      // Process each image
      for (let i = 0; i < images.length; i++) {
        const imageStartTime = Date.now();
        const faces = await computeFaceDescriptor(images[i]);

        // Find matches for each face
        const facesWithMatches = faces.map(
          (face: {
            box: { x: number; y: number; width: number; height: number };
            descriptor: number[];
          }) => {
            const match = findBestMatch(face.descriptor, references);
            return {
              ...face,
              similarity: match?.similarity,
              matchedPerson: match?.person,
            };
          }
        );

        const imageEndTime = Date.now();

        results.push({
          imageIndex: i,
          imageName: selectedFiles[i]?.name || `Image ${i + 1}`,
          processingTime: imageEndTime - imageStartTime,
          faces: facesWithMatches,
        });

        setProcessingProgress(50 + ((i + 1) / images.length) * 50);
      }

      const endTime = Date.now();
      setTotalProcessingTime(endTime - startTime);
      setBatchResults(results);
    } catch (err) {
      console.error('Batch recognition failed:', err);
      setError('Batch recognition failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setReferenceFiles(files);
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setIsLoading(true);
    setLoadingProgress(0);
    setBatchResults([]);
    setReferenceFaces([]);
    setTotalProcessingTime(null);

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
              Loading Batch Recognition Models...
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
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          Batch Face Recognition
        </h1>
        <p className="text-muted-foreground">
          Process multiple images to recognize and match faces against reference photos
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
                Reference Faces
              </CardTitle>
              <CardDescription>Upload reference photos of people to recognize</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReferenceUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => referenceInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Reference Photos
                </Button>
                {referenceFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {referenceFiles.length} reference files selected
                  </p>
                )}
              </div>

              {referenceFaces.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Loaded References:</Label>
                  <div className="grid gap-2 mt-2">
                    {referenceFaces.map((ref, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                          {ref.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{ref.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Test Images
              </CardTitle>
              <CardDescription>Images to process for face recognition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="samples">Samples</TabsTrigger>
                </TabsList>

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
                      Choose Test Images
                    </Button>
                    {selectedFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedFiles.length} test files selected
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="samples" className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedFiles([]);
                      setNumImages(5);
                    }}
                  >
                    Use Sample Images (BBT Cast)
                  </Button>
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
                Recognition Settings
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

              <div>
                <Label>Similarity Threshold: {similarityThreshold[0].toFixed(2)}</Label>
                <Slider
                  value={similarityThreshold}
                  onValueChange={setSimilarityThreshold}
                  min={0.1}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values require stronger matches
                </p>
              </div>

              {selectedModel === 'ssd_mobilenetv1' ? (
                <div>
                  <Label>Detection Confidence: {confidence[0].toFixed(2)}</Label>
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

              <Button onClick={runBatchRecognition} className="w-full" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Start Recognition'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {processingProgress < 50
                      ? 'Loading reference faces...'
                      : 'Processing test images...'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Summary */}
          {totalProcessingTime !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Processing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Total Time</span>
                    </div>
                    <div className="text-2xl font-bold">{totalProcessingTime}ms</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Images Processed</span>
                    </div>
                    <div className="text-2xl font-bold">{batchResults.length}</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Faces Found</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {batchResults.reduce((total, result) => total + result.faces.length, 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Recognition Results
                </CardTitle>
                <CardDescription>Face recognition results for each processed image</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batchResults.map(result => (
                    <div key={result.imageIndex} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{result.imageName}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{result.faces.length} faces</Badge>
                          <Badge variant="secondary">{result.processingTime}ms</Badge>
                        </div>
                      </div>

                      {result.faces.length > 0 ? (
                        <div className="space-y-2">
                          {result.faces.map((face, faceIndex) => (
                            <div
                              key={faceIndex}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <span className="text-sm">Face {faceIndex + 1}</span>
                              {face.matchedPerson ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="default">{face.matchedPerson}</Badge>
                                  <Badge variant="outline">
                                    {Math.round((face.similarity || 0) * 100)}% match
                                  </Badge>
                                </div>
                              ) : (
                                <Badge variant="secondary">No match found</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No faces detected</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {batchResults.length === 0 && !isProcessing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-muted-foreground text-center">
                  Upload reference photos and test images, then click &quot;Start Recognition&quot;
                  to begin batch face recognition processing.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
