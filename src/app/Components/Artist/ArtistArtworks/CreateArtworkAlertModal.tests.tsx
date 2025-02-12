import { CreateArtworkAlertModal_artwork$data } from "__generated__/CreateArtworkAlertModal_artwork.graphql"
import {
  CreateArtworkAlertModal,
  computeArtworkAlertProps,
} from "app/Components/Artist/ArtistArtworks/CreateArtworkAlertModal"
import { CreateSavedSearchModal } from "app/Components/Artist/ArtistArtworks/CreateSavedSearchModal"
import { setupTestWrapper } from "app/utils/tests/setupTestWrapper"
import { graphql } from "react-relay"

jest.mock("app/Components/Artist/ArtistArtworks/CreateSavedSearchModal", () => ({
  CreateSavedSearchModal: () => "CreateSavedSearchModal",
}))

describe("CreateArtworkAlertModal", () => {
  const { renderWithRelay } = setupTestWrapper({
    Component: CreateArtworkAlertModal,
    query: graphql`
      query CreateArtworkAlertModal_Test_Query {
        artwork(id: "foo") {
          ...CreateArtworkAlertModal_artwork
        }
      }
    `,
  })

  it("returns null if no artists", () => {
    const { queryByText } = renderWithRelay({
      Artwork: () => ({
        artistsArray: [],
      }),
    })

    expect(queryByText("CreateSavedSearchModal")).toBeFalsy()
  })

  it("returns renders modal", () => {
    const { UNSAFE_getByType } = renderWithRelay()
    expect(UNSAFE_getByType(CreateSavedSearchModal)).toBeTruthy()
  })
})

describe("computeArtworkAlertProps", () => {
  const artwork = {
    artistsArray: [{ name: "foo", internalID: "bar" }],
    attributionClass: {
      internalID: "1",
    },
    title: "Test Artwork",
    internalID: "2",
    slug: "test-artwork",
    mediumType: {
      filterGene: {
        name: "Test Gene",
        slug: "test-gene",
      },
    },
  } as unknown as CreateArtworkAlertModal_artwork$data

  it("should return default props when no artists are provided", () => {
    const result = computeArtworkAlertProps({ ...artwork, artistsArray: [] })

    expect(result).toEqual({
      hasArtists: false,
      entity: null,
      attributes: null,
      aggregations: null,
    })
  })

  it("should return correct props when artists are provided", () => {
    const result = computeArtworkAlertProps(artwork)

    expect(result).toEqual({
      aggregations: [
        {
          slice: "MEDIUM",
          counts: [{ name: "Test Gene", value: "test-gene", count: 0 }],
        },
      ],
      attributes: {
        artistIDs: ["bar"],
        attributionClass: ["1"],
        additionalGeneIDs: ["test-gene"],
      },
      entity: {
        artists: [{ id: "bar", name: "foo" }],
        owner: { type: "artwork", id: "2", slug: "test-artwork" },
      },
      hasArtists: true,
    })
  })

  it("should omit a medium if filterGene isnt provided", () => {
    const result = computeArtworkAlertProps({ ...artwork, mediumType: { filterGene: null } })

    expect(result).toEqual({
      aggregations: [],
      attributes: {
        artistIDs: ["bar"],
        attributionClass: ["1"],
        additionalGeneIDs: [],
      },
      entity: {
        artists: [{ id: "bar", name: "foo" }],
        owner: { type: "artwork", id: "2", slug: "test-artwork" },
      },
      hasArtists: true,
    })
  })
})
