"use client";

import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildRightsMailto } from "@/content/legal";
import { signOutAction } from "@/features/auth/actions";
import { cancelCurrentSubscriptionAction } from "@/features/billing/actions/billing-actions";
import { cn } from "@/lib/utils";

export type ProfileSettingsCopy = {
  settings: string;
  logout: string;
  cancelSubscription: string;
  cancelSubscriptionConfirm: string;
  cancelSubscriptionWarning: string;
  cancelSubscriptionKeep: string;
  deleteAccount: string;
  deleteDialogTitle: string;
  deleteDialogBody: string;
  deleteDialogEmailCta: string;
  deleteDialogAck: string;
};

type Props = {
  copy: ProfileSettingsCopy;
  deleteContactEmail: string;
  isPremium: boolean;
};

export function ProfileSettingsPanel({ copy, deleteContactEmail, isPremium }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const bodyWithEmail = copy.deleteDialogBody.replace(
    "{{email}}",
    deleteContactEmail,
  );
  const deleteMailto = buildRightsMailto("delete");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full border-border/60 text-foreground"
        onClick={() => setSettingsOpen(true)}
      >
        {copy.settings}
      </Button>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{copy.settings}</DialogTitle>
          <div className="flex flex-col gap-3 pt-1">
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted/40"
              >
                {copy.logout}
              </Button>
            </form>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-2 text-sm font-normal text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (!isPremium) return;
                setSettingsOpen(false);
                setCancelOpen(true);
              }}
              disabled={!isPremium}
            >
              {copy.cancelSubscription}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-2 text-sm font-normal text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSettingsOpen(false);
                setDeleteOpen(true);
              }}
            >
              {copy.deleteAccount}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{copy.deleteDialogTitle}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-foreground/90">
            {bodyWithEmail}
          </DialogDescription>
          <div className="mt-2 flex flex-col gap-2">
            <a
              href={deleteMailto}
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              {copy.deleteDialogEmailCta}
            </a>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setDeleteOpen(false)}
            >
              {copy.deleteDialogAck}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{copy.cancelSubscriptionConfirm}</DialogTitle>
          <DialogDescription className="text-foreground/90">
            {copy.cancelSubscriptionWarning}
          </DialogDescription>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              {copy.cancelSubscriptionKeep}
            </Button>
            <form action={cancelCurrentSubscriptionAction}>
              <Button type="submit" className="w-full">
                {copy.cancelSubscription}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
