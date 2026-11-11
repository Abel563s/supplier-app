<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the user's notification center page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = $user->notifications()->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('data->title', 'like', "%{$search}%")
                    ->orWhere('data->body', 'like', "%{$search}%")
                    ->orWhere('data->supplier_name', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('data->category', $category);
        }

        if ($date = $request->input('date')) {
            $query->whereDate('created_at', $date);
        }

        if ($request->input('unread') === 'true') {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate(20)->withQueryString();

        $categories = collect(User::notificationEventMeta())
            ->map(fn (array $meta, string $event) => $meta['category'] ?? null)
            ->unique()
            ->filter()
            ->values()
            ->all();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'date', 'unread']),
            'unreadCount' => $user->unreadNotifications()->count(),
            'title' => 'Notifications',
        ]);
    }

    /**
     * Return the count of unread notifications for the authenticated user.
     */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Return the authenticated user's notifications as JSON (paginated).
     */
    public function apiIndex(Request $request)
    {
        $user = $request->user();

        $query = $user->notifications()->latest();

        if ($category = $request->input('category')) {
            $query->where('data->category', $category);
        }

        if ($request->input('unread') === 'true') {
            $query->whereNull('read_at');
        }

        return response()->json($query->paginate(10)->through(fn ($notification) => $this->transform($notification)));
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, $notification)
    {
        $record = $request->user()->notifications()->where('id', $notification)->firstOrFail();

        $record->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all of the authenticated user's notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Delete (dismiss) a single notification.
     */
    public function destroy(Request $request, $notification)
    {
        $record = $request->user()->notifications()->where('id', $notification)->firstOrFail();

        $record->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    /**
     * Show the authenticated user's notification preferences.
     */
    public function preferences(Request $request)
    {
        return response()->json([
            'settings' => $request->user()->notificationSettings(),
            'categories' => collect(User::notificationEventMeta())
                ->map(fn (array $meta, string $event) => [
                    'event' => $event,
                    'category' => $meta['category'] ?? null,
                    'mandatory' => $meta['mandatory'] ?? [],
                ])
                ->values()
                ->all(),
        ]);
    }

    /**
     * Update the authenticated user's notification preferences.
     */
    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'in_app' => ['sometimes', 'boolean'],
            'email' => ['sometimes', 'boolean'],
            'categories' => ['sometimes', 'array'],
        ]);

        $settings = $user->notificationSettings();

        if (isset($validated['in_app'])) {
            $settings['in_app'] = (bool) $validated['in_app'];
        }

        if (isset($validated['email'])) {
            $settings['email'] = (bool) $validated['email'];
        }

        if (isset($validated['categories'])) {
            $settings['categories'] = array_replace($settings['categories'] ?? [], $validated['categories']);
        }

        $user->update(['notification_settings' => $settings]);

        return response()->json([
            'message' => 'Notification preferences updated.',
            'settings' => $user->notificationSettings(),
        ]);
    }

    /**
     * @param  DatabaseNotification  $notification
     * @return array<string, mixed>
     */
    private function transform($notification): array
    {
        $data = $notification->data instanceof Collection
            ? $notification->data->all()
            : (array) $notification->data;

        return [
            'id' => $notification->id,
            'category' => $data['category'] ?? null,
            'title' => $data['title'] ?? '',
            'body' => $data['body'] ?? '',
            'url' => $data['url'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'supplier_name' => $data['supplier_name'] ?? null,
            'event' => $data['event'] ?? null,
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at->toISOString(),
        ];
    }
}
