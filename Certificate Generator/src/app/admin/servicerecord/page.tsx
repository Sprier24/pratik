'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, SearchIcon, Download, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection, ChipProps } from "@heroui/react"
import axios from "axios";
import { Pagination, Tooltip } from "@heroui/react"
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { jsPDF } from "jspdf";

interface EngineerRemarks {
    serviceSpares: string;
    partNo: string;
    rate: string;
    quantity: string;
    total: string;
    poNo: string;
}

interface Service {
    id: string;
    customerName: string;
    customerLocation: string;
    contactPerson: string;
    contactNumber: string;
    serviceEngineer: string;
    serviceEngineerId?: string;
    date: string;
    place: string;
    placeOptions: string;
    natureOfJob: string;
    reportNo: string;
    makeModelNumberoftheInstrumentQuantity: string;
    serialNumberoftheInstrumentCalibratedOK: string;
    serialNumberoftheFaultyNonWorkingInstruments: string;
    engineerReport: string;
    customerReport: string;
    engineerRemarks: EngineerRemarks[];
    engineerName: string;
    engineerId?: string;
    status: string;
    createdAt?: string;
}

type SortDescriptor = {
    column: string;
    direction: 'ascending' | 'descending';
}

interface ServiceResponse {
    serviceId: string;
    message: string;
    downloadUrl: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

const columns = [
    { name: "Report Number", uid: "reportNo", sortable: true, width: "120px" },
    { name: "Customer", uid: "customerName", sortable: true, width: "110px" },
    { name: "Contact Person", uid: "contactPerson", sortable: true, width: "120px" },
    { name: "Contact Number", uid: "contactNumber", sortable: true, width: "120px" },
    { name: "Service Engineer", uid: "serviceEngineer", sortable: true, width: "120px" },
    { name: "Action", uid: "actions", sortable: false, width: "100px" },
];

const INITIAL_VISIBLE_COLUMNS = ["reportNo", "customerName", "contactPerson", "contactNumber", "serviceEngineer", "actions"];

export default function AdminServiceTable() {
    const [services, setServices] = useState<Service[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = React.useState(1);
    const router = useRouter();
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [filterValue, setFilterValue] = useState("");

    const fetchServices = async () => {
        try {
            const response = await axios.get("/api/services", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            let servicesData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                servicesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            servicesData.sort((a: Service, b: Service) => 
                new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );

            const servicesWithKeys = servicesData.map((service: Service) => ({
                ...service,
                key: service.id || generateUniqueId()
            }));

            setServices(servicesWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching services:", error);
            setError("Failed to fetch services.");
            setServices([]);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredServices = [...services];

        if (hasSearchFilter) {
            filteredServices = filteredServices.filter((service) =>
                service.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
                service.contactPerson.toLowerCase().includes(filterValue.toLowerCase()) ||
                service.contactNumber.toLowerCase().includes(filterValue.toLowerCase()) ||
                service.serviceEngineer.toLowerCase().includes(filterValue.toLowerCase()) ||
                service.reportNo.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (startDate || endDate) {
            filteredServices = filteredServices.filter((service) => {
                const serviceDate = new Date(service.date);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;

                if (start && end) {
                    return serviceDate >= start && serviceDate <= end;
                } else if (start) {
                    return serviceDate >= start;
                } else if (end) {
                    return serviceDate <= end;
                }
                return true;
            });
        }

        return filteredServices;
    }, [services, filterValue, hasSearchFilter, startDate, endDate]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortDescriptor.column === "date" || sortDescriptor.column === "createdAt") {
                const dateA = new Date(
                    sortDescriptor.column === "date" ? a.date : (a as any).createdAt || ""
                ).getTime();
                const dateB = new Date(
                    sortDescriptor.column === "date" ? b.date : (b as any).createdAt || ""
                ).getTime();

                const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                return sortDescriptor.direction === "descending" ? -cmp : cmp;
            }

            const first = a[sortDescriptor.column as keyof Service] || '';
            const second = b[sortDescriptor.column as keyof Service] || '';
            const cmp = String(first).localeCompare(String(second));

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const handleDownload = (service: Service) => {
        const logo = new Image();
        logo.src = "/img/rps.png";

        logo.onload = () => {
            const infoImage = new Image();
            infoImage.src = "/img/handf.png";

            infoImage.onload = () => {
                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                const leftMargin = 15;
                const rightMargin = 15;
                const topMargin = 20;
                let y = topMargin;

                // Add logo to top-left
                doc.addImage(logo, "PNG", 5, 5, 50, 15);
                y = 40;

                // Title
                doc.setFont("times", "bold").setFontSize(13).setTextColor(0, 51, 153);
                doc.text("SERVICE / CALIBRATION / INSTALLATION JOBREPORT", pageWidth / 2, y, { align: "center" });
                y += 10;

                // Form data rows
                const addRow = (label: string, value: string) => {
                    const labelOffset = 65;
                    doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
                    doc.text(label + ":", leftMargin, y);
                    doc.setFont("times", "normal").setTextColor(50);
                    doc.text(value || "N/A", leftMargin + labelOffset, y);
                    y += 7;
                };

                addRow("Report No.", service.reportNo);
                addRow("Customer Name", service.customerName);
                addRow("Customer Location", service.customerLocation);
                addRow("Contact Person", service.contactPerson);
                addRow("Status", service.status);
                addRow("Contact Number", service.contactNumber);
                addRow("Service Engineer", service.serviceEngineer);
                addRow("Date", formatDate(service.date));
                addRow("Place", service.place);
                addRow("Place Options", service.placeOptions);
                addRow("Nature of Job", service.natureOfJob);

                addRow("Make & Model Number", service.makeModelNumberoftheInstrumentQuantity);
                y += 5;
                addRow("Calibrated & Tested OK", service.serialNumberoftheInstrumentCalibratedOK);
                addRow("Sr.No Faulty/Non-Working", service.serialNumberoftheFaultyNonWorkingInstruments);
                y += 10;

                // Engineer Report section
                doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
                doc.text("Engineer Report:", leftMargin, y);
                y += 5;

                const engineerReportHeight = 30;
                doc.setDrawColor(0);
                doc.setLineWidth(0.2);
                doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, engineerReportHeight);

                const engineerReportLines = doc.splitTextToSize(service.engineerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
                doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
                doc.text(engineerReportLines, leftMargin + 2, y + 5);
                y += engineerReportHeight + 5;

                // Page 2 for engineer remarks and customer report
                doc.addPage();
                y = topMargin;

                doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
                doc.text("ENGINEER REMARKS", leftMargin, y);
                y += 8;

                const tableHeaders = ["Sr. No.", "Service/Spares", "Part No.", "Rate", "Quantity", "Total", "PO No."];
                const colWidths = [20, 50, 25, 25, 25, 15, 15];
                let x = leftMargin;

                tableHeaders.forEach((header, i) => {
                    doc.rect(x, y, colWidths[i], 8);
                    doc.text(header, x + 2, y + 6);
                    x += colWidths[i];
                });

                y += 8;

                const engineerRemarks = service.engineerRemarks || [];

                engineerRemarks.forEach((item: any, index: number) => {
                    x = leftMargin;
                    const values = [
                        String(index + 1),
                        item.serviceSpares || "",
                        item.partNo || "",
                        item.rate || "",
                        item.quantity || "",
                        item.total || "",
                        item.poNo || ""
                    ];
                    values.forEach((val, i) => {
                        doc.rect(x, y, colWidths[i], 8);
                        doc.text(val, x + 2, y + 6);
                        x += colWidths[i];
                    });
                    y += 8;

                    if (y + 50 > pageHeight) {
                        doc.addPage();
                        y = topMargin;
                    }
                });

                y += 10;

                // Customer Report section
                doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
                doc.text("Customer Report:", leftMargin, y);
                y += 5;

                const customerReportHeight = 30;
                doc.setDrawColor(0);
                doc.setLineWidth(0.2);
                doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, customerReportHeight);

                const customerReportLines = doc.splitTextToSize(service.customerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
                doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
                doc.text(customerReportLines, leftMargin + 2, y + 5);
                y += customerReportHeight + 5;

                // Service Engineer signature
                doc.setFont("times", "normal");
                doc.text("Service Engineer", pageWidth - rightMargin - 40, y);
                doc.text(service.serviceEngineer || "", pageWidth - rightMargin - 40, y + 5);

                // Timestamp
                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, "0");
                const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
                const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                doc.setFontSize(9).setTextColor(100);
                doc.text(`Report Generated On: ${date} ${time}`, leftMargin, pageHeight - 10);

                // Add footer image to all pages
                const footerY = pageHeight - 25;
                const footerWidth = 180;
                const footerHeight = 20;
                const footerX = (pageWidth - footerWidth) / 2;

                const pageCount = doc.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.addImage(infoImage, "PNG", footerX, footerY, footerWidth, footerHeight);
                }

                // Save PDF
                doc.save(`service-${service.reportNo || service.id}.pdf`);
            };

            infoImage.onerror = () => {
                console.error("Failed to load footer image.");
                alert("Company info image not found. Please check the path.");
            };
        };

        logo.onerror = () => {
            console.error("Failed to load logo image.");
            alert("Logo image not found. Please check the path.");
        };
    };

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this service report?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`/api/services?id=${id}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            toast({
                title: "Service Deleted",
                description: "Service successfully deleted",
                variant: "default",
            });
            await fetchServices();
        } catch (error) {
            console.error("Delete error:", error);
            let errorMessage = "Failed to delete service";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message;
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const renderCell = React.useCallback((service: Service, columnKey: string): React.ReactNode => {
        const cellValue = service[columnKey as keyof Service];

        switch (columnKey) {
            case "reportNo":
            case "customerName":
            case "contactPerson":
            case "contactNumber":
            case "serviceEngineer":
                return cellValue;
            case "actions":
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip content="Download">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                onClick={() => handleDownload(service)}
                                disabled={isDownloading === service.id}
                            >
                                {isDownloading === service.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-6 w-6" />
                                )}
                            </Button>
                        </Tooltip>
                        <Tooltip content="Edit">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-lg text-info cursor-pointer active:opacity-50"
                                onClick={() => router.push(`/admin/serviceform?id=${service.id}`)}
                            >
                                <Edit className="h-6 w-6" />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Delete">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                onClick={() => handleDelete(service.id)}
                            >
                                <Trash2 className="h-6 w-6" />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    }, [isDownloading, router]);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
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

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-default-400">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded p-2 text-sm bg-gray-100 text-black 
                            dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-default-400">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="border border-gray-300 rounded p-2 text-sm bg-gray-100 text-black 
                            dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }}
                        >
                            Clear Dates
                        </Button>
                    )}
                </div>
            </div>
        );
    }, [filterValue, onRowsPerPageChange, startDate, endDate]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 relative flex justify-between items-center">
                <span className="text-default-400 text-small">
                    Total {services.length} services
                </span>
                <div className="absolute left-1/2 transform -translate-x-1/2">
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
    }, [services.length, page, pages, onPreviousPage, onNextPage]);

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
                                    <BreadcrumbLink href="/admin/serviceform">
                                        Service Form
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-7xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Service Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table
                                isHeaderSticky
                                aria-label="Service records table"
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
                                <TableBody emptyContent={"No services found"} items={sortedItems}>
                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => (
                                                <TableCell style={{ fontSize: "12px", padding: "8px" }}>
                                                    {renderCell(item, columnKey as string)}
                                                </TableCell>
                                            )}
                                        </TableRow>
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