"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Tasklist from "./taskList"

const taskSchema = z.object({
    subject: z.string().min(2, { message: "Subject is required." }),
    relatedTo: z.string().min(2, { message: "Related to field is required." }),
    lastReminder: z.string().optional(),
    name: z.string().min(2, { message: "Name is required." }),
    assigned: z.string().min(2, { message: "Assigned person is required." }),
    taskDate: z.date().optional(),
    dueDate: z.string().min(2, { message: "Due date is required." }),
    status: z.enum(["Pending", "Resolved", "In Progress"]),
    priority: z.enum(["High", "Medium", "Low"]),
    notes: z.string().optional(),
});

export default function TaskPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<z.infer<typeof taskSchema>>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            subject: "",
            relatedTo: "",
            name: "",
            assigned: "",
            taskDate: new Date(),
            dueDate: "",
            status: "Pending",
            priority: "Medium",
            notes: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof taskSchema>) => {
        setIsSubmitting(true);
        try {
            // API call to create or update task
            const response = await fetch("/api/task", {
                method: "POST", // or PUT if updating
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit the task.");
            }

            toast({
                title: "Task Created",
                description: `Your task has been created successfully.`,
            });

            // Redirect or reset form, depending on your requirements
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error submitting the task.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 w-full">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                    <BreadcrumbLink href="/task">

                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Task</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        {/* Add button in the header */}
                        <div className="ml-auto">
                            <Button>Task Table</Button>
                        </div>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Create Task</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="subject"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Task</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Task" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="relatedTo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Related To</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Related To" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="assigned"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Assigned By</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Assigned By" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="taskDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Task Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                                >
                                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) => date > new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dueDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Due Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                                >
                                                                    {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={field.onChange}
                                                                disabled={(date) => date > new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <FormControl>
                                                        <select {...field} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Resolved">Resolved</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="priority"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Priority</FormLabel>
                                                    <FormControl>
                                                        <select {...field} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                            <option value="Low">Low</option>
                                                            <option value="Medium">Medium</option>
                                                            <option value="High">High</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Task Details</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        {...field}
                                                        placeholder="Enter Other Details"
                                                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows={3}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Task...
                                            </>
                                        ) : (
                                            "Create Task"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Tasklist />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
