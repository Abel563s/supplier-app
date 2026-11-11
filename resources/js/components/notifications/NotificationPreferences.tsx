import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { csrfHeaders } from '@/lib/csrf';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationPreferenceCategory {
    event: string;
    category: string | null;
    mandatory: string[];
}

export function NotificationPreferences() {
    const [settings, setSettings] = useState({
        in_app: true,
        email: true,
        categories: {} as Record<string, boolean>,
    });
    const [preferenceCategories, setPreferenceCategories] = useState<NotificationPreferenceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch('/notifications/preferences', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load preferences');
                }
                return response.json();
            })
            .then((payload) => {
                if (cancelled) {
                    return;
                }

                const data = payload as { settings?: Record<string, unknown>; categories?: NotificationPreferenceCategory[] };

                setSettings({
                    in_app: Boolean(data.settings?.in_app ?? true),
                    email: Boolean(data.settings?.email ?? true),
                    categories: (data.settings?.categories as Record<string, boolean>) ?? {},
                });
                setPreferenceCategories(data.categories ?? []);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const save = async (): Promise<void> => {
        setSaving(true);

        try {
            await fetch('/notifications/preferences', {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(settings),
            });
        } catch {
            // Preferences are best-effort; in-app notifications continue to work regardless.
        } finally {
            setSaving(false);
        }
    };

    const categoryMandatory = (category: string | null): boolean => {
        if (!category) {
            return false;
        }

        return preferenceCategories.some((item) => item.category === category && item.mandatory.length > 0);
    };

    if (loading) {
        return (
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-gray-500">Loading preferences…</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#00515F]" />
                    Notification preferences
                </CardTitle>
                <CardDescription>Choose how you receive notifications. Mandatory responsibility notifications cannot be disabled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium text-gray-900">In-app notifications</Label>
                        <p className="text-xs text-gray-500">Receive notifications in the portal header and notification center.</p>
                    </div>
                    <Toggle
                        pressed={settings.in_app}
                        onPressedChange={(value) => setSettings((prev) => ({ ...prev, in_app: value }))}
                        disabled={!settings.in_app}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-medium text-gray-900">Email notifications</Label>
                        <p className="text-xs text-gray-500">Receive important notifications by email.</p>
                    </div>
                    <Toggle
                        pressed={settings.email}
                        onPressedChange={(value) => setSettings((prev) => ({ ...prev, email: value }))}
                        disabled={!settings.email}
                    />
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Notification categories</Label>
                    <p className="text-xs text-gray-500">Enable or disable optional notification categories.</p>

                    {preferenceCategories.map((item) => {
                        const mandatory = categoryMandatory(item.category);
                        const enabled = settings.categories[item.event ?? item.category ?? ''] ?? true;

                        return (
                            <div key={item.event ?? item.category} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={enabled || mandatory}
                                        onCheckedChange={() => {
                                            if (mandatory) {
                                                return;
                                            }

                                            setSettings((prev) => ({
                                                ...prev,
                                                categories: {
                                                    ...prev.categories,
                                                    [item.event ?? item.category ?? '']: !enabled,
                                                },
                                            }));
                                        }}
                                        disabled={mandatory}
                                    />
                                    <Label className="text-sm text-gray-900">
                                        {item.event?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </Label>
                                    {mandatory && (
                                        <span className="rounded bg-[#00515F]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00515F]">
                                            Mandatory
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{item.category ?? 'General'}</p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Changes are saved automatically. Email delivery depends on your mail configuration.</p>
                <Button size="sm" onClick={save} disabled={saving} className="text-[#00515F] hover:bg-[#00ADC5]/10">
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </CardFooter>
        </Card>
    );
}
