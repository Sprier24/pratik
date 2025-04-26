"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";


interface ContactPerson {
    _id: string;
    firstName: string;
    contactNo: string;
    company: string;
}

interface EngineerRemarks {
    serviceSpares: string;
    partNo: string;
    rate: string;
    quantity: string;
    poNo: string;
}

interface ServiceRequest {
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
}

interface ServiceResponse {
    serviceId: string;
    message: string;
    downloadUrl: string;
}

interface Engineer {
    _id: string;
    name: string;
}

interface ServiceEngineer {
    _id: string;
    name: string;
}

export default function GenerateService() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('id');
    const isEditMode = !!serviceId;

    const [formData, setFormData] = useState<ServiceRequest>({
        customerName: "",
        customerLocation: "",
        contactPerson: "",
        contactNumber: "",
        serviceEngineer: "",
        date: new Date().toISOString().split('T')[0],
        place: "",
        placeOptions: "At Site",
        natureOfJob: "AMC",
        reportNo: "",
        makeModelNumberoftheInstrumentQuantity: "",
        serialNumberoftheInstrumentCalibratedOK: "",
        serialNumberoftheFaultyNonWorkingInstruments: "",
        engineerReport: "",
        customerReport: "",
        engineerRemarks: [{ serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }],
        engineerName: "",
        status: ""
    });

    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
    const [service, setService] = useState<ServiceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [isLoadingEngineers, setIsLoadingEngineers] = useState(true);
    const [serviceEngineers, setServiceEngineers] = useState<ServiceEngineer[]>([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [filteredContacts, setFilteredContacts] = useState<ContactPerson[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    useEffect(() => {
        const fetchContactPersons = async () => {
            setIsLoadingContacts(true);
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/v1/contactperson/getContactPersons",
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                // Check different possible response structures
                const data = response.data?.data || response.data || [];

                if (!Array.isArray(data)) {
                    console.error("API response is not an array:", data);
                    setContactPersons([]);
                    setFilteredContacts([]);
                    return;
                }

                setContactPersons(data);
                setFilteredContacts(data);
            } catch (error) {
                console.error("Error fetching contact persons:", error);
                toast({
                    title: "Error",
                    description: "Failed to load contacts",
                    variant: "destructive",
                });
                setContactPersons([]);
                setFilteredContacts([]);
            } finally {
                setIsLoadingContacts(false);
            }
        };


        fetchContactPersons();
    }, []);

    useEffect(() => {
        if (!Array.isArray(contactPersons)) {
            setFilteredContacts([]);
            return;
        }

        const customerNameInput = formData.customerName.trim().toLowerCase();

        if (customerNameInput.length > 0) {
            const filtered = contactPersons.filter((person) =>
                person.company?.toLowerCase().includes(customerNameInput)
            );

            setFilteredContacts(filtered);

            const exactMatches = filtered.filter(
                (person) => person.company?.toLowerCase() === customerNameInput
            );

            if (exactMatches.length > 0) {
                const match = exactMatches[0];

                setFormData((prev) => ({
                    ...prev,
                    customerName: match.company || customerNameInput, // normalize company name
                    contactPerson: match.firstName || "",
                    contactNumber: match.contactNo || "",
                }));
            }
        } else {
            setFilteredContacts(contactPersons);
        }
    }, [formData.customerName, contactPersons]);






    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/v1/engineers/getEngineers");
                const data = await response.json();
                console.log("API Response:", data);
                setEngineers(data);
            } catch (error) {
                console.error("Error fetching engineers:", error);
                toast({
                    title: "Error",
                    description: "Failed to load engineers",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingEngineers(false);
            }
        };

        fetchEngineers();

        if (isEditMode) {
            const fetchServiceData = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:5000/api/v1/services/getServiceById/${serviceId}`);
                    const serviceData = response.data;

                    setFormData({
                        customerName: serviceData.customerName || "",
                        customerLocation: serviceData.customerLocation || "",
                        contactPerson: serviceData.contactPerson || "",
                        contactNumber: serviceData.contactNumber || "",
                        serviceEngineer: serviceData.serviceEngineer || "",
                        serviceEngineerId: serviceData.serviceEngineerId || "",
                        date: serviceData.date ? new Date(serviceData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        place: serviceData.place || "",
                        placeOptions: serviceData.placeOptions || "At Site",
                        natureOfJob: serviceData.natureOfJob || "AMC",
                        reportNo: serviceData.reportNo || "",
                        makeModelNumberoftheInstrumentQuantity: serviceData.makeModelNumberoftheInstrumentQuantity || "",
                        serialNumberoftheInstrumentCalibratedOK: serviceData.serialNumberoftheInstrumentCalibratedOK || "",
                        serialNumberoftheFaultyNonWorkingInstruments: serviceData.serialNumberoftheFaultyNonWorkingInstruments || "",
                        engineerReport: serviceData.engineerReport || "",
                        customerReport: serviceData.customerReport || "",
                        engineerRemarks: serviceData.engineerRemarks?.length > 0
                            ? serviceData.engineerRemarks.map((remark: any) => ({
                                ...remark,
                                quantity: remark.quantity.toString()
                            }))
                            : [{ serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }],
                        engineerName: serviceData.engineerName || "",
                        engineerId: serviceData.engineerId || "",
                        status: serviceData.status || ""
                    });

                    if (serviceData.serviceId) {

                    }
                } catch (error) {
                    console.error("Error fetching service data:", error);
                    toast({
                        title: "Error",
                        description: "Failed to load service data",
                        variant: "destructive",
                    });
                    router.push("/adminservice");
                } finally {
                    setLoading(false);
                }
            };

            fetchServiceData();
        }
    }, [serviceId, isEditMode, router]);

    useEffect(() => {

        if (!isEditMode && !formData.reportNo) {
            const generateReportNo = () => {
                const date = new Date();
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                return `SRV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${randomNum}`;
            };

            setFormData(prev => ({
                ...prev,
                reportNo: generateReportNo()
            }));
        }
    }, [isEditMode]);

    useEffect(() => {
        const fetchServiceEngineers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/v1/ServiceEngineer/getServiceEngineers");
                const data = await response.json();
                setServiceEngineers(data);
            } catch (error) {
                console.error("Error fetching service engineers:", error);
                toast({
                    title: "Error",
                    description: "Failed to load service engineers",
                    variant: "destructive",
                });
            }
        };
        fetchServiceEngineers();
    }, []);


    const handleServiceEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedEngineer = serviceEngineers.find(engineer => engineer._id === selectedId);

        setFormData(prev => ({
            ...prev,
            serviceEngineerId: selectedId,
            serviceEngineer: selectedEngineer?.name || ""
        }));
    };

    const handleEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedEngineer = engineers.find(engineer => engineer._id === selectedId);

        setFormData(prev => ({
            ...prev,
            engineerId: selectedId,
            engineerName: selectedEngineer?.name || ""
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleengineerRemarksChange = (index: number, field: keyof EngineerRemarks, value: string) => {
        const updatedengineerRemarks = [...formData.engineerRemarks];
        updatedengineerRemarks[index] = { ...updatedengineerRemarks[index], [field]: value };
        setFormData({ ...formData, engineerRemarks: updatedengineerRemarks });
    };

    const addEngineerRemark = () => {
        if (formData.engineerRemarks.length < 10) {
            setFormData({
                ...formData,
                engineerRemarks: [...formData.engineerRemarks, { serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }]
            });
        }
    };

    const removeEngineerRemark = (index: number) => {
        const updatedEngineerRemarks = [...formData.engineerRemarks];
        updatedEngineerRemarks.splice(index, 1);
        setFormData({ ...formData, engineerRemarks: updatedEngineerRemarks });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Clean engineer remarks
        const processedRemarks = formData.engineerRemarks
            .filter(remark =>
                remark.serviceSpares?.trim() &&
                remark.partNo?.trim() &&
                remark.rate?.toString().trim() &&
                remark.quantity?.toString().trim() &&
                remark.poNo?.trim()
            )
            .map(remark => ({
                serviceSpares: remark.serviceSpares.trim(),
                partNo: remark.partNo.trim(),
                rate: remark.rate.toString().trim(),
                quantity: Number(remark.quantity),
                poNo: remark.poNo.trim()
            }));

        if (processedRemarks.length === 0) {
            setError("Please add at least one valid engineer remark.");
            setLoading(false);
            return;
        }

        // Required fields
        const requiredFields = [
            'customerName', 'customerLocation', 'contactPerson', 'contactNumber',
            'serviceEngineer', 'date', 'place', 'placeOptions', 'natureOfJob',
            'makeModelNumberoftheInstrumentQuantity', 'serialNumberoftheInstrumentCalibratedOK',
            'serialNumberoftheFaultyNonWorkingInstruments', 'engineerReport', 'customerReport', 'engineerName', 'status'
        ];

        // Validate required fields
        const missingFields = requiredFields.filter(field => {
            const value = formData[field as keyof typeof formData];
            return typeof value === 'string' ? value.trim() === '' : !value;
        });

        if (missingFields.length > 0) {
            setError(`Missing required fields: ${missingFields.join(', ')}`);
            setLoading(false);
            return;
        }

        // Construct payload
        const payload = {
            ...formData,
            engineerRemarks: processedRemarks,
            ...(isEditMode && { serviceId }),
        };

        // Log payload for debugging
        console.log("Submitting payload:", payload);

        const apiUrl = isEditMode
            ? `http://localhost:5000/api/v1/services/updateService/${serviceId}`
            : 'http://localhost:5000/api/v1/services/generateServices';

        const method = isEditMode ? 'put' : 'post';

        try {
            const response = await axios({
                method,
                url: apiUrl,
                data: payload,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json',
                }
            });

            console.log("API Response:", response.data);

            const serviceData = response.data;
            const effectiveServiceId = serviceData.serviceId || serviceId;

            setService({
                serviceId: effectiveServiceId,
                message: isEditMode ? "Service report updated successfully" : "Service report generated successfully",
                downloadUrl: `http://localhost:5000/api/v1/services/download/${effectiveServiceId}`,
            });

            await handleDownload();

            toast({
                title: "Success",
                description: isEditMode ? "Service report updated successfully" : "Service report generated successfully",
                variant: "default",
            });
        } catch (err) {
            console.error("API Error:", err);
            setError(isEditMode ? "Failed to update service" : "Failed to create service");

            toast({
                title: "Error",
                description: isEditMode ? "Failed to update service" : "Failed to create service",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };



    const handleDownload = async () => {
        if (!service?.serviceId) {
            toast({
                title: "Error",
                description: "No service ID available",
                variant: "destructive",
            });
            return;
        }

        setIsGeneratingPDF(true);

        try {
            // Create PDF with A4 size
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Load logo and footer image
            const logo = new Image();
            logo.src = "/img/rps.png";
            const infoImage = new Image();
            infoImage.src = "/img/handf.png";

            // Wait for images to load
            await new Promise<void>((resolve, reject) => {
                logo.onload = () => {
                    infoImage.onload = () => resolve();
                    infoImage.onerror = () => reject("Failed to load footer image");
                };
                logo.onerror = () => reject("Failed to load logo image");
            });

            const leftMargin = 15;
            const rightMargin = 15;
            const topMargin = 20;
            let y = topMargin;

            // Add logo to top-left corner
            doc.addImage(logo, "PNG", 5, 5, 50, 15);
            y = 40; // Add spacing below the logo

            // Add title
            doc.setFont("times", "bold").setFontSize(13).setTextColor(0, 51, 153);
            doc.text("SERVICE / CALIBRATION / INSTALLATION JOBREPORT", pageWidth / 2, y, { align: "center" });
            y += 10;

            // Add form data rows
            const addRow = (label: string, value: string) => {
                const labelOffset = 65;
                doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
                doc.text(label + ":", leftMargin, y);
                doc.setFont("times", "normal").setTextColor(50);
                doc.text(value || "N/A", leftMargin + labelOffset, y);
                y += 7;
            };

            addRow("Report No.", formData.reportNo);
            addRow("Customer Name", formData.customerName);
            addRow("Customer Location", formData.customerLocation);
            addRow("Contact Person", formData.contactPerson);
            addRow("Status", formData.status);
            addRow("Contact Number", formData.contactNumber);
            addRow("Service Engineer", formData.serviceEngineer);
            addRow("Date", formData.date);
            addRow("Place", formData.place);
            addRow("Place Options", formData.placeOptions);
            addRow("Nature of Job", formData.natureOfJob);

            addRow("Make & Model Number", formData.makeModelNumberoftheInstrumentQuantity);
            y += 5;
            addRow("Calibrated & Tested OK", formData.serialNumberoftheInstrumentCalibratedOK);
            addRow("Sr.No Faulty/Non-Working", formData.serialNumberoftheFaultyNonWorkingInstruments);
            y += 10;

            // Add Engineer Report section
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("Engineer Report:", leftMargin, y);
            y += 5;

            // Draw box around engineer report
            const engineerReportHeight = 30; // Adjust based on content
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, engineerReportHeight);

            // Split text into lines that fit within the box
            const engineerReportLines = doc.splitTextToSize(formData.engineerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
            doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
            doc.text(engineerReportLines, leftMargin + 2, y + 5);
            y += engineerReportHeight + 5;



            // Page 2: Engineer Remarks Table and Customer Report
            doc.addPage();
            y = topMargin;

            // Engineer Remarks Table
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("ENGINEER REMARKS", leftMargin, y);
            y += 8;

            const tableHeaders = ["Sr. No.", "Service/Spares", "Part No.", "Rate", "Quantity", "PO No."];
            const colWidths = [20, 60, 25, 25, 25, 25];
            let x = leftMargin;

            tableHeaders.forEach((header, i) => {
                doc.rect(x, y, colWidths[i], 8);
                doc.text(header, x + 2, y + 6);
                x += colWidths[i];
            });

            y += 8;

            formData.engineerRemarks.forEach((item, index) => {
                x = leftMargin;
                const values = [
                    String(index + 1),
                    item.serviceSpares || "",
                    item.partNo || "",
                    item.rate || "",
                    item.quantity || "",
                    item.poNo || ""
                ];
                values.forEach((val, i) => {
                    doc.rect(x, y, colWidths[i], 8);
                    doc.text(val, x + 2, y + 6);
                    x += colWidths[i];
                });
                y += 8;

                // Add new page if needed
                if (y + 50 > pageHeight) { // Leave space for customer report
                    doc.addPage();
                    y = topMargin;
                }
            });

            y += 10;

            // Add Customer Report section in a box after the table
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("Customer Report:", leftMargin, y);
            y += 5;

            // Draw box around customer report
            const customerReportHeight = 30; // Adjust based on content
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, customerReportHeight);

            // Split text into lines that fit within the box
            const customerReportLines = doc.splitTextToSize(formData.customerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
            doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
            doc.text(customerReportLines, leftMargin + 2, y + 5);
            y += customerReportHeight + 5;

            // Service Engineer signature
            doc.setFont("times", "normal");
            doc.text("Service Engineer", pageWidth - rightMargin - 40, y);
            doc.text(formData.serviceEngineer || "", pageWidth - rightMargin - 40, y + 5);

            // Timestamp
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, "0");
            const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
            const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            doc.setFontSize(9).setTextColor(100);
            doc.text(`Report Generated On: ${date} ${time}`, leftMargin, pageHeight - 10);

            // Add footer image to all pages
            const addFooterImage = () => {
                const footerY = pageHeight - 25;
                const footerWidth = 180;
                const footerHeight = 20;
                const footerX = (pageWidth - footerWidth) / 2;

                const pageCount = doc.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.addImage(infoImage, "PNG", footerX, footerY, footerWidth, footerHeight);
                }
            };

            addFooterImage();

            // Save PDF locally
            doc.save(`service-${service.serviceId}.pdf`);


        } catch (err: any) {
            console.error("Error generating PDF:", err);
            toast({
                title: "Error",
                description: err.response?.data?.error || "Failed to generate PDF",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };


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
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/admin/dashboard" >
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/servicerecord">
                                        Service Record
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">
                                {isEditMode ? "Update Service" : "Create Service"}
                            </CardTitle>
                            <CardDescription className="text-center">
                                {isEditMode
                                    ? "Modify the service details below"
                                    : "Fill out the form below to create a new service"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                        <span className="block sm:inline">{error}</span>
                                    </div>
                                )}
                                {loading && (
                                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
                                        <span className="block sm:inline">{isEditMode ? "Updating..." : "Generating..."}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            name="customerName"
                                            placeholder="Company Name"
                                            value={formData.customerName}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setShowDropdown(true);
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                        />


                                        {showDropdown && (
                                            <ul className="absolute left-0 top-full mt-1 z-20 w-full rounded-md border bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
                                                {isLoadingContacts ? (
                                                    <li className="px-4 py-2 text-gray-500">Loading contacts...</li>
                                                ) : filteredContacts.length > 0 ? (
                                                    filteredContacts.map((contact) => (
                                                        <li
                                                            key={contact._id}
                                                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${formData.customerName === contact.company
                                                                ? "bg-blue-50 dark:bg-blue-900"
                                                                : ""
                                                                }`}
                                                            onClick={() => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    customerName: contact.company || "",
                                                                    contactPerson: contact.firstName || "",
                                                                    contactNumber: contact.contactNo || "",
                                                                }));
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <div className="font-medium">{contact.company || ""}</div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                {contact.firstName && `Customer Name : ${contact.firstName}`}
                                                                {contact.contactNo && ` | Contact Number : ${contact.contactNo}`}
                                                            </div>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-gray-500">
                                                        {contactPersons.length === 0
                                                            ? "No records available"
                                                            : "No records available with this name"}
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        name="customerLocation"
                                        placeholder="Site Location "
                                        value={formData.customerLocation}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    <input
                                        type="text"
                                        name="contactPerson"
                                        placeholder="Contact Person"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        name="contactNumber"
                                        placeholder="Contact Number"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />


                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="p-2 border rounded"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Checked">Checked</option>
                                        <option value="Unchecked">Unchecked</option>
                                    </select>
                                    <select
                                        name="serviceEngineerId"
                                        value={formData.serviceEngineerId || ""}
                                        onChange={handleServiceEngineerChange}
                                        className="p-2 border rounded"
                                        required
                                    >
                                        <option value="">Select Service Engineer</option>
                                        {serviceEngineers.map((engineer) => (
                                            <option key={engineer._id} value={engineer._id}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        data-date-format="DD-MM-YYYY"
                                        min="2000-01-01"
                                        max="2100-12-31"
                                    />

                                    <input
                                        type="text"
                                        name="place"
                                        placeholder="Enter Place"
                                        value={formData.place}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-black">Place :</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeOptions"
                                                value="At Site"
                                                checked={formData.placeOptions === "At Site"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-black">At Site</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeOptions"
                                                value="In House"
                                                checked={formData.placeOptions === "In House"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-black">In House</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-black">Nature of Job :</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="AMC"
                                                checked={formData.natureOfJob === "AMC"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-black">AMC</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="Charged"
                                                checked={formData.natureOfJob === "Charged"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-black">Charged</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="Warranty"
                                                checked={formData.natureOfJob === "Warranty"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-black">Warranty</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="reportNo"
                                        placeholder="Report Number"
                                        value={formData.reportNo}
                                        onChange={handleChange}
                                        readOnly
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <select
                                        name="engineerId"
                                        value={formData.engineerId || ""}
                                        onChange={handleEngineerChange}
                                        className="p-2 border rounded w-full"
                                        required
                                        disabled={isLoadingEngineers}
                                    >
                                        <option value="">Created By</option>
                                        {isLoadingEngineers ? (
                                            <option>Loading engineer...</option>
                                        ) : (
                                            engineers.map((engineer) => (
                                                <option key={engineer._id} value={engineer._id}>
                                                    {engineer.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        name="makeModelNumberoftheInstrumentQuantity"
                                        placeholder="Model Number of the Instrument Quantity"
                                        value={formData.makeModelNumberoftheInstrumentQuantity}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                        rows={3}
                                    />

                                    <textarea
                                        name="serialNumberoftheInstrumentCalibratedOK"
                                        placeholder="Serial Number of the Instrument Calibrated & OK"
                                        value={formData.serialNumberoftheInstrumentCalibratedOK}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                        rows={3}
                                    />

                                    <textarea
                                        name="serialNumberoftheFaultyNonWorkingInstruments"
                                        placeholder="Serial Number of Faulty / Non-Working Instruments"
                                        value={formData.serialNumberoftheFaultyNonWorkingInstruments}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                        rows={3}
                                    />

                                    <textarea
                                        name="engineerReport"
                                        placeholder="Engineer Remark"
                                        value={formData.engineerReport}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                        rows={3}
                                    />
                                </div>

                                <h2 className="text-lg font-bold mt-4 text-center">Engineer Remarks Table</h2>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={addEngineerRemark}
                                        className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-gray-900"
                                        disabled={formData.engineerRemarks.length >= 10}
                                    >
                                        Create Engineer Remark
                                    </button>
                                </div>
                                <table className="table-auto border-collapse border border-gray-500 rounded w-full">
                                    <thead>
                                        <tr>
                                            <th className="border p-2">#</th>
                                            <th className="border p-2">Service / Spares</th>
                                            <th className="border p-2">Part Number</th>
                                            <th className="border p-2">Rate</th>
                                            <th className="border p-2">Quantity</th>
                                            <th className="border p-2">PO Number</th>
                                            <th className="border p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.engineerRemarks.map((engineerRemark, index) => (
                                            <tr key={index}>
                                                <td className="border p-2">{index + 1}</td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="serviceSpares"
                                                        value={engineerRemark.serviceSpares}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'serviceSpares', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="partNo"
                                                        value={engineerRemark.partNo}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'partNo', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="rate"
                                                        value={engineerRemark.rate}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'rate', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="quantity"
                                                        value={engineerRemark.quantity}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'quantity', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="poNo"
                                                        value={engineerRemark.poNo}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'poNo', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <button
                                                        onClick={() => removeEngineerRemark(index)}
                                                    >
                                                        <Trash2 className="h-6 w-6" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.engineerRemarks.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="border p-2 text-center text-gray-500">
                                                    Click "Create Engineer Remark" to add one
                                                </td>
                                            </tr>
                                        )}
                                        {formData.engineerRemarks.length >= 10 && (
                                            <tr>
                                                <td colSpan={7} className="border p-2 text-center text-yellow-600">
                                                    Maximum limit of 10 engineer remarks reached.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="flex flex-col gap-4">
                                    <textarea
                                        name="customerReport"
                                        placeholder="Customer Report"
                                        value={formData.customerReport}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                        rows={3}
                                    />
                                </div>


                                <button
                                    type="submit"
                                    className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md w-full"
                                    disabled={loading}
                                >
                                    {loading ? (isEditMode ? "Updating..." : "Generating...") : (isEditMode ? "Update Service Report" : "Generate Service Report")}
                                </button>
                            </form>

                            {service && (
                                <div className="mt-4 text-center">
                                    <p className="text-green-600 mb-2">Click here to download the service report</p>
                                    <button
                                        onClick={handleDownload}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                        disabled={isGeneratingPDF || loading}
                                    >
                                        {isGeneratingPDF ? "Generating PDF..." : "Download Service Report"}
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
