"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowLeftRight, BookOpen, ChevronsUpDown, ClipboardList, CreditCard, FileText, Gauge, History, LayoutDashboard, LifeBuoy, LogOut, Mail,
  Megaphone, Newspaper, Package, Receipt, ScrollText, Settings2, ShieldHalf, ShoppingBag, SlidersHorizontal, UserCog, Users, Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { Logo } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

/*
 * Two areas share this frame:
 *   member — what a customer sees (/dashboard, /signals, /store …)
 *   admin  — the back office (/admin …), staff only
 * Staff can switch between them; customers never see admin navigation.
 */
export type Area = "member" | "admin";
type Item = { href: string; label: string; icon: LucideIcon };
type Group = { label: string; items: Item[] };

const MEMBER: Group[] = [
  { label: "ภาพรวม", items: [
    { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/signals", label: "สัญญาณ", icon: Activity },
  ] },
  { label: "ซื้อและบัญชี", items: [
    { href: "/store", label: "ร้านค้า", icon: ShoppingBag },
    { href: "/billing", label: "การชำระเงิน", icon: CreditCard },
    { href: "/account", label: "บัญชีของฉัน", icon: Settings2 },
  ] },
  { label: "ข่าวสารและช่วยเหลือ", items: [
    { href: "/news", label: "ข่าวและสรุปตลาด", icon: Newspaper },
    { href: "/announcements", label: "ประกาศ", icon: Megaphone },
    { href: "/guide", label: "คู่มือการใช้งาน", icon: BookOpen },
    { href: "/support", label: "คำขอและความช่วยเหลือ", icon: LifeBuoy },
    { href: "/activity", label: "ประวัติของฉัน", icon: History },
  ] },
];
const ADMIN: Group[] = [
  { label: "ภาพรวม", items: [
    { href: "/admin", label: "ภาพรวมระบบ", icon: Gauge },
    { href: "/admin/work", label: "ศูนย์งาน", icon: ClipboardList },
  ] },
  { label: "ลูกค้าและการขาย", items: [
    { href: "/admin/members", label: "ข้อมูลลูกค้า", icon: Users },
    { href: "/admin/support", label: "คำขอจากสมาชิก", icon: LifeBuoy },
    { href: "/admin/orders", label: "คำสั่งซื้อ", icon: Receipt },
    { href: "/admin/products", label: "สินค้าและราคา", icon: Package },
  ] },
  { label: "เนื้อหา", items: [
    { href: "/admin/indicators", label: "อินดิเคเตอร์และห้อง", icon: SlidersHorizontal },
    { href: "/admin/content", label: "ข่าวและสรุปเช้า", icon: FileText },
    { href: "/admin/announcements", label: "ประกาศ", icon: Megaphone },
  ] },
  { label: "ระบบ", items: [
    { href: "/admin/access-history", label: "ประวัติการจัดการสิทธิ์", icon: ScrollText },
    { href: "/admin/team", label: "ทีมงาน", icon: UserCog },
    { href: "/admin/emails", label: "อีเมลที่ส่ง", icon: Mail },
    { href: "/admin/webhooks", label: "บันทึก Webhook", icon: Webhook },
  ] },
];
const AREA = {
  member: { groups: MEMBER, title: "สมาชิก", home: "/dashboard", tag: "1SHOT MEMBER" },
  admin: { groups: ADMIN, title: "ผู้ดูแลระบบ", home: "/admin", tag: "1SHOT BUSINESS" },
} as const;

const matches = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));

export type Viewer = { name: string; email: string; role: string; staff: boolean };

