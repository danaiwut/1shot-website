"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import {
  Activity, ArrowLeftRight, Bell, ChevronDown, BadgePercent, KeyRound, BookOpen, ChevronsUpDown, History, Home, LayoutDashboard, LayoutGrid, LifeBuoy, LogOut,
  Megaphone, Newspaper, Receipt, Settings2, ShieldHalf, ShoppingBag, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme";
import { cx, Logo } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

/*
 * Two areas share this frame:
 *   member — what a customer sees (/dashboard, /signals, /store …)
 *   admin  — the back office (/admin …), staff only
 * Staff can switch between them; customers never see admin navigation.
 */
export type Area = "member" | "admin";
type Page = { href: string; label: string };
/** `also`: other pages that belong under this menu item (highlight it, and name them in the breadcrumb). */
type Item = Page & { icon: LucideIcon; also?: Page[] };
type Folder = { label: string; icon: LucideIcon; children: Item[] };
type Entry = Item | Folder;
const isFolder = (e: Entry): e is Folder => "children" in e;

const MEMBER: Entry[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/signals", label: "สัญญาณ", icon: Activity },
  { href: "/store", label: "ร้านค้า", icon: ShoppingBag, also: [{ href: "/checkout", label: "ชำระเงิน" }, { href: "/billing", label: "ผลการชำระเงิน" }] },
  { label: "ข่าวสาร", icon: Newspaper, children: [
    { href: "/news", label: "ข่าวและสรุปตลาด", icon: Newspaper },
    { href: "/announcements", label: "ประกาศ", icon: Megaphone },
  ] },
  { label: "ช่วยเหลือ", icon: LifeBuoy, children: [
    { href: "/guide", label: "คู่มือการใช้งาน", icon: BookOpen },
    { href: "/support", label: "คำขอและความช่วยเหลือ", icon: LifeBuoy },
    { href: "/activity", label: "ประวัติของฉัน", icon: History },
  ] },
  { href: "/account", label: "บัญชีของฉัน", icon: Settings2 },
];
// Admin is deliberately flat: five everyday jobs plus "อื่นๆ" for the rest (big tiles on /admin/more).
const ADMIN: Entry[] = [
  { href: "/admin", label: "หน้าแรก", icon: Home },
  { href: "/admin/rights", label: "ให้สิทธิ์ลูกค้า", icon: KeyRound },
  { href: "/admin/members", label: "ลูกค้า", icon: Users },
  { href: "/admin/products", label: "ราคาและโปร", icon: BadgePercent, also: [{ href: "/admin/promotions", label: "ป้ายโปรหน้าแรก" }] },
  { href: "/admin/orders", label: "ยอดขาย", icon: Receipt },
  { href: "/admin/more", label: "อื่นๆ", icon: LayoutGrid, also: [
    { href: "/admin/indicators", label: "อินดิเคเตอร์" },
    { href: "/admin/support", label: "คำขอจากลูกค้า" },
    { href: "/admin/content", label: "เนื้อหา" },
    { href: "/admin/lots", label: "Lot Exness" },
    { href: "/admin/team", label: "ทีมงาน" },
    { href: "/admin/logs", label: "บันทึกระบบ" },
  ] },
];
const AREA = {
  member: { entries: MEMBER, title: "สมาชิก", home: "/dashboard", bell: "/announcements", bellLabel: "ประกาศ" },
  admin: { entries: ADMIN, title: "หลังบ้าน", home: "/admin", bell: "/admin#todo-title", bellLabel: "งานวันนี้" },
} as const;
const allItems = (entries: readonly Entry[]) => entries.flatMap((e) => (isFolder(e) ? e.children : [e]));

const matches = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
const subPage = (path: string, item: Item) => item.also?.find((p) => matches(path, p.href));
const inItem = (path: string, item: Item) => matches(path, item.href) || Boolean(subPage(path, item));

export type Viewer = { name: string; email: string; role: string; staff: boolean };

const itemClass =
  "relative h-11 gap-3 rounded-md px-3 text-sm text-muted group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-3.5! hover:text-fg data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-fg";

