<?php

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Supplier\DashboardController;
use App\Http\Controllers\Supplier\RegistrationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('supplier-registration/index');
})->name('home');

Route::get('supplier-registration', function () {
    return Inertia::render('supplier-registration/index');
})->name('supplier.registration');

Route::get('supplier-registration/register', function () {
    return Inertia::render('supplier-registration/register');
})->name('supplier.register');

Route::get('supplier-registration/login', function () {
    return Inertia::render('supplier-registration/login');
})->name('supplier.login');

Route::get('supplier-registration/requirements', function () {
    return Inertia::render('supplier-registration/requirements');
})->name('supplier.requirements');

Route::get('supplier-registration/categories', function () {
    return Inertia::render('supplier-registration/categories');
})->name('supplier.categories');

Route::get('supplier-registration/status', function () {
    return Inertia::render('supplier-registration/status');
})->name('supplier.status');

Route::middleware(['auth'])->prefix('supplier')->name('supplier.')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::get('registration', DashboardController::class)->name('registration');

    Route::controller(RegistrationController::class)->prefix('registration')->name('registration.')->group(function () {
        // Step 1 - Legal Entity & Identification
        Route::get('legal-entity', 'showStep')->defaults('step', 1)->name('legal-entity');
        Route::post('legal-entity', 'storeStep')->defaults('step', 1)->name('legal-entity.store');

        // Step 2 - Contact & Location
        Route::get('contact', 'showStep')->defaults('step', 2)->name('contact');
        Route::post('contact', 'storeStep')->defaults('step', 2)->name('contact.store');

        // Step 3 - Business Scope & Categories
        Route::get('business-scope', 'showStep')->defaults('step', 3)->name('business-scope');
        Route::post('business-scope', 'storeStep')->defaults('step', 3)->name('business-scope.store');

        // Step 4 - Bank & Financial
        Route::get('bank-financial', 'showStep')->defaults('step', 4)->name('bank-financial');
        Route::post('bank-financial', 'storeStep')->defaults('step', 4)->name('bank-financial.store');

        // Step 5 - Ownership & Signatory
        Route::get('ownership', 'showStep')->defaults('step', 5)->name('ownership');
        Route::post('ownership', 'storeStep')->defaults('step', 5)->name('ownership.store');

        // Step 6 - Supporting Documents
        Route::get('documents', 'showStep')->defaults('step', 6)->name('documents');
        Route::post('documents', 'storeDocuments')->name('documents.store');

        // Step 7 - Declarations
        Route::get('declarations', 'showStep')->defaults('step', 7)->name('declarations');
        Route::post('declarations', 'storeStep')->defaults('step', 7)->name('declarations.store');

        // Contracts API
        Route::get('contracts', 'contracts')->name('contracts');
        Route::post('contracts', 'storeContract')->name('contracts.store');
        Route::put('contracts/{contract}', 'updateContract')->name('contracts.update');
        Route::delete('contracts/{contract}', 'destroyContract')->name('contracts.destroy');

        // Documents API
        Route::get('documents/list', 'documents')->name('documents.list');
        Route::post('documents/upload', 'uploadDocument')->name('documents.upload');
        Route::delete('documents/{document}', 'removeDocument')->name('documents.remove');
        Route::get('documents/{document}/view', 'viewDocument')->name('documents.view');

        // Declarations
        Route::get('declarations/status', 'declarations')->name('declarations.status');

        // Submission
        Route::post('submit', 'submit')->name('submit');
        Route::get('submitted', 'submitted')->name('submitted');
    });
});

Route::middleware(['auth'])->prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::get('unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
    Route::get('api', [NotificationController::class, 'apiIndex'])->name('api');
    Route::patch('{notification}/read', [NotificationController::class, 'markRead'])->name('read');
    Route::patch('read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
    Route::delete('{notification}', [NotificationController::class, 'destroy'])->name('destroy');
    Route::get('preferences', [NotificationController::class, 'preferences'])->name('preferences');
    Route::patch('preferences', [NotificationController::class, 'updatePreferences'])->name('preferences.update');
});

Route::get('dashboard', function () {
    return redirect()->route('supplier.dashboard');
})->name('dashboard')->middleware('auth');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