export function AppSidebar({ area, viewer }: { area: Area; viewer: Viewer }) {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();
  const cfg = AREA[area];
  return (
    <Sidebar collapsible="icon" aria-label={area === "admin" ? "เมนูผู้ดูแลระบบ" : "เมนูหลัก"}>
      <SidebarHeader className="gap-3 border-b border-sidebar-border p-3">
        <Link href={area === "admin" ? "/admin" : "/"} aria-label={area === "admin" ? "ภาพรวมระบบ" : "หน้าแรก"} className="flex h-11 items-center gap-2 rounded-lg px-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="group-data-[collapsible=icon]:hidden"><Logo tone="auto" /></span>
          <span aria-hidden className="hidden size-9 place-items-center rounded-lg bg-brand text-sm font-black text-white group-data-[collapsible=icon]:grid">1</span>
        </Link>
        <div className="rounded-xl border border-sidebar-border bg-panel-2 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.13em] text-accent uppercase">
            {area === "admin" && <ShieldHalf aria-hidden className="size-3.5" />}{cfg.tag}
          </p>
          <p className="mt-0.5 text-xs text-muted">{area === "admin" ? "จัดการสินค้า ลูกค้า และบริการ" : "บัญชีและสิทธิ์ใช้งานของคุณ"}</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {cfg.groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-xs text-muted">{g.label}</SidebarGroupLabel>
            <SidebarMenu>
              {g.items.map((i) => {
                const on = matches(path, i.href);
                return (
                  <SidebarMenuItem key={i.href}>
                    <SidebarMenuButton
                      asChild isActive={on} tooltip={i.label}
                      className="h-11 gap-3 rounded-lg px-3 text-[15px] text-muted group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-3.5! data-[active=true]:bg-brand data-[active=true]:font-semibold data-[active=true]:text-white"
                    >
                      <Link href={i.href} aria-current={on ? "page" : undefined} onClick={() => setOpenMobile(false)}>
                        <i.icon aria-hidden strokeWidth={on ? 2.2 : 1.8} />
                        <span>{i.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <UserMenu area={area} viewer={viewer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function UserMenu({ area, viewer }: { area: Area; viewer: Viewer }) {
  const { isMobile } = useSidebar();
  const initial = viewer.name.slice(0, 1).toUpperCase();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-14 gap-3 rounded-xl data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-1!" aria-label={`เมนูบัญชี ${viewer.name}`}>
              <Avatar className="size-9 rounded-lg"><AvatarFallback className="rounded-lg bg-brand font-semibold text-white">{initial}</AvatarFallback></Avatar>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">{viewer.name}</span>
                <span className="truncate text-xs text-muted">{viewer.staff ? viewer.role : viewer.email}</span>
              </span>
              <ChevronsUpDown aria-hidden className="ml-auto size-4 text-muted" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" sideOffset={8} className="min-w-60 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold">{viewer.name}</p>
              <p className="truncate text-xs text-muted">{viewer.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="min-h-11"><Link href="/account"><Settings2 aria-hidden />บัญชีของฉัน</Link></DropdownMenuItem>
              {viewer.staff && (
                <DropdownMenuItem asChild className="min-h-11">
                  <Link href={area === "admin" ? "/dashboard" : "/admin"}>
                    {area === "admin" ? <ArrowLeftRight aria-hidden /> : <ShieldHalf aria-hidden />}
                    {area === "admin" ? "ดูมุมมองลูกค้า" : "ไปหน้าผู้ดูแลระบบ"}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action="/auth/signout" method="post">
              <DropdownMenuItem asChild className="min-h-11 w-full text-sell focus:text-sell">
                <button type="submit"><LogOut aria-hidden />ออกจากระบบ</button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Sticky header: sidebar toggle, breadcrumb (area › page › detail), theme switch and the main action. */
export function AppHeader({ area, staff }: { area: Area; staff: boolean }) {
  const path = usePathname();
  const cfg = AREA[area];
  const here = cfg.groups.flatMap((g) => g.items).find((i) => matches(path, i.href));
  const deeper = here && path !== here.href;
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-panel/90 px-3 backdrop-blur-xl sm:px-5">
      <SidebarTrigger className="size-11 rounded-xl" aria-label="เปิด/ปิดเมนู" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap text-sm">
          <BreadcrumbItem className="hidden sm:inline-flex">
            <BreadcrumbLink asChild className={area === "admin" ? "font-medium text-accent" : "text-muted"}>
              <Link href={cfg.home}>{cfg.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {here && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="min-w-0">
                {deeper
                  ? <BreadcrumbLink asChild className="truncate text-muted"><Link href={here.href}>{here.label}</Link></BreadcrumbLink>
                  : <BreadcrumbPage className="truncate font-semibold">{here.label}</BreadcrumbPage>}
              </BreadcrumbItem>
            </>
          )}
          {deeper && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage className="font-semibold">รายละเอียด</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-2">
        <ThemeToggle className="rounded-xl" />
        {area === "member" ? (
          <Button asChild className="hidden sm:inline-flex"><Link href="/store"><ShoppingBag aria-hidden />ซื้อ / ต่ออายุ</Link></Button>
        ) : staff ? (
          <Button asChild variant="outline" className="hidden sm:inline-flex"><Link href="/dashboard"><ArrowLeftRight aria-hidden />มุมมองลูกค้า</Link></Button>
        ) : null}
      </div>
    </header>
  );
}
