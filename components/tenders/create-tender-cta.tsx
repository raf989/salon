"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { CreateTenderModal } from "@/components/tenders/create-tender-modal";

type Props = {
  onCreated?: (id: string) => void;
};

export function CreateTenderCta({ onCreated }: Props = {}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-6 md:p-7 flex flex-col md:flex-row gap-4 md:items-center md:justify-between bg-caspian-50/50 border-caspian-200">
      <div>
        <h3 className="font-display font-semibold text-xl md:text-2xl text-ink-900">
          {t("tenders.cta.title")}
        </h3>
        <p className="text-ink-500 mt-1 max-w-md leading-relaxed">
          {t("tenders.cta.subtitle")}
        </p>
      </div>
      <Button
        variant="primary"
        size="lg"
        className="self-start md:self-auto"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" strokeWidth={2} />
        {t("tenders.cta.button")}
      </Button>
      <CreateTenderModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </Card>
  );
}
