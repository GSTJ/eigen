import { ActionType, ContextModule, OwnerType } from "@artsy/cohesion"
import {
  useSpace,
  useScreenDimensions,
  Flex,
  Tabs,
  Text,
  Box,
  Button,
  Spacer,
  BellIcon,
  Spinner,
} from "@artsy/palette-mobile"
import { ArtistArtworks_artist$data } from "__generated__/ArtistArtworks_artist.graphql"
import { ArtistArtworksFilterHeader } from "app/Components/Artist/ArtistArtworks/ArtistArtworksFilterHeader"
import { useShowArtworksFilterModal } from "app/Components/Artist/ArtistArtworks/hooks/useShowArtworksFilterModal"
import { ArtworkFilterNavigator, FilterModalMode } from "app/Components/ArtworkFilter"
import { Aggregations, FilterArray } from "app/Components/ArtworkFilter/ArtworkFilterHelpers"
import { ArtworksFiltersStore } from "app/Components/ArtworkFilter/ArtworkFilterStore"
import { ORDERED_ARTWORK_SORTS } from "app/Components/ArtworkFilter/Filters/SortOptions"
import { convertSavedSearchCriteriaToFilterParams } from "app/Components/ArtworkFilter/SavedSearch/convertersToFilterParams"
import { SearchCriteriaAttributes } from "app/Components/ArtworkFilter/SavedSearch/types"
import { useArtworkFilters } from "app/Components/ArtworkFilter/useArtworkFilters"
import ArtworkGridItem from "app/Components/ArtworkGrids/ArtworkGridItem"
import { FilteredArtworkGridZeroState } from "app/Components/ArtworkGrids/FilteredArtworkGridZeroState"
import { Props as InfiniteScrollGridProps } from "app/Components/ArtworkGrids/InfiniteScrollArtworksGrid"
import { useNavigateToPageableRoute } from "app/system/navigation/useNavigateToPageableRoute"
import { extractNodes } from "app/utils/extractNodes"
import { Schema } from "app/utils/track"
import React, { useCallback, useEffect, useMemo } from "react"
import { isTablet } from "react-native-device-info"
import { createPaginationContainer, graphql, RelayPaginationProp } from "react-relay"
import { useTracking } from "react-tracking"

interface ArtworksGridProps extends InfiniteScrollGridProps {
  artist: ArtistArtworks_artist$data
  searchCriteria: SearchCriteriaAttributes | null
  relay: RelayPaginationProp
  predefinedFilters?: FilterArray
}

const ESTIMATED_ITEM_SIZE = 272

