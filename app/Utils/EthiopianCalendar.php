<?php

namespace App\Utils;

use DateTime;
use DateTimeZone;
use InvalidArgumentException;

/**
 * Ethiopian Calendar conversion utilities.
 *
 * The Ethiopian calendar has 13 months:
 * - Months 1-12: 30 days each (Meskerem through Nehase)
 * - Month 13 (Pagume): 5 days in common years, 6 days in leap years
 * - Leap years: year % 4 == 3 (Pagume has 6 days)
 *
 * Conversion between Ethiopian and Gregorian dates uses the Rata Die (fixed day
 * number) method. RD 1 = January 1, 1 CE (Gregorian proleptic).
 * Ethiopian epoch: 1 Meskerem 1 = August 29, 8 CE (Gregorian proleptic) = RD 2797.
 */
class EthiopianCalendar
{
    /** @var array<int, string> */
    public const MONTHS = [
        1 => 'Meskerem',
        2 => 'Tikemt',
        3 => 'Hidar',
        4 => 'Tahsas',
        5 => 'Tir',
        6 => 'Yekatit',
        7 => 'Megabit',
        8 => 'Miyazia',
        9 => 'Ginbot',
        10 => 'Sene',
        11 => 'Hamle',
        12 => 'Nehase',
        13 => 'Pagume',
    ];

    /** Short month names for display */
    public const MONTH_SHORT = [
        1 => 'Meskerem',
        2 => 'Tikemt',
        3 => 'Hidar',
        4 => 'Tahsas',
        5 => 'Tir',
        6 => 'Yekatit',
        7 => 'Megabit',
        8 => 'Miyazia',
        9 => 'Ginbot',
        10 => 'Sene',
        11 => 'Hamle',
        12 => 'Nehase',
        13 => 'Pagume',
    ];

    /** Epoch Rata Die: 1 Meskerem 1 (Ethiopian year 1) = August 29, 8 CE (Gregorian proleptic) */
    private const EPOCH_RD = 2797;

    /**
     * Check if an Ethiopian year is a leap year (Pagume has 6 days).
     */
    public static function isLeapYear(int $ethiopianYear): bool
    {
        return $ethiopianYear % 4 === 3;
    }

    /**
     * Get the number of days in an Ethiopian month.
     */
    public static function daysInMonth(int $ethiopianYear, int $ethiopianMonth): int
    {
        if ($ethiopianMonth < 1 || $ethiopianMonth > 13) {
            throw new InvalidArgumentException("Invalid Ethiopian month: {$ethiopianMonth}");
        }

        if ($ethiopianMonth === 13) {
            return self::isLeapYear($ethiopianYear) ? 6 : 5;
        }

        return 30;
    }

    /**
     * Convert an Ethiopian date to a Rata Die (fixed day number).
     *
     * RD 1 = January 1, 1 CE (Gregorian proleptic).
     */
    public static function toRataDie(int $ethiopianYear, int $ethiopianMonth, int $ethiopianDay): int
    {
        if ($ethiopianYear < 1) {
            throw new InvalidArgumentException('Ethiopian year must be >= 1');
        }
        if ($ethiopianMonth < 1 || $ethiopianMonth > 13) {
            throw new InvalidArgumentException("Invalid Ethiopian month: {$ethiopianMonth}");
        }

        $maxDay = self::daysInMonth($ethiopianYear, $ethiopianMonth);
        if ($ethiopianDay < 1 || $ethiopianDay > $maxDay) {
            throw new InvalidArgumentException(
                "Invalid Ethiopian day {$ethiopianDay} for month {$ethiopianMonth}/year {$ethiopianYear} (max: {$maxDay})"
            );
        }

        // Days before this Ethiopian year
        // Leap years occur at year % 4 === 3 (years 3, 7, 11, ...)
        // Number of leap years strictly before year EY = floor(EY / 4)
        $yearsBefore = $ethiopianYear - 1;
        $leapYearsBefore = (int) floor($ethiopianYear / 4);
        $daysBeforeYear = 365 * $yearsBefore + $leapYearsBefore;

        // Days within this year before this month
        $daysBeforeMonth = 0;
        for ($m = 1; $m < $ethiopianMonth; $m++) {
            $daysBeforeMonth += self::daysInMonth($ethiopianYear, $m);
        }

        return self::EPOCH_RD + $daysBeforeYear + $daysBeforeMonth + ($ethiopianDay - 1);
    }

