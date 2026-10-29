import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Star } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  fullName: string;
  email: string;
  feedbackType: string;
  rating: number;
  message: string;
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  feedbackType: "",
  rating: 0,
  message: "",
};

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    form.fullName.trim() &&
    form.email.trim() &&
    form.feedbackType &&
    form.rating > 0 &&
    form.message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    // Simulate network request
    await new Promise((res) => setTimeout(res, 1400));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setForm(initialForm);
        setSubmitted(false);
        setHoverRating(null);
      }, 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/80">
        {submitted ? (
          /* ── Success State ── */
          <div className="flex flex-col items-center justify-center text-center py-16 px-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="font-['DM_Sans'] font-bold text-[26px] text-foreground mb-3">
              Feedback Submitted!
            </h2>
            <p className="font-['DM_Sans'] font-normal text-[15px] leading-[1.6] text-muted-foreground max-w-[380px]">
              Thank you for sharing your experience. Your feedback helps us continuously improve the Gavel AI platform for everyone.
            </p>
            <button
              onClick={() => handleClose(false)}
              className="mt-8 bg-transparent border border-border text-muted-foreground font-['DM_Sans'] font-normal text-[14px] px-[20px] py-[10px] rounded-[6px] hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-border">
              <DialogHeader>
                <DialogTitle className="font-['DM_Sans'] font-bold text-[22px] text-foreground text-left">
                  Customer Feedback
                </DialogTitle>
                <DialogDescription className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground text-left mt-1">
                  We'd love to hear your thoughts. Let us know how we can make Gavel AI even better for you.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">
              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="feedbackFullName" className="font-['DM_Sans'] font-medium text-[13px] text-foreground">
                    Full Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="feedbackFullName"
                    placeholder="E.g. Priya Nair"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="font-['DM_Sans'] text-[14px] h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="feedbackEmail" className="font-['DM_Sans'] font-medium text-[13px] text-foreground">
                    Email Address <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="feedbackEmail"
                    type="email"
                    placeholder="priya@company.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="font-['DM_Sans'] text-[14px] h-10"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Feedback Type + Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-['DM_Sans'] font-medium text-[13px] text-foreground">
                    Feedback Type <span className="text-primary">*</span>
                  </Label>
                  <Select value={form.feedbackType} onValueChange={(v) => handleChange("feedbackType", v)}>
                    <SelectTrigger className="font-['DM_Sans'] text-[14px] h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug" className="font-['DM_Sans'] text-[13px]">Bug Report</SelectItem>
                      <SelectItem value="feature" className="font-['DM_Sans'] text-[13px]">Feature Request</SelectItem>
                      <SelectItem value="general" className="font-['DM_Sans'] text-[13px]">General Feedback</SelectItem>
                      <SelectItem value="partnership" className="font-['DM_Sans'] text-[13px]">Partnership Inquiry</SelectItem>
                      <SelectItem value="other" className="font-['DM_Sans'] text-[13px]">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-start">
                  <Label className="font-['DM_Sans'] font-medium text-[13px] text-foreground">
                    Overall Experience <span className="text-primary">*</span>
                  </Label>
                  <div className="flex items-center gap-1.5 h-10">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isHighlighted = (hoverRating ?? form.rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleChange("rating", star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="focus:outline-none p-0.5 rounded transition-transform duration-100 hover:scale-110"
                        >
                          <Star
                            size={20}
                            className={`transition-colors duration-150 ${
                              isHighlighted
                                ? "fill-[#F97316] text-[#F97316]"
                                : "text-muted-foreground/40 hover:text-muted-foreground/60"
                            }`}
                          />
                        </button>
                      );
                    })}
                    {form.rating > 0 && (
                      <span className="font-['DM_Sans'] text-[12px] text-muted-foreground ml-1.5 font-medium">
                        {form.rating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="feedbackMessage" className="font-['DM_Sans'] font-medium text-[13px] text-foreground">
                  Feedback Details <span className="text-primary">*</span>
                </Label>
                <Textarea
                  id="feedbackMessage"
                  placeholder="Tell us what you liked, what can be improved, or detail a feature request..."
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="font-['DM_Sans'] text-[14px] min-h-[110px] resize-none"
                  required
                />
              </div>

              {/* Privacy statement */}
              <p className="font-['DM_Sans'] font-normal text-[11px] text-muted-foreground leading-normal">
                Your feedback is highly valued. We store this information securely in compliance with our Privacy Policy.
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="font-['DM_Sans'] font-normal text-[14px] text-muted-foreground border border-border px-[20px] py-[10px] rounded-[6px] hover:bg-foreground/5 hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="bg-[#F97316] text-foreground font-['DM_Sans'] font-semibold text-[14px] px-[24px] py-[10px] rounded-[6px] hover:brightness-[1.08] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
