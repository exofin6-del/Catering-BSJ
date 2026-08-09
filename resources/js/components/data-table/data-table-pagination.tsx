import type { Table as TanStackTable } from '@tanstack/react-table';
import * as React from 'react';

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Props<TData> = {
    table: TanStackTable<TData>;
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    className?: string;
};

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

export function DataTablePagination<TData>({
    table,
    pageCount,
    pageIndex,
    pageSize,
    pageSizeOptions = [10, 25, 50, 100],
    className,
}: Props<TData>) {
    const rowsPerPageId = React.useId();
    const tablePagination = table.getState().pagination;
    const currentPageSize = pageSize ?? tablePagination.pageSize;
    const resolvedPageCount = Math.max(pageCount ?? table.getPageCount(), 1);
    const currentPageIndex = Math.min(
        Math.max(pageIndex ?? tablePagination.pageIndex, 0),
        resolvedPageCount - 1,
    );
    const currentPage = currentPageIndex + 1;
    const canPreviousPage = currentPage > 1;
    const canNextPage = currentPage < resolvedPageCount;
    const paginationItems = getPaginationItems(currentPage, resolvedPageCount);
    const normalizedPageSizeOptions = Array.from(
        new Set([...pageSizeOptions, currentPageSize]),
    ).sort((firstOption, secondOption) => firstOption - secondOption);

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 md:px-0',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                <Select
                    value={`${currentPageSize}`}
                    onValueChange={(value) => {
                        table.setPagination((current) => ({
                            ...current,
                            pageIndex: 0,
                            pageSize: Number(value),
                        }));
                    }}
                >
                    <SelectTrigger
                        className="h-8 w-[70px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        id={rowsPerPageId}
                        aria-label="Jumlah baris per halaman"
                    >
                        <SelectValue placeholder={currentPageSize} />
                    </SelectTrigger>
                    <SelectContent
                        side="top"
                        align="center"
                        sideOffset={6}
                        className="min-w-[70px]"
                    >
                        {normalizedPageSizeOptions.map((option) => (
                            <SelectItem key={option} value={`${option}`}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Pagination className="mx-0 w-auto flex-none">
                <PaginationContent className="gap-0.5">
                    {canPreviousPage ? (
                        <PaginationItem>
                            <PaginationPrevious
                                aria-label="Halaman sebelumnya"
                                className="size-8 rounded-full px-0 [&>span]:hidden"
                                onClick={(e) => {
                                    e.preventDefault();
                                    table.setPageIndex(currentPageIndex - 1);
                                }}
                                href="#"
                            />
                        </PaginationItem>
                    ) : null}

                    {paginationItems.map((item, idx) =>
                        typeof item === 'number' ? (
                            <PaginationItem key={item}>
                                <PaginationLink
                                    isActive={item === currentPage}
                                    className="size-8 rounded-full"
                                    aria-label={`Buka halaman ${item}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        table.setPageIndex(item - 1);
                                    }}
                                    href="#"
                                >
                                    {item}
                                </PaginationLink>
                            </PaginationItem>
                        ) : (
                            <PaginationItem key={`${item}-${idx}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        ),
                    )}

                    {canNextPage ? (
                        <PaginationItem>
                            <PaginationNext
                                aria-label="Halaman berikutnya"
                                className="size-8 rounded-full px-0 [&>span]:hidden"
                                onClick={(e) => {
                                    e.preventDefault();
                                    table.setPageIndex(currentPageIndex + 1);
                                }}
                                href="#"
                            />
                        </PaginationItem>
                    ) : null}
                </PaginationContent>
            </Pagination>
        </div>
    );
}

function getPaginationItems(
    currentPage: number,
    pageCount: number,
): PaginationItem[] {
    if (pageCount <= 5) {
        return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 'ellipsis-right', pageCount];
    }

    if (currentPage >= pageCount - 2) {
        return [1, 'ellipsis-left', pageCount - 2, pageCount - 1, pageCount];
    }

    return [1, 'ellipsis-left', currentPage, 'ellipsis-right', pageCount];
}
