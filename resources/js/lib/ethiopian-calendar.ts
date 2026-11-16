/**
 * Ethiopian Calendar conversion utilities for JavaScript/TypeScript.
 * Mirrors the PHP implementation in App\Utils\EthiopianCalendar.
 *
 * The Ethiopian calendar has 13 months:
 * - Months 1-12: 30 days each (Meskerem through Nehase)
 * - Month 13 (Pagume): 5 days in common years, 6 days in leap years
 * - Leap years: year % 4 === 3
 */

export const ETHIOPIAN_MONTHS: Record<number, string> = {
    1: 'Meskerem',
    2: 'Tikemt',
    3: 'Hidar',
    4: 'Tahsas',
    5: 'Tir',
    6: 'Yekatit',
    7: 'Megabit',
    8: 'Miyazia',
    9: 'Ginbot',
    10: 'Sene',
    11: 'Hamle',
    12: 'Nehase',
    13: 'Pagume',
};

export const ETHIOPIAN_MONTH_SHORT: Record<number, string> = {
    1: 'Meskerem',
    2: 'Tikemt',
    3: 'Hidar',
    4: 'Tahsas',
    5: 'Tir',
    6: 'Yekatit',
    7: 'Megabit',
    8: 'Miyazia',
    9: 'Ginbot',
    10: 'Sene',
    11: 'Hamle',
    12: 'Nehase',
    13: 'Pagume',
};

/** Epoch Rata Die: 1 Meskerem 1 (Ethiopian year 1) = August 29, 8 CE (Gregorian proleptic) = RD 2797 */
const EPOCH_RD = 2797;

/**
 * Check if an Ethiopian year is a leap year (Pagume has 6 days).
 */
export function isEthiopianLeapYear(ethiopianYear: number): boolean {
    return ethiopianYear % 4 === 3;
}

/**
 * Get the number of days in an Ethiopian month.
 */
export function ethiopianDaysInMonth(ethiopianYear: number, ethiopianMonth: number): number {
    if (ethiopianMonth < 1 || ethiopianMonth > 13) {
        throw new Error(`Invalid Ethiopian month: ${ethiopianMonth}`);
    }

    if (ethiopianMonth === 13) {
        return isEthiopianLeapYear(ethiopianYear) ? 6 : 5;
    }

    return 30;
}

/**
 * Convert an Ethiopian date to a Rata Die (fixed day number).
 * RD 1 = January 1, 1 CE (Gregorian proleptic).
 */
export function ethiopianToRataDie(
    ethiopianYear: number,
    ethiopianMonth: number,
    ethiopianDay: number
): number {
    if (ethiopianYear < 1) {
        throw new Error('Ethiopian year must be >= 1');
    }
    if (ethiopianMonth < 1 || ethiopianMonth > 13) {
        throw new Error(`Invalid Ethiopian month: ${ethiopianMonth}`);
    }

    const maxDay = ethiopianDaysInMonth(ethiopianYear, ethiopianMonth);
    if (ethiopianDay < 1 || ethiopianDay > maxDay) {
        throw new Error(
            `Invalid Ethiopian day ${ethiopianDay} for month ${ethiopianMonth}/year ${ethiopianYear} (max: ${maxDay})`
        );
    }

    // Days before this Ethiopian year
    // Leap years occur at year % 4 === 3 (years 3, 7, 11, ...)
    // Number of leap years strictly before year EY = floor(EY / 4)
    const yearsBefore = ethiopianYear - 1;
    const leapYearsBefore = Math.floor(ethiopianYear / 4);
    const daysBeforeYear = 365 * yearsBefore + leapYearsBefore;

    // Days within this year before this month
    let daysBeforeMonth = 0;
    for (let m = 1; m < ethiopianMonth; m++) {
        daysBeforeMonth += ethiopianDaysInMonth(ethiopianYear, m);
    }

    return EPOCH_RD + daysBeforeYear + daysBeforeMonth + (ethiopianDay - 1);
}

/**
 * Convert a Rata Die (fixed day number) to an Ethiopian date.
 *
 * @returns {year: number, month: number, day: number}
 */
