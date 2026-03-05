"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const stripePromise = typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface InnerProps {
  isThai: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

function AddCardForm({ isThai, onSuccess, onClose }: InnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    try {
      // Create setup intent on server
      const res = await fetch("/api/billing/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Failed to create setup intent");
      }

      const result = await stripe.confirmCardSetup(data.clientSecret as string, {
        payment_method: {
          card,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Stripe error");
      }

      toast.success(isThai ? "เพิ่มบัตรเรียบร้อย" : "Card added successfully");
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isThai
            ? "เพิ่มบัตรไม่สำเร็จ"
            : "Failed to add card",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#111827",
                "::placeholder": { color: "#9CA3AF" },
              },
              invalid: {
                color: "#EF4444",
              },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {isThai ? "ยกเลิก" : "Cancel"}
        </Button>
        <Button onClick={handleSubmit} disabled={!stripe || submitting}>
          {submitting
            ? isThai
              ? "กำลังเพิ่มบัตร..."
              : "Adding card..."
            : isThai
              ? "บันทึกบัตร"
              : "Save card"}
        </Button>
      </DialogFooter>
    </>
  );
}

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isThai: boolean;
  onCardAdded: () => void;
}

export function AddCardDialog({ open, onOpenChange, isThai, onCardAdded }: AddCardDialogProps) {
  if (!stripePromise) {
    return null;
  }

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isThai ? "เพิ่มวิธีการชำระเงิน" : "Add payment method"}
          </DialogTitle>
          <DialogDescription>
            {isThai
              ? "ข้อมูลบัตรจะถูกส่งไปยัง Stripe โดยตรงและไม่ถูกเก็บในระบบของเรา"
              : "Card details are sent directly to Stripe and never stored on our servers."}
          </DialogDescription>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <AddCardForm isThai={isThai} onSuccess={onCardAdded} onClose={handleClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

