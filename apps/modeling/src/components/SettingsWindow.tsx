import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUiStore } from "../store/uiStore";
import {
  GeneralSettingsSection,
  ModelingSettingsSection,
  RotateUiSettingsSection,
} from "./settings/SettingsSections";
import { parseNumberInput, settingsMenuItems } from "./settings/settingsSchema";

const overlayClasses =
  "absolute inset-0 z-30 flex items-center justify-center p-3 md:p-6";
const backdropClasses = "absolute inset-0 bg-slate-950/58 backdrop-blur-sm";
const panelClasses =
  "relative z-10 flex min-h-[28rem] max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden border border-white/12 bg-slate-950/92 shadow-[0_24px_60px_rgba(3,10,20,0.4)] md:h-[44rem] md:max-h-[min(44rem,calc(100vh-2rem))]";
const modelingSettingsMenuItems = settingsMenuItems.filter(
  (menuItem) =>
    menuItem.key === "general" ||
    menuItem.key === "rotate-ui" ||
    menuItem.key === "modeling-ui",
);

export function SettingsWindow() {
  const [generalColorsOpen, setGeneralColorsOpen] = useState(false);
  const settings = useUiStore();

  useEffect(() => {
    if (!settings.settingsOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        settings.setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings.setSettingsOpen, settings.settingsOpen]);

  const handleNumberChange =
    (setter: (value: number) => void) => (value: string) => {
      const parsedValue = parseNumberInput(value);
      if (parsedValue !== null) {
        setter(parsedValue);
      }
    };

  if (!settings.settingsOpen) {
    return null;
  }

  return (
    <div className={overlayClasses}>
      <button
        aria-hidden="true"
        aria-label="Close settings"
        className={backdropClasses}
        onClick={() => settings.setSettingsOpen(false)}
        tabIndex={-1}
        type="button"
      />
      <dialog
        aria-label="Settings window"
        aria-modal="true"
        className={panelClasses}
        open
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-3 md:px-5">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-sky-100/70">
              Settings
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-50 md:text-lg">
              Workspace controls
            </h2>
            <p className="mt-1 text-[0.74rem] leading-5 text-slate-300/72">
              Modeling workspace の挙動と表示をここで調整します。
            </p>
          </div>
          <button
            aria-label="Dismiss settings dialog"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-sky-300/50"
            onClick={() => settings.setSettingsOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-3 pb-3 pt-3 md:grid-cols-[8.5rem_minmax(0,1fr)] md:px-4 md:pb-4">
          <nav
            aria-label="Settings sections"
            className="grid gap-2 md:content-start"
          >
            {modelingSettingsMenuItems.map((menuItem) => {
              const active = menuItem.key === settings.selectedSettingsMenu;

              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={`border px-2.5 py-2 text-left text-[0.72rem] font-semibold transition ${
                    active
                      ? "border-sky-300/45 bg-sky-300/12 text-slate-50"
                      : "border-white/8 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                  }`}
                  key={menuItem.key}
                  onClick={() => settings.setSelectedSettingsMenu(menuItem.key)}
                  title={menuItem.description}
                  type="button"
                >
                  <span className="block">{menuItem.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 border-t border-white/8 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            {settings.selectedSettingsMenu === "general" ? (
              <GeneralSettingsSection
                generalColorsOpen={generalColorsOpen}
                handleNumberChange={handleNumberChange}
                setGeneralColorsOpen={setGeneralColorsOpen}
                settings={settings}
              />
            ) : null}
            {settings.selectedSettingsMenu === "rotate-ui" ? (
              <RotateUiSettingsSection
                handleNumberChange={handleNumberChange}
                settings={settings}
              />
            ) : null}
            {settings.selectedSettingsMenu === "modeling-ui" ? (
              <ModelingSettingsSection
                handleNumberChange={handleNumberChange}
                settings={settings}
              />
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
