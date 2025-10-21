"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Badge } from "./ui/badge";
import { useTranslations } from "@/components/translations-context"

export function MobileNav() {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex gap-2 w-full items-center overflow-auto">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="outline" aria-label="Open navigation">
            <MenuIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] rounded-lg flex flex-col flex-1 justify-start items-start overflow-y-auto p-6">
          <DialogHeader className="w-full">
            <DialogTitle className="w-full text-left text-2xl font-bold">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-2xl"
              >
                  {siteConfig.name}
                <Badge variant="outline" className="text-normal">
                  {t('header.beta')}
                </Badge>
              </Link>
            </DialogTitle>
          </DialogHeader>
          <h1 className="mt-6 text-xl font-bold">{t('header.title')}</h1>
          <p className="mt-2 text-muted-foreground text-start text-lg">
            {t('header.about')}
          </p>
          <div className="mt-6 w-full space-y-2">
            <Link
              href="/text-to-speech"
              onClick={() => setOpen(false)}
              className="block w-full p-3 text-left rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">文字转语音</div>
              <div className="text-sm text-muted-foreground">将文本转换为高质量语音</div>
            </Link>
            <Link
              href="/meeting-minutes"
              onClick={() => setOpen(false)}
              className="block w-full p-3 text-left rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">会议纪要</div>
              <div className="text-sm text-muted-foreground">自动生成会议记录和摘要</div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}