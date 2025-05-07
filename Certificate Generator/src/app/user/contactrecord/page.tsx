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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Pagination, Tooltip } from "@heroui/react";
import { AppSidebar } from "@/components/app-sidebar";

interface ContactPerson {
  id : string;
  first_name: string;
  middle_name: string;
  last_name: string;
  contact_no: string;
  email: string;
  designation: string;
  company_id: string;
  key?: string;
  createdAt: string; 
}

interface companies {
  id: string;
  company_name?: string;
  companyName?: string;
}

interface SortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}

const columns = [
  { name: "First Name", uid: "first_name", sortable: true, width: "120px" },
  { name: "Middle Name", uid: "middle_name", sortable: true, width: "120px" },
  { name: "Last Name", uid: "last_name", sortable: true, width: "120px" },
  { name: "Contact Number", uid: "contact_no", sortable: true, width: "120px" },
  { name: "Email", uid: "email", sortable: true, width: "120px" },
  { name: "Designation", uid: "designation", sortable: true, width: "120px" },
  { name: "Company", uid: "company_id", sortable: true, width: "120px" }, // still use company_id as UID
];

const INITIAL_VISIBLE_COLUMNS = ["first_name", "middle_name", "last_name", "contact_no", "email", "designation", "company_id", "actions"];

export default function ContactRecordTable() {
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [companies, setCompanies] = useState<companies[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "createdAt", direction: "descending" });

  const router = useRouter();
  const hasSearchFilter = Boolean(filterValue);

  useEffect(() => {
    const fetchData = async () => {
      setIsSubmitting(true);
      try {
        const [contactsRes, companiesRes] = await Promise.all([
          axios.get('/api/contactPersons'),
          axios.get('/api/companies')
        ]);
  
        console.log(contactsRes.data);  // Log the data to check if IDs are present
        setContactPersons(contactsRes.data);
        setCompanies(companiesRes.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toast({
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch data.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    fetchData();
  }, []);
  

  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company?.company_name || company?.companyName || "Unknown";
  };

  const handleDelete = useCallback((contactId: string) => {
    if (!contactId) return;

    fetch(`/api/contactpersons?id=${contactId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Contact deleted successfully") {
          alert("Contact deleted successfully");
          setContactPersons(prev => prev.filter(c => c.id !== contactId));
        } else {
          alert("Failed to delete contact");
        }
      })
      .catch((error) => {
        console.error("Error deleting contact:", error);
        alert("Error deleting contact");
      });
  }, []);

  const filteredItems = React.useMemo(() => {
    let filtered = [...contactPersons];

    if (hasSearchFilter) {
      const searchLower = filterValue.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.first_name.toLowerCase().includes(searchLower) ||
        contact.middle_name.toLowerCase().includes(searchLower) ||
        contact.last_name.toLowerCase().includes(searchLower) ||
        contact.contact_no.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.designation.toLowerCase().includes(searchLower) ||
        getCompanyName(contact.company_id).toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [contactPersons, filterValue, hasSearchFilter, companies]);

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

  const topContent = (
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
          className="bg-transparent outline-none text-default-400 text-small ml-2"
          onChange={onRowsPerPageChange}
          defaultValue="15"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
        </select>
      </label>
    </div>
  );

  const bottomContent = (
    <div className="py-2 px-2 relative flex justify-between items-center">
      <span className="text-default-400 text-small">
        Total {contactPersons.length} contacts
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
          variant="default"
          size="sm"
          disabled={page === 1}
          onClick={onPreviousPage}
        >
          Previous
        </Button>
        <Button
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

  const renderCell = useCallback((contactPerson: ContactPerson, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="relative flex items-center gap-2">
          <Tooltip>
            <span
              className="text-lg text-info cursor-pointer active:opacity-50"
              onClick={() => {
                if (!contactPerson.id) {
                  // Show a toast message if the ID is missing
                  toast({
                    title: 'Error',
                    description: 'Contact ID is missing. Unable to edit contact.',
                    variant: 'destructive', // Customize to your design
                  });
                  return; // Prevent the redirect if the ID is missing
                }
          
                // Redirect to contact form with the ID if it's available
                router.push(`/admin/contactform?id=${contactPerson.id}`);
              }}
              
            >
              <Edit className="h-6 w-6" />
            </span>
          </Tooltip>
          <Tooltip>
            <span
              className="text-lg text-danger cursor-pointer active:opacity-50"
              onClick={() => handleDelete(contactPerson.id)}
            >
              <Trash2 className="h-6 w-6" />
            </span>
          </Tooltip>
        </div>
      );
    }

    if (columnKey === "company_id") {
      return getCompanyName(contactPerson.company_id);
    }

    return contactPerson[columnKey as keyof ContactPerson];
  }, [router, handleDelete, companies]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 transition-[width,height] ease-linear">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/user/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/user/contactpersonform">Create Contact</BreadcrumbLink>
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
              <Table
                isHeaderSticky
                aria-label="Contact persons table"
                bottomContent={bottomContent}
                bottomContentPlacement="outside"
                classNames={{ wrapper: "max-h-[382px] overflow-y-auto" }}
                selectedKeys={selectedKeys}
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
                onSortChange={(descriptor) =>
                  setSortDescriptor({
                    column: descriptor.column as string,
                    direction: descriptor.direction as "ascending" | "descending",
                  })
                }
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
                  {paginatedItems.map((contactPerson) => (
                    <TableRow key={contactPerson.id}>
                      {columns.map((column) => (
                        <TableCell key={column.uid}>
                          {renderCell(contactPerson, column.uid)}
                        </TableCell>
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
