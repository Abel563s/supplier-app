<?php

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function supplierImportColumns(): array
{
    return [
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
}

function supplierImportRow(array $overrides = []): array
{
    return array_merge([
        'legal_form' => 'PLC',
        'country_of_registration' => 'Ethiopia',
        'legal_name' => 'Imported Supplier PLC',
        'trade_name' => 'Imported Supplier',
        'tin' => '9988776655',
        'business_registration_no' => 'BRN/IMPORT/2026',
        'vat_registered' => 'false',
        'vat_registration_no' => '',
        'registered_capital' => '1000000',
        'latest_annual_turnover' => '5000000',
        'date_established' => '2015-04-01',
        'trade_license_renewed_date' => '2026-06-30',
        'primary_contact_name' => 'Abebe Kebede',
        'primary_phone' => '+251911000000',
        'alternate_phone' => '+251911000001',
        'primary_email' => 'imported-supplier@example.com',
        'alternate_email' => '',
        'city' => 'Addis Ababa',
        'subcity' => 'Bole',
        'woreda' => '03',
        'procurement_type' => 'supply;consulting',
        'primary_business_category' => 'Office Facilities',
        'sub_category' => 'Office Material',
        'specialization' => 'Wholesaler / Distributor',
        'products_services_description' => 'Office supplies and equipment.',
        'bank_name' => '',
        'branch_name' => '',
        'account_number' => '',
        'account_holder_name' => '',
        'number_of_employees' => '',
        'technical_personnel' => '',
        'non_technical_personnel' => '',
        'tax_clearance_from' => '2025-07-01',
        'tax_clearance_to' => '2026-06-30',
        'tax_clearance_fiscal_year' => '',
        'subject_to_excise_tax' => 'false',
        'authorized_manufacturer_distributor' => 'false',
        'signatory_title' => 'General Manager',
        'owner_ceo_name' => 'Abebe Kebede',
        'declaration_confirmed' => 'true',
    ], $overrides);
}

function supplierImportFile(array $rows, ?array $columns = null): UploadedFile
{
    $stream = fopen('php://temp', 'r+');
    $columns ??= supplierImportColumns();
    fputcsv($stream, $columns);

    foreach ($rows as $row) {
        fputcsv($stream, array_map(
            static fn (string $column): string => (string) ($row[$column] ?? ''),
            $columns,
        ));
    }

    rewind($stream);
    $contents = stream_get_contents($stream);
    fclose($stream);

    return UploadedFile::fake()->createWithContent('suppliers.csv', $contents);
}

function supplierImportSpreadsheet(array $rows, ?array $columns = null): UploadedFile
{
    $columns ??= supplierImportColumns();
    $spreadsheet = new Spreadsheet;
    $worksheet = $spreadsheet->getActiveSheet();
    $worksheet->fromArray([$columns], null, 'A1');

    foreach ($rows as $rowIndex => $row) {
        $rowNumber = $rowIndex + 2;
        $worksheet->fromArray([
            array_map(
                static fn (string $column): string => (string) ($row[$column] ?? ''),
                $columns,
            ),
        ], null, 'A'.$rowNumber);

        foreach (['date_established', 'trade_license_renewed_date', 'tax_clearance_from', 'tax_clearance_to'] as $dateColumn) {
            $columnIndex = array_search($dateColumn, $columns, true);

            if ($columnIndex === false || empty($row[$dateColumn])) {
                continue;
            }

            $cellAddress = Coordinate::stringFromColumnIndex($columnIndex + 1).$rowNumber;
            $worksheet->setCellValue($cellAddress, SpreadsheetDate::PHPToExcel(new DateTimeImmutable($row[$dateColumn])));
            $worksheet->getStyle($cellAddress)->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_DATE_YYYYMMDD);
        }
    }

    $path = tempnam(sys_get_temp_dir(), 'supplier-import-');
    (new Xlsx($spreadsheet))->save($path);
    $contents = file_get_contents($path);
    unlink($path);
    $spreadsheet->disconnectWorksheets();

    return UploadedFile::fake()->createWithContent('suppliers.xlsx', $contents);
}

it('downloads a styled Excel template with every admin supplier registration field', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('suppliers.import.template'));

    $response->assertOk()
        ->assertDownload('supplier-import-template.xlsx')
        ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $path = tempnam(sys_get_temp_dir(), 'supplier-template-');
    file_put_contents($path, $response->streamedContent());
    $spreadsheet = IOFactory::load($path);
    $worksheet = $spreadsheet->getActiveSheet();

    expect($worksheet->rangeToArray('A1:AN1', null, true, false, false)[0])->toBe(supplierImportColumns())
        ->and($worksheet->getStyle('A1')->getFill()->getStartColor()->getRGB())->toBe('00515F')
        ->and($worksheet->getStyle('A1')->getFont()->getColor()->getRGB())->toBe('FFFFFF');

    $spreadsheet->disconnectWorksheets();
    unlink($path);
});