const ArtworksGrid: React.FC<ArtworksGridProps> = ({
  artist,
  relay,
  predefinedFilters,
  searchCriteria,
  ...props
}) => {
  const { showFilterArtworksModal, openFilterArtworksModal, closeFilterArtworksModal } =
    useShowArtworksFilterModal({ artist })
  const tracking = useTracking()
  const space = useSpace()
  const { width } = useScreenDimensions()
  const artworks = useMemo(() => extractNodes(artist.artworks), [artist.artworks])
  const appliedFilters = ArtworksFiltersStore.useStoreState((state) => state.appliedFilters)

  const { navigateToPageableRoute } = useNavigateToPageableRoute({ items: artworks })

  useArtworkFilters({
    relay,
    aggregations: artist.aggregations?.aggregations,
    componentPath: "ArtistArtworks/ArtistArtworks",
  })

  const setInitialFilterStateAction = ArtworksFiltersStore.useStoreActions(
    (state) => state.setInitialFilterStateAction
  )

  useEffect(() => {
    let filters: FilterArray = []

    if (Array.isArray(predefinedFilters)) {
      filters = predefinedFilters
    }

    if (searchCriteria && artist.aggregations?.aggregations) {
      const params = convertSavedSearchCriteriaToFilterParams(
        searchCriteria,
        artist.aggregations.aggregations as Aggregations
      )
      const sortFilterItem = ORDERED_ARTWORK_SORTS.find(
        (sortEntity) => sortEntity.paramValue === "-published_at"
      )!

      filters = [...params, sortFilterItem]
    }

    setInitialFilterStateAction(filters)
  }, [])

  const numColumns = isTablet() ? 3 : 2

  const trackClear = (id: string, slug: string) => {
    tracking.trackEvent({
      action_name: "clearFilters",
      context_screen: Schema.ContextModules.ArtworkGrid,
      context_screen_owner_type: Schema.OwnerEntityTypes.Artist,
      context_screen_owner_id: id,
      context_screen_owner_slug: slug,
      action_type: Schema.ActionTypes.Tap,
    })
  }

  const shouldDisplaySpinner = !!artworks.length && !!relay.isLoading() && !!relay.hasMore()

  const loadMore = useCallback(() => {
    if (relay.hasMore() && !relay.isLoading()) {
      relay.loadMore(10)
    }
  }, [relay.hasMore(), relay.isLoading()])

  if (!artist.statuses?.artworks) {
    return (
      <Tabs.ScrollView>
        <Spacer y={6} />

        <Text variant="md" textAlign="center">
          Get notified when new works are available
        </Text>

        <Text variant="md" textAlign="center" color="black60">
          There are currently no works for sale for this artist. Create an alert, and we’ll let you
          know when new works are added.
        </Text>

        <Spacer y={2} />

        <Button
          variant="outline"
          mx="auto"
          icon={<BellIcon />}
          onPress={() => {
            openFilterArtworksModal("createAlert")

            tracking.trackEvent({
              action: ActionType.tappedCreateAlert,
              context_screen_owner_type: OwnerType.artist,
              context_screen_owner_id: artist.internalID,
              context_screen_owner_slug: artist.slug,
              context_module: ContextModule.artworkGrid,
            })
          }}
        >
          Create Alert
        </Button>

        <Spacer y={6} />
        <ArtworkFilterNavigator
          {...props}
          id={artist.internalID}
          slug={artist.slug}
          visible={showFilterArtworksModal}
          name={artist.name ?? ""}
          exitModal={closeFilterArtworksModal}
          closeModal={closeFilterArtworksModal}
          mode={FilterModalMode.ArtistArtworks}
          shouldShowCreateAlertButton
        />
      </Tabs.ScrollView>
    )
  }

  return (
    <>
      <Tabs.Masonry
        data={artworks}
        numColumns={numColumns}
        // this number is the estimated size of the artworkGridItem component
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Box mb="80px" pt={2}>
            <FilteredArtworkGridZeroState
              id={artist.id}
              slug={artist.slug}
              trackClear={trackClear}
              hideClearButton={!appliedFilters.length}
            />
          </Box>
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item, columnIndex }) => {
          const imgAspectRatio = item.image?.aspectRatio ?? 1
          const imgWidth = width / numColumns - space(2) - space(1)
          const imgHeight = imgWidth / imgAspectRatio

          return (
            <Flex
              pl={columnIndex === 0 ? 0 : 1}
              pr={numColumns - (columnIndex + 1) === 0 ? 0 : 1}
              mt={2}
            >
              <ArtworkGridItem
                {...props}
                contextScreenOwnerType={OwnerType.artist}
                contextScreenOwnerId={artist.internalID}
                contextScreenOwnerSlug={artist.slug}
                artwork={item}
                height={imgHeight}
                navigateToPageableRoute={navigateToPageableRoute}
              />
            </Flex>
          )
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        // need to pass zIndex: 1 here in order for the SubTabBar to
        // be visible above list content
        ListHeaderComponentStyle={{ zIndex: 1 }}
        ListHeaderComponent={
          <Tabs.SubTabBar>
            <ArtistArtworksFilterHeader artist={artist} />
          </Tabs.SubTabBar>
        }
        ListFooterComponent={
          shouldDisplaySpinner ? (
            <Flex my={4} flexDirection="row" justifyContent="center">
              <Spinner />
            </Flex>
          ) : null
        }
      />
      <ArtworkFilterNavigator
        {...props}
        id={artist.internalID}
        slug={artist.slug}
        visible={!!showFilterArtworksModal}
        name={artist.name ?? ""}
        exitModal={closeFilterArtworksModal}
        closeModal={closeFilterArtworksModal}
        mode={FilterModalMode.ArtistArtworks}
        shouldShowCreateAlertButton
      />
    </>
  )
}

export default createPaginationContainer(
  ArtworksGrid,
  {
    artist: graphql`
      fragment ArtistArtworks_artist on Artist
      @argumentDefinitions(
        count: { type: "Int", defaultValue: 10 }
        cursor: { type: "String" }
        input: { type: "FilterArtworksInput" }
      ) {
        ...ArtistArtworksFilterHeader_artist
        id
        slug
        name
        internalID
        aggregations: filterArtworksConnection(
          first: 0
          aggregations: [
            COLOR
            DIMENSION_RANGE
            LOCATION_CITY
            MAJOR_PERIOD
            MATERIALS_TERMS
            MEDIUM
            PARTNER
            PRICE_RANGE
            SIMPLE_PRICE_HISTOGRAM
          ]
        ) {
          aggregations {
            slice
            counts {
              count
              name
              value
            }
          }
        }
        artworks: filterArtworksConnection(first: $count, after: $cursor, input: $input)
          @connection(key: "ArtistArtworksGrid_artworks") {
          edges {
            node {
              id
              slug
              image(includeAll: false) {
                aspectRatio
              }
              ...ArtworkGridItem_artwork @arguments(includeAllImages: false)
            }
          }
        }
        statuses {
          artworks
        }
      }
    `,
  },
  {
    getConnectionFromProps(props) {
      return props.artist && props.artist.artworks
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        id: props.artist.id,
        input: fragmentVariables.input,
        count,
        cursor,
      }
    },
    query: graphql`
      query ArtistArtworksQuery(
        $id: ID!
        $count: Int!
        $cursor: String
        $input: FilterArtworksInput
      ) {
        node(id: $id) {
          ... on Artist {
            ...ArtistArtworks_artist @arguments(count: $count, cursor: $cursor, input: $input)
          }
        }
      }
    `,
  }
)
