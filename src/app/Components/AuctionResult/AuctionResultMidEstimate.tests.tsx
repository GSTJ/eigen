import { renderWithWrappersLEGACY } from "app/tests/renderWithWrappers"
import { Flex, Text } from "palette"
import { extractText } from "../../tests/extractText"
import { AuctionResultsMidEstimate } from "./AuctionResultMidEstimate"

describe("AuctionResultMidEstimate", () => {
  it("renders the short description", () => {
    const tree = renderWithWrappersLEGACY(
      <AuctionResultsMidEstimate value="25%" shortDescription="short description" />
    )
    expect(extractText(tree.root.findAllByType(Flex)[0])).toContain("short description")
  })
  it("renders properly when the percentage is greater than 5", () => {
    const tree = renderWithWrappersLEGACY(<AuctionResultsMidEstimate value="25%" />)
    expect(extractText(tree.root.findAllByType(Flex)[0])).toEqual("(+25%)")
    expect(tree.root.findAllByType(Text)[0].props.color).toEqual("green100")
  })

  it("renders properly when the percentage is less than -5", () => {
    const tree = renderWithWrappersLEGACY(<AuctionResultsMidEstimate value="-25%" />)
    expect(extractText(tree.root.findAllByType(Flex)[0])).toEqual("(-25%)")
    expect(tree.root.findAllByType(Text)[0].props.color).toEqual("red100")
  })

  it("renders properly when the percentage is between -5 and 5", () => {
    const instance1 = renderWithWrappersLEGACY(<AuctionResultsMidEstimate value="2%" />)
    const instance2 = renderWithWrappersLEGACY(<AuctionResultsMidEstimate value="2%" />)
    const instance3 = renderWithWrappersLEGACY(<AuctionResultsMidEstimate value="-2%" />)
    expect(instance1.root.findAllByType(Text)[0].props.color).toEqual("black60")
    expect(instance2.root.findAllByType(Text)[0].props.color).toEqual("black60")
    expect(instance3.root.findAllByType(Text)[0].props.color).toEqual("black60")
    expect(extractText(instance1.root.findAllByType(Flex)[0])).toEqual("(+2%)")
    expect(extractText(instance2.root.findAllByType(Flex)[0])).toEqual("(+2%)")
    expect(extractText(instance3.root.findAllByType(Flex)[0])).toEqual("(-2%)")
  })
})
