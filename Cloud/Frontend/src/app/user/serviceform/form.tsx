"use client";

import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { Trash2, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
    engineerId?: string;
    engineerName: string;
    status: string;
}

interface ServiceResponse {
    serviceEngineer: string;
    customerName: string;
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
    const [service, setService] = useState<ServiceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [isLoadingEngineers, setIsLoadingEngineers] = useState(true);
    const [serviceEngineers, setServiceEngineers] = useState<ServiceEngineer[]>([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
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
                const response = await axios.get("http://localhost:5000/api/v1/engineers/getEngineers");
                setEngineers(response.data);
            } catch (error) {
                console.error("Error fetching engineers:", error);
            }
        };
        fetchEngineers();
    }, []);

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
            } finally {
                setIsLoadingEngineers(false);
            }
        };
        fetchServiceEngineers();
    }, []);

    useEffect(() => {
        if (!formData.reportNo) {
            const generateReportNo = () => {
                const date = new Date();
                const currentYear = date.getFullYear();
                const shortStartYear = String(currentYear).slice(-2);
                const shortEndYear = String(currentYear + 1).slice(-2);
                const yearRange = `${shortStartYear}-${shortEndYear}`;
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                return `RPS/SRV/${yearRange}/${randomNum}`;
            };
            setFormData(prev => ({
                ...prev,
                reportNo: generateReportNo()
            }));
        }
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEngineerRemarksChange = (index: number, field: keyof EngineerRemarks, value: string) => {
        const updatedEngineerRemarks = [...formData.engineerRemarks];
        updatedEngineerRemarks[index] = { ...updatedEngineerRemarks[index], [field]: value };
        setFormData({ ...formData, engineerRemarks: updatedEngineerRemarks });
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

    const validateForm = () => {
        const requiredFields = [
            'customerName', 'customerLocation', 'contactPerson', 'contactNumber',
            'serviceEngineer', 'date', 'place', 'placeOptions', 'natureOfJob',
            'makeModelNumberoftheInstrumentQuantity', 'serialNumberoftheInstrumentCalibratedOK',
            'serialNumberoftheFaultyNonWorkingInstruments', 'engineerReport', 'customerReport', 'engineerName', 'status'
        ];

        for (const field of requiredFields) {
            if (!formData[field as keyof ServiceRequest]?.toString().trim()) {
                return `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`;
            }
        }

        if (!formData.serviceEngineerId || !formData.serviceEngineer.trim()) {
            return "Please select a service engineer";
        }

        if (formData.engineerRemarks.length === 0) {
            return "All fields in engineer remarks must be filled.";
        }

        for (const remark of formData.engineerRemarks) {
            if (!remark.serviceSpares.trim() || !remark.partNo.trim() ||
                !remark.rate.trim() || !remark.quantity.trim() || !remark.poNo.trim()) {
                return "All fields in engineer remarks must be filled.";
            }
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/v1/services/generateServices`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            setService(response.data);
            toast({
                title: "Success",
                description: "Service report generated successfully",
                variant: "default",
            });
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate service. Please try again.");
            console.error("API Error:", err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const generateAndSendPDF = async () => {
        if (!service?.serviceId) {
            toast({
                title: "Error",
                description: "No service ID available",
                variant: "destructive",
            });
            return;
        }

        setIsGeneratingPDF(true);
        setIsSendingEmail(false);

        try {
            // Create PDF with A4 size
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Load logo and footer images
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

            // Add logo
            doc.addImage(logo, "PNG", 5, 5, 50, 15);
            y = 40;

            // Title
            doc.setFont("times", "bold").setFontSize(13).setTextColor(0, 51, 153);
            doc.text("SERVICE / CALIBRATION / INSTALLATION JOBREPORT", pageWidth / 2, y, { align: "center" });
            y += 10;

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

            // Engineer Report Section
            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("Engineer Report:", leftMargin, y);
            y += 5;

            const engineerReportHeight = 30;
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, engineerReportHeight);

            const engineerReportLines = doc.splitTextToSize(formData.engineerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
            doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
            doc.text(engineerReportLines, leftMargin + 2, y + 5);

            y += engineerReportHeight + 5;

            // Page 2
            doc.addPage();
            y = topMargin;

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

                if (y + 50 > pageHeight) {
                    doc.addPage();
                    y = topMargin;
                }
            });

            y += 10;

            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("Customer Report:", leftMargin, y);
            y += 5;

            const customerReportHeight = 30;
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.rect(leftMargin, y, pageWidth - leftMargin - rightMargin, customerReportHeight);

            const customerReportLines = doc.splitTextToSize(formData.customerReport || "No report provided", pageWidth - leftMargin - rightMargin - 5);
            doc.setFont("times", "normal").setFontSize(9).setTextColor(0);
            doc.text(customerReportLines, leftMargin + 2, y + 5);

            y += customerReportHeight + 5 + (10 * 7);

            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            doc.text("Customer Name, Seal & Sign", leftMargin, y);
            doc.text("Engineer Name, Seal & Sign", pageWidth - rightMargin - 60, y);

            y += 6;

            doc.setFont("times", "normal").setFontSize(10).setTextColor(50);
            doc.text(formData.customerName || "N/A", leftMargin, y);
            doc.text(formData.engineerName || "N/A", pageWidth - rightMargin - 60, y);

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

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            doc.save(`service-${service.serviceId}.pdf`);

            // After saving, start email sending
            setIsGeneratingPDF(false);
            setIsSendingEmail(true);

            const emailResponse = await axios.post(
                'http://localhost:5000/api/v1/services/sendMail',
                {
                    serviceId: service.serviceId,
                    pdfData: pdfBase64
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            toast({
                title: "Success",
                description: "PDF generated and email sent successfully",
                variant: "default",
            });

        } catch (err: any) {
            console.error("Error generating PDF:", err);
            toast({
                title: "Error",
                description: err.response?.data?.error || "Failed to generate PDF",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
            setIsSendingEmail(false); // 👈 VERY IMPORTANT
        }
    };


    return (
        <div className="container mx-auto p-4">
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                                            <div className="font-medium">{contact.company || "No company"}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {contact.firstName && `Contact: ${contact.firstName}`}
                                                {contact.contactNo && ` | Phone: ${contact.contactNo}`}
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
                    <label className="font-medium text-black dark:text-white">Place :</label>
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
                            <span className="text-black dark:text-white">At Site</span>
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
                            <span className="text-black dark:text-white">In House</span>
                        </label>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <label className="font-medium text-black dark:text-white">Nature of Job :</label>
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
                            <span className="text-black dark:text-white">AMC</span>
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
                            <span className="text-black dark:text-white">Charged</span>
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
                            <span className="text-black dark:text-white">Warranty</span>
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
                            <th className="border p-2">Total</th>
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
                                        onChange={(e) => handleEngineerRemarksChange(index, 'serviceSpares', e.target.value)}
                                        className="w-full p-1 border rounded"
                                    />
                                </td>
                                <td className="border p-2">
                                    <input
                                        type="text"
                                        name="partNo"
                                        value={engineerRemark.partNo}
                                        onChange={(e) => handleEngineerRemarksChange(index, 'partNo', e.target.value)}
                                        className="w-full p-1 border rounded"
                                    />
                                </td>
                                <td className="border p-2">
                                    <input
                                        type="text"
                                        name="rate"
                                        value={engineerRemark.rate}
                                        onChange={(e) => handleEngineerRemarksChange(index, 'rate', e.target.value)}
                                        className="w-full p-1 border rounded"
                                    />
                                </td>
                                <td className="border p-2">
                                    <input
                                        type="text"
                                        name="quantity"
                                        value={engineerRemark.quantity}
                                        onChange={(e) => handleEngineerRemarksChange(index, 'quantity', e.target.value)}
                                        className="w-full p-1 border rounded"
                                    />
                                </td>
                                <td className="border p-2">
                                    <input
                                        type="text"
                                        name="total"
                                        value={Number(engineerRemark.rate) * Number(engineerRemark.quantity) || 0}
                                        readOnly
                                        className="w-full p-1 border rounded"
                                    />
                                </td>
                                <td className="border p-2">
                                    <input
                                        type="text"
                                        name="poNo"
                                        value={engineerRemark.poNo}
                                        onChange={(e) => handleEngineerRemarksChange(index, 'poNo', e.target.value)}
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
                                <td colSpan={8} className="border p-2 text-center text-gray-500">
                                    Click "Create Engineer Remark" to add one
                                </td>
                            </tr>
                        )}
                        {formData.engineerRemarks.length >= 10 && (
                            <tr>
                                <td colSpan={5} className="border p-2 text-center text-yellow-600">
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
                    {loading ? "Generating..." : "Generate Service Report"}
                </button>
            </form>

            {service && (
                <div className="mt-4 text-center">
                    <p className="text-green-600 mb-2">Click here to download and email the service report</p>
                    <button
                        onClick={generateAndSendPDF}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2 mx-auto"
                        disabled={isGeneratingPDF || isSendingEmail}
                    >
                        {isGeneratingPDF || isSendingEmail ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isGeneratingPDF ? "Generating PDF..." : "Sending Email..."}
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download & Email Service  Report
                            </>
                        )}
                    </button>
                </div>
            )

            }
        </div >
    );
}