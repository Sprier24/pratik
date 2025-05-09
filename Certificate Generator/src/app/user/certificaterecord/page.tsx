'use client';
import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { SearchIcon, Trash2, Download, ArrowUpIcon, ArrowDownIcon, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection } from "@heroui/react"
import { Pagination, Tooltip } from "@heroui/react"
import { jsPDF } from "jspdf";
import { AppSidebar } from "@/components/app-sidebar";

interface Observation {
    gas: string;
    before: string;
    after: string;
}
interface Certificate {
    _id: string;
    certificateNo: string;
    customerName: string;
    siteLocation: string;
    makeModel: string;
    range: string;
    serialNo: string;
    calibrationGas: string;
    gasCanisterDetails: string;
    dateOfCalibration: string;
    calibrationDueDate: string;
    observations: Observation[];
    engineerName: string;
    status: string;
    [key: string]: string;
}
type SortDescriptor = {
    column: string;
    direction: 'ascending' | 'descending';
}
const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};
const columns = [
    { name: "Certificate Number", uid: "certificate_no", sortable: true, width: "120px" },
    { name: "Customer Name", uid: "customer_name", sortable: true, width: "120px" },
    { name: "Site Location", uid: "site_location", sortable: true, width: "120px" },
    { name: "Model", uid: "make_model", sortable: true, width: "120px" },
    { name: "Serial Number", uid: "serial_no", sortable: true, width: "120px" },
    { name: "Engineer Name", uid: "engineer_name", sortable: true, width: "120px" },
    { name: "Actions", uid: "actions", sortable: true, width: "120px" },
];

