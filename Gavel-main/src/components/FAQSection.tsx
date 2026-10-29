import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long does it take to integrate Gavel APIs?",
    answer: "Most engineering teams are up and running in our sandbox environment within a few hours. A full production rollout typically takes under a week thanks to our deterministic API structure and comprehensive documentation.",
  },
  {
    question: "Does Gavel handle RBI compliance?",
    answer: "Yes. Our infrastructure is designed to be strictly aligned with RBI's 2022 Digital Lending Guidelines. We provide immutable audit trails and per-decision explainability required for regulatory filing.",
  },
  {
    question: "Can we use our own custom underwriting logic?",
    answer: "Absolutely. You can configure custom deterministic rules and guardrails. You have full control over the rule sequence and risk thresholds.",
  },
  {
    question: "What happens if a bureau is down?",
    answer: "Gavel features built-in fallback mechanisms. If a primary bureau times out, we can instantly pivot to a secondary bureau or lean on bank statement transaction patterns to ensure your flow doesn't hang.",
  },
  {
    question: "How secure is user data?",
    answer: "We utilize industry-standard encryption for data at rest and TLS 1.3 for data in transit. We maintain a strict data localization policy in compliance with RBI mandates.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-24 bg-background relative overflow-hidden border-t border-border">
    <div className="container mx-auto px-6 relative z-10">
      <div className="text-center mb-16">
        <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-foreground mb-3 block">FAQ</span>
        <h2 className="text-[46px] font-['DM_Sans'] font-bold text-foreground mb-4">
          Got questions?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-[17px]">
          Everything you need to know about the infrastructure and compliance.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`} 
              className="border border-border rounded-xl px-6 bg-surface hover:border-border transition-all"
            >
              <AccordionTrigger className="text-left font-['DM_Sans'] font-semibold text-foreground hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-['DM_Sans'] text-[15px] leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);

export default FAQSection;