export function rataDieToEthiopian(rd: number): { year: number; month: number; day: number } {
    if (rd < EPOCH_RD) {
        throw new Error(`Rata Die ${rd} is before the Ethiopian calendar epoch`);
    }

    const daysSinceEpoch = rd - EPOCH_RD;

    // Estimate the year (365.25 days per year average)
    let year = Math.floor(daysSinceEpoch / 365.25) + 1;

    // Adjust year estimate
    while (true) {
        const daysBeforeYear = 365 * (year - 1) + Math.floor(year / 4);
        const daysInYear = isEthiopianLeapYear(year) ? 366 : 365;
        if (daysSinceEpoch < daysBeforeYear) {
            year--;
        } else if (daysSinceEpoch >= daysBeforeYear + daysInYear) {
            year++;
        } else {
            break;
        }
    }

    const daysBeforeYear = 365 * (year - 1) + Math.floor(year / 4);
    let dayOfYear = daysSinceEpoch - daysBeforeYear; // 0-indexed

    // Find the month
    let month = 1;
    for (let m = 1; m <= 13; m++) {
        const daysInMonth = ethiopianDaysInMonth(year, m);
        if (dayOfYear < daysInMonth) {
            month = m;
            break;
        }
        dayOfYear -= daysInMonth;
    }

    return { year, month, day: dayOfYear + 1 };
}

/**
 * Convert an Ethiopian date to a Gregorian date string (Y-m-d).
 */
export function ethiopianToGregorian(
    ethiopianYear: number,
    ethiopianMonth: number,
    ethiopianDay: number
): string {
    const rd = ethiopianToRataDie(ethiopianYear, ethiopianMonth, ethiopianDay);
    return rataDieToGregorian(rd);
}

/**
 * Convert a Gregorian date string (Y-m-d) to an Ethiopian date.
 *
 * @returns {year: number, month: number, day: number}
 */
export function gregorianToEthiopian(gregorianDate: string): { year: number; month: number; day: number } {
    const rd = gregorianToRataDie(gregorianDate);
    return rataDieToEthiopian(rd);
}

/**
 * Convert a Rata Die to a Gregorian date string (Y-m-d).
 */
function rataDieToGregorian(rd: number): string {
    // Algorithm from "Calendrical Calculations" (Dershowitz & Reingold)
    const d0 = rd - 1; // RD 1 = Jan 1, 1 CE, so d0 = 0 for Jan 1, 1 CE

    const n1 = Math.floor(d0 / 146097); // 146097 days = 400-year Gregorian cycle
    let remaining = d0 % 146097;

    const n2 = Math.floor(remaining / 36524); // 36524 days = 100-year cycle
    remaining = remaining % 36524;
    const n2Adj = n2 === 4 ? 3 : n2;

    const n3 = Math.floor(remaining / 1461); // 1461 days = 4-year cycle
    remaining = remaining % 1461;

    const n4 = Math.floor(remaining / 365);
    remaining = remaining % 365;
    const n4Adj = n4 === 4 ? 3 : n4;

    const year = 400 * n1 + 100 * n2Adj + 4 * n3 + n4Adj + 1;
    let dayOfYear = remaining; // 0-indexed day of year

    const isLeap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

    const monthLengths = [
        31,
        isLeap ? 29 : 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];

    let month = 0;
    for (let m = 0; m < 12; m++) {
        if (dayOfYear < monthLengths[m]) {
            month = m;
            break;
        }
        dayOfYear -= monthLengths[m];
    }

    const date = new Date(Date.UTC(year, month, dayOfYear + 1));
    return date.toISOString().split('T')[0];
}

/**
 * Convert a Gregorian date string (Y-m-d) to a Rata Die.
 */
function gregorianToRataDie(gregorianDate: string): number {
    const date = new Date(gregorianDate + 'T00:00:00Z');
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const year = date.getUTCFullYear();

    // Days before this year in Gregorian calendar
    const yearsBefore = year - 1;
    const leapYearsBefore =
        Math.floor(yearsBefore / 4) -
        Math.floor(yearsBefore / 100) +
        Math.floor(yearsBefore / 400);

    const daysBeforeYear = 365 * yearsBefore + leapYearsBefore;

    // RD = 1 (Jan 1, 1 CE) + days from Jan 1, 1 CE to this date
    return 1 + daysBeforeYear + dayOfYear;
}

/**
 * Format an Ethiopian date for display.
 *
 * @returns string e.g. "15 Tikemt 2016"
 */
export function formatEthiopianDate(year: number, month: number, day: number): string {
    return `${day} ${ETHIOPIAN_MONTH_SHORT[month] ?? month} ${year}`;
}

/**
 * Validate an Ethiopian date components.
 *
 * @returns {valid: boolean, error?: string}
 */
export function validateEthiopianDate(
    year: number,
    month: number,
    day: number
): { valid: boolean; error?: string } {
    try {
        ethiopianToRataDie(year, month, day);
        return { valid: true };
    } catch (e: unknown) {
        return { valid: false, error: e instanceof Error ? e.message : String(e) };
    }
}
