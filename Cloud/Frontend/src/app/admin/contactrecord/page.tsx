'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";
import { Loader2, SearchIcon, Edit2Icon, DeleteIcon, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { ModeToggle } from "@/components/ModeToggle";
import { Pagination, Tooltip } from "@heroui/react";
import { AdminSidebar } from "@/components/admin-sidebar";

// Define the ContactPerson type
interface ContactPerson {
    firstName: string;
    middleName: string;
    lastName: string;
    contactNo: string;
    email: string;
    designation: string;
    _id: string;
    key?: string;

}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Define columns for the table
const columns = [
    { name: "First Name", uid: "firstName", sortable: true, width: "120px" },
    { name: "Middle Name", uid: "middleName", sortable: true, width: "120px" },
    { name: "Last Name", uid: "lastName", sortable: true, width: "120px" },
    { name: "Contact Number", uid: "contactNo", sortable: true, width: "120px" },
    { name: "Email Address", uid: "email", sortable: true, width: "120px" },
    { name: "Designation", uid: "designation", sortable: true, width: "120px" },
    { name: "Action", uid: "actions", sortable: false, width: "120px" },
];

// Define initial visible columns
const INITIAL_VISIBLE_COLUMNS = ["firstName", "middleName", "lastName", "contactNo", "email", "designation", "actions"];

export default function ContactPersonDetailsTable() {
    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = React.useState(1);
    const router = useRouter();
    const [filterValue, setFilterValue] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<ContactPerson | null>(null);
    const hasSearchFilter = Boolean(filterValue);



    const fetchContactPersons = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/v1/contactperson/getContactPersons`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            let contactPersonsData = response.data.data || [];

            // Add newly fetched data at the top
            setContactPersons(prev => [...contactPersonsData, ...prev]); // Prepend the data

            setError(null);
        } catch (error) {
            console.error("Error fetching contact persons:", error);
            setError("Failed to fetch contact persons. Please try again.");
            setContactPersons([]);
        }
    };


    // Delete contact person by ID
    const handleDelete = async (contactPersonId: string) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:5000/api/v1/contactperson/deleteContactPerson/${contactPersonId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setContactPersons(prev => prev.filter(contact => contact._id !== contactPersonId));
            toast.success("Contact person deleted successfully");
        } catch (error) {
            console.error("Error deleting contact person:", error);
            toast.error("Failed to delete contact person");
        }
    };


    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredContacts = [...contactPersons];

        if (hasSearchFilter) {
            filteredContacts = filteredContacts.filter((contact) =>
                contact.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
                contact.lastName.toLowerCase().includes(filterValue.toLowerCase()) ||
                contact.email.toLowerCase().includes(filterValue.toLowerCase()) ||
                contact.contactNo.toLowerCase().includes(filterValue.toLowerCase()) ||
                contact.designation.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        return filteredContacts;
    }, [contactPersons, hasSearchFilter, filterValue]);

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof ContactPerson] || "";
            const second = b[sortDescriptor.column as keyof ContactPerson] || "";

            let cmp = 0;
            if (first < second) cmp = -1;
            if (first > second) cmp = 1;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);


    // Pagination logic
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
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[80%]"
                        placeholder="Search"
                        startContent={<SearchIcon className="h-4 w-10 text-muted-foreground" />}
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onClear={() => setFilterValue("")}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {contactPersons.length} contacts</span>
                    <label className="flex items-center text-default-400 text-small gap-2">
                        Rows per page
                        <div className="relative">
                            <select
                                className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-md px-3 py-1 text-default-400 text-sm cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                                onChange={onRowsPerPageChange}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                            </select>
                        </div>
                    </label>
                </div>
            </div>
        );
    }, [filterValue, onRowsPerPageChange, contactPersons.length]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <Pagination
                    isCompact
                    showShadow
                    color="success"
                    page={page}
                    total={pages}
                    onChange={setPage}
                    classNames={{
                        cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
                        item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
                    }}
                />
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

    const renderCell = useCallback((contact: ContactPerson, columnKey: string) => {
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer"
                            onClick={() => handleDelete(contact._id)}
                        >
                            <DeleteIcon />
                        </span>
                    </Tooltip>

                    <Tooltip>
                        <span
                            className="text-lg text-info cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`contactform?id=${contact._id}`);
                            }}
                        >
                            <Edit2Icon className="h-6 w-6" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return contact[columnKey as keyof ContactPerson];
    }, []);

    useEffect(() => {
        fetchContactPersons();
    }, []);

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <ModeToggle />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbLink href="/admin/dashboard">
                                    Dashboard
                                </BreadcrumbLink>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/contactform">
                                        Create Contact
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Contact Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15 max-h-screen-xl max-w-screen-xl">
                                {error ? (
                                    <div className="text-red-500 text-center py-4">{error}</div>
                                ) : (
                                    <Table
                                        isHeaderSticky
                                        aria-label="Contacts table with custom cells, pagination, and sorting"
                                        bottomContent={bottomContent}
                                        bottomContentPlacement="outside"
                                        classNames={{
                                            wrapper: "max-h-[382px] overflow-y-auto",
                                        }}
                                        selectedKeys={selectedKeys}
                                        sortDescriptor={sortDescriptor}
                                        topContent={topContent}
                                        topContentPlacement="outside"
                                        onSelectionChange={setSelectedKeys}
                                        onSortChange={setSortDescriptor}
                                    >
                                        <TableHeader>
                                            {headerColumns.map((column) => (
                                                <TableColumn key={column.uid} width={column.width}>
                                                    {column.name}
                                                </TableColumn>
                                            ))}
                                        </TableHeader>
                                        <TableBody>
                                            {sortedItems.map((contact) => (
                                                <TableRow key={contact._id}>
                                                    {headerColumns.map((column) => (
                                                        <TableCell key={column.uid}>
                                                            {renderCell(contact, column.uid)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
