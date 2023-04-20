import { Box, Popover, PopoverProps } from "@artsy/palette-mobile"

import { FC } from "react"

interface ProgressiveOnboardingPopoverProps extends Omit<PopoverProps, "children"> {
  name: string
}

export const ProgressiveOnboardingPopover: FC<ProgressiveOnboardingPopoverProps> = ({
  popover,
  children,
  name,
  ...rest
}) => {
  return (
    <Popover
      popover={popover}
      width={250}
      variant="defaultDark"
      pointer
      visible
      ignoreClickOutside
      manageFocus={false}
      {...rest}
    >
      {({ anchorRef }) => {
        return <Box ref={anchorRef as any}>{children}</Box>
      }}
    </Popover>
  )
}
