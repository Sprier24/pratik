"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Company {
  _id: string;
  companyName: string;
}

const contactSchema = z.object({
  firstName: z.string().nonempty({ message: "Required" }),
  middleName: z.string().nonempty({ message: "Required" }),
  lastName: z.string().nonempty({ message: "Required" }),
  contactNo: z.string()
    .regex(/^\d*$/, { message: "Contact number must be numeric" })
    .nonempty({ message: "Required" }),
  email: z.string().email({ message: "Required" }),
  designation: z.string().nonempty({ message: "Required" }),
  company: z.string().nonempty({ message: "Please select a company" }),
});

export default function Customer() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("id");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      contactNo: "",
      email: "",
      designation: "",
      company: "",
    },
  });

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const response = await axios.get(
        `http://localhost:5000/api/v1/company/getAllcompanies`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCompanies(response.data.data || response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (contactId) {
      const fetchContact = async () => {
        try {
          setIsSubmitting(true);
          const response = await axios.get(`http://localhost:5000/api/v1/contactperson/getContactPersonByid/${contactId}`);

          const contactData = response.data.data || response.data;

          if (contactData) {
            form.reset({
              firstName: contactData.firstName || "",
              middleName: contactData.middleName || "",
              lastName: contactData.lastName || "",
              contactNo: contactData.contactNo || contactData.phone || "",
              email: contactData.email || "",
              designation: contactData.designation || contactData.position || "",
              company: contactData.companyName || contactData.company?.companyName || "",
            });

            if (contactData.company) {
              setCompanySearchTerm(contactData.company.companyName || "");
              setSelectedCompanyName(contactData.company.companyName || "");
            }
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to fetch contact details.",
            variant: "destructive",
          });
          console.error("Fetch error:", error);
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchContact();
    }
  }, [contactId, form]);

  const filteredCompanies = companies.filter(company =>
    (company?.companyName || '').toLowerCase().includes((companySearchTerm || '').toLowerCase())
  );

  const onSubmit = async (values: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        company: selectedCompanyName || ""  // Pass the company name here instead of the ID
      };

      if (contactId) {
        await axios.put(`http://localhost:5000/api/v1/contactperson/updateContactPerson/${contactId}`, payload);
        toast({
          title: "Contact Updated",
          description: "The contact has been successfully updated",
        });
      } else {
        await axios.post("http://localhost:5000/api/v1/contactperson/generateContactPerson", payload);
        toast({
          title: "Contact Submitted",
          description: "The contact has been successfully created",
        });
        form.reset();
        setCompanySearchTerm("");
        setSelectedCompanyName(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to submit contact details",
        variant: "destructive",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
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
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/contactrecord">
                    Contact Record
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
                {contactId ? "Update Contact" : "Create Contact"}
              </CardTitle>
              <CardDescription className="text-center">
                {contactId ? "Modify the contact details below" : "Fill out the form below to create a new contact"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Customer Name"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Company Name"
                                value={companySearchTerm}
                                onChange={(e) => {
                                  setCompanySearchTerm(e.target.value);
                                  setShowCompanyDropdown(true);
                                }}
                                onFocus={() => setShowCompanyDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
                                disabled={isSubmitting}
                              />

                              {showCompanyDropdown && (
                                <ul className="absolute z-20 mt-1 w-full rounded-md border bg-background text-sm shadow-lg max-h-60 overflow-y-auto">
                                  {isLoadingCompanies ? (
                                    <li className="px-4 py-2 text-muted-foreground">Loading companies...</li>
                                  ) : filteredCompanies.length > 0 ? (
                                    filteredCompanies.map((company) => (
                                      <li
                                        key={company._id}
                                        className={`px-4 py-2 cursor-pointer hover:bg-muted transition-colors ${field.value === company._id ? "bg-muted font-medium" : ""
                                          }`}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                          field.onChange(company.companyName);
                                          setCompanySearchTerm(company.companyName);
                                          setShowCompanyDropdown(false);
                                        }}
                                      >
                                        {company.companyName}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="px-4 py-2 text-muted-foreground">
                                      {companySearchTerm
                                        ? "This name is not in the company records"
                                        : "Start typing to search companies"}
                                    </li>
                                  )}
                                </ul>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contactNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Contact Number"
                              {...field}
                              disabled={isSubmitting}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                field.onChange(numericValue);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Email Address"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Designation"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CardFooter className="px-0">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin mr-2" />
                          {contactId ? "Updating..." : "Creating..."}
                        </>
                      ) : contactId ? "Update" : "Create"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}