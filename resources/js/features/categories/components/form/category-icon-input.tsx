import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { CategoryIconPicker } from './category-icon-picker';

interface CategoryIconInputProps {
    value: string;
    onChange: (value: string) => void;
    iconValue: string;
    onIconChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function CategoryIconInput({
    value,
    onChange,
    iconValue,
    onIconChange,
    placeholder = 'Nama kategori',
    autoFocus,
}: CategoryIconInputProps) {
    return (
        <InputGroup>
            <InputGroupAddon
                align="inline-start"
                className="mr-1.5 border-r border-border/40 pr-1"
            >
                <CategoryIconPicker
                    value={iconValue}
                    onValueChange={onIconChange}
                />
            </InputGroupAddon>
            <InputGroupInput
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
                autoFocus={autoFocus}
                placeholder={placeholder}
            />
        </InputGroup>
    );
}
