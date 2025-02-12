import {
  Avatar,
  Flex,
  Spacer,
  Spinner,
  Text,
  ToolTip,
  Touchable,
  useSpace,
} from "@artsy/palette-mobile"
import { MyCollectionCollectedArtistsRail_artist$key } from "__generated__/MyCollectionCollectedArtistsRail_artist.graphql"
import { MyCollectionCollectedArtistsRail_me$key } from "__generated__/MyCollectionCollectedArtistsRail_me.graphql"
import { MyCollectionTabsStore } from "app/Scenes/MyCollection/State/MyCollectionTabsStore"
import { useFeatureFlag } from "app/utils/hooks/useFeatureFlag"
import { setVisualClueAsSeen, useVisualClue } from "app/utils/hooks/useVisualClue"
import { Animated } from "react-native"
import { useFragment, usePaginationFragment } from "react-relay"
import { graphql } from "relay-runtime"

interface MyCollectionCollectedArtistsRailProps {
  me: MyCollectionCollectedArtistsRail_me$key
}

export const ARTIST_CIRCLE_DIAMETER = 100

export const MyCollectionCollectedArtistsRail: React.FC<MyCollectionCollectedArtistsRailProps> = ({
  me,
}) => {
  const enableCollectedArtistsOnboarding = useFeatureFlag("ARShowCollectedArtistOnboarding")
  const { showVisualClue } = useVisualClue()
  const space = useSpace()

  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment(
    collectedArtistsPaginationFragment,
    me
  )

  const handleLoadMore = () => {
    if (!hasNext || isLoadingNext) {
      return
    }

    loadNext(10)
  }

  const userInterests = data.userInterestsConnection?.edges || []
  const collectedArtists = userInterests.map((userInterest) => userInterest?.node)

  if (!collectedArtists) return <></>

  const filteredUserInterests = userInterests.filter((userInterest) => {
    if (userInterest?.internalID && userInterest.node && userInterest.node.internalID) {
      return true
    }
    return
  })

  return (
    <Flex testID="my-collection-collected-artists-rail">
      <Flex position="absolute" top={0} left={0} right={0} height={1} bg="black5"></Flex>

      <Animated.FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filteredUserInterests}
        renderItem={({ item, index }) => {
          if (item?.node && item.internalID && item.node.internalID) {
            return (
              <ToolTip
                enabled={
                  !!enableCollectedArtistsOnboarding &&
                  index === 1 &&
                  showVisualClue("MyCollectionArtistsCollectedOnboardingTooltip1") &&
                  !showVisualClue("MyCollectionArtistsCollectedOnboarding")
                }
                initialToolTipText="Tap to review your artist"
                onPress={() => {
                  setVisualClueAsSeen("MyCollectionArtistsCollectedOnboardingTooltip1")
                }}
                position="BOTTOM"
                tapToDismiss
                xOffset={-10}
                yOffset={15}
              >
                <Artist
                  key={item.node.internalID}
                  artist={item.node}
                  interestId={item.internalID}
                  onPress={() => {
                    if (!enableCollectedArtistsOnboarding) return

                    setVisualClueAsSeen("MyCollectionArtistsCollectedOnboardingTooltip1")
                  }}
                />
              </ToolTip>
            )
          }
          return null
        }}
        keyExtractor={(item, index) => item?.internalID || index.toString()}
        onEndReachedThreshold={1}
        ItemSeparatorComponent={() => <Spacer y={2} />}
        contentContainerStyle={{
          paddingTop: space(2),
          paddingBottom: space(4),
          paddingHorizontal: space(2),
        }}
        ListFooterComponent={
          <Flex flexDirection="row" mr={4}>
            {!!isLoadingNext && (
              <Flex
                mr={1}
                width={ARTIST_CIRCLE_DIAMETER}
                height={ARTIST_CIRCLE_DIAMETER}
                alignItems="center"
                justifyContent="center"
              >
                <Spinner />
              </Flex>
            )}
          </Flex>
        }
        onEndReached={handleLoadMore}
      />
    </Flex>
  )
}

export const Artist: React.FC<{
  artist: MyCollectionCollectedArtistsRail_artist$key
  interestId: string
  onPress?: () => void
}> = ({ artist, interestId, onPress }) => {
  const data = useFragment(artistFragment, artist)
  const setViewKind = MyCollectionTabsStore.useStoreActions((state) => state.setViewKind)

  return (
    <Touchable
      haptic
      onPress={() => {
        setViewKind({
          viewKind: "Artist",
          artistId: data.internalID,
          interestId: interestId,
        })
        onPress?.()
      }}
      accessibilityHint={`View more details ${data.name}`}
    >
      <Flex mr={1} width={ARTIST_CIRCLE_DIAMETER}>
        <Avatar
          initials={data.initials || undefined}
          src={data?.image?.url || undefined}
          size="md"
        />
        <Text variant="xs" numberOfLines={2} textAlign="center" mt={0.5}>
          {data.name}
        </Text>
      </Flex>
    </Touchable>
  )
}

const collectedArtistsPaginationFragment = graphql`
  fragment MyCollectionCollectedArtistsRail_me on Me
  @argumentDefinitions(count: { type: "Int", defaultValue: 10 }, after: { type: "String" })
  @refetchable(queryName: "MyCollectionCollectedArtistsRail_myCollectionInfoRefetch") {
    userInterestsConnection(
      first: $count
      after: $after
      category: COLLECTED_BEFORE
      interestType: ARTIST
    ) @connection(key: "MyCollectionCollectedArtistsRail_userInterestsConnection") {
      edges {
        internalID
        node {
          ... on Artist {
            internalID
            ...MyCollectionCollectedArtistsRail_artist
          }
        }
      }
    }
  }
`

const artistFragment = graphql`
  fragment MyCollectionCollectedArtistsRail_artist on Artist {
    internalID
    name
    initials
    image {
      url
    }
  }
`
