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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define validation schema using Zod
const accountSchema = z.object({
    accountName: z.string().min(2, { message: "Account name is required." }),
    contactName: z.string().min(2, { message: "Contact name is required." }),
    contactNumber: z.string().optional(),
    emailAddress: z.string().email({ message: "Invalid email address." }),
    accountType: z.enum(["Prospect", "Customer", "Partner"], { message: "Account type is required." }),
    industry: z.string().min(2, { message: "Industry is required." }),
    status: z.enum(["Active", "Inactive"], { message: "Account status is required." }),
    accountManager: z.string().min(2, { message: "Account manager is required." }),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    address: z.string().min(2, { message: "Address is required." }),
    description: z.string().optional(),
    companyName: z.string().min(2, { message: "Company name is required." }),
    bankDetails: z.object({
        bankName: z.string().min(2, { message: "Bank name is required." }),
        accountNumber: z.string().min(2, { message: "Account number is required." }),
        sortCode: z.string().min(2, { message: "Sort code is required." }),
        accountType: z.enum(["Checking", "Savings"], { message: "Account type is required." }),
        bankAddress: z.string().min(2, { message: "Bank address is required." }),
        swiftCode: z.string().min(2, { message: "SWIFT code is required." }),
    }).optional(),
});


export default function AccountPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize the form
    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            companyName: "",
            accountType: "",
            bankName: "",
            bankholderName: "",
            accountNumber: "",
            ifscCode: "",
            cardholderName: "",
            cardNumber: "",
            expiryDate: "",
            upiId: "",
            description: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof accountSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit the account.");
            }

            toast({
                title: "Account Created",
                description: "Your account has been created successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error submitting the account.",
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
                                    <BreadcrumbLink href="/Account">

                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Account</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="ml-auto">
                            <Button>Account Table</Button>
                        </div>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
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
                                                        <Input placeholder="Enter Company Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="accountType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Type</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            {...field}
                                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="Customer">Customer</option>
                                                            <option value="Partner">Partner</option>
                                                            <option value="Prospect">Prospect</option>
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
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Bank Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name=" bankholderName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Holder Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Bank Holder Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="accountNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Bank Account Number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ifscCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank IFSC Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Bank IFSC Code" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="cardholderName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Card Holder Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Card Holder Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cardNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Card Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Credit / Debit Card Number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name=" expiryDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Expiry Date</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter Card Expiry Date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="upiId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>UPI ID</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter UPI ID" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
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
                                                Creating Account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
