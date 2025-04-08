"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import axios from "axios";
import { toast } from "@heroui/react";
// import { toast } from "@/components/ui/use-toast";

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
    id?: string;
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
        engineerRemarks: [{ serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }],
        engineerName: "",
        status: ""
    });

    const [service, setService] = useState<ServiceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [isLoadingEngineers, setIsLoadingEngineers] = useState(true);

    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/v1/engineers/getEngineers");
                const data = await response.json();
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
                        setService({
                            serviceId: serviceData.serviceId,
                            message: "Service loaded for editing",
                            downloadUrl: `http://localhost:5000/api/v1/services/download/${serviceData.serviceId}`
                        });
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

    const handleServiceEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedEngineer = engineers.find(engineer => engineer.id === selectedId);

        setFormData(prev => ({
            ...prev,
            serviceEngineerId: selectedId,
            serviceEngineer: selectedEngineer?.name || ""
        }));
    };

    const handleEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedEngineer = engineers.find(engineer => engineer.id === selectedId);

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

        const sanitizedRemarks = formData.engineerRemarks
            .filter(remark =>
                remark.serviceSpares?.trim() &&
                remark.partNo?.trim() &&
                remark.rate?.trim() &&
                remark.quantity?.trim() &&
                remark.poNo?.trim()
            )
            .map(remark => ({
                serviceSpares: remark.serviceSpares.trim(),
                partNo: remark.partNo.trim(),
                rate: remark.rate.trim(),
                quantity: Number(remark.quantity),
                poNo: remark.poNo.trim()
            }));

        const submissionData = {
            ...formData,
            engineerRemarks: sanitizedRemarks.length > 0 ? sanitizedRemarks : [],
            serviceEngineer: formData.serviceEngineer.trim(),
            engineerName: formData.engineerName.trim()
        };

        const requiredFields = {
            customerName: "Customer Name",
            customerLocation: "Customer Location",
            contactPerson: "Contact Person",
            contactNumber: "Contact Number",
            serviceEngineer: "Service Engineer",
            date: "Date",
            place: "Place",
            placeOptions: "Place Options",
            natureOfJob: "Nature of Job",
            makeModelNumberoftheInstrumentQuantity: "Make & Model Number",
            serialNumberoftheInstrumentCalibratedOK: "Serial Number (Calibrated OK)",
            serialNumberoftheFaultyNonWorkingInstruments: "Serial Number (Faulty/Non-Working)",
            engineerName: "Engineer Name",
            status: "Status"
        };

        const emptyFields = Object.entries(requiredFields)
            .filter(([key]) => !submissionData[key as keyof ServiceRequest]?.toString().trim())
            .map(([_, label]) => label);

        if (emptyFields.length > 0) {
            setError(`Please fill in: ${emptyFields.join(", ")}`);
            setLoading(false);
            return;
        }

        if (sanitizedRemarks.length === 0) {
            setError("Please add at least one valid engineer remark");
            setLoading(false);
            return;
        }

        const hasInvalidQuantity = sanitizedRemarks.some(remark => isNaN(Number(remark.quantity)));
        if (hasInvalidQuantity) {
            setError("Quantity must be a number in all remarks");
            setLoading(false);
            return;
        }

        try {
            let response;
            if (isEditMode) {
                response = await axios.put(
                    `http://localhost:5000/api/v1/services/update/${serviceId}`,
                    submissionData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                response = await axios.post(
                    "http://localhost:5000/api/v1/services/generateServices",
                    submissionData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            setService(response.data);
            toast({
                title: "Success",
                description: isEditMode
                    ? "Service updated successfully!"
                    : "Service request created successfully!",
                variant: "default",
            });

            if (isEditMode) {
                router.push("/admincertificatetable");
            }
        } catch (err: any) {
            console.error("Error:", err.response?.data || err.message);
            setError(err.response?.data?.error ||
                (isEditMode ? "Failed to update service" : "Failed to generate service"));
            toast({
                title: "Error",
                description: err.response?.data?.error ||
                    (isEditMode ? "Failed to update service" : "Failed to generate service"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!service?.downloadUrl) return;

        try {
            const response = await axios.get(
                `http://localhost:5000${service.downloadUrl}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `service-${service.serviceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError("Failed to download certificate. Please try again.");
            toast({
                title: "Error",
                description: "Failed to download service report",
                variant: "destructive",
            });
        }
    };

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
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="addmodel" >
                                        Add Model
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="adminservice" >
                                        Admin Service
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="adminservicetable">
                                        Admin Service Table
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
                                {isEditMode ? "Edit Service" : "Admin Service"}
                            </CardTitle>
                            <CardDescription className="text-center">
                                {isEditMode
                                    ? "Edit the service details below."
                                    : "Please fill out the form below to generate a new Service."}
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
                                    <input
                                        type="text"
                                        name="customerName"
                                        placeholder="Customer Name"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        type="text"
                                        name="customerLocation"
                                        placeholder="Customer Location"
                                        value={formData.customerLocation}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        type="text"
                                        name="contactPerson"
                                        placeholder="Contact Person"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

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
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        placeholder="Contact Number"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <select
                                        value={formData.serviceEngineerId}
                                        onChange={handleServiceEngineerChange}
                                        className="p-2 border rounded"
                                        required
                                        disabled={isLoadingEngineers}
                                    >
                                        <option value="">Select Service Engineer</option>
                                        {isLoadingEngineers ? (
                                            <option>Loading engineers...</option>
                                        ) : (
                                            engineers.map((engineer) => (
                                                <option key={engineer.id} value={engineer.id}>
                                                    {engineer.name}
                                                </option>
                                            ))
                                        )}
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
                                    <label className="font-medium text-gray-700">Place:</label>
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
                                            <span className="text-gray-700">At Site</span>
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
                                            <span className="text-gray-700">In House</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-gray-700">Nature of Job:</label>
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
                                            <span className="text-gray-700">AMC</span>
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
                                            <span className="text-gray-700">Charged</span>
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
                                            <span className="text-gray-700">Warranty</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <select
                                        value={formData.engineerId}
                                        onChange={handleEngineerChange}
                                        className="p-2 border rounded"
                                        required
                                        disabled={isLoadingEngineers}
                                    >
                                        <option value="">Select Engineer</option>
                                        {isLoadingEngineers ? (
                                            <option>Loading engineers...</option>
                                        ) : (
                                            engineers.map((engineer) => (
                                                <option key={engineer.id} value={engineer.id}>
                                                    {engineer.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        name="makeModelNumberoftheInstrumentQuantity"
                                        placeholder="Make & Model Number of the Instrument Quantity"
                                        value={formData.makeModelNumberoftheInstrumentQuantity}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <textarea
                                        name="serialNumberoftheInstrumentCalibratedOK"
                                        placeholder="Serial Number of the Instrument Calibrated & OK"
                                        value={formData.serialNumberoftheInstrumentCalibratedOK}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <textarea
                                        name="serialNumberoftheFaultyNonWorkingInstruments"
                                        placeholder="Serial Number of Faulty/Non-Working Instruments"
                                        value={formData.serialNumberoftheFaultyNonWorkingInstruments}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <h2 className="text-lg font-bold mt-4">Engineer Remarks Table</h2>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={addEngineerRemark}
                                        className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-gray-900"
                                        disabled={formData.engineerRemarks.length >= 10}
                                    >
                                        Add Engineer Remark
                                    </button>
                                </div>
                                <table className="table-auto border-collapse border border-gray-500 rounded w-full">
                                    <thead>
                                        <tr>
                                            <th className="border p-2">#</th>
                                            <th className="border p-2">Service/Spares</th>
                                            <th className="border p-2">Part No.</th>
                                            <th className="border p-2">Rate</th>
                                            <th className="border p-2">Quantity</th>
                                            <th className="border p-2">PO No.</th>
                                            <th className="border p-2">Remove</th>
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
                                                        className="bg-red-900 text-white px-2 py-1 border rounded hover:bg-red-950"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.engineerRemarks.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="border p-2 text-center text-gray-500">
                                                    No engineer remarks added yet. Click "Add Engineer Remark" to add one.
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

                                <button
                                    type="submit"
                                    className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md"
                                    disabled={loading}
                                >
                                    {loading ? (isEditMode ? "Updating..." : "Generating...") : (isEditMode ? "Update Service" : "Generate Service")}
                                </button>
                            </form>

                            {service && (
                                <div className="mt-4 text-center">
                                    <p className="text-green-600 mb-2">{service.message}</p>
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