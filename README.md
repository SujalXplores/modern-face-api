# modern-face-api

[![npm version](https://badge.fury.io/js/modern-face-api.svg)](https://badge.fury.io/js/modern-face-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Code Quality](https://img.shields.io/badge/code_quality-biome-60a5fa.svg)](https://biomejs.dev/)

A modern, TypeScript-first JavaScript API for face detection and recognition in the browser and Node.js, powered by TensorFlow.js.

## 🚀 [Try the Live Demo](https://modern-face-api.vercel.app)

![Face API Demo](https://user-images.githubusercontent.com/31125521/57224752-ad3dc080-700a-11e9-85b9-1357b9f9bca4.gif)

## 🌟 Features

- **🎯 Face Detection** - Multiple models: SSD MobileNet V1 & Tiny Face Detector
- **📍 Face Landmarks** - 68-point facial landmark detection with high precision
- **🔍 Face Recognition** - 99.38% accuracy on LFW benchmark using ResNet-34
- **😊 Expression Recognition** - 7 facial expressions (happy, sad, angry, fearful, disgusted, surprised, neutral)
- **👤 Age & Gender** - Demographic analysis with age estimation and gender classification
- **⚡ Real-time Processing** - Optimized for live video streams and webcam input
- **🌐 Universal** - Works in browsers and Node.js environments
- **📱 Mobile-friendly** - Lightweight models for resource-constrained devices
- **🔧 TypeScript** - Full TypeScript support with intelligent autocompletion
- **🚀 Modern Tooling** - Built with modern development tools and best practices

## 🚀 Quick Start

### Installation

```bash
npm install modern-face-api
```

### Browser Usage

```html
<script src="https://unpkg.com/modern-face-api/dist/modern-face-api.min.js"></script>
<script>
  // Load models and detect faces
  Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
  ]).then(() => {
    // Ready to detect faces!
    detectFaces();
  });

  async function detectFaces() {
    const img = document.getElementById('inputImg');
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();
    console.log(detections);
  }
</script>
```

### ES6/TypeScript

```typescript
import * as faceapi from 'modern-face-api';

// Load models
await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');

// Detect faces in an image
const detections = await faceapi.detectAllFaces(imageElement);

// Detect faces with landmarks and expressions
const results = await faceapi
  .detectAllFaces(imageElement)
  .withFaceLandmarks()
  .withFaceExpressions();
```

### Node.js Usage

```javascript
// Import Node.js bindings
import '@tensorflow/tfjs-node';
import * as canvas from 'canvas';
import * as faceapi from 'modern-face-api';

// Patch environment
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models from disk
await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');

// Detect faces
const detections = await faceapi.detectAllFaces(image);
```

## 🎨 Live Demos

### Next.js Interactive Demo (Recommended)

Experience all features with our modern, responsive demo:

**🌐 [Live Demo](https://modern-face-api.vercel.app)** - Try it now!

Or run locally:

```bash
git clone https://github.com/SujalXplores/modern-face-api.git
cd modern-face-api/examples/nextjs-ui
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore:
- 🎯 Real-time face detection
- 📍 Facial landmark visualization  
- 😊 Expression recognition
- 👤 Age and gender estimation
- ⚙️ Interactive parameter tuning
- 📹 Webcam integration

### Browser Examples

```bash
cd modern-face-api/examples/examples-browser
npm install
npm start
```

### Node.js Examples

```bash
cd modern-face-api/examples/examples-nodejs
npm install
npx ts-node faceDetection.ts
```

## 📖 API Reference

### Loading Models

All neural network instances are available via `faceapi.nets`:

```javascript
// Available models
faceapi.nets.ssdMobilenetv1        // Face detection
faceapi.nets.tinyFaceDetector      // Lightweight face detection
faceapi.nets.faceLandmark68Net     // 68-point landmarks
faceapi.nets.faceLandmark68TinyNet // Lightweight landmarks
faceapi.nets.faceRecognitionNet    // Face descriptors
faceapi.nets.faceExpressionNet     // Expression recognition
faceapi.nets.ageGenderNet          // Age and gender
```

Load models from URI:

```javascript
await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
```

Load models from disk (Node.js):

```javascript
await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
```

### Face Detection

Detect all faces:

```javascript
const detections = await faceapi.detectAllFaces(input);
```

Detect single face:

```javascript
const detection = await faceapi.detectSingleFace(input);
```

With detection options:

```javascript
// SSD MobileNet V1 options
const detections = await faceapi.detectAllFaces(input, 
  new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 })
);

// Tiny Face Detector options
const detections = await faceapi.detectAllFaces(input,
  new faceapi.TinyFaceDetectorOptions({ inputSize: 320 })
);
```

### Face Landmarks

```javascript
// 68-point landmarks
const detectionsWithLandmarks = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks();

// Tiny model (faster)
const detectionsWithLandmarks = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks(true);
```

### Face Recognition

```javascript
// Compute face descriptors
const results = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks()
  .withFaceDescriptors();

// Face matching
const faceMatcher = new faceapi.FaceMatcher(referenceDescriptors);
const bestMatch = faceMatcher.findBestMatch(queryDescriptor);
```

### Expression Recognition

```javascript
// Detect expressions
const detectionsWithExpressions = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks()
  .withFaceExpressions();

// Available expressions: happy, sad, angry, fearful, disgusted, surprised, neutral
```

### Age and Gender

```javascript
// Estimate age and gender
const detectionsWithAgeGender = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks()
  .withAgeAndGender();
```

### Composition of Tasks

Chain multiple analyses:

```javascript
// Complete analysis
const fullResults = await faceapi
  .detectAllFaces(input)
  .withFaceLandmarks()
  .withFaceExpressions()
  .withAgeAndGender()
  .withFaceDescriptors();
```

### Displaying Results

```javascript
// Prepare canvas
const canvas = document.getElementById('overlay');
const displaySize = { width: input.width, height: input.height };
faceapi.matchDimensions(canvas, displaySize);

// Resize results to match display
const resizedDetections = faceapi.resizeResults(detections, displaySize);

// Draw detection boxes
faceapi.draw.drawDetections(canvas, resizedDetections);

// Draw landmarks
faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

// Draw expressions
faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
```

## 🤖 Models

### Face Detection Models

#### SSD MobileNet V1
- **Size**: ~5.4 MB
- **Accuracy**: High
- **Speed**: Moderate
- **Use case**: High-accuracy applications

#### Tiny Face Detector  
- **Size**: ~190 KB
- **Accuracy**: Good
- **Speed**: Very fast
- **Use case**: Real-time applications, mobile devices

### Face Landmark Detection

#### 68-Point Model
- **Size**: ~350 KB
- **Points**: 68 facial landmarks
- **Accuracy**: High precision

#### Tiny 68-Point Model
- **Size**: ~80 KB  
- **Points**: 68 facial landmarks
- **Accuracy**: Good precision, faster inference

### Face Recognition

#### ResNet-34 Based Model
- **Size**: ~6.2 MB
- **Accuracy**: 99.38% on LFW benchmark
- **Output**: 128-dimensional face descriptor
- **Training**: Trained on millions of faces

### Expression Recognition

#### Expression Model
- **Size**: ~310 KB
- **Expressions**: 7 classes (happy, sad, angry, fearful, disgusted, surprised, neutral)
- **Architecture**: Depthwise separable convolutions

### Age and Gender Recognition

#### Age-Gender Model
- **Size**: ~420 KB
- **Age**: Mean Absolute Error of 4.54 years
- **Gender**: 95% accuracy
- **Architecture**: Multi-task network with feature extraction

## 🛠️ Development

### Prerequisites

- Node.js 18+ or modern browser
- TypeScript 5.0+ (for development)

### Setup

```bash
git clone https://github.com/SujalXplores/modern-face-api.git
cd modern-face-api
npm install
```

### Build

```bash
npm run build
```

### Development Scripts

```bash
# Lint and format code
npm run lint

# Auto-fix formatting issues  
npm run lint:fix

# Run tests
npm test

# Run browser tests
npm run test-browser

# Run Node.js tests
npm run test-node
```

### Modern Tooling

This project uses modern development tools:

- **Biome.js** - Ultra-fast linting and formatting (10x faster than ESLint)
- **TypeScript** - Type safety and better developer experience  
- **Rollup** - Optimized bundling with tree-shaking
- **Husky** - Git hooks for code quality
- **lint-staged** - Run linters on staged files only

### Code Quality

Quality gates are automatically enforced:
- Pre-commit hooks run Biome formatting and linting
- Pre-push hooks run full project validation
- TypeScript strict mode enabled
- Automated testing on multiple environments

## 📁 Project Structure

```
modern-face-api/
├── src/                    # Source code
│   ├── classes/           # Core classes (Box, FaceDetection, etc.)
│   ├── dom/              # Browser-specific utilities
│   ├── globalApi/        # High-level API
│   ├── ops/              # TensorFlow operations
│   └── [model-dirs]/     # Neural network implementations
├── examples/
│   ├── nextjs-ui/        # Modern Next.js demo
│   ├── examples-browser/ # Browser examples
│   └── examples-nodejs/  # Node.js examples
├── weights/              # Pre-trained model weights
├── dist/                 # Built files
└── build/               # Compiled TypeScript
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run quality checks: `npm run check`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## 📚 Resources

- [API Documentation](https://SujalXplores.github.io/modern-face-api/docs/globals.html)
- [Original face-api.js](https://github.com/justadudewhohacks/face-api.js) - Credit to the original creators
- [TensorFlow.js](https://www.tensorflow.org/js) - The ML framework powering this library

## 🙏 Acknowledgments

- Original face-api.js by [Vincent Mühler](https://github.com/justadudewhohacks)
- TensorFlow.js team for the ML framework
- [dlib](http://dlib.net/) for face recognition research
- Community contributors and maintainers

## 📄 License

[MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [🌐 Live Demo](https://modern-face-api.vercel.app)
- [npm package](https://www.npmjs.com/package/modern-face-api)
- [GitHub repository](https://github.com/SujalXplores/modern-face-api)
- [Documentation](https://SujalXplores.github.io/modern-face-api/docs/)
- [Issues](https://github.com/SujalXplores/modern-face-api/issues)

---

<div align="center">

**Built with ❤️ by [SujalXplores](https://github.com/SujalXplores)**

[⭐ Star this repo](https://github.com/SujalXplores/modern-face-api) • [🐛 Report Bug](https://github.com/SujalXplores/modern-face-api/issues) • [💡 Request Feature](https://github.com/SujalXplores/modern-face-api/issues)

</div>
