import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PLATFORM_MODULES, getModuleBySlug } from "@/data/platform-modules";
import ModulePreview from "@/components/platform/ModulePreview";

/**
 * The product tour is now the public face of eight internal products, so the
 * catalogue is treated as data that must stay honest and complete:
 *  - every module must be deep-linkable (unique slug)
 *  - every module must render a preview without throwing
 *  - every claimed endpoint must be a real method+path pair
 */
describe("platform module catalogue", () => {
  it("exposes exactly eight modules", () => {
    expect(PLATFORM_MODULES).toHaveLength(8);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(PLATFORM_MODULES.map((m) => m.id)).size).toBe(PLATFORM_MODULES.length);
    expect(new Set(PLATFORM_MODULES.map((m) => m.slug)).size).toBe(PLATFORM_MODULES.length);
  });

  it("gives every module the content the tour needs", () => {
    for (const module of PLATFORM_MODULES) {
      expect(module.capabilities.length).toBeGreaterThanOrEqual(3);
      expect(module.facts.length).toBeGreaterThanOrEqual(3);
      expect(module.endpoints.length).toBeGreaterThanOrEqual(3);
      expect(module.summary.length).toBeGreaterThan(80);
      expect(module.replaces.length).toBeGreaterThan(10);
      expect(module.consoleTab.length).toBeGreaterThan(0);
    }
  });

  it("only lists real API paths", () => {
    const allowedMethods = ["GET", "POST", "PATCH", "DELETE"];
    for (const module of PLATFORM_MODULES) {
      for (const endpoint of module.endpoints) {
        expect(allowedMethods).toContain(endpoint.method);
        expect(endpoint.path.startsWith("/v1/")).toBe(true);
      }
    }
  });

  it("falls back to the first module for an unknown slug", () => {
    expect(getModuleBySlug("does-not-exist").id).toBe(PLATFORM_MODULES[0].id);
    expect(getModuleBySlug(undefined).id).toBe(PLATFORM_MODULES[0].id);
    expect(getModuleBySlug("collections").id).toBe("collections");
  });
});

describe("ModulePreview", () => {
  it("renders every module screen without throwing", () => {
    for (const module of PLATFORM_MODULES) {
      const { getByText, unmount } = render(
        <ModulePreview moduleId={module.id} title={`Console · ${module.consoleTab}`} />,
      );
      expect(getByText(`Console · ${module.consoleTab}`)).toBeInTheDocument();
      unmount();
    }
  });

  it("shows the underwriting decision trace", () => {
    const { getByText } = render(<ModulePreview moduleId="underwriting" />);
    expect(getByText("Underwriting queue")).toBeInTheDocument();
    expect(getByText("Decision trace · GVL-4822")).toBeInTheDocument();
    expect(getByText("GVL-4823")).toBeInTheDocument();
  });
});
