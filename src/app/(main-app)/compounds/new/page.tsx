import { CompoundNewForm } from '@/components/forms/compound/new';

export default function NewCompoundPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New compound</h1>
        <p className="text-muted-foreground text-sm">Create a compound batch entry.</p>
      </div>
      <CompoundNewForm />
    </div>
  );
}
