"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  File,
  GalleryVerticalEnd,
  Settings,
  CircleUser,
  ListEndIcon,
  InfoIcon
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/app/admin/adminComponents/nav-admin";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin",
    email: "",
    avatar: "",
  },
  teams: [
    {
      name: "Spriers",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "OSCorp",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Company",
      url: "#",
      icon: InfoIcon,
      items: [
        {
          title: "Company Record",
          url: "/admin/companyrecord",
        },
        {
          title: "Contact Record",
          url: "/admin/contactrecord",
        },
      ],
    },
    {
      title: "User",
      url: "#",
      icon: CircleUser,

      items: [
        {
          title: "Create User",
          url: "admin/userform",
        },
        {
          title: "User Record",
          url: "/admin/userrecord",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: File,
      items: [
        {
          title: "Create Certificate",
          url: "/admin/certificateform",
        },
        {
          title: "Certificate Record",
          url: "/admin/certificaterecord",
        },
        {
          title: "Create Service",
          url: "/admin/serviceform",
        },
        {
          title: "Service Record",
          url: "/admin/servicerecord",
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
          url: "/admin/addmodel",
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
        const isItemActive = item.items.some(
          (subItem) => isClient && activePath === `/admin${subItem.url}` // Prepend /admin dynamically
        );

        return {
          ...item,
          isActive: isItemActive,
          isOpen: activeDropdowns[item.title] ?? false,
          toggleDropdown: () => toggleDropdown(item.title),
          items: item.items.map((subItem) => ({
            ...subItem,
            isActive: isClient && activePath === `/admin/${subItem.url}`, // Prepend /admin dynamically
          })),
        };
      }),
    [isClient, activePath, activeDropdowns]
  );



  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
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
