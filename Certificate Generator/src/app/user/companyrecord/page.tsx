'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SearchIcon, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import * as z from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Pagination, Tooltip } from "@heroui/react";
import { AppSidebar } from "@/components/app-sidebar";

interface companies {
    id: string;
    company_name: string;
    address: string;
    gst_number: string;
    industries: string;
    website: string;
    industries_type: string;
    flag: string;
}

interface SortDescriptor {
    column: string;
    direction: "ascending" | "descending";
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const columns = [
    { name: "Company Name", uid: "company_name", sortable: true, width: "120px" },
    { name: "Company Address", uid: "address", sortable: true, width: "120px" },
    { name: "Industries", uid: "industries", sortable: true, width: "120px" },
    { name: "Industries Type", uid: "industries_type", sortable: true, width: "120px" },
    { name: "GST Number", uid: "gst_number", sortable: true, width: "120px" },
    { name: "Website", uid: "website", sortable: true, width: "120px" },
    { name: "Flag", uid: "flag", sortable: true, width: "120px" },
];

const INITIAL_VISIBLE_COLUMNS = ["company_name", "address", "gst_number", "industries", "website", "industries_type", "flag", "actions"];

const companiesSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  industries: z.string().min(1, { message: "Industries is required" }),
  industriesType: z.string().min(1, { message: "Industry type is required" }),
  gstNumber: z.string().min(1, { message: "GST number is required" }),
  website: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url({ message: "Invalid website URL" }).optional()
  ),
  flag: z.enum(["Red", "Yellow", "Green"], {
    required_error: "Please select a flag color",
  }),
});

export default function CompanyDetailsTable() {
    const [companies, setCompanies] = useState<companies[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [page, setPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt", 
        direction: "descending",
    });
    const router = useRouter();
    const hasSearchFilter = Boolean(filterValue);

    useEffect(() => {
        const fetchCompanies = async () => {
          setIsSubmitting(true);
          try {
            const res = await axios.get('/api/companies'); 
            setCompanies(res.data); 
          } catch (err: any) {
            console.error("Error fetching companies:", err);
            toast({
              title: 'Error',
              description: err.response?.data?.error || 'Failed to fetch companies.',
              variant: 'destructive',
            });
          } finally {
            setIsSubmitting(false);
          }
        };
      
        fetchCompanies(); 
      }, []);
      

      const handleDelete = useCallback((companyId: string) => {
        if (!companyId) {
          console.error("No company ID provided for deletion");
          return;
        }
      
        console.log("Attempting to delete company with ID:", companyId);
      
        fetch(`/api/companies?id=${companyId}`, {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Company deleted successfully") {
              alert("Company deleted successfully");
              // Optionally, refresh the list of companies or remove the deleted company from the state
            } else {
              alert("Failed to delete company");
            }
          })
          .catch((error) => {
            console.error("Error deleting company:", error);
            alert("Error deleting company");
          });
      }, []);   
      
    const filteredItems = React.useMemo(() => {
        let filtered = [...companies];

        if (hasSearchFilter) {
            const searchLower = filterValue.toLowerCase();
            filtered = filtered.filter(company =>
                company.company_name.toLowerCase().includes(searchLower) ||
                company.address.toLowerCase().includes(searchLower) ||
                company.industries.toLowerCase().includes(searchLower) ||
                company.industries_type.toLowerCase().includes(searchLower) ||
                company.gst_number.toLowerCase().includes(searchLower) ||
                company.website.toLowerCase().includes(searchLower) ||
                company.flag.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [companies, filterValue, hasSearchFilter]);

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof companies] || "";
            const second = b[sortDescriptor.column as keyof companies] || "";
    
            let cmp = 0;
            if (first < second) cmp = -1;
            if (first > second) cmp = 1;
    
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const paginatedItems = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page, rowsPerPage]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const onNextPage = useCallback(() => {
        if (page < pages) setPage(page + 1);
    }, [page, pages]);

    const onPreviousPage = useCallback(() => {
        if (page > 1) setPage(page - 1);
    }, [page]);

    const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex justify-between items-center gap-4">
                <Input
                    isClearable
                    className="w-full max-w-[300px]"
                    placeholder="Search"
                    startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    onClear={() => setFilterValue("")}
                />
                <label className="flex items-center text-default-400 text-small">
                    Rows per page:
                    <select
                        className="bg-transparent  outline-none text-default-400 text-small ml-2"
                        onChange={onRowsPerPageChange}
                        defaultValue="5"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                    </select>
                </label>
            </div>
        );
    }, [filterValue, onRowsPerPageChange]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 relative flex justify-between items-center">
                <span className="text-default-400 text-small">
                    Total {companies.length} company
                </span>
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <Pagination
                        isCompact
                        showShadow
                        color="success"
                        page={page}
                        total={pages}
                        onChange={setPage}
                    />
                </div>
                <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={page === 1}
                        onClick={onPreviousPage}
                    >
                        Previous
                    </Button>
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={page === pages}
                        onClick={onNextPage}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [page, pages, onPreviousPage, onNextPage]);

    const renderCell = useCallback((company: companies, columnKey: string) => {
        if (columnKey === "actions") {
            console.log("Company object:", company); // Check if company._id exists
    
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-info cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`/admin/companyform?id=${company.id}`);
                            }}
                        >
                            <Edit className="h-6 w-6" />
                        </span>
                    </Tooltip>
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                if (company.id) {
                                    handleDelete(company.id); // Ensure company._id is passed here
                                } else {
                                    console.error("No company ID available"); // Log the error if company ID is missing
                                }
                            }}
                        >
                            <Trash2 className="h-6 w-6" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return company[columnKey as keyof companies];
    }, [router, handleDelete]);
    
    

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/user/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/user/companyform">
                                        Create Company
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Company Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table
                                isHeaderSticky
                                aria-label="Companies table with custom cells, pagination and sorting"
                                bottomContent={bottomContent}
                                bottomContentPlacement="outside"
                                classNames={{
                                    wrapper: "max-h-[382px] overflow-y-auto",
                                }}
                                selectedKeys={selectedKeys}
                                sortDescriptor={sortDescriptor}
                                topContent={topContent}
                                topContentPlacement="outside"
                                onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
                                onSortChange={(descriptor) => {
                                    setSortDescriptor({
                                        column: descriptor.column as string,
                                        direction: descriptor.direction as "ascending" | "descending",
                                    });
                                }}
                            >
                                <TableHeader>
                                    {columns.map((column) => (
                                        <TableColumn
                                            key={column.uid}
                                            allowsSorting={column.sortable}
                                            onClick={() => {
                                                if (!column.sortable) return;
                                                setSortDescriptor(prev => ({
                                                    column: column.uid,
                                                    direction:
                                                        prev.column === column.uid && prev.direction === "ascending"
                                                            ? "descending"
                                                            : "ascending",
                                                }));
                                            }}
                                            style={{ cursor: column.sortable ? "pointer" : "default" }}
                                        >
                                            {column.name}
                                        </TableColumn>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {paginatedItems.map((company) => (
                                        <TableRow key={company.id}>
                                            {columns.map((column) => (
                                                <TableCell key={column.uid}>{renderCell(company, column.uid)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}