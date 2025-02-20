"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import Leadlist from "./leadList"

const formSchema = z.object({
    companyName: z.string().min(2, { message: "Company name is required." }),
    customerName: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
    contactNumber: z.string().optional(),
    emailAddress: z.string().email({ message: "Invalid email address" }),
    address: z.string().min(2, { message: "Address is required." }),
    productName: z.string().min(2, { message: "Product name is required." }),
    amount: z.number().positive({ message: "Amount must be positive." }),
    gstNumber: z.string().min(1, { message: "GST Number is required." }),
    status: z.enum(["New", "Discussion", "Demo", "Proposal", "Decided"]),
    date: z.date().optional(),
    endDate: z.date().optional(),
    notes: z.string().optional(),
    isActive: z.boolean(),
})

export default function LeadPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: "",
            customerName: "",
            contactNumber: "", // Default empty string for contact number
            emailAddress: "",
            address: "",
            productName: "",
            amount: 0,
            gstNumber: "",
            status: "New",
            date: new Date(),
            endDate: undefined,
            notes: "", // Default empty string for notes
            isActive: true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const response = await fetch("/api/submit-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit the lead")
            }

            toast({
                title: "Lead Submitted",
                description: `Your lead has been successfully submitted. ID: ${data.id}`,
            })
            router.push(`/lead/${data.id}`) // Redirect to the lead details page
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error submitting the lead.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

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
                                    <BreadcrumbLink href="/lead">
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Lead</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        {/* Add button in the header */}
                        <div className="ml-auto">
                            <Button>Lead Table</Button>
                        </div>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Create Lead</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="companyName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Company Name" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="customerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Customer Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Customer Name" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="contactNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contact Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Contact Number" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="emailAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Email Address" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Company Address" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="productName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Product Name" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Amount</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Product Amount" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="gstNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>GST Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter GST Number" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Status</FormLabel>
                                                    <FormControl>
                                                        <select

                                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="New">New</option>
                                                            <option value="Discussion">Discussion</option>
                                                            <option value="Demo">Demo</option>
                                                            <option value="Decided">Decided</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Lead Date</FormLabel>
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
                                            name="endDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>End Date</FormLabel>
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
                                                                disabled={(date) => date < new Date()}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
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
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        placeholder="Enter Other Details"
                                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                        rows="3"
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
                                                Submitting...
                                            </>
                                        ) : (
                                            "Create Lead"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Leadlist />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
