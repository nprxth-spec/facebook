"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLAN_OPTIONS: { id: "free" | "pro" | "business"; label: string }[] = [
  { id: "free", label: "ฟรี" },
  { id: "pro", label: "Pro" },
  { id: "business", label: "Business" },
];

export function UserPlanActionsCell({
  userId,
  userName,
  currentPlanId,
  currentPlanLabel,
}: {
  userId: string;
  userName: string;
  currentPlanId: string;
  currentPlanLabel: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planId, setPlanId] = useState<"free" | "pro" | "business">(
    (["free", "pro", "business"].includes(currentPlanId)
      ? currentPlanId
      : "free") as "free" | "pro" | "business",
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChangePlan = () => {
    setError(null);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.append("planId", planId);
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: {
          "x-admin-ajax": "1",
        },
        body: formData,
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      if (res.ok && payload?.ok) {
        setDialogOpen(false);
        router.refresh();
      } else {
        const message =
          payload?.error ??
          "ไม่สามารถเปลี่ยนแพ็กเกจได้ กรุณาตรวจสอบข้อมูลการชำระเงินของผู้ใช้หรือค่าการตั้งค่า Stripe";
        setError(message);
        console.error("Failed to change plan", payload ?? {});
      }
    });
  };

  return (
    <div className="inline-flex items-center justify-end">
      <button
        type="button"
        onClick={handleChangePlan}
        className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
      >
        แก้ไขแพ็กเกจ
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              แก้ไขแพ็กเกจผู้ใช้
            </DialogTitle>
            <DialogDescription className="text-sm">
              ผู้ใช้: {userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">
              แพ็กเกจปัจจุบัน:{" "}
              <span className="font-medium text-slate-800">
                {currentPlanLabel || "ฟรี"}
              </span>
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-500">
                เลือกแพ็กเกจใหม่:
              </span>
              <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-50 p-1">
                {PLAN_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`cursor-pointer rounded-full px-3 py-0.5 text-xs ${
                      planId === p.id
                        ? "bg-slate-900 text-slate-50"
                        : "bg-transparent text-slate-700 hover:bg-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              ระบบจะยกเลิก subscription เดิม (ถ้ามี) และสร้าง subscription
              ใหม่ตามแพ็กเกจที่เลือก โดยใช้บัตรหลักใน Stripe ของผู้ใช้นี้
            </p>
            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "กำลังอัปเดต..." : "ยืนยันการเปลี่ยนแพ็กเกจ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

