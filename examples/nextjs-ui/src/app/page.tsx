import { ArrowRight, Brain, Camera, Code, Github, Shield, Video, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Modern Face API
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Advanced face detection, recognition, and analysis powered by TensorFlow.js. Experience
          cutting-edge AI directly in your browser with complete privacy.
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            🚀 v0.22.5
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            🧠 TensorFlow.js
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            ⚡ Real-time
          </Badge>
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="h-12 px-6 cursor-pointer">
            <Link href="/face-detection">
              <Camera className="mr-2 h-4 w-4" />
              Try Face Detection
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-6 cursor-pointer" asChild>
            <Link href="https://github.com/SujalXplores/modern-face-api" target="_blank">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Image Analysis</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Detect faces, landmarks, expressions, age, and gender in static images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Face Detection</Badge>
              <Badge variant="secondary">Landmarks</Badge>
              <Badge variant="secondary">Expressions</Badge>
              <Badge variant="secondary">Age & Gender</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Real-time Processing</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Live webcam analysis with smooth performance and minimal latency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Webcam</Badge>
              <Badge variant="secondary">Live Tracking</Badge>
              <Badge variant="secondary">60 FPS</Badge>
              <Badge variant="secondary">Low Latency</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Face Recognition</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Advanced facial recognition and similarity matching capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Recognition</Badge>
              <Badge variant="secondary">Similarity</Badge>
              <Badge variant="secondary">Matching</Badge>
              <Badge variant="secondary">Embedding</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">High Performance</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Optimized for speed with WebGL acceleration and efficient algorithms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">WebGL</Badge>
              <Badge variant="secondary">Optimized</Badge>
              <Badge variant="secondary">Efficient</Badge>
              <Badge variant="secondary">Fast</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Privacy First</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              All processing happens locally in your browser - no data leaves your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Local Processing</Badge>
              <Badge variant="secondary">No Server</Badge>
              <Badge variant="secondary">Private</Badge>
              <Badge variant="secondary">Secure</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-2 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Developer Friendly</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              Easy-to-use API with TypeScript support and comprehensive documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">Modern API</Badge>
              <Badge variant="secondary">Well Documented</Badge>
              <Badge variant="secondary">Examples</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Section */}
      <Card className="card-shadow ">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Quick Start Examples</CardTitle>
          <CardDescription className="text-lg">
            Explore different capabilities with our interactive examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Image Processing
              </h3>
              <div className="space-y-2">
                {[
                  {
                    title: 'Face Detection',
                    href: '/face-detection',
                    desc: 'Detect faces in uploaded images',
                  },
                  {
                    title: 'Face Landmarks',
                    href: '/face-landmarks',
                    desc: '68-point facial landmark detection',
                  },
                  {
                    title: 'Age & Gender',
                    href: '/age-gender',
                    desc: 'Predict age and gender from faces',
                  },
                  {
                    title: 'Expression Recognition',
                    href: '/face-expressions',
                    desc: 'Recognize 7 basic emotions',
                  },
                ].map(item => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors cursor-pointer"
                    asChild
                  >
                    <Link href={item.href}>
                      <div className="text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Real-time Processing
              </h3>
              <div className="space-y-2">
                {[
                  {
                    title: 'Webcam Detection',
                    href: '/webcam-detection',
                    desc: 'Real-time face detection',
                  },
                  {
                    title: 'Live Landmarks',
                    href: '/webcam-landmarks',
                    desc: 'Real-time landmark tracking',
                  },
                  {
                    title: 'Live Expressions',
                    href: '/webcam-expressions',
                    desc: 'Real-time emotion recognition',
                  },
                  {
                    title: 'Video Tracking',
                    href: '/video-tracking',
                    desc: 'Face tracking in video files',
                  },
                ].map(item => (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors cursor-pointer"
                    asChild
                  >
                    <Link href={item.href}>
                      <div className="text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-6">
        <h2 className="text-2xl font-bold">Built with Modern Technologies</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Leveraging the latest in web technologies and machine learning frameworks
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            React 19
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Next.js 15
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            TypeScript
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            TensorFlow.js
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            shadcn/ui
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Tailwind CSS
          </Badge>
        </div>
      </div>
    </div>
  );
}