    /**
     * Convert a Rata Die (fixed day number) to an Ethiopian date.
     *
     * @return array{year: int, month: int, day: int}
     */
    public static function fromRataDie(int $rd): array
    {
        if ($rd < self::EPOCH_RD) {
            throw new InvalidArgumentException("Rata Die {$rd} is before the Ethiopian calendar epoch");
        }

        $daysSinceEpoch = $rd - self::EPOCH_RD;

        // Estimate the year (365.25 days per year average)
        $year = (int) floor($daysSinceEpoch / 365.25) + 1;

        // Adjust year estimate
        while (true) {
            $daysBeforeYear = 365 * ($year - 1) + (int) floor($year / 4);
            $daysInYear = self::isLeapYear($year) ? 366 : 365;
            if ($daysSinceEpoch < $daysBeforeYear) {
                $year--;
            } elseif ($daysSinceEpoch >= $daysBeforeYear + $daysInYear) {
                $year++;
            } else {
                break;
            }
        }

        $daysBeforeYear = 365 * ($year - 1) + (int) floor($year / 4);
        $dayOfYear = $daysSinceEpoch - $daysBeforeYear; // 0-indexed

        // Find the month
        $month = 1;
        for ($m = 1; $m <= 13; $m++) {
            $daysInMonth = self::daysInMonth($year, $m);
            if ($dayOfYear < $daysInMonth) {
                $month = $m;
                break;
            }
            $dayOfYear -= $daysInMonth;
        }

        return [
            'year' => $year,
            'month' => $month,
            'day' => $dayOfYear + 1, // Convert 0-indexed to 1-indexed
        ];
    }

    /**
     * Convert an Ethiopian date to a Gregorian date string (Y-m-d).
     */
    public static function ethiopianToGregorian(int $ethiopianYear, int $ethiopianMonth, int $ethiopianDay): string
    {
        $rd = self::toRataDie($ethiopianYear, $ethiopianMonth, $ethiopianDay);

        return self::rataDieToGregorian($rd);
    }

    /**
     * Convert a Gregorian date string (Y-m-d) to an Ethiopian date.
     *
     * @return array{year: int, month: int, day: int}
     */
    public static function gregorianToEthiopian(string $gregorianDate): array
    {
        $rd = self::gregorianToRataDie($gregorianDate);

        return self::fromRataDie($rd);
    }

    /**
     * Convert a Rata Die to a Gregorian date string (Y-m-d).
     */
    public static function rataDieToGregorian(int $rd): string
    {
        // Algorithm from "Calendrical Calculations" (Dershowitz & Reingold)
        // Convert fixed day number to Gregorian date
        $d0 = $rd - 1; // RD 1 = Jan 1, 1 CE, so d0 = 0 for Jan 1, 1 CE

        $n1 = (int) floor($d0 / 146097); // 146097 days = 400-year Gregorian cycle
        $d0 = $d0 % 146097;

        $n2 = (int) floor($d0 / 36524); // 36524 days = 100-year cycle
        $d0 = $d0 % 36524;
        if ($n2 === 4) {
            $n2 = 3;
        }

        $n3 = (int) floor($d0 / 1461); // 1461 days = 4-year cycle
        $d0 = $d0 % 1461;

        $n4 = (int) floor($d0 / 365);
        $d0 = $d0 % 365;
        if ($n4 === 4) {
            $n4 = 3;
        }

        $year = 400 * $n1 + 100 * $n2 + 4 * $n3 + $n4 + 1;
        $dayOfYear = $d0; // 0-indexed day of year

        $isLeap = ($year % 400 === 0) || ($year % 4 === 0 && $year % 100 !== 0);

        $monthLengths = [31, $isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        $month = 0;
        for ($m = 0; $m < 12; $m++) {
            if ($dayOfYear < $monthLengths[$m]) {
                $month = $m;
                break;
            }
            $dayOfYear -= $monthLengths[$m];
        }

        $date = new DateTime("{$year}-01-01", new DateTimeZone('UTC'));
        $date->modify("+{$month} months");
        $date->modify("+{$dayOfYear} days");

        return $date->format('Y-m-d');
    }

    /**
     * Convert a Gregorian date string (Y-m-d) to a Rata Die.
     */
    public static function gregorianToRataDie(string $gregorianDate): int
    {
        $date = new DateTime($gregorianDate, new DateTimeZone('UTC'));
        $startOfYear = new DateTime($date->format('Y') . '-01-01', new DateTimeZone('UTC'));

        $dayOfYear = (int) $date->diff($startOfYear)->format('%a');
        $year = (int) $date->format('Y');

        // Days before this year in Gregorian calendar
        $yearsBefore = $year - 1;
        $leapYearsBefore = (int) floor($yearsBefore / 4)
            - (int) floor($yearsBefore / 100)
            + (int) floor($yearsBefore / 400);

        $daysBeforeYear = 365 * $yearsBefore + $leapYearsBefore;

        // RD = 1 (Jan 1, 1 CE) + days from Jan 1, 1 CE to this date
        return 1 + $daysBeforeYear + $dayOfYear;
    }

    /**
     * Format an Ethiopian date for display.
     *
     * @return string e.g. "15 Tikemt 2016"
     */
    public static function formatEthiopianDate(int $year, int $month, int $day): string
    {
        return "{$day} " . self::MONTH_SHORT[$month] . " {$year}";
    }

    /**
     * Validate an Ethiopian date components.
     *
     * @return array{valid: bool, error?: string}
     */
    public static function validate(int $year, int $month, int $day): array
    {
        try {
            self::toRataDie($year, $month, $day);
            return ['valid' => true];
        } catch (InvalidArgumentException $e) {
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }
}
