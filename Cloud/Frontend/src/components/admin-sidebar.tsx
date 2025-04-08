"use client";
import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/app/admin/adminComponents/nav-admin";
import { File, Settings, CircleUser, InfoIcon, LayoutDashboard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        }
      ],
    },
    {
      title: "Company",
      url: "#",
      icon: InfoIcon,
      items: [
        {
          title: "Company Details",
          url: "admin/adminCompany",
        },
        {
          title: "Contact Person",
          url: "admin/admincustomer",
        },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: CircleUser,

      items: [
        {
          title: "Create User",
          url: "admin/adminregister",
        },
        {
          title: "User Details",
          url: "admin/u",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: File,
      items: [
        {
          title: "Admin Certificate",
          url: "admin/addcategory",
        },
        {
          title: "Admin Certificate Table",
          url: "admin/admincertificatetable",
        },
        {
          title: "Admin Service",
          url: "admin/adminservice",
        },
        {
          title: "Admin Service Table",
          url: "admin/adminservicetable",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Add Model",
          url: "admin/addmodel",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isClient, setIsClient] = React.useState(false);
  const [activePath, setActivePath] = React.useState("");
  const [activeDropdowns, setActiveDropdowns] = React.useState<{ [key: string]: boolean }>({});
  React.useEffect(() => {
    setIsClient(true);
    setActivePath(window.location.pathname);
    const savedDropdowns = JSON.parse(localStorage.getItem('activeDropdowns') || '{}');
    setActiveDropdowns(savedDropdowns);
  }, []);

  const toggleDropdown = (dropdownTitle: string) => {
    setActiveDropdowns((prev) => {
      const updated = { ...prev, [dropdownTitle]: !prev[dropdownTitle] };

      localStorage.setItem('activeDropdowns', JSON.stringify(updated));
      return updated;
    });
  };

  const updatedNavMain = React.useMemo(
    () =>
      data.navMain.map((item) => {
        const isItemActive = item.items?.some(
          (subItem) => isClient && activePath === `/admin${subItem.url}`
        );
        return {
          ...item,
          isActive: isItemActive,
          isOpen: activeDropdowns[item.title] ?? false,
          toggleDropdown: () => toggleDropdown(item.title),
          items: item.items
            ? item.items.map((subItem) => ({
              ...subItem,
              isActive: isClient && activePath === `/admin${subItem.url}`,
            }))
            : [],
        };
      }),
    [isClient, activePath, activeDropdowns]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
