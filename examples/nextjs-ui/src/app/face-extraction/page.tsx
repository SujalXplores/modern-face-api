import { Camera } from 'lucide-react';
import ComingSoonPage from '@/components/coming-soon-page';

export default function FaceExtractionPage() {
  return (
    <ComingSoonPage
      title="Face Extraction"
      description="Extract and crop individual faces from images for further processing"
      icon={Camera}
      features={{
        primary: ['Face cropping', 'Aligned extraction', 'Batch processing'],
        secondary: ['Custom sizing', 'Download gallery', 'Quality optimization'],
      }}
    />
  );
}
