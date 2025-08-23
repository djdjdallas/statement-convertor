'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4 mr-2" />
      {copied ? 'Copied!' : 'Copy Link'}
    </Button>
  );
}