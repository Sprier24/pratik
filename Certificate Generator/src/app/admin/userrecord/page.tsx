'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { SearchIcon, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Tooltip } from "@heroui/react";
import { AdminSidebar } from "@/components/admin-sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  contact: number;
}

const columns = [
  { name: "User Name", uid: "name", sortable: true, width: "120px" },
  { name: "Email Address", uid: "email", sortable: true, width: "120px" },
  { name: "Contact Number", uid: "contact", sortable: true, width: "120px" },
  { name: "Delete", uid: "actions", sortable: false, width: "100px" },
];
const INITIAL_VISIBLE_COLUMNS = ["name", "email", "contact", "actions"];

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
  const router = useRouter();
  const [sortDescriptor, setSortDescriptor] = useState({ column: "name", direction: "ascending" as "ascending" | "descending" });
useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
  
    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== id));
        toast({
          title: "Success!",
          description: "User has been deleted successfully.",
          variant: "default",
        });
      } else {
        console.error(result.error || "Failed to delete user");
        toast({
          title: "Error",
          description: result.error || "Failed to delete user.",
          variant: "destructive", // To show an error toast
        });
      }
    } catch (error) {
      console.error("Failed to delete user", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the user.",
        variant: "destructive", // To show an error toast
      });
    }
  };
  

  const headerColumns = React.useMemo(() => {
    return columns.filter(column => visibleColumns.has(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filtered = [...users];
    if (filterValue) {
      const searchLower = filterValue.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [users, filterValue]);

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof User] || "";
      const second = b[sortDescriptor.column as keyof User] || "";
      let cmp = 0;
      if (first < second) cmp = -1;
      if (first > second) cmp = 1;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  const paginatedItems = sortedItems;

  const topContent = (
    <div className="flex justify-between items-center gap-4 w-full">
      <Input
        isClearable
        className="w-full max-w-[300px]"
        placeholder="Search"
        startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        onClear={() => setFilterValue("")}
      />
      <span className="text-default-400 text-sm whitespace-nowrap">
        Total {filteredItems.length} {filteredItems.length === 1 ? "y" : "User"}
      </span>
    </div>
  );

  const renderCell = useCallback((user: User, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="relative flex items-center gap-2">
          <Tooltip>
            <span
              className="text-lg text-danger cursor-pointer active:opacity-50"
              onClick={(e) => {
                e.preventDefault();
                handleDelete(user.id);
              }}
            >
              <Trash2 className="h-6 w-6" />
            </span>
          </Tooltip>
        </div>
      );
    }
    return user[columnKey as keyof User];
  }, [router]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/userform">
                    <BreadcrumbLink>Create User</BreadcrumbLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">User Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                isHeaderSticky
                aria-label="Users table with custom cells, pagination and sorting"
                bottomContentPlacement="outside"
                classNames={{
                  wrapper: "max-h-[382px] overflow-y-auto",
                }}
                sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
                onSortChange={(descriptor) => {
                  setSortDescriptor({
                    column: descriptor.column as string,
                    direction: descriptor.direction as "ascending" | "descending",
                  });
                }}
              >
                <TableHeader columns={headerColumns}>
                  {(column) => (
                    <TableColumn
                      key={column.uid}
                      align={column.uid === "actions" ? "center" : "start"}
                      allowsSorting={column.sortable}
                    >
                      {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-6">
                        Go to create user and add data
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((User) => (
                      <TableRow key={User.id}>
                        {columns.map((column) => (
                          <TableCell key={column.uid}>
                            {renderCell(User, column.uid)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
