import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <SearchX className="w-10 h-10 text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-900 mb-1">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="strawberry-matcha-btn text-white">
        <Link href="/browse">Back to browsing</Link>
      </Button>
    </div>
  );
}
