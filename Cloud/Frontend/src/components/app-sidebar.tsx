"use client"
import * as React from "react"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import { NavMain } from "@/components/nav-main"
import { CirclePlay, File } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar"

const data = {}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const navMain = React.useMemo(
    () => [
      {
        title: "Dashboard",
        url: "#",
        icon: CirclePlay,
        items: [
          {
            title: "Dashboard",
            url: "/user/dashboard",
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
            url: "/user/certificateform",
          },
          {
            title: "Certificate Record",
            url: "/user/certificaterecord",
          },
          {
            title: "Create Service",
            url: "/user/serviceform",
          },
          {
            title: "Service Record",
            url: "/user/servicerecord",
          },
        ],
      },
    ],
    [pathname],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
