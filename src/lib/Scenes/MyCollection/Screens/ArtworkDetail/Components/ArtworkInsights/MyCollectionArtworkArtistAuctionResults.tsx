import { MyCollectionArtworkArtistAuctionResults_artwork } from "__generated__/MyCollectionArtworkArtistAuctionResults_artwork.graphql"
import { CaretButton } from "lib/Components/Buttons/CaretButton"
import OpaqueImageView from "lib/Components/OpaqueImageView/OpaqueImageView"
import { ScreenMargin } from "lib/Scenes/MyCollection/Components/ScreenMargin"
import { AppStore } from "lib/store/AppStore"
import { extractNodes } from "lib/utils/extractNodes"
import { DateTime } from "luxon"
import { Box, Flex, Spacer, Text } from "palette"
import React, { useRef } from "react"
import { View } from "react-native"
import { createFragmentContainer, graphql } from "react-relay"
import { InfoButton } from "./InfoButton"

interface MyCollectionArtworkArtistAuctionResultsProps {
  artwork: MyCollectionArtworkArtistAuctionResults_artwork
}

const MyCollectionArtworkArtistAuctionResults: React.FC<MyCollectionArtworkArtistAuctionResultsProps> = (props) => {
  const navRef = useRef<View>(null)
  const results = extractNodes(props?.artwork?.artist?.auctionResultsConnection)
  const navActions = AppStore.actions.myCollection.navigation
  const artistID = props.artwork.artist?.slug!

  return (
    <ScreenMargin ref={navRef}>
      <InfoButton title="Recent auction results" onPress={() => navActions.showInfoModal("auctionResults")} />

      <Spacer my={0.5} />

      {results.map(({ title, saleDate, priceRealized, internalID, images }) => {
        const dateOfSale = DateTime.fromISO(saleDate as string).toLocaleString(DateTime.DATE_MED)
        const salePrice = priceRealized?.centsUSD === 0 ? null : priceRealized?.display

        return (
          <Box my={0.5} key={internalID}>
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="row">
                <OpaqueImageView imageURL={images?.thumbnail?.url} width={45} height={45} />
                <Flex flexDirection="column">
                  <Text numberOfLines={1}>{title}</Text>
                  <Text>Sold {dateOfSale}</Text>
                </Flex>
              </Flex>
              {!!salePrice && (
                <Box>
                  <Text>{salePrice}</Text>
                </Box>
              )}
            </Flex>
          </Box>
        )
      })}

      <Spacer my={1} />

      <CaretButton onPress={() => navActions.navigateToAuctionDetail(artistID)} text="Explore auction results" />
    </ScreenMargin>
  )
}

export const MyCollectionArtworkArtistAuctionResultsFragmentContainer = createFragmentContainer(
  MyCollectionArtworkArtistAuctionResults,
  {
    artwork: graphql`
      fragment MyCollectionArtworkArtistAuctionResults_artwork on Artwork {
        artist {
          slug
          auctionResultsConnection(
            first: 3
            sort: DATE_DESC # organizations: $organizations # categories: $categories # sizes: $sizes # earliestCreatedYear: $createdAfterYear # latestCreatedYear: $createdBeforeYear # allowEmptyCreatedDates: $allowEmptyCreatedDates
          ) {
            edges {
              node {
                internalID
                title
                dimensionText
                images {
                  thumbnail {
                    url
                  }
                }
                description
                dateText
                saleDate
                priceRealized {
                  display
                  centsUSD
                }
              }
            }
          }
        }
      }
    `,
  }
)
