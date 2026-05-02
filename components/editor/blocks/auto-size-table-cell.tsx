import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

export function AutoSizeTableCell({
  value,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textareaElement = textareaRef.current;

    if (!textareaElement) {
      return;
    }

    textareaElement.style.height = "0px";
    textareaElement.style.height = `${textareaElement.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      value={value}
      className={className}
    />
  );
}
