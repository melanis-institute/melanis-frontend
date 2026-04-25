import type { SelectHTMLAttributes } from "react";
import { classNames } from "@shared/lib/classNames";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={classNames(
        "h-[50px] w-full rounded-[14px] border border-melanis-semantic-border-default bg-white px-4 text-[15px] font-medium text-melanis-semantic-text-primary outline-none transition focus-visible:ring-2 focus-visible:ring-melanis-semantic-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] disabled:cursor-not-allowed disabled:bg-melanis-action-disabled-bg",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
