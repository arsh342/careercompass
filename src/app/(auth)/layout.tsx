import { CompassIcon } from '@/components/icons';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <CompassIcon className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">CareerCompass</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