export function AppSidebar({ area, viewer }: { area: Area; viewer: Viewer }) {
  const path = usePathname();
  const { setOpenMobile, state } = useSidebar();
  const cfg = AREA[area];
  const close = () => setOpenMobile(false);
  return (
    <Sidebar variant="floating" collapsible="icon" aria-label={area === "admin" ? "เมนูผู้ดูแลระบบ" : "เมนูหลัก"}>
      <SidebarHeader className="flex-row items-center gap-1 px-2 pt-3 pb-2 group-data-[collapsible=icon]:flex-col">
        <Link href={area === "admin" ? "/admin" : "/"} aria-label={area === "admin" ? "ภาพรวมระบบ" : "หน้าแรก"} className="mr-auto flex h-11 min-w-0 items-center gap-2 rounded-md px-1.5 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:px-0">
          <span className="group-data-[collapsible=icon]:hidden"><Logo tone="auto" className="h-7" /></span>
          {area === "admin" && <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-muted group-data-[collapsible=icon]:hidden">หลังบ้าน</span>}
          <span aria-hidden className="hidden size-8 place-items-center rounded-md bg-brand text-sm font-black text-white group-data-[collapsible=icon]:grid">1</span>
        </Link>
        <Link href={cfg.bell} onClick={close} aria-label={cfg.bellLabel} title={cfg.bellLabel} className="grid size-11 place-items-center rounded-md text-muted hover:bg-sidebar-accent hover:text-fg group-data-[collapsible=icon]:hidden">
          <Bell aria-hidden className="size-[18px]" />
        </Link>
        <SidebarTrigger className="size-11 rounded-md text-muted hover:text-fg" aria-label="ย่อ/ขยายเมนู" />
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {cfg.entries.map((e) => (isFolder(e)
              ? <FolderItem key={e.label} folder={e} path={path} collapsed={state === "collapsed"} onNavigate={close} />
              : <LinkItem key={e.href} item={e} on={inItem(path, e)} onNavigate={close} />))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <UserMenu area={area} viewer={viewer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function LinkItem({ item: i, on, onNavigate }: { item: Item; on: boolean; onNavigate: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={on} tooltip={i.label} className={itemClass}>
        <Link href={i.href} aria-current={on ? "page" : undefined} onClick={onNavigate}>
          <i.icon aria-hidden strokeWidth={on ? 2.2 : 1.8} />
          <span>{i.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Collapsible group with sub-items; opens by itself when one of its pages is active. */
function FolderItem({ folder: f, path, collapsed, onNavigate }: { folder: Folder; path: string; collapsed: boolean; onNavigate: () => void }) {
  const activeChild = f.children.some((c) => matches(path, c.href));
  const [open, setOpen] = useState(activeChild);
  useEffect(() => { if (activeChild) setOpen(true); }, [activeChild]);
  const id = useId();

  // Icon-only sidebar: the group icon goes straight to its first page.
  if (collapsed) {
    const first = f.children.find((c) => matches(path, c.href)) ?? f.children[0];
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={activeChild} tooltip={f.label} className={itemClass}>
          <Link href={first.href} onClick={onNavigate}><f.icon aria-hidden /><span>{f.label}</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={cx(itemClass, activeChild && !open && "font-semibold text-fg")}>
        <f.icon aria-hidden strokeWidth={activeChild ? 2.2 : 1.8} />
        <span>{f.label}</span>
        <ChevronDown aria-hidden className={cx("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub id={id} className="mr-0 ml-5 gap-0.5 border-l border-line py-0.5 pr-0 pl-2.5">
          {f.children.map((c) => {
            const on = matches(path, c.href);
            return (
              <SidebarMenuSubItem key={c.href}>
                <SidebarMenuSubButton asChild isActive={on} className="h-10 rounded-md px-2.5 text-sm text-muted hover:text-fg data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-fg">
                  <Link href={c.href} aria-current={on ? "page" : undefined} onClick={onNavigate}>{c.label}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function UserMenu({ area, viewer }: { area: Area; viewer: Viewer }) {
  const { isMobile } = useSidebar();
  const [leaving, startLeaving] = useTransition();
  const initial = viewer.name.slice(0, 1).toUpperCase();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-12 gap-3 rounded-md data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-1!" aria-label={`เมนูบัญชี ${viewer.name}`}>
              <Avatar className="size-8 rounded-md"><AvatarFallback className="rounded-md bg-panel-3 text-sm font-semibold text-fg">{initial}</AvatarFallback></Avatar>
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
            <DropdownMenuItem
              className="min-h-11 text-sell focus:text-sell"
              disabled={leaving}
              onSelect={(e) => { e.preventDefault(); startLeaving(() => signOut()); }}
            >
              <LogOut aria-hidden />{leaving ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
            </DropdownMenuItem>
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
  const here = allItems(cfg.entries).find((i) => inItem(path, i));
  const sub = here && subPage(path, here);
  const deeper = here && path !== (sub ?? here).href;
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-panel-2/90 px-3 backdrop-blur-xl sm:px-5">
      <SidebarTrigger className="size-11 rounded-xl md:hidden" aria-label="เปิดเมนู" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5 md:hidden" />
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
                {deeper || sub
                  ? <BreadcrumbLink asChild className="truncate text-muted"><Link href={here.href}>{here.label}</Link></BreadcrumbLink>
                  : <BreadcrumbPage className="truncate font-semibold">{here.label}</BreadcrumbPage>}
              </BreadcrumbItem>
            </>
          )}
          {sub && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                {deeper
                  ? <BreadcrumbLink asChild className="truncate text-muted"><Link href={sub.href}>{sub.label}</Link></BreadcrumbLink>
                  : <BreadcrumbPage className="truncate font-semibold">{sub.label}</BreadcrumbPage>}
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
      <ThemeToggle className="border-transparent" />
    </header>
  );
}
