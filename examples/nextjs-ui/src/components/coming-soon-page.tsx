import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: {
    primary: string[];
    secondary: string[];
  };
}

export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  features,
}: ComingSoonPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-lg">{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              This feature is currently under development and will be available soon.
            </p>
            {features && (
              <div className="space-y-4 mb-6">
                <div className="text-left">
                  <h4 className="font-semibold mb-2">Coming Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {features.primary.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                {features.secondary.length > 0 && (
                  <div className="text-left">
                    <h4 className="font-semibold mb-2">Additional Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {features.secondary.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-muted rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <Button asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
