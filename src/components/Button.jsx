import { forwardRef } from "react";

const Slot = forwardRef((props, ref) => {
  const Component = props.children?.type || 'div'
  const { children, ...rest } = props
  return <Component {...rest} ref={ref} />
})
Slot.displayName = 'Slot'

import { cx } from "../utils/cx";
import { IconContext } from "react-icons";

export const Button = forwardRef(
  (
    {
      asChild = false,
      isLoading = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <IconContext.Provider value={{ size: "1.1em" }}>
        <Comp
          ref={ref}
          disabled={disabled || isLoading}
          className={cx(
            "group relative inline-flex items-center justify-center gap-2 rounded-lg",
            "px-4 py-2.5 text-sm font-semibold",
            "bg-zinc-100 text-zinc-950",
            "shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_8px_20px_-8px_rgba(0,0,0,0.8)]",
            "transition-all duration-150 ease-out",
            "hover:bg-white cursor-pointer",
            "active:translate-y-[1px]",
            "disabled:opacity-40 disabled:pointer-events-none",
            isLoading && "pointer-events-none",
            className
          )}
          {...props}
        >
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
            </span>
          )}

          <span className={cx(isLoading && "invisible")}>{children}</span>
        </Comp>
      </IconContext.Provider>
    );
  }
);

Button.displayName = "Button";

export default Button
