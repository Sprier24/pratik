"use client";

import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from '@/hooks/use-toast'
import { AdminSidebar } from "@/components/admin-sidebar";
import { Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";

interface Company {
    _id: string;
    company_name: string;
}

interface Observation {
    gas: string;
    before: string;
    after: string;
}

interface Certificate {
    id: string;
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
}

interface Model {
    id: string;
    model_name: string;
    range: string;
}

interface Engineer {
    id: string;
    name: string;
}

const generateCertificateNumber = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const shortStartYear = String(currentYear).slice(-2);
    const shortEndYear = String(currentYear + 1).slice(-2);
    const yearRange = `${shortStartYear}-${shortEndYear}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `RPS/CER/${yearRange}/${randomNum}`;
};

export default function CertificateFormWrapper() {
    return (
        <Suspense fallback={<CertificateFormLoading />}>
            <CertificateForm />
        </Suspense>
    );
}

function CertificateFormLoading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            <span className="ml-4">Loading certificate form...</span>
        </div>
    );
}

function CertificateForm() {
    const searchParams = useSearchParams();
    const certificateId = searchParams.get('id');

    const [formData, setFormData] = useState<Certificate>({
        id: "",
        certificateNo: generateCertificateNumber(),
        customerName: "",
        siteLocation: "",
        makeModel: "",
        range: "",
        serialNo: "",
        calibrationGas: "", 
        gasCanisterDetails: "",
        dateOfCalibration: new Date().toISOString().split('T')[0],
        calibrationDueDate: new Date().toISOString().split('T')[0],
        observations: [{ gas: "", before: "", after: "" }],
        engineerName: "",
        status: "",
    });

    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [timePeriod, setTimePeriod] = useState<number | null>(null);
    const [models, setModels] = useState<Model[]>([]);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companySearchTerm, setCompanySearchTerm] = useState("");
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>("");

    const fetchCompanies = async () => {
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
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch("/api/models");
                const data = await res.json();
                setModels(data);
            } catch {
                toast({ title: "Error", description: "Failed to load models", variant: "destructive" });
            }
        };

        const fetchEngineers = async () => {
            try {
                const res = await fetch("/api/engineers");
                const data = await res.json();
                setEngineers(data);
            } catch {
                toast({ title: "Error", description: "Failed to load engineers", variant: "destructive" });
            }
        };

        fetchModels();
        fetchEngineers();
    }, []);

    useEffect(() => {
        const fetchCertificateData = async () => {
            const today = new Date().toISOString().split('T')[0];
    
            if (!certificateId) return;
    
            try {
                setLoading(true);
                setError(null);
    
                const response = await axios.get(
                    `/api/certificates?id=${certificateId}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );
    
                if (!response.data) {
                    throw new Error("No data received from server");
                }
    
                const certificateData = response.data;
    
                const transformedData = {
                    certificateNo: certificateData.certificate_no || generateCertificateNumber(),
                    customerName: certificateData.customer_name || "",
                    siteLocation: certificateData.site_location || "",
                    makeModel: certificateData.make_model || "",
                    range: certificateData.range || "",
                    serialNo: certificateData.serial_no || "",
                    calibrationGas: certificateData.calibration_gas || "",
                    gasCanisterDetails: certificateData.gas_canister_details || "",
                    dateOfCalibration: certificateData.date_of_calibration?.split('T')[0] || today,
                    calibrationDueDate: certificateData.calibration_due_date?.split('T')[0] || today,
                    observations: Array.isArray(certificateData.observations) 
                        ? certificateData.observations 
                        : typeof certificateData.observations === 'string'
                            ? JSON.parse(certificateData.observations)
                            : [{ gas: "", before: "", after: "" }],
                    engineerName: certificateData.engineer_name || "",
                    status: certificateData.status || ""
                };
    
                setFormData(prev => ({
                    ...prev,
                    certificateNo: transformedData.certificateNo,
                    customerName: transformedData.customerName,
                    siteLocation: transformedData.siteLocation,
                    makeModel: transformedData.makeModel,
                    range: transformedData.range,
                    serialNo: transformedData.serialNo,
                    calibrationGas: transformedData.calibrationGas,
                    gasCanisterDetails: transformedData.gasCanisterDetails,
                    observations: transformedData.observations,
                    engineerName: transformedData.engineerName,
                    status: transformedData.status
                }));
                
                setStartDate(transformedData.dateOfCalibration);
                setEndDate(transformedData.calibrationDueDate);
                setSelectedModelId(transformedData.makeModel);
    
            } catch (error) {
                const err = error as Error;
                console.error("Error fetching certificate:", err);
                setError(err.message || "Failed to load certificate data");
            } finally {
                setLoading(false);
            }
        };
    
        fetchCertificateData();
    }, [certificateId]);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        setFormData(prev => ({
            ...prev,
            dateOfCalibration: newStartDate
        }));

        if (timePeriod) {
            const startDateObj = new Date(newStartDate);
            startDateObj.setMonth(startDateObj.getMonth() + timePeriod);
            const newEndDate = startDateObj.toISOString().split("T")[0];
            setEndDate(newEndDate);
            setFormData(prev => ({
                ...prev,
                calibrationDueDate: newEndDate
            }));
        }
    };

    const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const period = Number(e.target.value);
        setTimePeriod(period);

        if (startDate) {
            const startDateObj = new Date(startDate);
            startDateObj.setMonth(startDateObj.getMonth() + period);
            const newEndDate = startDateObj.toISOString().split("T")[0];
            setEndDate(newEndDate);
            setFormData(prev => ({
                ...prev,
                calibrationDueDate: newEndDate
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modelId = e.target.value;
        setSelectedModelId(modelId);
        const selectedModel = models.find(m => m.id === modelId);
        const modelRange = selectedModel?.range || "";
        const modelName = selectedModel?.model_name || "";

        let updatedObservations = [{ gas: "", before: "", after: "" }];
        
        if (modelName === "GMIleakSurveyor") {
            updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
        } else if (modelName === "GMIGT41Series") {
            updatedObservations = Array(4).fill({ gas: "", before: "", after: "" });
        } else if (modelName === "GMIGT44") {
            updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
        }
    
        setFormData(prev => ({
            ...prev,
            makeModel: modelName,
            range: modelRange,
            observations: updatedObservations
        }));
    };

    const handleObservationChange = (index: number, field: keyof Observation, value: string) => {
        const updatedObservations = [...formData.observations];
        updatedObservations[index] = { ...updatedObservations[index], [field]: value };
        setFormData({ ...formData, observations: updatedObservations });
    };

    const addObservation = () => {
        if (formData.observations.length < 5) {
            setFormData({
                ...formData,
                observations: [...formData.observations, { gas: "", before: "", after: "" }]
            });
        }
    };

    const removeObservation = (index: number) => {
        const updatedObservations = [...formData.observations];
        updatedObservations.splice(index, 1);
        setFormData({ ...formData, observations: updatedObservations });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const requiredFields: Record<string, string> = {
                customerName: "Customer Name",
                siteLocation: "Site Location",
                makeModel: "Make/Model",
                range: "Range",
                serialNo: "Serial No",
                calibrationGas: "Calibration Gas",
                gasCanisterDetails: "Gas Canister Details",
                status: "Status",
                engineerName: "Engineer Name"
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([field]) => !formData[field as keyof typeof formData]?.toString().trim())
                .map(([_, label]) => label);

            if (!startDate) missingFields.push("Date of Calibration");
            if (!endDate) missingFields.push("Calibration Due Date");

            const invalidObservations = formData.observations
                .map((obs, index) => {
                    const missing: string[] = [];
                    if (!obs.gas?.trim()) missing.push(`Observation ${index + 1} - Gas`);
                    if (!obs.before?.trim()) missing.push(`Observation ${index + 1} - Before`);
                    if (!obs.after?.trim()) missing.push(`Observation ${index + 1} - After`);
                    return missing;
                })
                .flat();

            const validationErrors = [...missingFields, ...invalidObservations];
            if (validationErrors.length > 0) {
                setError(`Please fill in: ${validationErrors.join(", ")}`);
                setLoading(false);
                return;
            }

            const submissionData = {
                ...formData,
                id: certificateId || undefined,
                dateOfCalibration: startDate,
                calibrationDueDate: endDate,
                observations: formData.observations.map(obs => ({
                    gas: obs.gas.trim(),
                    before: obs.before.trim(),
                    after: obs.after.trim()
                }))
            };

            const isEditMode = !!certificateId;
            const method = isEditMode ? 'put' : 'post';
            const url = `/api/certificates${isEditMode ? `?id=${certificateId}` : ''}`;

            const response = await axios({
                method,
                url,
                data: submissionData,
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                }
            });

            setCertificate(response.data);
            toast({
                title: "Success",
                description: isEditMode 
                    ? "Certificate updated successfully" 
                    : "Certificate created successfully",
                variant: "default",
            });

        } catch (err: unknown) {
            let errorMessage = "An unexpected error occurred";
            
            if (axios.isAxiosError(err)) {
                errorMessage = err.response?.data?.message || 
                              err.response?.data?.error || 
                              err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            console.error("Submission error:", errorMessage);
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const logo = new Image();
        logo.src = "/img/rps.png";

        logo.onload = () => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const leftMargin = 15;
            const rightMargin = 15;
            const topMargin = 20;
            const bottomMargin = 20;
            const contentWidth = pageWidth - leftMargin - rightMargin;
            let y = topMargin;

            const logoWidth = 60;
            const logoHeight = 20;
            const logoX = 2;
            const logoY = 10;

            doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

            y = logoY + logoHeight + 10;

            doc.setFont("times", "bold").setFontSize(16).setTextColor(0, 51, 102);
            doc.text("CALIBRATION CERTIFICATE", pageWidth / 2, y, { align: "center" });
            y += 10;

            const labelX = leftMargin;
            const labelWidth = 55;
            const valueX = labelX + labelWidth + 2;
            const lineGap = 8;

            const formatDate = (inputDateString: string | undefined) => {
                if (!inputDateString) return "N/A";
                const inputDate = new Date(inputDateString);
                if (isNaN(inputDate.getTime())) return "N/A";
                const pad = (n: number) => n.toString().padStart(2, "0");
                return `${pad(inputDate.getDate())} - ${pad(inputDate.getMonth() + 1)} - ${inputDate.getFullYear()}`;
            };

            const addRow = (labelText: string, value: string) => {
                doc.setFont("times", "bold").setFontSize(11).setTextColor(0);
                doc.text(labelText, labelX, y);
                doc.setFont("times", "normal").setTextColor(50);
                doc.text(": " + (value || "N/A"), valueX, y);
                y += lineGap;
            };

            addRow("Certificate No.", formData.certificateNo);
            addRow("Customer Name", formData.customerName);
            addRow("Site Location", formData.siteLocation);
            addRow("Make & Model", formData.makeModel);
            addRow("Range", formData.range);
            addRow("Serial No.", formData.serialNo);
            addRow("Calibration Gas", formData.calibrationGas);
            addRow("Gas Canister Details", formData.gasCanisterDetails);

            y += 5;
            addRow("Date of Calibration", formatDate(formData.dateOfCalibration));
            addRow("Calibration Due Date", formatDate(formData.calibrationDueDate));
            addRow("Status", formData.status);

            y += 5;
            doc.setDrawColor(180);
            doc.setLineWidth(0.3);
            doc.line(leftMargin, y, pageWidth - rightMargin, y);
            y += 10;

            doc.setFont("times", "bold").setFontSize(12).setTextColor(0, 51, 102);
            doc.text("OBSERVATIONS", leftMargin, y);
            y += 10;

            const colWidths = [20, 70, 40, 40];
            const headers = ["Sr. No.", "Concentration of Gas", "Reading Before", "Reading After"];
            let x = leftMargin;

            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            headers.forEach((header, i) => {
                doc.rect(x, y - 5, colWidths[i], 8);
                doc.text(header, x + 2, y);
                x += colWidths[i];
            });
            y += 8;

            doc.setFont("times", "normal").setFontSize(10);
            formData.observations.forEach((obs, index) => {
                let x = leftMargin;
                const rowY = y + index * 8;

                const rowData = [
                    `${index + 1}`,
                    obs.gas || "",
                    obs.before || "",
                    obs.after || ""
                ];

                rowData.forEach((text, colIndex) => {
                    doc.rect(x, rowY - 6, colWidths[colIndex], 8);
                    doc.text(text, x + 2, rowY);
                    x += colWidths[colIndex];
                });
            });

            y += formData.observations.length * 8 + 15;

            const conclusion = "The above-mentioned Gas Detector was calibrated successfully, and the result confirms that the performance of the instrument is within acceptable limits.";
            doc.setFont("times", "normal").setFontSize(10).setTextColor(0);
            const conclusionLines = doc.splitTextToSize(conclusion, contentWidth);
            doc.text(conclusionLines, leftMargin, y);
            y += conclusionLines.length * 6 + 15;

            doc.setFont("times", "bold");
            doc.text("Tested & Calibrated By", pageWidth - rightMargin, y, { align: "right" });
            doc.setFont("times", "normal");
            doc.text(formData.engineerName || "________________", pageWidth - rightMargin, y + 10, { align: "right" });

            doc.setDrawColor(180);
            doc.line(leftMargin, pageHeight - bottomMargin - 10, pageWidth - rightMargin, pageHeight - bottomMargin - 10);

            doc.setFontSize(8).setTextColor(100);
            doc.text("This certificate is electronically generated and does not require a physical signature.", leftMargin, pageHeight - bottomMargin - 5);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, pageHeight - bottomMargin);

            doc.save("calibration-certificate.pdf");
        };

        logo.onerror = () => {
            console.error("Failed to load logo image.");
            alert("Logo image not found. Please check the path.");
        };
    };

    const filteredCompanies = companies.filter(company =>
        company.company_name.toLowerCase().includes(companySearchTerm.toLowerCase())
    );

    if (loading && certificateId) {
        return <CertificateFormLoading />;
    }

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
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/certificaterecord">
                                        Certificate Record
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
                                {certificateId ? "Update Certificate" : "Create Certificate"}
                            </CardTitle>
                            <CardDescription className="text-center">
                                {certificateId
                                    ? "Modify the certificate details below"
                                    : "Fill out the form below to create a new certificate"}
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
                                        <span className="block sm:inline">{certificateId ? "Updating..." : "Generating..."}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            name="customerName"
                                            placeholder="Customer Name"
                                            value={formData.customerName}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, customerName: e.target.value }));
                                                setCompanySearchTerm(e.target.value);
                                                setShowCompanyDropdown(true);
                                            }}
                                            onFocus={() => setShowCompanyDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
                                            className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md w-full text-sm"
                                        />

                                        {showCompanyDropdown && (
                                            <ul className="absolute left-0 top-full mt-1 z-20 w-full rounded-md border bg-white text-sm shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCompanies.length > 0 ? (
                                                    filteredCompanies.map((company) => (
                                                        <li
                                                            key={company._id}
                                                            className={`px-4 py-2 cursor-pointer transition-colors ${selectedCompanyName === company.company_name ? " font-medium" : ""
                                                                }`}
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    customerName: company.company_name
                                                                }));
                                                                setCompanySearchTerm(company.company_name);
                                                                setSelectedCompanyName(company.company_name);
                                                                setShowCompanyDropdown(false);
                                                            }}
                                                        >
                                                            {company.company_name}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-gray-500">
                                                        {companySearchTerm ? "No companies found" : "Start typing to search companies"}
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        name="siteLocation"
                                        placeholder="Site Location"
                                        value={formData.siteLocation}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                </div>
                                <div className="flex gap-4 items-center">
                                    <select
                                        className="w-full sm:w-1/2 bg-white border px-3 py-2 rounded-md text-black"
                                        value={selectedModelId}
                                        onChange={handleModelChange}
                                    >
                                        <option value="">Select Model</option>
                                        {models.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.model_name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        value={formData.range}
                                        readOnly
                                        className="w-full sm:w-1/2 bg-gray-100 border px-3 py-2 rounded-md text-black"
                                        placeholder="Model Range"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="serialNo"
                                        placeholder="Serial Number"
                                        value={formData.serialNo}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                    <input
                                        type="text"
                                        name="calibrationGas"
                                        placeholder="Calibration Gas"
                                        value={formData.calibrationGas}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    <textarea
                                        name="gasCanisterDetails"
                                        placeholder="Gas Canister Details"
                                        value={formData.gasCanisterDetails}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black w-full px-3 py-2 rounded-md resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="date"
                                        name="dateOfCalibration"
                                        value={startDate}
                                        onChange={handleStartDateChange}
                                        className="p-2 rounded-md border bg-white"
                                        min="2000-01-01"
                                        max="2100-12-31"
                                    />

                                    <select
                                        onChange={handleTimePeriodChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    >
                                        <option value="">Select Period</option>
                                        <option value="3">3 Months</option>
                                        <option value="6">6 Months</option>
                                        <option value="9">9 Months</option>
                                        <option value="12">12 Months</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="date"
                                        name="calibrationDueDate"
                                        placeholder="Enter Calibration Due Date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setFormData(prev => ({
                                                ...prev,
                                                calibrationDueDate: e.target.value
                                            }));
                                        }}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                        disabled={timePeriod !== null}
                                        data-date-format="DD-MM-YYYY"
                                        min="2000-01-01"
                                        max="2100-12-31"
                                    />
                                    <select
                                        name="engineerName"
                                        value={formData.engineerName}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    >
                                        <option value="">Select Engineer</option>
                                        {engineers.map((eng) => (
                                            <option key={eng.id} value={eng.name}>
                                                {eng.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        id="certificateNo"
                                        name="certificateNo"
                                        value={formData.certificateNo}
                                        onChange={handleChange}
                                        readOnly
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    />
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-2 rounded-md"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Checked">Checked</option>
                                        <option value="Unchecked">Unchecked</option>
                                    </select>
                                </div>

                                <h2 className="text-lg font-bold mt-4 text-center">Observation Table</h2>
                                <div className="flex justify-end mb-4">
                                    <button
                                        type="button"
                                        onClick={addObservation}
                                        className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-gray-900"
                                        disabled={formData.observations.length >= 5}
                                    >
                                        Create Observation
                                    </button>
                                </div>
                                <table className="table-auto border-collapse border border-gray-500 rounded w-full">
                                    <thead>
                                        <tr>
                                            <th className="border p-2">#</th>
                                            <th className="border p-2">Gas</th>
                                            <th className="border p-2">Before Calibration</th>
                                            <th className="border p-2">After Calibration</th>
                                            <th className="border p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.observations.map((observation, index) => (
                                            <tr key={index}>
                                                <td className="border p-2">{index + 1}</td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="gas"
                                                        value={observation.gas}
                                                        onChange={(e) => handleObservationChange(index, 'gas', e.target.value)}
                                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="before"
                                                        value={observation.before}
                                                        onChange={(e) => handleObservationChange(index, 'before', e.target.value)}
                                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="after"
                                                        value={observation.after}
                                                        onChange={(e) => handleObservationChange(index, 'after', e.target.value)}
                                                        className="bg-white text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black p-1 rounded-md"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeObservation(index)}
                                                    >
                                                        <Trash2 className="h-6 w-6" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.observations.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="border p-2 text-center text-gray-500">
                                                    Click Create Observation to add one
                                                </td>
                                            </tr>
                                        )}
                                        {formData.observations.length >= 5 && (
                                            <tr>
                                                <td colSpan={5} className="border p-2 text-center text-yellow-600">
                                                    Maximum limit of 5 observations reached.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <button
                                    type="submit"
                                    className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md w-full"
                                    disabled={loading}
                                >
                                    {loading ? "Generating..." : "Generate Certificate"}
                                </button>
                            </form>

                            {certificate && (
                                <div className="mt-4 text-center">
                                    <p className="text-green-600 mb-2">{certificate.id}</p>
                                    <button
                                        onClick={handleDownload}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                    >
                                        Download Certificate
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