it('imports multiple supplier registrations from the template format', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $firstSupplier = supplierImportRow();
    $secondSupplier = supplierImportRow([
        'legal_name' => 'Second Imported Supplier PLC',
        'tin' => '1122334455',
        'business_registration_no' => 'BRN/IMPORT/2027',
        'primary_email' => 'second-imported-supplier@example.com',
        'declaration_confirmed' => 'false',
    ]);

    $this->actingAs($admin)
        ->from(route('suppliers.index'))
        ->post(route('suppliers.import'), ['file' => supplierImportFile([$firstSupplier, $secondSupplier])])
        ->assertRedirect(route('suppliers.index'))
        ->assertSessionHas('success', '2 suppliers imported successfully.');

    $first = Supplier::query()->where('tin', '9988776655')->firstOrFail();
    $second = Supplier::query()->where('tin', '1122334455')->firstOrFail();

    expect($first->legal_name)->toBe('Imported Supplier PLC')
        ->and($first->procurement_type)->toBe('supply,consulting')
        ->and($first->status)->toBe('submitted')
        ->and($first->declaration_confirmed)->toBeTrue()
        ->and($second->status)->toBe('draft')
        ->and($second->declaration_confirmed)->toBeFalse()
        ->and($first->user->role)->toBe('supplier');
});

it('imports supplier registrations from the styled Excel template format', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierImportRow();

    $this->actingAs($admin)
        ->from(route('suppliers.index'))
        ->post(route('suppliers.import'), ['file' => supplierImportSpreadsheet([$supplier])])
        ->assertRedirect(route('suppliers.index'))
        ->assertSessionHas('success', '1 suppliers imported successfully.');

    $importedSupplier = Supplier::query()->where('tin', '9988776655')->firstOrFail();

    expect($importedSupplier->legal_name)->toBe('Imported Supplier PLC')
        ->and($importedSupplier->procurement_type)->toBe('supply,consulting')
        ->and($importedSupplier->status)->toBe('submitted')
        ->and($importedSupplier->date_established->format('Y-m-d'))->toBe('2015-04-01')
        ->and($importedSupplier->user->role)->toBe('supplier');
});

it('rejects invalid CSV rows without partially creating suppliers', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $firstSupplier = supplierImportRow();
    $invalidSupplier = supplierImportRow([
        'legal_name' => 'Invalid Imported Supplier',
        'tin' => '0000000000',
        'business_registration_no' => 'BRN/INVALID/2026',
        'primary_email' => 'not-an-email',
    ]);
    $initialUserCount = User::query()->count();

    $this->actingAs($admin)
        ->from(route('suppliers.index'))
        ->post(route('suppliers.import'), ['file' => supplierImportFile([$firstSupplier, $invalidSupplier])])
        ->assertRedirect(route('suppliers.index'))
        ->assertSessionHasErrors('file');

    expect(Supplier::query()->whereIn('tin', ['9988776655', '0000000000'])->count())->toBe(0)
        ->and(User::query()->count())->toBe($initialUserCount);
});

it('rejects CSV files with unexpected headers', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->from(route('suppliers.index'))
        ->post(route('suppliers.import'), [
            'file' => supplierImportFile([supplierImportRow()], ['name', 'email']),
        ])
        ->assertRedirect(route('suppliers.index'))
        ->assertSessionHasErrors('file');
});

it('rejects duplicate emails in one CSV without creating suppliers', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $firstSupplier = supplierImportRow();
    $duplicateSupplier = supplierImportRow([
        'legal_name' => 'Duplicate Imported Supplier PLC',
        'tin' => '1122334455',
        'business_registration_no' => 'BRN/IMPORT/2027',
    ]);

    $this->actingAs($admin)
        ->from(route('suppliers.index'))
        ->post(route('suppliers.import'), ['file' => supplierImportFile([$firstSupplier, $duplicateSupplier])])
        ->assertRedirect(route('suppliers.index'))
        ->assertSessionHasErrors('file');

    expect(Supplier::query()->count())->toBe(0);
});

it('forbids non-admin users from importing supplier registrations', function () {
    $user = User::factory()->create(['role' => 'supplier']);

    $this->actingAs($user)
        ->post(route('suppliers.import'), ['file' => supplierImportFile([supplierImportRow()])])
        ->assertForbidden();
});
