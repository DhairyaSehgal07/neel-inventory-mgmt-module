import { RawMaterialNewForm } from '@/components/forms/raw-materials/new';

export default function RawMaterialNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New raw material</h1>
        <p className="text-muted-foreground text-sm">Create a raw material inventory entry.</p>
      </div>
      <RawMaterialNewForm />
    </div>
  );
}
