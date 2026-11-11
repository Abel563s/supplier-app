<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Supplier\RegistrationController;
use App\Http\Requests\Admin\SupplierStoreRequest;
use App\Http\Requests\Admin\SupplierUpdateRequest;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\SupplierReviewHistory;
use App\Models\SupplierStatusHistory;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Reader\Exception as SpreadsheetReaderException;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as XlsxReader;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierController extends Controller
{
    private const SUPPLIER_IMPORT_COLUMNS = [
        'legal_form',
        'country_of_registration',
        'legal_name',
        'trade_name',
        'tin',
        'business_registration_no',
        'vat_registered',
        'vat_registration_no',
        'registered_capital',
        'latest_annual_turnover',
        'date_established',
        'trade_license_renewed_date',
        'primary_contact_name',
        'primary_phone',
        'alternate_phone',
        'primary_email',
        'alternate_email',
        'city',
        'subcity',
        'woreda',
        'procurement_type',
        'primary_business_category',
        'sub_category',
        'specialization',
        'products_services_description',
        'bank_name',
        'branch_name',
        'account_number',
        'account_holder_name',
        'number_of_employees',
        'technical_personnel',
        'non_technical_personnel',
        'tax_clearance_from',
        'tax_clearance_to',
        'tax_clearance_fiscal_year',
        'subject_to_excise_tax',
        'authorized_manufacturer_distributor',
        'signatory_title',
        'owner_ceo_name',
        'declaration_confirmed',
    ];

    public function index(Request $request)
    {
        $visibleSuppliers = Supplier::query()->where('status', '!=', 'draft');

        if ($request->user()->isDepartmentReviewer()) {
            $visibleSuppliers->whereHas('departmentReviews', fn ($query) => $query
                ->where('department', $request->user()->role));
        }

        $query = clone $visibleSuppliers;

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('legal_name', 'like', "%{$search}%")
                    ->orWhere('trade_name', 'like', "%{$search}%")
                    ->orWhere('tin', 'like', "%{$search}%")
                    ->orWhere('business_registration_no', 'like', "%{$search}%")
                    ->orWhere('primary_contact_name', 'like', "%{$search}%")
                    ->orWhere('primary_email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'pending') {
                $query->whereIn('status', ['pending', 'under_review']);
            } else {
                $query->where('status', $status);
            }
        }

        $suppliers = $query
            ->with('departmentReviews.departmentRole')
            ->orderByDesc('created_at')
            ->paginate(20);

        $stats = [
            'total' => (clone $visibleSuppliers)->count(),
            'pending' => (clone $visibleSuppliers)->whereIn('status', ['pending', 'under_review'])->count(),
        ];

        foreach (['submitted', 'needs_correction', 'approved', 'rejected'] as $status) {
            $stats[$status] = (clone $visibleSuppliers)->where('status', $status)->count();
        }

        return Inertia::render('admin/suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats,
            'isAdmin' => $request->user()->isAdmin(),
            'departmentName' => $request->user()->roleDefinition?->name,
            'departments' => Role::departments()->pluck('name', 'key'),
            'title' => 'Suppliers',
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/suppliers/create', [
            'documentTypes' => SupplierDocument::catalog(),
            'completion' => (new RegistrationController)->calculateCompletion(null, 1),
            'title' => 'Register Supplier',
        ]);
    }

    public function store(SupplierStoreRequest $request, NotificationService $notificationService)
    {
        $validated = $request->validated();

        $supplier = DB::transaction(fn (): Supplier => $this->createSupplier($validated));

        if ($supplier->status === 'submitted') {
            $notificationService->notifySupplierRegistered($supplier);
        }

        return redirect()
            ->route('suppliers.edit', $supplier)
            ->with('success', 'Supplier registered successfully. Upload the required documents to complete the registration.');
    }

    public function downloadImportTemplate(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $spreadsheet = new Spreadsheet;
            $worksheet = $spreadsheet->getActiveSheet();
            $worksheet->setTitle('Suppliers');

            $lastColumn = Coordinate::stringFromColumnIndex(count(self::SUPPLIER_IMPORT_COLUMNS));
            $worksheet->fromArray([self::SUPPLIER_IMPORT_COLUMNS], null, 'A1');
            $worksheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '00515F'],
                ],
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
            ]);
            $worksheet->getRowDimension(1)->setRowHeight(32);
            $worksheet->getStyle("A2:{$lastColumn}501")
                ->getNumberFormat()
                ->setFormatCode(NumberFormat::FORMAT_TEXT);

            foreach (self::SUPPLIER_IMPORT_COLUMNS as $index => $column) {
                $letter = Coordinate::stringFromColumnIndex($index + 1);
                $worksheet->getColumnDimension($letter)->setWidth(22);

                if (in_array($column, ['date_established', 'trade_license_renewed_date', 'tax_clearance_from', 'tax_clearance_to'], true)) {
                    $worksheet->getStyle("{$letter}2:{$letter}501")
                        ->getNumberFormat()
                        ->setFormatCode('yyyy-mm-dd');
                }
            }

            $worksheet->freezePane('A2');
            $worksheet->setAutoFilter("A1:{$lastColumn}501");

            (new Xlsx($spreadsheet))->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, 'supplier-import-template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'extensions:csv,xlsx', 'mimes:csv,txt,xlsx', 'max:10240'],
        ]);

        $file = $request->file('file');
        $dataRows = [];

        if (Str::lower($file->getClientOriginalExtension()) === 'xlsx') {
            $reader = new XlsxReader;

            try {
                $worksheets = $reader->listWorksheetInfo($file->getRealPath());
            } catch (SpreadsheetReaderException) {
                throw ValidationException::withMessages([
                    'file' => 'The uploaded Excel file is invalid or could not be read.',
                ]);
            }

            if (($worksheets[0]['totalRows'] ?? 0) > 501) {
                throw ValidationException::withMessages([
                    'file' => 'The import is limited to 500 supplier rows per file.',
                ]);
            }

            try {
                $spreadsheet = $reader->load($file->getRealPath());
            } catch (SpreadsheetReaderException) {
                throw ValidationException::withMessages([
                    'file' => 'The uploaded Excel file is invalid or could not be read.',
                ]);
            }

            $worksheet = $spreadsheet->getSheet(0);
            $highestColumnIndex = Coordinate::columnIndexFromString($worksheet->getHighestDataColumn());

            if ($highestColumnIndex > count(self::SUPPLIER_IMPORT_COLUMNS)) {
                $spreadsheet->disconnectWorksheets();

                throw ValidationException::withMessages([
                    'file' => 'The Excel columns do not match the supplier import template. Download a fresh template and keep its column names.',
                ]);
            }

            $lastColumn = Coordinate::stringFromColumnIndex(max(1, $highestColumnIndex));
            $headers = $worksheet->rangeToArray("A1:{$lastColumn}1", null, false, false, false)[0] ?? [];
            $headers = array_map(static fn ($header): string => trim((string) $header), $headers);

            for ($rowNumber = 2; $rowNumber <= $worksheet->getHighestDataRow(); $rowNumber++) {
                $values = $worksheet->rangeToArray("A{$rowNumber}:{$lastColumn}{$rowNumber}", null, false, false, false)[0] ?? [];

                foreach ($headers as $columnIndex => $header) {
                    $cell = $worksheet->getCell([$columnIndex + 1, $rowNumber]);

                    if (
                        in_array($header, ['date_established', 'trade_license_renewed_date', 'tax_clearance_from', 'tax_clearance_to'], true)
                        && is_numeric($values[$columnIndex] ?? null)
                        && SpreadsheetDate::isDateTime($cell)
                    ) {
                        $values[$columnIndex] = SpreadsheetDate::excelToDateTimeObject((float) $values[$columnIndex])->format('Y-m-d');
                    }
                }

                $dataRows[$rowNumber] = $values;
            }

            $spreadsheet->disconnectWorksheets();
        } else {
            $stream = fopen($file->getRealPath(), 'r');

            if ($stream === false) {
                throw ValidationException::withMessages([
                    'file' => 'The uploaded CSV file could not be read.',
                ]);
            }

            $headers = fgetcsv($stream);

            if ($headers === false) {
                fclose($stream);

                throw ValidationException::withMessages([
                    'file' => 'The CSV file is empty. Download and use the supplier template.',
                ]);
            }

            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
            $headers = array_map(static fn ($header): string => trim((string) $header), $headers);

            $rowNumber = 1;

            while (($values = fgetcsv($stream)) !== false) {
                $dataRows[++$rowNumber] = $values;
            }

            fclose($stream);
        }

        if (
            count($headers) !== count(self::SUPPLIER_IMPORT_COLUMNS)
            || count(array_unique($headers)) !== count($headers)
            || array_diff(self::SUPPLIER_IMPORT_COLUMNS, $headers) !== []
            || array_diff($headers, self::SUPPLIER_IMPORT_COLUMNS) !== []
        ) {
            throw ValidationException::withMessages([
                'file' => 'The columns do not match the supplier import template. Download a fresh template and keep its column names.',
            ]);
        }

        $rows = [];
        $errors = [];
        $seenEmails = [];

        foreach ($dataRows as $rowNumber => $values) {
            if (count(array_filter($values, static fn ($value): bool => $value !== null && trim((string) $value) !== '')) === 0) {
                continue;
            }

            if (count($values) !== count($headers)) {
                $errors[] = "Row {$rowNumber}: The number of values does not match the template columns.";

                continue;
            }

            $row = array_combine($headers, array_map(
                static fn ($value) => $value === null || trim((string) $value) === '' ? null : trim((string) $value),
                $values,
            ));

            $row['procurement_type'] = $row['procurement_type'] === null
                ? []
                : array_values(array_filter(array_map('trim', explode(';', $row['procurement_type']))));

            foreach (['vat_registered', 'subject_to_excise_tax', 'authorized_manufacturer_distributor', 'declaration_confirmed'] as $booleanField) {
                $row[$booleanField] = $this->normalizeImportBoolean($row[$booleanField]);
            }

            $emailKey = Str::lower((string) $row['primary_email']);

            if (isset($seenEmails[$emailKey])) {
                $errors[] = "Row {$rowNumber}: Primary Email duplicates row {$seenEmails[$emailKey]}.";

                continue;
            }

            $seenEmails[$emailKey] = $rowNumber;

            $validator = Validator::make(
                $row,
                SupplierStoreRequest::createRules(),
                SupplierStoreRequest::createMessages(),
            );

            if ($validator->fails()) {
                $errors[] = "Row {$rowNumber}: ".implode(' ', $validator->errors()->all());

                continue;
            }

            $rows[] = $validator->validated();

            if (count($rows) > 500) {
                $errors[] = 'The import is limited to 500 supplier rows per file.';

                break;
            }
        }

        if ($rows === [] && $errors === []) {
            $errors[] = 'The CSV has no supplier rows to import.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'file' => implode("\n", $errors),
            ]);
        }

        DB::transaction(function () use ($rows): void {
            foreach ($rows as $row) {
                $this->createSupplier($row);
            }
        });

        return back()->with('success', count($rows).' suppliers imported successfully.');
    }

    public function show(Request $request, Supplier $supplier)
    {
        $this->authorizeSupplierAccess($request, $supplier);

        $isAdmin = $request->user()->isAdmin();
        $isDepartmentReviewer = $request->user()->isDepartmentReviewer();
        $latestDepartmentGrades = null;
        $departmentReview = null;
        $gradeGroups = $this->gradeGroups($supplier, $isDepartmentReviewer ? $request->user()->role : null);

        if ($isDepartmentReviewer) {
            $departmentReview = $supplier->departmentReviews()
                ->where('department', $request->user()->role)
                ->firstOrFail();

            $latestDepartmentGrades = $supplier->reviewHistory()
                ->where('event_type', 'department_graded')
                ->where('department', $request->user()->role)
                ->orderByDesc('id')
                ->first()?->grade_snapshot;
        }

        return Inertia::render('admin/suppliers/show', [
            'supplier' => $supplier,
            'documents' => $supplier->documents()->orderBy('document_type')->orderByDesc('uploaded_at')->orderByDesc('id')->get(),
            'documentTypes' => SupplierDocument::catalog(),
            'contracts' => $supplier->contracts()->orderByDesc('created_at')->get(),
            'statusHistory' => $supplier->statusHistory()->with('changer')->orderByDesc('created_at')->get(),
            'correctionRequests' => $supplier->correctionRequests()->with('requester')->orderByDesc('created_at')->get(),
            'reviewHistory' => $supplier->reviewHistory()->with(['actor', 'departmentRole'])->get(),
            'departmentReviews' => $supplier->departmentReviews()->with(['departmentRole', 'reviewer'])->get(),
            'departments' => Role::departments()->orderBy('name')->get(['key', 'name']),
            'isAdmin' => $isAdmin,
            'isDepartmentReviewer' => $isDepartmentReviewer,
            'canGrade' => $isAdmin
                ? $supplier->approval_stage === 'admin_review'
                : $isDepartmentReviewer
                    && $supplier->approval_stage === 'department_review'
                    && $departmentReview?->status !== 'completed',
            'canInitiateHandoff' => $isAdmin
                && $supplier->approval_stage === 'admin_review'
                && ! in_array($supplier->status, ['approved', 'rejected'], true)
                && $this->gradesAreComplete($supplier->procurement_grades, $supplier),
            'canManageAdminReview' => $isAdmin
                && $supplier->approval_stage === 'admin_review'
                && ! in_array($supplier->status, ['approved', 'rejected'], true),
            'isSupplierApproved' => $supplier->status === 'approved',
            'isDepartmentReview' => $supplier->approval_stage === 'department_review',
            'canApproveDepartment' => $isDepartmentReviewer
                && $supplier->approval_stage === 'department_review'
                && $departmentReview?->status !== 'completed'
                && $this->gradesAreComplete($latestDepartmentGrades, $supplier, $request->user()->role),
            'reviewingDepartmentName' => $departmentReview?->departmentRole?->name,
            'departmentGrades' => $latestDepartmentGrades,
            'gradeGroups' => $gradeGroups,
            'title' => $supplier->legal_name,
        ]);
    }

    public function correctionRequestForm(Supplier $supplier)
    {
        return Inertia::render('admin/suppliers/correction-request', [
            'supplier' => $supplier,
            'title' => 'Request Correction',
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('admin/suppliers/edit', [
            'supplier' => $supplier,
            'completion' => (new RegistrationController)->calculateCompletion($supplier->user, 1),
            'documents' => $supplier->documents()->orderBy('document_type')->orderByDesc('uploaded_at')->orderByDesc('id')->get(),
            'documentTypes' => SupplierDocument::catalog(),
            'declarationConfirmed' => (bool) $supplier->declaration_confirmed,
            'title' => 'Edit '.$supplier->legal_name,
        ]);
    }

    public function uploadDocument(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $request->validate([
            'document_type' => ['required', 'string', Rule::in(SupplierDocument::TYPES)],
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $file = $request->file('file');
        $path = $file->store('supplier-documents', 'public');

        $supplier->documents()->create([
            'document_type' => $request->input('document_type'),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'file_type' => $file->getClientOriginalExtension(),
            'uploaded_at' => now(),
        ]);

        $notificationService->notifySupplierDocumentsSubmitted($supplier);

        return response()->json([
            'message' => 'Document uploaded successfully.',
            'document_type' => $request->input('document_type'),
        ], 201);
    }

    public function update(SupplierUpdateRequest $request, Supplier $supplier, NotificationService $notificationService)
    {
        $validated = $request->validated();

        if (isset($validated['procurement_type']) && is_array($validated['procurement_type'])) {
            $validated['procurement_type'] = implode(',', $validated['procurement_type']);
        }

        $supplier->update($validated);

        if ($supplier->status !== 'draft') {
            $notificationService->notifySupplierUpdated($supplier);
        }

        return redirect()->route('suppliers.show', $supplier)->with('success', 'Supplier details updated successfully.');
    }

    public function storeGrades(Request $request, Supplier $supplier)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $grades = $this->validatedGrades($request, $supplier);

        DB::transaction(function () use ($request, $supplier, $grades): void {
            $lockedSupplier = Supplier::query()->lockForUpdate()->findOrFail($supplier->id);
            abort_if($lockedSupplier->approval_stage !== 'admin_review', 409, 'The Admin review stage is already complete.');

            $lockedSupplier->procurement_grades = $grades;
            $lockedSupplier->save();

            SupplierReviewHistory::create([
                'supplier_id' => $lockedSupplier->id,
                'event_type' => 'admin_graded',
                'actor_id' => $request->user()->id,
                'grade_snapshot' => $grades,
            ]);
        });

        return redirect()->route('suppliers.show', $supplier)->with('success', 'Supplier grades saved successfully.');
    }

    public function storeDepartmentGrades(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $this->authorizeSupplierAccess($request, $supplier);
        abort_unless($request->user()->isDepartmentReviewer(), 403);

        $grades = $this->validatedGrades($request, $supplier, $request->user()->role);

        DB::transaction(function () use ($request, $supplier, $grades): void {
            $lockedSupplier = Supplier::query()->lockForUpdate()->findOrFail($supplier->id);
            abort_if($lockedSupplier->approval_stage !== 'department_review', 409, 'This supplier is not in the department review stage.');

            $departmentReview = $lockedSupplier->departmentReviews()
                ->where('department', $request->user()->role)
                ->lockForUpdate()
                ->firstOrFail();
            abort_if($departmentReview->status === 'completed', 409, 'This department review is already complete.');

            $departmentReview->update([
                'status' => 'in_review',
                'reviewer_id' => $request->user()->id,
            ]);

            SupplierReviewHistory::create([
                'supplier_id' => $lockedSupplier->id,
                'event_type' => 'department_graded',
                'department' => $request->user()->role,
                'actor_id' => $request->user()->id,
                'grade_snapshot' => $grades,
            ]);
        });

        $notificationService->notifyDepartmentGraded($supplier, $request->user()->role);

        return redirect()->route('suppliers.show', $supplier)->with('success', 'Departmental grades saved successfully.');
    }

    public function sendCorrectionRequest(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'section' => ['required', 'string', 'max:255'],
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $previousStatus = $supplier->status;
        $supplier->update(['status' => 'needs_correction']);

        SupplierStatusHistory::create([
            'supplier_id' => $supplier->id,
            'previous_status' => $previousStatus,
            'new_status' => 'needs_correction',
            'changed_by' => $request->user()->id,
            'notes' => $validated['reason'],
        ]);

        $supplier->correctionRequests()->create([
            'requested_by' => $request->user()->id,
            'section' => $validated['section'],
            'reason' => $validated['reason'],
        ]);

        $notificationService->notifyAdditionalInfoRequested($supplier, $validated['section'], $validated['reason']);

        return redirect()->route('suppliers.show', $supplier)->with('success', 'Correction request sent successfully.');
    }

    public function approve(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'departments' => ['required', 'array', 'min:1'],
            'departments.*' => [
                'required',
                'string',
                'distinct',
                Rule::exists('roles', 'key')->where('type', Role::DEPARTMENT),
            ],
        ]);

        DB::transaction(function () use ($request, $supplier, $validated): void {
            $lockedSupplier = Supplier::query()->lockForUpdate()->findOrFail($supplier->id);
            abort_if($lockedSupplier->approval_stage !== 'admin_review', 409, 'This supplier has already been handed off for review.');
            abort_unless($this->gradesAreComplete($lockedSupplier->procurement_grades, $lockedSupplier), 422, 'Complete the initial grades before handing off this supplier.');

            $departments = Role::departments()
                ->whereIn('key', $validated['departments'])
                ->get()
                ->sortBy(fn (Role $department): int => array_search($department->key, $validated['departments'], true))
                ->values();
            abort_if($departments->count() !== count($validated['departments']), 422, 'Select one or more valid departments.');

            $previousStatus = $lockedSupplier->status;
            $assignedAt = now();

            $lockedSupplier->update([
                'status' => 'pending',
                'approval_department' => $departments->first()->key,
                'approval_stage' => 'department_review',
                'department_review_status' => 'assigned',
                'department_assigned_by' => $request->user()->id,
                'department_assigned_at' => $assignedAt,
            ]);

            foreach ($departments as $department) {
                $lockedSupplier->departmentReviews()->create([
                    'department' => $department->key,
                    'assigned_by' => $request->user()->id,
                    'assigned_at' => $assignedAt,
                    'status' => 'assigned',
                ]);

                SupplierReviewHistory::create([
                    'supplier_id' => $lockedSupplier->id,
                    'event_type' => 'department_assigned',
                    'department' => $department->key,
                    'actor_id' => $request->user()->id,
                    'grade_snapshot' => $lockedSupplier->procurement_grades,
                    'notes' => 'Initial Admin review completed and handed off.',
                ]);
            }

            SupplierStatusHistory::create([
                'supplier_id' => $lockedSupplier->id,
                'previous_status' => $previousStatus,
                'new_status' => 'pending',
                'changed_by' => $request->user()->id,
                'notes' => 'Initial review completed; assigned to '.$departments->pluck('name')->join(', ').'.',
            ]);
        });

        foreach ($validated['departments'] as $departmentKey) {
            $notificationService->notifySupplierAssigned($supplier, $departmentKey);
        }

        return back()->with('success', 'Supplier review assigned to the selected departments.');
    }

    public function approveDepartmentReview(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $this->authorizeSupplierAccess($request, $supplier);
        abort_unless($request->user()->isDepartmentReviewer(), 403);

        DB::transaction(function () use ($request, $supplier): void {
            $lockedSupplier = Supplier::query()->lockForUpdate()->findOrFail($supplier->id);
            abort_if($lockedSupplier->approval_stage !== 'department_review', 409, 'This supplier is not in the department review stage.');

            $departmentReview = $lockedSupplier->departmentReviews()
                ->where('department', $request->user()->role)
                ->lockForUpdate()
                ->firstOrFail();
            abort_if($departmentReview->status === 'completed', 409, 'This department review is already complete.');

            $grades = $lockedSupplier->reviewHistory()
                ->where('event_type', 'department_graded')
                ->where('department', $request->user()->role)
                ->orderByDesc('id')
                ->first()?->grade_snapshot;

            abort_unless(
                $this->gradesAreComplete($grades, $lockedSupplier, $request->user()->role),
                422,
                'Complete and save departmental grades before approval.',
            );

            $departmentReview->update([
                'status' => 'completed',
                'reviewer_id' => $request->user()->id,
                'approved_at' => now(),
            ]);

            if (! $lockedSupplier->departmentReviews()->where('status', '!=', 'completed')->exists()) {
                $previousStatus = $lockedSupplier->status;
                $lockedSupplier->update([
                    'status' => 'approved',
                    'department_review_status' => 'completed',
                    'approval_stage' => 'department_review_completed',
                ]);

                SupplierStatusHistory::create([
                    'supplier_id' => $lockedSupplier->id,
                    'previous_status' => $previousStatus,
                    'new_status' => 'approved',
                    'changed_by' => $request->user()->id,
                    'notes' => 'All assigned departments approved the supplier.',
                ]);
            }

            SupplierReviewHistory::create([
                'supplier_id' => $lockedSupplier->id,
                'event_type' => 'department_approved',
                'department' => $request->user()->role,
                'actor_id' => $request->user()->id,
                'grade_snapshot' => $grades,
                'notes' => 'Departmental review completed; supplier is not finally approved.',
            ]);
        });

        $notificationService->notifyDepartmentApproved($supplier, $request->user()->role);

        $supplier->refresh();
        if ($supplier->status === 'approved') {
            $notificationService->notifySupplierApproved($supplier);
        }

        return back()->with('success', 'Departmental review completed. Final supplier approval remains pending.');
    }

    public function reject(Request $request, Supplier $supplier, NotificationService $notificationService)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $previousStatus = $supplier->status;

        $supplier->update(['status' => 'rejected']);

        SupplierStatusHistory::create([
            'supplier_id' => $supplier->id,
            'previous_status' => $previousStatus,
            'new_status' => 'rejected',
            'changed_by' => $request->user()->id,
            'notes' => $validated['reason'],
        ]);

        $notificationService->notifySupplierRejected($supplier);

        return back()->with('success', 'Supplier rejected successfully.');
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        $supplier->delete();

        return back()->with('success', 'Supplier deleted successfully.');
    }

    /**
     * @param  array<string, mixed>|null  $grades
     * @return array<string, array<string, float>>
     */
    private function validatedGrades(Request $request, Supplier $supplier, ?string $department = null): array
    {
        $gradeGroups = $this->gradeGroups($supplier, $department);
        abort_if($gradeGroups === [], 422, 'A supplier must have a procurement type before it can be graded.');

        $rules = [
            'grades' => ['required', 'array:'.implode(',', array_column($gradeGroups, 'key'))],
        ];

        foreach ($gradeGroups as $group) {
            $criterionKeys = array_column($group['criteria'], 'key');
            $rules["grades.{$group['key']}"] = ['required', 'array:'.implode(',', $criterionKeys)];

            foreach ($group['criteria'] as $criterion) {
                $rules["grades.{$group['key']}.{$criterion['key']}"] = [
                    'required',
                    'numeric',
                    'min:0',
                    'max:'.$criterion['maximumScore'],
                ];
            }
        }

        $validated = $request->validate($rules);

        return array_map(
            static fn (array $scores): array => array_map(static fn (string|int|float $score): float => (float) $score, $scores),
            $validated['grades'],
        );
    }

    /**
     * @param  array<string, mixed>|null  $grades
     */
    private function gradesAreComplete(?array $grades, Supplier $supplier, ?string $department = null): bool
    {
        if ($grades === null) {
            return false;
        }

        $gradeGroups = $this->gradeGroups($supplier, $department);

        if ($gradeGroups === []) {
            return false;
        }

        foreach ($gradeGroups as $group) {
            if (! isset($grades[$group['key']])) {
                return false;
            }

            foreach ($group['criteria'] as $criterion) {
                if (! array_key_exists($criterion['key'], $grades[$group['key']])) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function createSupplier(array $validated): Supplier
    {
        $validated['procurement_type'] = implode(',', $validated['procurement_type']);
        $declarationConfirmed = (bool) ($validated['declaration_confirmed'] ?? false);

        $user = User::create([
            'name' => $validated['primary_contact_name'],
            'email' => $validated['primary_email'],
            'password' => Hash::make(Str::password(20)),
            'role' => 'supplier',
        ]);

        $supplier = new Supplier($validated);
        $supplier->user()->associate($user);
        $supplier->declaration_confirmed = $declarationConfirmed;
        $supplier->status = $declarationConfirmed ? 'submitted' : 'draft';
        $supplier->submitted_at = $declarationConfirmed ? now() : null;
        $supplier->save();

        return $supplier;
    }

    private function normalizeImportBoolean(?string $value): bool|string|null
    {
        if ($value === null) {
            return false;
        }

        return match (Str::lower($value)) {
            '1', 'true', 'yes', 'y' => true,
            '0', 'false', 'no', 'n' => false,
            default => $value,
        };
    }

    /**
     * @return array<int, array{
     *     key: string,
     *     label: string,
     *     criteria: array<int, array{key: string, label: string, maximumScore: int}>,
     *     maximumScore: int,
     *     contributionPercent: int|null
     * }>
     */
    private function gradeGroups(Supplier $supplier, ?string $department = null): array
    {
        $genericCriteria = [
            'company_profile' => ['Company Profile', 5],
            'organizational_structure' => ['Organizational Structure', 3],
            'address' => ['Address', 4],
            'product_list' => ['Product or product list', 4],
            'legal_document' => ['Legal Document', 4],
        ];

        $departmentCriteria = match ($department) {
            'mep' => null,
            'commercial' => [
                'contract_amount_supply_chain' => ['Contract Amount - Supply Chain', 5],
                'years_of_experience' => ['Years of Experience', 5],
                'executed_projects' => ['Number of Executed Projects', 5],
                'ongoing_contracts' => ['Number of Ongoing Contracts', 5],
                'client_reference' => ['Client Reference', 5],
            ],
            'finance' => [
                'asset' => ['Asset', 3],
                'working_capital' => ['Working Capital', 3],
                'revenue' => ['Revenue', 3],
                'stock_inventory_ratio' => ['Stock / Inventory Ratio', 3],
                'equity_liability_ratio' => ['Equity to Liability Ratio', 3],
                'qualified_opinion' => ['Qualified Opinion', 2],
                'unqualified_opinion' => ['Unqualified Opinion', 3],
            ],
            'hse' => [
                'documentation_certification' => ['Documentation & Certification', 2],
                'employee_competency_safety' => ['Employees Competency, Safety Culture & Climate', 8],
                'housekeeping_waste_management' => ['Housekeeping and Waste Management', 4],
                'agreement_commitment' => ['Agreement & Commitment', 1],
            ],
            'qaqc' => $genericCriteria,
            default => null,
        };

        if ($departmentCriteria !== null) {
            return [$this->makeGradeGroup(
                'general',
                'Overall',
                $departmentCriteria,
                match ($department) {
                    'commercial' => 25,
                    'finance' => 20,
                    'hse' => 20,
                    default => null,
                },
            )];
        }

        $procurementTypes = $supplier->procurement_type_list;

        if ($procurementTypes === []) {
            return [];
        }

        return array_map(function (string $procurementType) use ($department, $genericCriteria): array {
            $criteria = $department === 'mep'
                ? ($procurementType === 'supply'
                    ? [
                        'system_certificate' => ['Third-party system certificate (management system certificate)', 4],
                        'product_certificate' => ['Third-party product certificate', 5],
                        'test_report' => ['Third-party test report', 5],
                        'product_catalogue' => ['Product Catalogue', 6],
                    ]
                    : [
                        'system_certificate' => ['Third-party system certificate (management system certificate)', 4],
                        'product_certificate' => ['Third-party product certificate', 5],
                        'litigation_history' => ['Litigation History', 5],
                        'product_catalogue' => ['Product Catalogue', 6],
                    ])
                : $genericCriteria;

            return $this->makeGradeGroup(
                $procurementType,
                match ($procurementType) {
                    'service' => 'Subcontract works & Services',
                    'consulting' => 'Consulting',
                    'non-consulting' => 'Non-Consulting',
                    default => ucfirst($procurementType),
                },
                $criteria,
                $department === 'mep' ? 20 : null,
            );
        }, $procurementTypes);
    }

    /**
     * @param  array<string, array{string, int}>  $criteria
     * @return array{
     *     key: string,
     *     label: string,
     *     criteria: array<int, array{key: string, label: string, maximumScore: int}>,
     *     maximumScore: int,
     *     contributionPercent: int|null
     * }
     */
    private function makeGradeGroup(string $key, string $label, array $criteria, ?int $contributionPercent): array
    {
        $formattedCriteria = [];

        foreach ($criteria as $criterionKey => [$criterionLabel, $maximumScore]) {
            $formattedCriteria[] = [
                'key' => $criterionKey,
                'label' => $criterionLabel,
                'maximumScore' => $maximumScore,
            ];
        }

        return [
            'key' => $key,
            'label' => $label,
            'criteria' => $formattedCriteria,
            'maximumScore' => array_sum(array_column($formattedCriteria, 'maximumScore')),
            'contributionPercent' => $contributionPercent,
        ];
    }

    private function authorizeSupplierAccess(Request $request, Supplier $supplier): void
    {
        if ($request->user()->isDepartmentReviewer()) {
            abort_unless(
                $supplier->departmentReviews()->where('department', $request->user()->role)->exists(),
                404,
            );
        }
    }
}
