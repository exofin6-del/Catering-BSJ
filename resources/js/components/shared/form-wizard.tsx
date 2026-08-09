import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FORM_ACTION_BUTTON_CLASS_NAME =
    'h-9 min-w-0 justify-center gap-1.5 px-2 text-xs whitespace-nowrap sm:min-w-28 sm:gap-2 sm:px-3 sm:text-sm';

export type FormWizardStepDefinition<StepId extends string = string> = {
    description: string;
    icon: LucideIcon;
    id: StepId;
    title: string;
};

export type FormWizardNavigationProps<StepId extends string = string> = {
    activeStepIndex: number;
    onStepClick?: (stepIndex: number) => void;
    steps: FormWizardStepDefinition<StepId>[];
};

export function FormWizardStepper<StepId extends string>({
    activeStepIndex,
    onStepClick,
    steps,
}: FormWizardNavigationProps<StepId>) {
    return (
        <div className="admin-card p-3 sm:p-4 md:p-5">
            <nav aria-label="Progress">
                {/* Mobile */}
                <ol
                    role="list"
                    className="flex w-full items-start gap-2 md:hidden"
                >
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === activeStepIndex;
                        const isDone = index < activeStepIndex;
                        const isHighlighted = isActive || isDone;
                        const isLast = index === steps.length - 1;

                        return (
                            <li
                                key={step.id}
                                className={cn(
                                    'relative flex min-w-0 flex-1 flex-col items-center',
                                    onStepClick && 'cursor-pointer',
                                )}
                                onClick={() => onStepClick?.(index)}
                            >
                                {!isLast && (
                                    <div
                                        className={cn(
                                            'absolute top-[16px] left-1/2 z-0 h-px w-full transition-colors duration-300',
                                            isDone ? 'bg-primary' : 'bg-muted',
                                        )}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-1 bg-background px-1">
                                    <button
                                        type="button"
                                        disabled={!onStepClick}
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300',
                                            isHighlighted
                                                ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'border-muted bg-background text-muted-foreground',
                                        )}
                                    >
                                        <Icon className="size-3.5 stroke-[2.5]" />
                                    </button>

                                    <span
                                        className={cn(
                                            'text-[10px] font-bold tracking-tight whitespace-nowrap uppercase transition-colors',
                                            isHighlighted
                                                ? 'text-primary'
                                                : 'text-muted-foreground/60',
                                        )}
                                    >
                                        Step {index + 1}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {/* Desktop */}
                <ol
                    role="list"
                    className="hidden w-full items-center md:grid"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            steps.length - 1,
                            0,
                        )}, max-content minmax(48px, 1fr)) max-content`,
                    }}
                >
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === activeStepIndex;
                        const isDone = index < activeStepIndex;
                        const isHighlighted = isActive || isDone;
                        const isLast = index === steps.length - 1;

                        return (
                            <Fragment key={step.id}>
                                <li
                                    className={cn(
                                        'flex min-w-0 items-center gap-3',
                                        onStepClick && 'cursor-pointer',
                                    )}
                                    onClick={() => onStepClick?.(index)}
                                >
                                    <button
                                        type="button"
                                        disabled={!onStepClick}
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300',
                                            isHighlighted
                                                ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'border-muted bg-background text-muted-foreground',
                                        )}
                                    >
                                        <Icon className="size-5 stroke-[2.5]" />
                                    </button>

                                    <div className="flex min-w-0 flex-col items-start text-left">
                                        <span
                                            className={cn(
                                                'text-[9px] font-bold tracking-widest uppercase transition-colors',
                                                isHighlighted
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground/60',
                                            )}
                                        >
                                            Step {index + 1}
                                        </span>

                                        <span
                                            className={cn(
                                                'line-clamp-2 max-w-[150px] text-sm leading-5 font-semibold break-words transition-colors',
                                                isHighlighted
                                                    ? 'font-bold text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                </li>

                                {!isLast && (
                                    <div
                                        className={cn(
                                            'mx-4 h-0.5 rounded-full transition-colors duration-300',
                                            isDone ? 'bg-primary' : 'bg-muted',
                                        )}
                                    />
                                )}
                            </Fragment>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

export function FormWizardPage({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('min-h-0 w-full flex-1', className)}>{children}</div>
    );
}

export function FormActionFooter({
    center,
    className,
    leading,
    mode = 'standalone',
    trailing,
}: {
    center?: ReactNode;
    className?: string;
    leading?: ReactNode;
    mode?: 'standalone' | 'fixed';
    trailing?: ReactNode;
}) {
    const footerContent = (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-2">
            <div className="flex min-w-0 justify-start">
                {leading ?? <span aria-hidden />}
            </div>

            {center ?? <span aria-hidden />}

            <div className="flex min-w-0 justify-end">
                {trailing ?? <span aria-hidden />}
            </div>
        </div>
    );

    if (mode === 'fixed') {
        return (
            <footer
                className={cn(
                    'sticky right-0 bottom-0 left-0 z-20 mt-auto -mb-4 md:-mb-6',
                    'border-t border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
                    'px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5',
                    className,
                )}
            >
                <div className="mx-auto max-w-screen-xl">{footerContent}</div>
            </footer>
        );
    }

    return (
        <footer className={cn('shrink-0', className)}>{footerContent}</footer>
    );
}

export function FormWizardFooter({
    activeStepIndex,
    className,
    isLastStep,
    mode = 'standalone',
    nextLabel = 'Berikutnya',
    nextDisabled = false,
    previousLabel = 'Sebelumnya',
    previousFallback,
    processing,
    saveLabel = 'Simpan',
    savingLabel = 'Menyimpan...',
    submitFormId,
    hideStepIndicator,
    stepCount,
    onNext,
    onPrevious,
    onSaveClick,
}: {
    activeStepIndex: number;
    className?: string;
    isLastStep: boolean;
    mode?: 'standalone' | 'fixed';
    nextLabel?: string;
    nextDisabled?: boolean;
    previousLabel?: string;
    previousFallback?: ReactNode;
    processing: boolean;
    saveLabel?: string;
    savingLabel?: string;
    submitFormId?: string;
    hideStepIndicator?: boolean;
    stepCount: number;
    onNext: () => void;
    onPrevious: () => void;
    onSaveClick?: () => void;
}) {
    const showStep = !hideStepIndicator && stepCount > 1;
    const stepIndicator = showStep ? (
        <div className="min-w-fit px-1 text-center text-[11px] font-medium whitespace-nowrap text-muted-foreground sm:text-xs">
            Langkah {activeStepIndex + 1}/{stepCount}
        </div>
    ) : undefined;

    return (
        <FormActionFooter
            center={stepIndicator}
            className={className}
            leading={
                activeStepIndex > 0 ? (
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={processing}
                        onClick={onPrevious}
                        className={FORM_ACTION_BUTTON_CLASS_NAME}
                    >
                        <ChevronLeft className="size-4" />
                        {previousLabel}
                    </Button>
                ) : (
                    previousFallback
                )
            }
            mode={mode}
            trailing={
                isLastStep ? (
                    <Button
                        type={onSaveClick ? 'button' : 'submit'}
                        form={onSaveClick ? undefined : submitFormId}
                        disabled={processing || nextDisabled}
                        onClick={onSaveClick}
                        className={FORM_ACTION_BUTTON_CLASS_NAME}
                    >
                        <Save className="size-4" />
                        {processing ? savingLabel : saveLabel}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled={processing || nextDisabled}
                        onClick={onNext}
                        className={FORM_ACTION_BUTTON_CLASS_NAME}
                    >
                        {nextLabel}
                        <ChevronRight className="size-4" />
                    </Button>
                )
            }
        />
    );
}