export default function CertificateTable() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(columns.map(column => column.uid)));
    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({ column: "createdAt", direction: "descending" });
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const API_BASE_URL = "/api/certificates";

    const fetchCertificates = async () => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch certificates");
            }
            const data = await response.json();
            const certificatesData = Array.isArray(data) ? data : [];
            const certificatesWithKeys = certificatesData.map((certificate: Certificate) => ({
                ...certificate,
                key: certificate.id || generateUniqueId(),
                _id: certificate.id, // Map id to _id if needed
            }));
            setCertificates(certificatesWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching certificates", error);
            setError("Failed to fetch certificates");
            setCertificates([]);
        }
    };
    useEffect(() => {
        fetchCertificates();
    }, []);

    const handleDelete = async (certificateId: string) => {
        if (!window.confirm("Are you sure you want to delete this certificate?")) {
            return;
        }
        try {
            await axios.delete(`/api/certificates?id=${certificateId}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                }
            });
            setCertificates((prevCertificates) =>
                prevCertificates.filter(cert => cert._id !== certificateId)
            );
            toast({
                title: "Certificate deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting certificate", error);
            toast({
                title: "Failed to delete certificate",
                variant: "destructive",
            });
        }
    };
    const [filterValue, setFilterValue] = useState("");
    const hasSearchFilter = Boolean(filterValue);
    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);
    const filteredItems = React.useMemo(() => {
        let filteredCertificates = [...certificates];
        if (hasSearchFilter) {
            filteredCertificates = filteredCertificates.filter((certificate) =>
                certificate.certificateNo.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.siteLocation.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.makeModel.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.serialNo.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.engineerName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }
        if (startDate || endDate) {
            filteredCertificates = filteredCertificates.filter((certificate) => {
                const calibrationDate = new Date(certificate.dateOfCalibration);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);
                calibrationDate.setHours(0, 0, 0, 0);
                if (start && end) {
                    return calibrationDate >= start && calibrationDate <= end;
                } else if (start) {
                    return calibrationDate >= start;
                } else if (end) {
                    return calibrationDate <= end;
                }
                return true;
            });
        }
        return filteredCertificates;
    }, [certificates, hasSearchFilter, filterValue, startDate, endDate]);
    const items = filteredItems;
    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortDescriptor.column === 'dateOfCalibration' ||
                sortDescriptor.column === 'calibrationDueDate' ||
                sortDescriptor.column === 'createdAt') {
                const dateA = new Date(a[sortDescriptor.column]).getTime();
                const dateB = new Date(b[sortDescriptor.column]).getTime();
                const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                return sortDescriptor.direction === "descending" ? -cmp : cmp;
            }
            const first = a[sortDescriptor.column as keyof Certificate] || '';
            const second = b[sortDescriptor.column as keyof Certificate] || '';
            const cmp = String(first).localeCompare(String(second));
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const handleDownload = async (certificateId: string) => {
        try {
            setIsDownloading(certificateId);
            const certificateToDownload = certificates.find(cert => cert._id === certificateId);
            if (!certificateToDownload) throw new Error("Certificate data not found");
            const logo = new Image();
            logo.src = "/img/rps.png";
            await new Promise<void>((resolve, reject) => {
                logo.onload = () => resolve();
                logo.onerror = () => reject(new Error("Failed to load logo image"));
            });
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
            const bottomMargin = 20;
            const contentWidth = pageWidth - leftMargin - rightMargin;
            const checkPageBreak = (y: number, buffer = 20): number => {
                if (y + buffer > pageHeight - bottomMargin) {
                    doc.addPage();
                    return topMargin;
                }
                return y;
            };
            const formatDate = (dateString: string | null | undefined): string => {
                if (!dateString) return "N/A";
                try {
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
                } catch {
                    return "Invalid Date";
                }
            };
            const addRow = (label: string, value: string | undefined, y: number): number => {
                y = checkPageBreak(y, 10);
                doc.setFont("times", "bold").setFontSize(11).setTextColor(0);
                doc.text(`${label}:`, leftMargin, y);
                doc.setFont("times", "normal").setTextColor(50);
                doc.text(value || "N/A", leftMargin + 40, y);
                return y + 8;
            };
            const logoWidth = 60;
            const logoHeight = 20;
            const logoX = 2;
            const logoY = 10;
            doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);
            let y = logoY + logoHeight + 10;
            doc.setFont("times", "bold").setFontSize(16).setTextColor(0, 51, 102);
            doc.text("CALIBRATION CERTIFICATE", pageWidth / 2, y, { align: "center" });
            y += 10;
            y = addRow("Certificate No.", certificateToDownload.certificateNo, y);
            y = addRow("Customer Name", certificateToDownload.customerName, y);
            y = addRow("Site Location", certificateToDownload.siteLocation, y);
            y = addRow("Make & Model", certificateToDownload.makeModel, y);
            y = addRow("Range", certificateToDownload.range, y);
            y = addRow("Serial No.", certificateToDownload.serialNo, y);
            y = addRow("Calibration Gas", certificateToDownload.calibrationGas, y);
            y = addRow("Gas Canister Details", certificateToDownload.gasCanisterDetails, y);
            y += 5;
            y = addRow("Date of Calibration", formatDate(certificateToDownload.dateOfCalibration), y);
            y = addRow("Calibration Due Date", formatDate(certificateToDownload.calibrationDueDate), y);
            y = addRow("Status", certificateToDownload.status, y);
            y += 5;
            doc.setDrawColor(180);
            doc.setLineWidth(0.3);
            doc.line(leftMargin, y, pageWidth - rightMargin, y);
            y += 10;
            y = checkPageBreak(y, 20);
            doc.setFont("times", "bold").setFontSize(12).setTextColor(0, 51, 102);
            doc.text("OBSERVATIONS", leftMargin, y);
            y += 10;
            const colWidths = [20, 70, 40, 40];
            const headers = ["Sr. No.", "Concentration of Gas", "Reading Before", "Reading After"];
            let x = leftMargin;
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            headers.forEach((header, i) => {
                doc.rect(x, y - 5, colWidths[i], 8, 'S');
                doc.text(header, x + colWidths[i] / 2, y, { align: "center" });
                x += colWidths[i];
            });
            y += 8;
            doc.setFont("times", "normal").setFontSize(10);
            certificateToDownload.observations.forEach((obs, index) => {
                y = checkPageBreak(y, 15);
                x = leftMargin;
                const rowY = y;
                const rowData = [
                    `${index + 1}`,
                    obs.gas || "-",
                    obs.before || "-",
                    obs.after || "-"
                ];
                rowData.forEach((text, colIndex) => {
                    doc.rect(x, rowY - 6, colWidths[colIndex], 8, 'S');
                    doc.text(text, x + colWidths[colIndex] / 2, rowY, { align: "center" });
                    x += colWidths[colIndex];
                });
                y += 8;
            });
            y += 10;
            const conclusion = "The above-mentioned Gas Detector was calibrated successfully, and the result confirms that the performance of the instrument is within acceptable limits.";
            doc.setFont("times", "italic").setFontSize(10).setTextColor(0);
            const conclusionLines = doc.splitTextToSize(conclusion, contentWidth);
            y = checkPageBreak(y, conclusionLines.length * 6 + 15);
            doc.text(conclusionLines, leftMargin, y);
            y += conclusionLines.length * 6 + 15;
            y = checkPageBreak(y, 20);
            doc.setFont("times", "bold");
            doc.text("Tested & Calibrated By", pageWidth - rightMargin, y, { align: "right" });
            doc.setFont("times", "normal");
            doc.text(certificateToDownload.engineerName || "________________", pageWidth - rightMargin, y + 10, { align: "right" });
            y = checkPageBreak(y, 20);
            doc.setDrawColor(180);
            doc.line(leftMargin, pageHeight - bottomMargin - 10, pageWidth - rightMargin, pageHeight - bottomMargin - 10);
            doc.setFontSize(8).setTextColor(100);
            doc.text("This certificate is electronically generated and does not require a physical signature.", leftMargin, pageHeight - bottomMargin - 5);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, pageHeight - bottomMargin);
            doc.save(`calibration-certificate-${certificateToDownload.certificate_no}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
            toast({
                title: "Failed to generate certificate",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(null);
        }
    };
    const onSearchChange = React.useCallback((value: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);
    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);
    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-center w-full gap-4">
                    {/* Search Input (Left) */}
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            isClearable
                            className="w-full max-w-[300px]"
                            placeholder="Search"
                            startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onClear={() => setFilterValue("")}
                        />
                    </div>

                    {/* Date Filter (Center) */}
                    <div className="flex items-center gap-3 mx-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-default-400">From:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm bg-white text-black 
                               dark:bg-white dark:border-gray-700 dark:text-black"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-default-400">To:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="border border-gray-300 rounded p-2 text-sm bg-white text-black 
                               dark:bg-white dark:border-gray-700 dark:text-black"
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

                    {/* Total Certificates (Right) */}
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Total: <strong>{filteredItems.length}</strong> certificate{filteredItems.length !== 1 ? "s" : ""}
                    </div>
                </div>
            </div>
        );
    }, [filterValue, startDate, endDate, filteredItems.length]);
    const bottomContent = (
        <div className="py-2 px-2">
            <span className="text-default-400 text-small">
                Total {filteredItems.length} certificates
            </span>
        </div>
    );
    const handleSelectionChange = (keys: Selection) => {
        if (keys === "all") {
            setSelectedKeys(new Set(certificates.map(cert => cert._id)));
        } else {
            setSelectedKeys(keys as Set<string>);
        }
    };

    const renderCell = React.useCallback((certificate: Certificate, columnKey: string): React.ReactNode => {
        const cellValue = certificate[columnKey];
        if ((columnKey === "dateOfCalibration" || columnKey === "calibrationDueDate") && cellValue) {
            return formatDate(cellValue);
        }
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDownload(certificate._id)}
                        >
                            <Download className="h-6 w-6" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return cellValue;
    }, [isDownloading, handleDownload, handleDelete]);

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
                                    <BreadcrumbLink href="/user/certificateform">
                                        Create Certificate
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-7xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Certificate Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table
                                isHeaderSticky
                                aria-label="Leads table with custom cells, pagination and sorting"
                                classNames={{
                                    wrapper: "max-h-[382px] ower-flow-y-auto",
                                }}
                                selectedKeys={selectedKeys}
                                sortDescriptor={sortDescriptor}
                                topContent={topContent}
                                topContentPlacement="outside"
                                onSelectionChange={handleSelectionChange}
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
                                            onClick={() => {
                                                if (column.sortable) {
                                                    setSortDescriptor(prev => ({
                                                        column: column.uid,
                                                        direction: prev.column === column.uid && prev.direction === 'ascending'
                                                            ? 'descending'
                                                            : 'ascending'
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                {column.name}
                                                {sortDescriptor.column === column.uid && (
                                                    <span className="ml-1">
                                                        {sortDescriptor.direction === 'ascending' ? (
                                                            <ArrowUpIcon className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowDownIcon className="h-4 w-4" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody emptyContent={"Create certificate and add data"} items={sortedItems}>
                                    {(item) => (
                                        <TableRow key={item._id}>
                                            {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item as Certificate, columnKey as string)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
};
function setPage(arg0: number) {
    throw new Error("Function not implemented");
}

