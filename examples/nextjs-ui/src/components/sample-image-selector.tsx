'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SampleImage {
  name: string;
  url: string;
  category?: string;
}

interface SampleImageSelectorProps {
  images: SampleImage[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SampleImageSelector({
  images,
  value,
  onValueChange,
  placeholder = 'Select a sample image...',
  label = 'Sample Images',
  className,
}: SampleImageSelectorProps) {
  // Group images by category if they have categories
  const groupedImages = images.reduce(
    (acc, image) => {
      const category = image.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(image);
      return acc;
    },
    {} as Record<string, SampleImage[]>
  );

  const categories = Object.keys(groupedImages);
  const hasCategories =
    categories.length > 1 || (categories.length === 1 && categories[0] !== 'General');

  return (
    <div className={className}>
      <Label htmlFor="sample-image-select" className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="sample-image-select" className="mt-3 cursor-pointer">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {hasCategories
            ? // Render grouped by categories
              categories.map(category => (
                <div key={category}>
                  {category !== 'General' && (
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category}
                    </div>
                  )}
                  {groupedImages[category].map(image => (
                    <SelectItem className="cursor-pointer" key={image.url} value={image.url}>
                      {image.name}
                    </SelectItem>
                  ))}
                </div>
              ))
            : // Render flat list
              images.map(image => (
                <SelectItem className="cursor-pointer" key={image.url} value={image.url}>
                  {image.name}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Predefined sample image sets for common use cases
export const sampleImageSets = {
  basic: [
    { name: 'Sample 1', url: '/images/bbt1.jpg', category: 'People' },
    { name: 'Sample 2', url: '/images/bbt2.jpg', category: 'People' },
    { name: 'Sample 3', url: '/images/bbt3.jpg', category: 'People' },
    { name: 'Sample 4', url: '/images/bbt4.jpg', category: 'People' },
    { name: 'Sample 5', url: '/images/bbt5.jpg', category: 'People' },
  ],

  expressions: [
    {
      name: 'Sample 1 (Happy)',
      url: '/images/happy.jpg',
      category: 'Expressions',
    },
    { name: 'Sample 2 (Sad)', url: '/images/sad.jpg', category: 'Expressions' },
    {
      name: 'Sample 3 (Angry)',
      url: '/images/angry.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 4 (Disgusted)',
      url: '/images/disgusted.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 5 (Surprised)',
      url: '/images/surprised.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 6 (Fearful)',
      url: '/images/fearful.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 7 (Neutral)',
      url: '/images/neutral.jpg',
      category: 'Expressions',
    },
  ],

  all: [
    { name: 'Sample 1', url: '/images/bbt1.jpg', category: 'People' },
    { name: 'Sample 2', url: '/images/bbt2.jpg', category: 'People' },
    { name: 'Sample 3', url: '/images/bbt3.jpg', category: 'People' },
    { name: 'Sample 4', url: '/images/bbt4.jpg', category: 'People' },
    { name: 'Sample 5', url: '/images/bbt5.jpg', category: 'People' },
    {
      name: 'Sample 6 (Happy)',
      url: '/images/happy.jpg',
      category: 'Expressions',
    },
    { name: 'Sample 7 (Sad)', url: '/images/sad.jpg', category: 'Expressions' },
    {
      name: 'Sample 8 (Angry)',
      url: '/images/angry.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 9 (Disgusted)',
      url: '/images/disgusted.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 10 (Surprised)',
      url: '/images/surprised.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 11 (Fearful)',
      url: '/images/fearful.jpg',
      category: 'Expressions',
    },
    {
      name: 'Sample 12 (Neutral)',
      url: '/images/neutral.jpg',
      category: 'Expressions',
    },
  ],
};
