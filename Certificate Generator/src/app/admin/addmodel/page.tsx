"use client";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AdminSidebar } from "@/components/admin-sidebar";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Model {
    id: string;
    model_name: string;
    range: string;
}

interface Engineer {
    id: string;
    name: string;
}

interface ServiceEngineer {
    id: string;
    name: string;
}

export default function AddModel() {
    const [models, setModels] = useState<Model[]>([]);
    const [newModel, setNewModel] = useState("");
    const [newRange, setNewRange] = useState("");
    const [modelLoading, setModelLoading] = useState(false);

    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [newEngineer, setNewEngineer] = useState("");
    const [engineerLoading, setEngineerLoading] = useState(false);

    const [serviceEngineers, setServiceEngineers] = useState<ServiceEngineer[]>(
        []
    );
    const [newServiceEngineer, setNewServiceEngineer] = useState("");
    const [serviceEngineerLoading, setServiceEngineerLoading] = useState(false);

    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    const [selectedModelId, setSelectedModelId] = useState<string>("");
    const [selectedRange, setSelectedRange] = useState<string>("");


    useEffect(() => {
        fetchModels();
        fetchEngineers();
        fetchServiceEngineers();
    }, []);

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

    const fetchServiceEngineers = async () => {
        try {
            const res = await fetch("/api/service-engineers");
            const data = await res.json();
            setServiceEngineers(data);
        } catch {
            toast({ title: "Error", description: "Failed to load service engineers", variant: "destructive" });
        }
    };

    const handleCreateModel = async () => {
        if (!newModel || !newRange) {
            toast({ title: "Warning", description: "Please fill both model and range" });
            return;
        }
        setModelLoading(true);
        try {
            const newId = crypto.randomUUID();
            await fetch("/api/models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, model_name: newModel, range: newRange }),
            });
            toast({ title: "Success", description: "Model created successfully" });
            setNewModel("");
            setNewRange("");
            fetchModels();
        } catch {
            toast({ title: "Error", description: "Failed to create model", variant: "destructive" });
        } finally {
            setModelLoading(false);
        }
    };

    const handleCreateEngineer = async () => {
        if (!newEngineer) {
            toast({ title: "Warning", description: "Please enter engineer name" });
            return;
        }
        setEngineerLoading(true);
        try {
            const newId = crypto.randomUUID();
            await fetch("/api/engineers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, name: newEngineer }),
            });
            toast({ title: "Success", description: "Engineer created successfully" });
            setNewEngineer("");
            fetchEngineers();
        } catch {
            toast({ title: "Error", description: "Failed to create engineer", variant: "destructive" });
        } finally {
            setEngineerLoading(false);
        }
    };

    const handleCreateServiceEngineer = async () => {
        if (!newServiceEngineer) {
            toast({ title: "Warning", description: "Please enter service engineer name" });
            return;
        }
        setServiceEngineerLoading(true);
        try {
            const newId = crypto.randomUUID();
            await fetch("/api/service-engineers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: newId, name: newServiceEngineer }),
            });
            toast({ title: "Success", description: "Service engineer created successfully" });
            setNewServiceEngineer("");
            fetchServiceEngineers();
        } catch {
            toast({ title: "Error", description: "Failed to create service engineer", variant: "destructive" });
        } finally {
            setServiceEngineerLoading(false);
        }
    };

    const handleDelete = async (
        id: string,
        type: "model" | "engineer" | "serviceEngineer"
    ) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

        setDeleteLoadingId(id);
        try {
            const endpoint =
                type === "model"
                    ? `/api/models?id=${id}`
                    : type === "engineer"
                        ? `/api/engineers?id=${id}`
                        : `/api/service-engineers?id=${id}`;

            await fetch(endpoint, { method: "DELETE" });

            toast({ title: "Deleted", description: `${type} deleted successfully` });

            if (type === "model") fetchModels();
            else if (type === "engineer") fetchEngineers();
            else fetchServiceEngineers();
        } catch {
            toast({
                title: "Error",
                description: `Failed to delete ${type}`,
                variant: "destructive",
            });
        } finally {
            setDeleteLoadingId(null);
        }
    };

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 px-4 border-b">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/dashboard">
                                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Manage Resources</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="container mx-auto py-10 px-4 space-y-10 max-w-5xl">
                    {/* === MODELS === */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold text-center">
                                Models
                            </CardTitle>
                            <CardDescription className="text-center">
                                Manage your vehicle models
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {models.length ? (
                                    models.map((model) => (
                                        <div
                                            key={model.id}
                                            className="flex items-center justify-between px-4 py-2 bg-white border rounded shadow-sm"
                                        >
                                            <span className="text-sm text-gray-800 font-medium">
                                                {model.model_name} - {model.range}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(model.id, "model")}
                                                className="text-red-500 hover:text-red-700 transition"
                                                disabled={deleteLoadingId === model.id}
                                            >
                                                {deleteLoadingId === model.id ? "Deleting..." : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">No models available</p>
                                )}
                            </div>

                           
                            <div className="flex gap-4 items-center">
                                <select
                                    className="w-full sm:w-1/2 bg-white border px-3 py-2 rounded-md text-black"
                                    value={selectedModelId}
                                    onChange={(e) => {
                                        const modelId = e.target.value;
                                        setSelectedModelId(modelId);
                                        const selectedModel = models.find((model) => model.id === modelId);
                                        setSelectedRange(selectedModel?.range || "");
                                    }}
                                >
                                    <option value="">Select Model</option>
                                    {models.map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.model_name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={selectedRange}
                                    readOnly
                                    className="w-full sm:w-1/2 bg-gray-100 border px-3 py-2 rounded-md text-black"
                                    placeholder="Model Range"
                                />
                            </div>


                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    value={newModel}
                                    onChange={(e) => setNewModel(e.target.value)}
                                    placeholder="New Model Name"
                                    className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-black focus:ring-1 px-3 py-2 rounded-md"
                                />
                                <input
                                    value={newRange}
                                    onChange={(e) => setNewRange(e.target.value)}
                                    placeholder="New Range"
                                    className="w-full bg-white text-black border border-gray-300 focus:border-black focus:ring-black focus:ring-1 px-3 py-2 rounded-md"
                                />
                            </div>
                            <button
                                onClick={handleCreateModel}
                                disabled={modelLoading}
                                className="bg-blue-950 hover:bg-blue-900 text-white font-semibold py-2 px-4 rounded-md w-full transition"
                            >
                                {modelLoading ? "Creating..." : "Create New Model"}
                            </button>
                        </CardContent>
                    </Card>



                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold text-center">
                                Engineers
                            </CardTitle>
                            <CardDescription className="text-center">
                                Manage your engineers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {engineers.length ? (
                                    engineers.map((eng) => (
                                        <div
                                            key={eng.id}
                                            className="flex items-center justify-between px-4 py-2 bg-white border rounded shadow-sm"
                                        >
                                            <span className="text-sm text-gray-800 font-medium">
                                                {eng.name}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(eng.id, "engineer")}
                                                className="text-red-500 hover:text-red-700 transition"
                                                disabled={deleteLoadingId === eng.id}
                                            >
                                                {deleteLoadingId === eng.id ? "Deleting..." : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">No engineers available</p>
                                )}
                            </div>

                            {/* Dropdown alone on first line */}
                            <div>
                                <select className="w-full sm:w-1/3 bg-white border px-3 py-2 rounded-md text-black">
                                    <option>Select Engineer</option>
                                    {engineers.map((eng) => (
                                        <option key={eng.id} value={eng.id}>
                                            {eng.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Input and Button below */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    value={newEngineer}
                                    onChange={(e) => setNewEngineer(e.target.value)}
                                    placeholder="New Engineer Name"
                                    className="flex-1 bg-white border border-gray-300 px-3 py-2 rounded-md text-black"
                                />
                                <button
                                    onClick={handleCreateEngineer}
                                    disabled={engineerLoading}
                                    className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-md w-full sm:w-40 transition"
                                >
                                    {engineerLoading ? "Creating..." : "Add Engineer"}
                                </button>
                            </div>
                        </CardContent>
                    </Card>


                    {/* === SERVICE ENGINEERS === */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold text-center">
                                Service Engineers
                            </CardTitle>
                            <CardDescription className="text-center">
                                Manage your service engineers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {serviceEngineers.length ? (
                                    serviceEngineers.map((eng) => (
                                        <div
                                            key={eng.id}
                                            className="flex items-center justify-between px-4 py-2 bg-white border rounded shadow-sm"
                                        >
                                            <span className="text-sm text-gray-800 font-medium">
                                                {eng.name}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(eng.id, "serviceEngineer")}
                                                className="text-red-500 hover:text-red-700 transition"
                                                disabled={deleteLoadingId === eng.id}
                                            >
                                                {deleteLoadingId === eng.id ? "Deleting..." : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">No service engineers available</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <select className="w-full sm:w-1/3 bg-white border px-3 py-2 rounded-md text-black">
                                    <option>Select Service Engineer</option>
                                    {serviceEngineers.map((eng) => (
                                        <option key={eng.id} value={eng.id}>
                                            {eng.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    value={newServiceEngineer}
                                    onChange={(e) => setNewServiceEngineer(e.target.value)}
                                    placeholder="New Service Engineer Name"
                                    className="flex-1 bg-white border border-gray-300 px-3 py-2 rounded-md text-black"
                                />
                                <button
                                    onClick={handleCreateServiceEngineer}
                                    disabled={serviceEngineerLoading}
                                    className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-md w-full sm:w-40 transition"
                                >
                                    {serviceEngineerLoading ? "Creating..." : "Add Service Engineer"}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
