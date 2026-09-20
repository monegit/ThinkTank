import { tv } from "tailwind-variants";

export const appShellStyles = tv({
  slots: {
    root: "flex-1 items-center justify-center bg-slate-50 p-6",
    content: "w-full max-w-xl gap-3.5 rounded-2xl bg-white p-7",
    title: "text-[28px] font-bold text-slate-900",
    description: "text-base leading-6 text-slate-600",
    action: "self-start cursor-pointer rounded-lg px-4 py-2.5",
    actionLabel: "font-semibold text-white"
  },
  variants: {
    actionTone: {
      primary: { action: "bg-indigo-600 active:bg-indigo-700" },
      neutral: { action: "bg-slate-700 active:bg-slate-800" }
    }
  },
  defaultVariants: {
    actionTone: "primary"
  }
});
