import { LumaSpin } from "@/components/ui/luma-spin";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LumaSpin />
    </div>
  );
}
