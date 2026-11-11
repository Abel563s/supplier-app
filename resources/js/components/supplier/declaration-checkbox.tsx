import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface DeclarationProps {
    declarations: { id: string; text: string }[];
    checked: Record<string, boolean>;
    onChange: (id: string, checked: boolean) => void;
}

export default function Declaration({ declarations, checked, onChange }: DeclarationProps) {

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Declaration</h3>
            <p className="mt-1 text-sm text-gray-600">Please confirm the following before submitting your registration.</p>

            <div className="mt-4 space-y-4">
                {declarations.map((declaration) => (
                    <div key={declaration.id} className="flex items-start gap-3">
                        <Checkbox
                            id={declaration.id}
                            checked={checked[declaration.id] || false}
                            onCheckedChange={(value) => onChange(declaration.id, value === true)}
                        />
                        <Label htmlFor={declaration.id} className="text-sm leading-relaxed text-gray-700">
                            {declaration.text}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
}
