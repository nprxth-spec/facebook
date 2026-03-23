"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { explainApiError } from "@/lib/explain-api-error";

export type ErrorExplanationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Raw message from API (`data.error` or `Error.message`) */
  rawMessage: string;
  isThai: boolean;
};

export function ErrorExplanationDialog({
  open,
  onOpenChange,
  rawMessage,
  isThai,
}: ErrorExplanationDialogProps) {
  const expl = explainApiError(rawMessage);
  const title = isThai ? expl.titleTh : expl.titleEn;
  const cause = isThai ? expl.causeTh : expl.causeEn;
  const steps = isThai ? expl.stepsTh : expl.stepsEn;
  const rawLabel = isThai ? "รายละเอียดจากระบบ" : "Technical details";
  const whatToDo = isThai ? "ควรทำอย่างไร" : "What to try";
  const closeLabel = isThai ? "ปิด" : "Close";
  const reconnectLabel = isThai ? "เชื่อมต่อ Google ใหม่" : "Reconnect Google";
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnectGoogle = async () => {
    setReconnecting(true);
    try {
      // Clear stored refresh token so next OAuth flow will mint a fresh one.
      await fetch("/api/google-connections", { method: "DELETE" });
      await signIn("google", { callbackUrl: "/settings?tab=connections" });
    } catch {
      // If reconnect fails, keep the dialog open so user can read details.
      setReconnecting(false);
      throw new Error("Failed to reconnect Google");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">{cause}</p>
          {steps.length > 0 && (
            <div>
              <p className="font-medium text-foreground mb-2">{whatToDo}</p>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground leading-relaxed">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {rawMessage.trim().length > 0 && (
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{rawLabel}</p>
              <pre className="text-xs whitespace-pre-wrap break-words font-mono text-foreground/90">
                {rawMessage}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {expl.actionKind === "reconnect_google" ? (
            <Button
              type="button"
              variant="outline"
              disabled={reconnecting}
              onClick={() => handleReconnectGoogle().finally(() => setReconnecting(false))}
            >
              {reconnecting ? (isThai ? "กำลังเชื่อมต่อ..." : "Connecting...") : reconnectLabel}
            </Button>
          ) : null}
          <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
