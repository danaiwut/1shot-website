"use client";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Opens the sent email's HTML in a sandboxed iframe inside a dialog. */
export function EmailPreview({ subject, to, html }: { subject: string; to: string; html: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 rounded-full px-4 font-semibold" aria-label={`ดูตัวอย่างอีเมล: ${subject}`}>
          <Eye aria-hidden />ดูตัวอย่าง
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] rounded-2xl border-line bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="leading-snug">{subject}</DialogTitle>
          <DialogDescription>ถึง {to}</DialogDescription>
        </DialogHeader>
        <iframe title={`ตัวอย่างอีเมล: ${subject}`} srcDoc={html} sandbox="" className="h-[65dvh] w-full rounded-xl border border-line bg-white" />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-full px-6">ปิด</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
