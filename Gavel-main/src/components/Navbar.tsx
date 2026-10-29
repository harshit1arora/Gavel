import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Code2, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLATFORM_MODULES } from "@/data/platform-modules";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "@/i18n/LanguageProvider";

const lenderItems = [
  { name: "Underwriting API", path: "/platform/underwriting" },
  { name: "KYC Engine", path: "/kyc-engine" },
  { name: "Credit Scoring", path: "/credit-scoring" },
  { name: "Rules Engine", path: "/rules-engine" },
  { name: "RBI Compliance", path: "/platform/compliance" },
  { name: "API Reference", path: "/api-reference" },
];

const borrowerItems = [
  { name: "Loan Predictor", path: "/loan-approval-predictor" },
  { name: "Financial Tools", path: "/tools" },
  { name: "All Guides & Resources", path: "/all-guides" },
];

const Navbar = () => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  const linkClass = (path: string) =>
    `relative font-['DM_Sans'] text-[13.5px] transition-colors duration-200 ${
      isActive(path) ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
    }`;

  const triggerClass =
    "group flex items-center gap-1 px-3 h-9 rounded-[7px] font-['DM_Sans'] text-[13.5px] text-muted-foreground hover:text-foreground hover:bg-surface transition-colors outline-none data-[state=open]:text-foreground data-[state=open]:bg-surface";

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-[60] px-4 pt-4">
        <nav className="mx-auto w-full max-w-[1120px] h-[60px] rounded-[14px] border border-border/70 bg-background/75 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] flex items-center justify-between pl-4 pr-3">
          <Logo />

          <div className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className={triggerClass}>
                {t("nav.platform")}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[260px] p-1.5">
                <DropdownMenuLabel className="font-['DM_Sans'] text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground px-2 py-1.5">
                  Product tour
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/platform" className="font-['DM_Sans'] text-[13px] font-semibold cursor-pointer">
                    All eight modules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {PLATFORM_MODULES.map((m) => (
                  <DropdownMenuItem key={m.slug} asChild>
                    <Link to={`/platform/${m.slug}`} className="font-['DM_Sans'] text-[13px] cursor-pointer">
                      {m.railLabel}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className={triggerClass}>
                {t("nav.lenders")}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px] p-1.5">
                {lenderItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="font-['DM_Sans'] text-[13px] cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className={triggerClass}>
                {t("nav.borrowers")}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px] p-1.5">
                {borrowerItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="font-['DM_Sans'] text-[13px] cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          <div className="flex items-center gap-1.5">
            <a
              href="https://github.com/gavel-ai/gavel-ai"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Gavel on GitHub"
              className="hidden xl:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[7px] font-['DM_Sans'] text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <Code2 size={13} /> {t("nav.opensource")}
            </a>

            <LanguageSwitcher />

            <ThemeToggle />

            <Link to="/try" className="g-btn g-btn-primary hidden sm:inline-flex !h-9 !px-4 !text-[13px]">
              {t("nav.tryFree")}
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-[7px] text-foreground hover:bg-surface transition-colors"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[55] lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="relative h-full overflow-y-auto pt-24 pb-10 px-6"
            >
              <div className="max-w-[520px] mx-auto space-y-8">
                <div>
                  <div className="g-eyebrow mb-3">Start here</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/try" className="g-btn g-btn-primary w-full" onClick={() => setOpen(false)}>
                      {t("nav.tryFree")}
                    </Link>
                    <Link to="/demo" className="g-btn g-btn-secondary w-full" onClick={() => setOpen(false)}>
                      {t("nav.liveDemo")}
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="g-eyebrow mb-2">Platform</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {PLATFORM_MODULES.map((m) => (
                      <Link
                        key={m.slug}
                        to={`/platform/${m.slug}`}
                        onClick={() => setOpen(false)}
                        className="py-2 font-['DM_Sans'] text-[14px] text-foreground/85 hover:text-primary"
                      >
                        {m.railLabel}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="g-eyebrow mb-2">For lenders</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {lenderItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className="py-2 font-['DM_Sans'] text-[14px] text-foreground/85 hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="g-eyebrow mb-2">For borrowers</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {borrowerItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className="py-2 font-['DM_Sans'] text-[14px] text-foreground/85 hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-5">
                  <Link
                    to="/pricing"
                    onClick={() => setOpen(false)}
                    className="font-['DM_Sans'] text-[14px] text-foreground"
                  >
                    {t("nav.pricing")}
                  </Link>
                  <a
                    href="https://github.com/gavel-ai/gavel-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-['DM_Sans'] text-[13px] text-muted-foreground"
                  >
                    <Code2 size={13} /> Open source
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
