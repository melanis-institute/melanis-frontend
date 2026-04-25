import type { TextareaHTMLAttributes } from "react";
import { classNames } from "@shared/lib/classNames";

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={classNames(
        "min-h-28 w-full rounded-[14px] border border-melanis-semantic-border-default bg-white px-4 py-3 text-[15px] font-medium text-melanis-semantic-text-primary outline-none transition placeholder:text-melanis-semantic-text-muted focus-visible:ring-2 focus-visible:ring-melanis-semantic-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] disabled:cursor-not-allowed disabled:bg-melanis-action-disabled-bg",
        className,
      )}
      {...props}
    />
  );
}
