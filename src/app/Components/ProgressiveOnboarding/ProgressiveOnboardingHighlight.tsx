import { Box } from "@artsy/palette-mobile"
import { themeGet } from "@styled-system/theme-get"

import { FC, useRef } from "react"
import { TouchableHighlight } from "react-native"
import styled, { keyframes } from "styled-components"

export type ProgressiveOnboardingHighlightPosition = "center" | { top: string; left: string }

interface ProgressiveOnboardingHighlightProps {
  handlePress: () => void
  name: string
  position: ProgressiveOnboardingHighlightPosition
}

export const ProgressiveOnboardingHighlight: FC<ProgressiveOnboardingHighlightProps> = ({
  children,
  handlePress,
  name,
  position,
}) => {
  const style = useRef(
    position === "center"
      ? {
          top: "50%",
          left: "50%",
          marginTop: -SIZE / 2,
          marginLeft: -SIZE / 2,
        }
      : {
          top: position.top,
          left: position.left,
        }
  )

  return (
    <Wrapper onPress={handlePress}>
      <Highlight style={style.current} />

      {children}
    </Wrapper>
  )
}

const pulse = keyframes`
  0% { transform: scale(0.8); }
  50% { transform: scale(1); }
  100% { transform: scale(0.8); }
`

const SIZE = 38

export const Highlight = styled(Box)`
  position: absolute;
  pointer-events: none;
  border: 3px solid ${themeGet("colors.blue10")};
  animation: ${pulse} 2s ease-in-out infinite;
  border-radius: 50%;
  height: ${SIZE}px;
  width: ${SIZE}px;
`
const Wrapper = styled(TouchableHighlight)`
  position: relative;
  width: 100%;
`
