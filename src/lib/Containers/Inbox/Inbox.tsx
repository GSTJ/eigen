import { Inbox_me } from "__generated__/Inbox_me.graphql"
import { InboxQuery } from "__generated__/InboxQuery.graphql"
import { defaultEnvironment } from "lib/relay/createEnvironment"
import { ConversationsContainer } from "lib/Scenes/Inbox/Components/Conversations/Conversations"
import { MyBidsContainer } from "lib/Scenes/MyBids/MyBids"
import { listenToNativeEvents } from "lib/store/NativeModel"
import renderWithLoadProgress from "lib/utils/renderWithLoadProgress"
import { Flex, Separator, Text } from "palette"
import React from "react"
import { EmitterSubscription, LayoutChangeEvent, RefreshControl, ScrollView, ScrollViewProps } from "react-native"
// @ts-expect-error @types file generates duplicate declaration problems
import ScrollableTabView, { TabBarProps } from "react-native-scrollable-tab-view"
import { createRefetchContainer, graphql, QueryRenderer, RelayRefetchProp } from "react-relay"

// Tabs
interface ScrollableTabProps extends ScrollViewProps {
  tabLabel: string
}

const ScrollableTab: React.FC<ScrollableTabProps> = (props) => <ScrollView {...props} />

const InboxTabs: React.FC<TabBarProps> = (props) => (
  <>
    <Flex flexDirection="row" px={1.5} mb={1}>
      {props.tabs?.map((name: JSX.Element, page: number) => {
        const isTabActive = props.activeTab === page
        return (
          <Text
            mr={2}
            key={`inbox-tab-${name}`}
            color={isTabActive ? "black100" : "black30"}
            variant="largeTitle"
            onPress={() => {
              if (!!props.goToPage) {
                props.goToPage(page)
              }
            }}
          >
            {name}
          </Text>
        )
      })}
    </Flex>
    <Separator />
  </>
)

// Inbox
interface State {
  fetchingData: boolean
}

interface Props {
  me: Inbox_me
  relay: RelayRefetchProp
  isVisible: boolean
}

export class Inbox extends React.Component<Props, State> {
  // @ts-ignore STRICTNESS_MIGRATION
  conversations: ConversationsRef

  state = {
    fetchingData: false,
  }

  scrollViewVerticalStart = 0

  listener: EmitterSubscription | null = null

  flatListHeight = 0

  componentDidMount() {
    this.listener = listenToNativeEvents((event) => {
      if (event.type === "NOTIFICATION_RECEIVED") {
        this.fetchData()
      }
    })
  }

  componentWillUnmount() {
    this.listener?.remove()
  }

  UNSAFE_componentWillReceiveProps(newProps: Props) {
    if (newProps.isVisible) {
      this.fetchData()
    }
  }

  fetchData = () => {
    if (this.state.fetchingData) {
      return
    }

    this.setState({ fetchingData: true })

    if (this.conversations) {
      this.conversations.refreshConversations(() => {
        this.setState({ fetchingData: false })
      })
    } else {
      this.props.relay.refetch({}, null, () => {
        this.setState({ fetchingData: false })
      })
    }
  }

  onScrollableTabViewLayout = (layout: LayoutChangeEvent) => {
    this.scrollViewVerticalStart = layout.nativeEvent.layout.y
  }

  render() {
    const bottomInset = this.scrollViewVerticalStart
    const refreshControl = <RefreshControl refreshing={this.state.fetchingData} onRefresh={this.fetchData} />
    return (
      <ScrollableTabView
        style={{ paddingTop: 50 }}
        initialPage={0}
        renderTabBar={() => <InboxTabs />}
        contentProps={{
          contentInset: { bottom: bottomInset },
          onLayout: this.onScrollableTabViewLayout,
        }}
      >
        <ScrollableTab
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          tabLabel="Bids"
          key="bids"
          refreshControl={refreshControl}
        >
          <MyBidsContainer me={this.props.me} />
        </ScrollableTab>
        <ScrollableTab tabLabel="Inquiries" key="inquiries" refreshControl={refreshControl}>
          <ConversationsContainer
            me={this.props.me}
            componentRef={(conversations) => (this.conversations = conversations)}
          />
        </ScrollableTab>
      </ScrollableTabView>
    )
  }
}

export const InboxContainer = createRefetchContainer(
  Inbox,
  {
    me: graphql`
      fragment Inbox_me on Me {
        ...Conversations_me
        ...MyBids_me
      }
    `,
  },
  graphql`
    query InboxRefetchQuery {
      me {
        ...Inbox_me
      }
    }
  `
)

export const InboxQueryRenderer: React.FC = () => {
  return (
    <QueryRenderer<InboxQuery>
      environment={defaultEnvironment}
      query={graphql`
        query InboxQuery {
          me {
            ...Inbox_me
          }
        }
      `}
      cacheConfig={{ force: true }}
      variables={{}}
      render={renderWithLoadProgress(InboxContainer)}
    />
  )
}
