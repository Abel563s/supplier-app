import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
    value: string;
    label: string;
    group?: string;
}

interface SearchableSelectProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<SearchableSelectOption | string>;
    placeholder?: string;
    emptyMessage?: string;
    className?: string;
}

export default function SearchableSelect({
    id,
    value,
    onChange,
    options,
    placeholder = 'Search or select an option',
    emptyMessage = 'No results found.',
    className,
}: SearchableSelectProps) {
    const [query, setQuery] = useState('');

    const normalizedOptions = useMemo(
        () => options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option)),
        [options],
    );

    const filteredOptions = useMemo(() => {
        const search = query.trim().toLowerCase();

        if (search === '') {
            return normalizedOptions;
        }

        return normalizedOptions.filter((option) => `${option.label} ${option.group ?? ''}`.toLowerCase().includes(search));
    }, [normalizedOptions, query]);

    return (
        <Combobox
            value={value}
            onChange={(selected) => {
                onChange(selected ?? '');
                setQuery('');
            }}
        >
            <div className={cn('relative', className)}>
                <ComboboxInput
                    id={id}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:outline-hidden"
                    placeholder={placeholder}
                    displayValue={(option: string) => option ?? ''}
                    onChange={(event) => setQuery(event.target.value)}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400" aria-label="Toggle options">
                    <ChevronsUpDown className="h-4 w-4" />
                </ComboboxButton>
                <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div key={option.value}>
                                {option.group && (index === 0 || filteredOptions[index - 1].group !== option.group) && (
                                    <p className="px-3 pt-2 pb-1 text-xs font-semibold text-teal uppercase">{option.group}</p>
                                )}
                                <ComboboxOption
                                    value={option.value}
                                    className={({ active }) =>
                                        `cursor-pointer px-3 py-2 text-sm select-none ${active ? 'bg-teal/10 text-teal' : 'text-gray-700'}`
                                    }
                                >
                                    {({ selected }) => (
                                        <span className="flex items-center justify-between gap-2">
                                            {option.label}
                                            {selected && <Check className="h-4 w-4 text-teal" />}
                                        </span>
                                    )}
                                </ComboboxOption>
                            </div>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}
