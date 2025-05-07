'use client';

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AppSidebar } from "@/components/app-sidebar";

const companiesSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  industries: z.string().min(1, { message: "Industries is required" }),
  industriesType: z.string().min(1, { message: "Industry type is required" }),
  gstNumber: z.string().min(1, { message: "GST number is required" }),
  website: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url({ message: "Invalid website URL" }).optional()
  ),
  flag: z.enum(["Red", "Yellow", "Green"], {
    required_error: "Please select a flag color",
  }),
});

export default function CompanyForm() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('id');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof companiesSchema>>({
    resolver: zodResolver(companiesSchema),
    defaultValues: {
      companyName: "",
      address: "",
      gstNumber: "",
      industries: "",
      website: "",
      industriesType: "",
      flag: undefined,
    },
  });

  useEffect(() => {
    if (companyId) {
      const fetchCompany = async () => {
        try {
          setIsSubmitting(true);
          const res = await axios.get(`/api/companies?id=${companyId}`);
          if (res.data) {
            form.reset({
              companyName: res.data.company_name,
              address: res.data.address,
              gstNumber: res.data.gst_number,
              industries: res.data.industries,
              website: res.data.website || "",
              industriesType: res.data.industries_type,
              flag: res.data.flag,
            });
          }
        } catch (err) {
          console.error(err);
          toast({
            title: "Error",
            description: "Failed to load company",
            variant: "destructive",
          });
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchCompany();
    }
  }, [companyId, form]);

  const onSubmit = async (values: z.infer<typeof companiesSchema>) => {
    setIsSubmitting(true);
  
    try {
      if (companyId) {
        // Update company
        const res = await axios.put(`/api/companies?id=${companyId}`, values);
        if (res.status === 200) {
          toast({ title: "Success", description: "Company updated successfully" });
        } else {
          throw new Error("Update failed");
        }
      } else {
        // Create new company
        const res = await axios.post("/api/companies", {
          ...values,
          id: crypto.randomUUID(), // Auto-generate ID for new company
        });
        if (res.status === 201) {
          toast({ title: "Success", description: "Company created successfully" });
          form.reset();
        } else {
          throw new Error("Create failed");
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
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
        <header className="flex h-16 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/user/dashboard">
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/user/companyrecord">Company Record</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="container mx-auto py-10 px-4">
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl text-center font-bold">
                {companyId ? "Update Company" : "Create Company"}
              </CardTitle>
              <CardDescription className="text-center">
                {companyId
                  ? "Edit existing company details"
                  : "Fill out the form to add a new company"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {["companyName", "address", "industries", "industriesType", "gstNumber", "website"].map((name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof z.infer<typeof companiesSchema>}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{name.replace(/([A-Z])/g, " $1")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Enter ${name}`}
                                {...field}
                                className="bg-white"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="flag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flag</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-white border px-3 py-2 rounded-md w-full"
                              disabled={isSubmitting}
                            >
                              <option value="">Select flag</option>
                              <option value="Red">Red</option>
                              <option value="Yellow">Yellow</option>
                              <option value="Green">Green</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        {companyId ? "Updating..." : "Creating..."}
                      </>
                    ) : companyId ? "Update Company" : "Create Company"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
