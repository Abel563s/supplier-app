<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BusinessLicenseExpiryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\ProcurementDashboardController;
use App\Http\Controllers\Admin\ProcurementRequestController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\TaxExpiryController;
use App\Http\Controllers\Procurement\ProcurementRequestController as ProcurementRequestSubmitController;
use App\Models\Supplier;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('admin')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store']);
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/', function () {
            return redirect('/admin/dashboard');
        })->name('dashboard.redirect')->middleware('role:admin');

        Route::get('/dashboard', DashboardController::class)->name('dashboard')->middleware('role:admin');

        Route::get('/audit-log', [AuditLogController::class, 'index'])->name('audit-log')->middleware('role:admin');
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings')->middleware('role:admin');
        Route::get('/reports', function () {
            return Inertia::render('admin/reports/index', [
                'stats' => [
                    'total' => Supplier::count(),
                    'draft' => Supplier::where('status', 'draft')->count(),
                    'submitted' => Supplier::where('status', 'submitted')->count(),
                    'under_review' => Supplier::whereIn('status', ['pending', 'under_review'])->count(),
                    'needs_correction' => Supplier::where('status', 'needs_correction')->count(),
                    'approved' => Supplier::where('status', 'approved')->count(),
                    'rejected' => Supplier::where('status', 'rejected')->count(),
                ],
            ]);
        })->name('reports')->middleware('role:admin');

        Route::get('/tax-expiry', [TaxExpiryController::class, 'index'])->name('tax-expiry')->middleware('role:admin');
        Route::get('/business-license-expiry', [BusinessLicenseExpiryController::class, 'index'])
            ->name('business-license-expiry')
            ->middleware('role:admin');
        Route::put('/business-license-expiry', [BusinessLicenseExpiryController::class, 'update'])
            ->name('business-license-expiry.update')
            ->middleware('role:admin');

        Route::prefix('roles')->name('roles.')->middleware('role:admin')->group(function () {
            Route::get('/', [RolesController::class, 'index'])->name('index');
            Route::post('/', [RolesController::class, 'store'])->name('store');
            Route::put('/{user}', [RolesController::class, 'update'])->name('update');
            Route::delete('/{user}', [RolesController::class, 'destroy'])->name('destroy');
        });

        Route::prefix('suppliers')->name('suppliers.')->group(function () {
            Route::middleware('role:admin,department')->group(function () {
                Route::get('/', [SupplierController::class, 'index'])->name('index');
                Route::get('/{supplier}', [SupplierController::class, 'show'])->whereNumber('supplier')->name('show');
                Route::get('/{supplier}/documents', [DocumentController::class, 'index'])->name('documents');
                Route::get('/{supplier}/documents/{document}/view', [DocumentController::class, 'view'])->name('documents.view');
            });

            Route::middleware('role:admin')->group(function () {
                Route::get('/create', [SupplierController::class, 'create'])->name('create');
                Route::get('/import/template', [SupplierController::class, 'downloadImportTemplate'])->name('import.template');
                Route::post('/import', [SupplierController::class, 'import'])->name('import');
                Route::post('/', [SupplierController::class, 'store'])->name('store');
                Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy');
                Route::get('/{supplier}/edit', [SupplierController::class, 'edit'])->name('edit');
                Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update');
                Route::post('/{supplier}/grades', [SupplierController::class, 'storeGrades'])->name('grades.store');
                Route::post('/{supplier}/documents/upload', [SupplierController::class, 'uploadDocument'])->name('documents.upload');
                Route::post('/{supplier}/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
                Route::delete('/{supplier}/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
                Route::get('/{supplier}/correction-request', [SupplierController::class, 'correctionRequestForm'])->name('correction-request');
                Route::post('/{supplier}/correction-request', [SupplierController::class, 'sendCorrectionRequest'])->name('correction-request.send');
                Route::post('/{supplier}/approve', [SupplierController::class, 'approve'])->name('approve');
                Route::post('/{supplier}/reject', [SupplierController::class, 'reject'])->name('reject');
            });

            Route::middleware('role:department')->group(function () {
                Route::post('/{supplier}/departmental-grades', [SupplierController::class, 'storeDepartmentGrades'])->name('departmental-grades.store');
                Route::post('/{supplier}/departmental-approve', [SupplierController::class, 'approveDepartmentReview'])->name('departmental-approve');
            });
        });

        Route::prefix('supplier-requests')->name('supplier-requests.')->middleware('role:admin')->group(function () {
            Route::get('/', [ProcurementRequestController::class, 'index'])->name('index');
            Route::get('/{supplierRequest}', [ProcurementRequestController::class, 'show'])->name('show');
            Route::delete('/{supplierRequest}', [ProcurementRequestController::class, 'destroy'])->name('destroy');
            Route::post('/{supplierRequest}/run-matching', [ProcurementRequestController::class, 'runMatching'])->name('run-matching');
            Route::post('/{supplierRequest}/select-suppliers', [ProcurementRequestController::class, 'selectSuppliers'])->name('select-suppliers');
            Route::post('/{supplierRequest}/approve-shortlist', [ProcurementRequestController::class, 'approveShortlist'])->name('approve-shortlist');
            Route::delete('/{supplierRequest}/unselect/{supplierId}', [ProcurementRequestController::class, 'unselectSupplier'])->name('unselect-supplier');
            Route::post('/{supplierRequest}/approve', [ProcurementRequestController::class, 'approve'])->name('approve');
            Route::post('/{supplierRequest}/reject', [ProcurementRequestController::class, 'reject'])->name('reject');
            Route::get('/{supplierRequest}/ro-document/view', [ProcurementRequestController::class, 'viewRoDocument'])->name('ro-document.view');
            Route::get('/{supplierRequest}/tech-spec-document/view', [ProcurementRequestController::class, 'viewTechSpecDocument'])->name('tech-spec-document.view');
        });
    });

    Route::post('/roles/create-public', [RolesController::class, 'storePublic'])
        ->middleware(['auth', 'admin', 'role:admin'])
        ->name('roles.store.public');
});

Route::prefix('proc')->middleware(['auth', 'admin', 'role:admin,procurement'])->group(function () {
    Route::get('/dashboard', ProcurementDashboardController::class)->name('procurement.dashboard');

    Route::get('/request-supplier', [ProcurementRequestSubmitController::class, 'create'])->name('procurement.request-supplier');
    Route::post('/request-supplier', [ProcurementRequestSubmitController::class, 'store'])->name('procurement.request-supplier.store');
    Route::get('/requests/{procurementRequest}', [ProcurementRequestSubmitController::class, 'show'])->name('procurement.requests.show');
    Route::get('/requests/{procurementRequest}/letter', [ProcurementRequestController::class, 'letter'])->name('procurement.requests.letter');
    Route::get('/requests/{procurementRequest}/letter/print', [ProcurementRequestController::class, 'printLetter'])->name('procurement.requests.letter.print');
    Route::get('/requests/{procurementRequest}/ro-document/view', [ProcurementRequestSubmitController::class, 'viewRoDocument'])->name('procurement.requests.ro-document.view');
    Route::get('/requests/{procurementRequest}/tech-spec-document/view', [ProcurementRequestSubmitController::class, 'viewTechSpecDocument'])->name('procurement.requests.tech-spec-document.view');
});
